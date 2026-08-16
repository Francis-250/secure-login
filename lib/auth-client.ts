import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  emailOTPClient,
  lastLoginMethodClient,
  phoneNumberClient,
  twoFactorClient,
  usernameClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    emailOTPClient(),
    lastLoginMethodClient(),
    phoneNumberClient(),
    usernameClient(),
    twoFactorClient(),
  ],
});
