import { Headphones } from "lucide-react";

import { EmailSignInForm } from "@/components/auth/EmailSignInForm";
import { OtpVerifyForm } from "@/components/auth/OtpVerifyForm";
import {
  APP_NAME,
  LOGIN_HEADLINE,
  LOGIN_HEADLINE_ACCENT,
  LOGIN_SUBTITLE,
} from "@/constants/app";
import { useEmailOtpSignIn } from "@/hooks/useEmailOtpSignIn";
import { cn } from "@/lib/utils";

export function LoginFormPanel() {
  const {
    step,
    email,
    isLoading,
    error,
    sendCode,
    verifyCode,
    resetToEmail,
    clearError,
  } = useEmailOtpSignIn();

  return (
    <div className="flex min-h-screen flex-col justify-center bg-background px-6 py-10 sm:px-12 lg:px-16 xl:px-24">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
            <Headphones className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight">{APP_NAME}</span>
        </div>

        <h1 className="text-3xl font-bold leading-tight lg:text-4xl">
          {LOGIN_HEADLINE}
          <br />
          <span className="text-accent">{LOGIN_HEADLINE_ACCENT}</span>
        </h1>
        <p className="mt-2 mb-8 text-sm text-muted-foreground lg:text-base">{LOGIN_SUBTITLE}</p>

        {error ? (
          <div
            className={cn(
              "mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive",
            )}
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {step === "email" ? (
          <EmailSignInForm
            isLoading={isLoading}
            onSubmit={(value) => {
              clearError();
              void sendCode(value);
            }}
          />
        ) : (
          <OtpVerifyForm
            email={email}
            isLoading={isLoading}
            onSubmit={(value) => {
              clearError();
              void verifyCode(value);
            }}
            onResend={() => {
              clearError();
              void sendCode(email);
            }}
            onChangeEmail={resetToEmail}
          />
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Admin access only. Contact your operator if you need an account.
        </p>
      </div>
    </div>
  );
}
