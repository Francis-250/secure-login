import { redirect } from "next/navigation";

export const ROLES = {
  ADMIN: "admin",
  OPERATOR: "operator",
  USER: "user",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ADMIN_AREA_ROLES = [ROLES.ADMIN, ROLES.OPERATOR] as const;
export const ADMIN_ONLY_ROLES = [ROLES.ADMIN] as const;
export const OPERATOR_ROLES = [ROLES.OPERATOR] as const;

export function isAdminAreaRole(role?: string | null): boolean {
  return role === ROLES.ADMIN || role === ROLES.OPERATOR;
}

export function guardRole(
  role: string | null | undefined,
  allowed: readonly string[],
  fallback: string,
): void {
  if (!role || !allowed.includes(role)) {
    redirect(fallback);
  }
}