import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  emailOTPClient,
  lastLoginMethodClient,
  phoneNumberClient,
  twoFactorClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    emailOTPClient(),
    lastLoginMethodClient(),
    phoneNumberClient(),
    twoFactorClient({ twoFactorPage: "/auth/two-factor" }),
  ],
});
