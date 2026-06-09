import { useAuth } from "@clerk/react";
import { Navigate } from "react-router-dom";

import { NonAdminAccessScreen } from "@/components/auth/NonAdminAccessScreen";
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
    return <NonAdminAccessScreen title="Admin access required" />;
  }

  return <AuthLayout />;
}
