import { useUser } from "@clerk/react";

const ADMIN_ROLE = "admin";

export function useAdminAccess() {
  const { user, isLoaded, isSignedIn } = useUser();

  const role =
    (user?.publicMetadata?.role as string | undefined) ??
    (user?.unsafeMetadata?.role as string | undefined);

  const isAdmin = isSignedIn && role === ADMIN_ROLE;

  return {
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    isAdmin,
    role,
    user,
  };
}
