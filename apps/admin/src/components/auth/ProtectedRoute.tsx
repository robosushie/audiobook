import { useAuth } from "@clerk/react";
import { Navigate, useLocation } from "react-router-dom";

import { ROUTES } from "@/constants/routes";
import { useAdminAccess } from "@/hooks/useAdminAccess";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { isAdmin } = useAdminAccess();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold">Admin access required</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Your account is signed in but does not have the admin role. Use an admin email from
          bootstrap or ask an operator to update your Clerk public metadata.
        </p>
      </div>
    );
  }

  return children;
}
