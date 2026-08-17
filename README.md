# Secure Login

A production-style authentication and account-management platform built with
**Next.js (App Router)**, **Better Auth**, **Prisma (PostgreSQL)**, and an
**AI-assisted risk engine** (Groq / LangChain). It provides email/password,
social (GitHub/Google), email OTP, and TOTP 2FA sign-in, plus a full admin
console for managing users, sessions, and login risk.

> The risk engine decides **allow**, **challenge**, or **block** for every
> password sign-in. Legitimate users who change devices/browsers are stepped up
> through email verification instead of being locked out.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Project layout](#project-layout)
- [Data model](#data-model)
- [How authentication works](#how-authentication-works)
  - [Sign-up & email verification](#sign-up--email-verification)
  - [Password sign-in](#password-sign-in)
  - [The step-up (OTP) flow](#the-step-up-otp-flow)
  - [Two-factor authentication (TOTP)](#two-factor-authentication-totp)
  - [Social sign-in](#social-sign-in)
  - [Email OTP sign-in](#email-otp-sign-in)
  - [Password reset](#password-reset)
- [The risk engine](#the-risk-engine)
  - [Signals collected](#signals-collected)
  - [Heuristics & weights](#heuristics--weights)
  - [Decisions: allow / challenge / block](#decisions-allow--challenge--block)
  - [AI (Groq) refinement](#ai-groq-refinement)
  - [Account lockout](#account-lockout)
- [Sessions](#sessions)
- [User dashboard](#user-dashboard)
- [Admin console](#admin-console)
- [API routes](#api-routes)
- [Operational notes for admins](#operational-notes-for-admins)

---

## Tech stack

| Concern        | Technology                                   |
| -------------- | -------------------------------------------- |
| Framework      | Next.js 16 (App Router, React 19, TypeScript) |
| Auth           | Better Auth 1.6 (`better-auth`)               |
| Database       | PostgreSQL via Prisma 7                       |
| Emails         | Brevo (transactional SMTP API)                |
| AI risk scoring| LangChain + Groq (structured LLM output)     |
| UI             | Tailwind, lucide-react, sonner, qrcode.react  |

---

## Getting started

```bash
npm install          # runs `prisma generate` (postinstall)
cp .env.example .env # or configure your existing .env
npx prisma migrate dev   # create/apply database schema
npm run dev              # http://localhost:3000
```

Scripts:

```bash
npm run dev        # start the Next.js dev server
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint
```

---

## Environment variables

| Variable                  | Purpose                                        |
| ------------------------- | ---------------------------------------------- |
| `DATABASE_URL`            | PostgreSQL connection string                   |
| `BETTER_AUTH_SECRET`      | Secret used to sign auth cookies/tokens        |
| `BETTER_AUTH_URL`         | Public base URL of the app                     |
| `BREVO_API_KEY`           | Brevo API key for transactional emails         |
| `BREVO_SENDER_EMAIL`      | From-address (falls back to `BREVO_EMAIL_USER`)|
| `BREVO_SENDER_NAME`       | Display name used as sender                    |
| `GROQ_API_KEY`            | Enables AI risk refinement (optional)          |
| `GROQ_MODEL`              | LLM model id (default `llama-3.3-70b-versatile`) |
| `GITHUB_CLIENT_ID`        | GitHub OAuth app id (optional)                 |
| `GITHUB_CLIENT_SECRET`    | GitHub OAuth secret (optional)                 |
| `GOOGLE_CLIENT_ID`        | Google OAuth client id (optional)              |
| `GOOGLE_CLIENT_SECRET`    | Google OAuth secret (optional)                 |

If `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` are missing, email delivery silently
fails (OTP/verification flows will not send). OAuth providers are optional — the
login/register forms hide buttons for providers that are not configured.

---

## Project layout

```
app/
  (dashboard)/user/        # user area: overview, security, sessions, activity
  (dashboard)/admin/       # admin area: dashboard, users, sessions, risk, settings
  auth/                    # login, register, two-factor, step-up, verify-email,
                           # forgot/reset password, callbacks (session redirect)
  api/
    auth/[...all]/route.ts # all Better Auth endpoints
    risk/route.ts          # admin-only risk log query
    admin/settings/route.ts# admin-only settings read/update
    user/delete-account/route.ts # self-service account deletion
components/
  auth/                    # login, register, 2FA, step-up OTP, verify email, reset pw
  user/                    # user navbar + overview/security/sessions panels
  admin/                   # admin shell, tables, drawers, charts, settings manager
  layout/                  # public site header/sidebar
lib/
  auth.ts                  # Better Auth config + security hooks (risk integration)
  auth-client.ts           # client-side Better Auth client
  risk.ts                  # risk engine (signals, heuristics, Groq, actions)
  settings.ts              # app settings (maxFailedAttempts, AI toggle)
  brevo.ts                 # transactional email helper
  prisma.ts                # Prisma client singleton
prisma/
  schema.prisma            # database schema
  migrations/              # generated migrations
```

---

## Data model

All tables are PostgreSQL via Prisma. Key models:

- **`user`** — id, name, email (unique), emailVerified, role (`user`/`admin`),
  banned, banReason, banExpires, twoFactorEnabled, phoneNumber, username, etc.
- **`session`** — id, token (unique), expiresAt, ipAddress, userAgent,
  `impersonatedBy` (admin impersonation).
- **`account`** — linked sign-in providers (`credential`, `github`, `google`);
  holds the bcrypt password hash for the `credential` provider.
- **`twoFactor`** — TOTP secret, encrypted backup codes, failed count, lockout.
- **`verification`** — OTP codes / email-verification tokens (keyed by
  identifier + type, e.g. `sign-in`, `email-verification`, `forget-password`).
- **`rateLimit`** — Better Auth rate-limit counters (database-backed).
- **`setting`** — key/value app settings (`maxFailedAttempts`,
  `aiRiskEnabled`, `aiRequestCount`).
- **`loginAttempt`** — the audit trail: email, userId, ipAddress, userAgent,
  country, city, success, riskScore, riskReason, createdAt.

---

## How authentication works

All auth traffic goes through `app/api/auth/[...all]/route.ts`, which delegates
to the Better Auth instance configured in `lib/auth.ts`.

### Sign-up & email verification

1. `POST /sign-up/email` (client: `authClient.signUp.email`) creates the user
   with `emailVerified: false` and sends a verification OTP by email
   (the `emailOTP` plugin with `sendVerificationOnSignUp: true`).
2. The user is redirected to `/auth/verify-email?email=…`, enters the 6-digit
   code, and calls `authClient.emailOtp.verifyEmail` to set `emailVerified`.

Password rules: min 8, max 100 characters. `requireEmailVerification: true`
means unverified accounts cannot sign in with credentials.

### Password sign-in

`POST /sign-in/email` (`authClient.signIn.email`). Two custom hooks wrap it:

- **`before` hook** (`lib/auth.ts`) — runs *before* the password is checked:
  1. **Account lock check**: if the email has ≥ `maxFailedAttempts`
     *failed* attempts in the last 24h, the request is rejected
     (`Account locked`) and a failed attempt is logged.
  2. **Risk evaluation** (`lib/risk.ts`): if the decision is **`block`**,
     the request is rejected with the flagged reasons.
  3. `challenge` / `allow` pass through to normal password validation.
- **`after` hook** — runs *after* password validation:
  - Wrong password → a failed `loginAttempt` is logged.
  - Correct password + **`challenge`** → **step-up OTP** (see below).
  - Correct password + `allow` → a successful `loginAttempt` is logged.
  - Social `callback/*` and TOTP verification also log successful attempts.

### The step-up (OTP) flow

When the risk engine returns `challenge` (for example, a **new device or
location** with an otherwise-correct password):

1. The just-created session is **revoked** immediately (the user is not signed
   in yet).
2. A **`sign-in` OTP** is generated, stored, and emailed to the user.
3. The sign-in returns a `STEP_UP_REQUIRED` error; `login-form.tsx` detects the
   prefix and redirects to `/auth/step-up?email=…`.
4. The user enters the code; `authClient.signIn.emailOtp` verifies it and creates
   a real session → `/auth/callbacks` → dashboard.

The code is 6 digits, valid for 20 minutes, with 3 allowed attempts; the
step-up page offers a *Resend code* button. Users with **TOTP 2FA enabled skip
the email step-up** — their 2FA already provides the second factor.

### Two-factor authentication (TOTP)

- Enable in **Security → Two-factor authentication**: confirm your password,
  scan the QR code (`qrcode.react`), enter a 6-digit code, and save the
  generated **backup codes**.
- On later password sign-ins, Better Auth returns `twoFactorRedirect` and the
  client routes to `/auth/two-factor` where the TOTP code is verified
  (`authClient.twoFactor.verifyTotp`).
- Account lockout after 5 failed TOTP attempts for 15 minutes (config in
  `lib/auth.ts`).
- Backup codes can be regenerated; each is single-use.

### Social sign-in

GitHub/Google OAuth via `authClient.signIn.social`. The `after` hook logs a
successful attempt from the `callback/*` path. Social accounts can be linked or
unlinked in the user Security panel.

### Email OTP sign-in

The `emailOTP` plugin supports direct `sign-in` OTP codes
(`authClient.emailOtp.sendVerificationOtp` + `authClient.signIn.emailOtp`).
This is the mechanism the step-up flow relies on.

### Password reset

`/auth/forgot-password` sends a reset OTP; `/auth/reset-password` verifies the
code and sets a new password (see `reset-password-form.tsx`). The email
subject/template is defined in the `emailOTP` plugin's `sendVerificationOTP`
callback in `lib/auth.ts`.

---

## The risk engine

Located in `lib/risk.ts`. Every password sign-in is scored **0–1** and assigned
an **action**. The 24h lookback window is used for all counters.

### Signals collected

For each attempt we gather:

| Signal | What it is |
| ------ | ---------- |
| `history` | Up to 50 **successful** sign-ins for this user (baseline) |
| `recentCount` | **Failed** attempts for this email in 24h |
| `stuffing` | Distinct **emails with failed attempts** from this IP in 24h |

Only *failed* attempts feed velocity/stuffing, so legitimate successful logins
(including a user logging in several times per day or several users behind a
shared office IP) do not create false positives.

### Heuristics & weights

| Heuristic | Points | Kind | Why |
| --------- | ------ | ---- | --- |
| New device (browser/agent never signed in) | +0.35 | identity | Ambiguous — legit device change |
| New location (first sign-in from a country) | +0.30 | identity | Ambiguous — legit travel |
| Impossible travel (2 countries < 6h apart) | +0.50 | attack | Strong account-takeover indicator |
| High attempt velocity (≥ `maxFailedAttempts` failed) | +0.20 | attack | Brute-force indicator (skipped for admins) |
| Credential stuffing (≥ 4 distinct failed emails/IP) | +0.40 | attack | Automated attack pattern |
| Unusual sign-in hour (vs. typical pattern) | +0.20 | weak | Never decisive on its own |

`score = min(1, sum)`. Level: **low** < 0.4, **medium** 0.4–0.7, **high** ≥ 0.7.

### Decisions: allow / challenge / block

`decideAction` (`lib/risk.ts`):

1. **attack score ≥ 0.4** → **`block`** — unambiguous attack (impossible travel,
   credential stuffing, brute-force velocity). Rejected with the reasons shown.
2. **level high** (≥ 0.7) → **`challenge`** — require email OTP rather than a
   hard block.
3. **new device or location + medium** (≥ 0.4) → **`challenge`** — the classic
   "changed PC/browser" case becomes a step-up, not a lockout.
4. Otherwise → **`allow`**.

This means a legitimate user who changes device/browser or location is offered
email verification (step-up) instead of being permanently blocked, while
genuine attack patterns still get blocked.

### AI (Groq) refinement

When `aiRiskEnabled` is on (default) and the heuristic is not already `high`,
the attempt summary (email, IP, location, user-agent, counters, heuristic flags)
is sent to Groq with a structured-output schema. The final score is the max of
heuristic and LLM scores; LLM-only `high` still maps to `challenge` — an LLM
cannot hard-block on its own. The AI has a 3.5s timeout, and a counter
(`aiRequestCount`) tracks usage from the settings page.

### Account lockout

Independent of risk scoring: if failed attempts for the email in 24h reach
`maxFailedAttempts` (default 5, admin-configurable 1–100), sign-in is blocked
for 24 hours. This threshold is also reused by the velocity heuristic.

**Admin accounts are exempt**: the failed-attempts lockout and the velocity
heuristic are skipped for users with `role = "admin"`, so an admin can never be
locked out of their own account by failed password attempts. Other risk signals
(impossible travel, credential stuffing from shared-IP attack patterns, new
device/location) still apply to admins.

---

## Sessions

- Sessions expire after **7 days**; the expiry is refreshed when a session is
  older than **24h** (`updateAge`).
- IP address + user-agent are recorded on each session.
- Users can see all of their sessions, revoke individual ones, or **sign out
  everywhere else** (`authClient.revokeSession` /
  `authClient.revokeOtherSessions`).
- Admins can view/revoke any session or all of a user's sessions.
- **Impersonation** is tracked via `session.impersonatedBy`, so an admin acting
  as a user is recorded.

---

## User dashboard

Protected by `app/(dashboard)/user/layout.tsx` (redirects to login if no
session).

| Page | What it does |
| ---- | ------------ |
| **Overview** | Edit profile (name, phone), change email (OTP-confirmed via `changeEmail`), change password, and delete your account (password or 2FA confirmation). |
| **Security** | Change password; enable/disable TOTP 2FA with QR + backup codes; link/unlink GitHub/Google; shows last sign-in method. |
| **Sessions** | List active devices, revoke a session, sign out everywhere else. |
| **Activity** | Last 50 sign-in attempts on the account (device, location, result, and any risk flag). |

---

## Admin console

Protected by `app/(dashboard)/admin/layout.tsx` — requires a session **and**
`role === "admin"` (non-admins are redirected to `/user`).

| Page | Route | What it does |
| ---- | ----- | ------------ |
| **Dashboard** | `/admin` | Total users, active sessions, banned users, high-risk attempts; 14-day risk chart (low/med/high per day, average); recent login attempts. |
| **Users** | `/admin/users` | Search/filter users; create users (email + temp password + role); ban/unban (reason + duration); mark email verified/unverified; set password; **unlock an account locked by failed attempts**; **impersonate**; delete. Per-user detail drawer. |
| **Sessions** | `/admin/sessions` | All active sessions across users, searchable by user/device/IP; view details; revoke one or all for a user. |
| **Risk log** | `/admin/risk` | Searchable/filterable login-attempt audit trail (by user, min risk score); shows IP, location, user-agent, success, score, and reason. |
| **Settings** | `/admin/settings` | `maxFailedAttempts` (login policy / lockout + velocity threshold) and toggle the AI risk assessment; AI request counter and model display. |

All admin data access goes through the Better Auth `admin` plugin
(`authClient.admin.*`), which enforces role checks, and the two custom API
routes (`/api/risk`, `/api/admin/settings`) which call
`auth.api.getSession` and verify `role === "admin"`.

---

## API routes

| Route | Method | Auth | Purpose |
| ----- | ------ | ---- | ------- |
| `/api/auth/*` | all | public/plugin | Better Auth endpoints (sign-in, sign-up, OTP, 2FA, sessions, admin, social) |
| `/api/risk` | GET | admin | Risk log query (search, userId, minRisk) |
| `/api/admin/unlock` | POST | admin | Clear a user's recent failed attempts (unlock an account blocked by the failed-attempt lockout) |
| `/api/admin/settings` | GET/PATCH | admin | Read/update `maxFailedAttempts` and `aiRiskEnabled` |
| `/api/user/delete-account` | POST | user | Self-service account deletion (password or 2FA re-confirmation) |

---

## Operational notes for admins

- **A user reports “I can’t sign in”** → check the **Risk log** for their email.
  The reason string explains exactly which rule fired. Common legitimate cases:
  - *Step-up verification required: New device…* — normal; they just need the
    emailed code (or to resend it).
  - *Account locked: too many failed attempts* — a temporary 24h block; wait,
    consider raising `maxFailedAttempts`, or clear it immediately from
    **Admin → Users → Unlock account** (removes the recent failed-attempt
    records for that email).
  - *Sign-in blocked: … stuffing / impossible travel* — genuine attack signals;
    investigate the IP before unblocking anything.
- **Admin accounts are never locked out** by failed password attempts — the
  account-lockout and velocity rules skip `role = "admin"`. An admin who
  mistypes a password keeps access to their account.
- **Shared IP / office networks** → several successful logins from one IP do
  *not* count as credential stuffing (only *failed* attempts do), so normal
  office use is fine.
- **Device or browser changes are expected** — new devices trigger an email
  code, never a permanent block. If a user loses access to their email and
  their device, an admin can reset their password from **Users → Set password**.
- **AI toggle** — disabling it makes scoring faster and free (heuristics only)
  but loses the LLM refinement layer.
- **Suspected compromise** → impersonate to review, revoke all sessions from
  **Admin → Sessions**, and force a password reset from **Admin → Users**.