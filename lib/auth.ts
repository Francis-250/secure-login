import { betterAuth } from "better-auth";
import { APIError } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import {
  admin,
  emailOTP,
  lastLoginMethod,
  phoneNumber,
  twoFactor,
  username,
} from "better-auth/plugins";
import { sendEmail } from "./brevo";
import { evaluateRisk, logLoginAttempt } from "./risk";
import { getSettings } from "./settings";

function extractRequestInfo(ctx: {
  request?: Request;
}) {
  const headers = ctx.request?.headers;
  const userAgent = headers?.get("user-agent") ?? null;
  const xff = headers?.get("x-forwarded-for");
  const ipAddress = xff ? xff.split(",")[0].trim() : headers?.get("x-real-ip") ?? null;
  const country =
    headers?.get("cf-ipcountry") ?? headers?.get("x-vercel-ip-country") ?? null;
  const city = headers?.get("x-vercel-ip-city") ?? null;
  return { ipAddress, userAgent, country, city };
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 100,
    requireEmailVerification: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    username(),
    phoneNumber(),
    admin(),
    lastLoginMethod(),
    emailOTP({
      otpLength: 6,
      expiresIn: 20 * 60,
      sendVerificationOnSignUp: true,
      allowedAttempts: 3,
      changeEmail: {
        enabled: true,
      },

      async sendVerificationOTP({ email, otp, type }) {
        if (type === "sign-in") {
          await sendEmail({
            to: email,
            subject: "Your sign-in code — SECURE LOGIN",
            html: `<p>Your sign-in code is: <strong>${otp}</strong></p>`,
          });
        } else if (type === "email-verification") {
          await sendEmail({
            to: email,
            subject: "Verify your email — SECURE LOGIN",
            html: `<p>Your email verification code is: <strong>${otp}</strong></p>`,
          });
        } else if (type === "forget-password") {
          await sendEmail({
            to: email,
            subject: "Reset your password — SECURE LOGIN",
            html: `<p>Your password reset code is: <strong>${otp}</strong></p>`,
          });
        } else if (type === "change-email") {
          await sendEmail({
            to: email,
            subject: "Confirm your new email — SECURE LOGIN",
            html: `<p>Your email change code is: <strong>${otp}</strong></p>`,
          });
        }
      },
    }),
    twoFactor({
      issuer: "SECURE LOGIN",
      accountLockout: {
        enabled: true,
        maxFailedAttempts: 5,
        durationSeconds: 900,
      },
    }),
  ],
  rateLimit: {
    window: 60,
    max: 30,
    storage: "database",
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"],
    },
  },
  hooks: {
    before: createAuthMiddleware(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (ctx: any) => {
        if (ctx.path !== "/sign-in/email") return;
        const email: string | undefined = ctx.body?.email;
        if (!email) return;

        const info = extractRequestInfo(ctx);
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });

        const { maxFailedAttempts } = await getSettings();
        const failedWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const failedCount = await prisma.loginAttempt.count({
          where: { email, success: false, createdAt: { gte: failedWindow } },
        });

        if (failedCount >= maxFailedAttempts) {
          await logLoginAttempt({
            email,
            userId: user?.id,
            ...info,
            success: false,
          });
          throw new APIError("TOO_MANY_REQUESTS", {
            message: `Account locked: too many failed attempts (${maxFailedAttempts}). Try again later.`,
          });
        }

        const risk = await evaluateRisk({
          email,
          userId: user?.id,
          ...info,
        });

        if (risk.level === "high") {
          await logLoginAttempt({
            email,
            userId: user?.id,
            ...info,
            success: false,
            riskScore: risk.score,
            riskReason: risk.reasons.join("; "),
          });
          throw new APIError("FORBIDDEN", {
            message: `Sign-in blocked: ${risk.reasons.join("; ")}`,
          });
        }
      },
    ),
    after: createAuthMiddleware(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (ctx: any) => {
        if (ctx.path === "/sign-in/email") {
          const email: string | undefined = ctx.body?.email;
          if (!email) return;

          const returned: unknown = ctx.context?.returned;
          const failed = returned instanceof APIError;
          const info = extractRequestInfo(ctx);
          const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
          });

          const risk = await evaluateRisk({
            email,
            userId: user?.id,
            ...info,
          });

          await logLoginAttempt({
            email,
            userId: user?.id,
            ...info,
            success: !failed,
            riskScore: risk.score,
            riskReason:
              risk.level === "low" ? null : risk.reasons.join("; "),
          });
          return;
        }

        if (ctx.path.startsWith("/callback/")) {
          const user = ctx.context?.newSession?.user as
            | { id: string; email: string }
            | undefined;
          if (user?.email) {
            const info = extractRequestInfo(ctx);
            await logLoginAttempt({
              email: user.email,
              userId: user.id,
              ...info,
              success: true,
            });
          }
          return;
        }

        if (ctx.path === "/two-factor/verify-totp") {
          const returned = ctx.context?.returned as
            | { status?: boolean }
            | undefined;
          if (returned?.status === true) {
            const user = ctx.context?.newSession?.user as
              | { id: string; email: string }
              | undefined;
            if (user?.email) {
              const info = extractRequestInfo(ctx);
              await logLoginAttempt({
                email: user.email,
                userId: user.id,
                ...info,
                success: true,
              });
            }
          }
        }
      },
    ),
  },
});