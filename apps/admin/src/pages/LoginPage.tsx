import { useAuth } from "@clerk/react";
import { Navigate } from "react-router-dom";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { ROUTES } from "@/constants/routes";
import { useAdminAccess } from "@/hooks/useAdminAccess";

export function LoginPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { isAdmin } = useAdminAccess();

  if (isLoaded && isSignedIn && isAdmin) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  if (isLoaded && isSignedIn && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="max-w-md text-sm text-muted-foreground">
          Your account is signed in but does not have admin access.
        </p>
      </div>
    );
  }

  return <AuthLayout />;
}
