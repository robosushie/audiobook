import { ClerkProvider } from "@clerk/react";
import { BrowserRouter } from "react-router-dom";

import { UserEventsProvider } from "@/contexts/user-events";
import { ROUTES } from "@/constants/routes";
import { getClerkPublishableKey } from "@/lib/env";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ClerkProvider
      publishableKey={getClerkPublishableKey()}
      signInUrl={ROUTES.login}
      signUpUrl={ROUTES.login}
      afterSignOutUrl={ROUTES.login}
    >
      <BrowserRouter>
        <UserEventsProvider>{children}</UserEventsProvider>
      </BrowserRouter>
    </ClerkProvider>
  );
}
