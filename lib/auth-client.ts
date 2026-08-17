import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  emailOTPClient,
  lastLoginMethodClient,
  magicLinkClient,
  phoneNumberClient,
  twoFactorClient,
  usernameClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    emailOTPClient(),
    lastLoginMethodClient(),
    magicLinkClient(),
    phoneNumberClient(),
    twoFactorClient({ twoFactorPage: "/auth/two-factor" }),
    usernameClient(),
  ],
});
