import { useUser } from "@clerk/react";

import { getClerkUserRole, isAdminRole } from "@/state/auth";

export function useAdminAccess() {
  const { user, isLoaded, isSignedIn } = useUser();

  const role = getClerkUserRole(user);
  const isAdmin = isSignedIn && isAdminRole(role);

  return {
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    isAdmin,
    role,
    user,
  };
}
