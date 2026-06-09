import { useAuth } from "@clerk/react";
import { Navigate, useLocation } from "react-router-dom";

import { NonAdminAccessScreen } from "@/components/auth/NonAdminAccessScreen";
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
    return <NonAdminAccessScreen title="Admin access required" />;
  }

  return children;
}
