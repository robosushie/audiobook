import { SignOutButton, useUser } from "@clerk/react";
import { LogOut, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/constants/app";

type NonAdminAccessScreenProps = {
  title?: string;
  description?: string;
};

export function NonAdminAccessScreen({
  title = "Access denied",
  description = "Your account does not have admin permissions. Sign out and sign in with an admin account, or contact your operator.",
}: NonAdminAccessScreenProps) {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-md text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {APP_NAME} admin
        </p>

        <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-7 w-7" strokeWidth={1.75} aria-hidden />
        </div>

        <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>

        {email ? (
          <p className="mt-4 text-sm text-foreground">
            Signed in as <span className="font-medium">{email}</span>
          </p>
        ) : null}

        <div className="mt-8">
          <SignOutButton>
            <Button variant="outline" className="w-full sm:min-w-[200px]">
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </Button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
