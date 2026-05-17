/** Clerk session is the source of truth; this module holds shared auth constants only. */

export const ADMIN_ROLE = "admin" as const;

export function isAdminRole(role: string | undefined | null): boolean {
  return role === ADMIN_ROLE;
}
