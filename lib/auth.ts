import { betterAuth } from "better-auth";
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

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 3,
    maxPasswordLength: 100,
    requireEmailVerification: true,

    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password — SECURE LOGIN",
        html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
      });
    },
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
    phoneNumber(),
    username(),
    admin(),
    lastLoginMethod(),
    emailOTP({
      otpLength: 6,
      expiresIn: 20 * 60,
      sendVerificationOnSignUp: true,
      allowedAttempts: 3,

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
        }
      },
    }),
    twoFactor({
      issuer: "SECURE LOGIN",
    }),
  ],
  rateLimit: {
    window: 60,
    max: 5,
    storage: "database",
  },
});
