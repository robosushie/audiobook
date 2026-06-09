/** Clerk session is the source of truth; this module holds shared auth constants only. */

type ClerkRoleMetadata = {
  publicMetadata?: Record<string, unknown>;
  unsafeMetadata?: Record<string, unknown>;
};

export const ADMIN_ROLE = "admin" as const;

export function isAdminRole(role: string | undefined | null): boolean {
  return role === ADMIN_ROLE;
}

export function getClerkUserRole(user: ClerkRoleMetadata | null | undefined): string | undefined {
  return (
    (user?.publicMetadata?.role as string | undefined) ??
    (user?.unsafeMetadata?.role as string | undefined)
  );
}
