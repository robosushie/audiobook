import { useClerk } from "@clerk/react";
import { useCallback, useState } from "react";

import type { LoginStep } from "@/types/auth";

type UseEmailOtpSignInResult = {
  step: LoginStep;
  email: string;
  isLoading: boolean;
  error: string | null;
  sendCode: (email: string) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  resetToEmail: () => void;
  clearError: () => void;
};

function clerkErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "errors" in error) {
    const errors = (error as { errors?: { message?: string; longMessage?: string }[] })
      .errors;
    const first = errors?.[0];
    if (first?.longMessage) return first.longMessage;
    if (first?.message) return first.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function useEmailOtpSignIn(): UseEmailOtpSignInResult {
  const { client, setActive, loaded } = useClerk();
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = useCallback(
    async (nextEmail: string) => {
      if (!loaded || !client?.signIn) {
        setError("Authentication is still loading. Please wait.");
        return;
      }

      const normalized = nextEmail.trim().toLowerCase();
      if (!normalized) {
        setError("Enter your email address.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const signIn = client.signIn;
        const created = await signIn.create({ identifier: normalized });
        const emailFactor = created.supportedFirstFactors?.find(
          (factor) => factor.strategy === "email_code",
        );

        if (!emailFactor || !("emailAddressId" in emailFactor)) {
          throw new Error(
            "Email code sign-in is not available for this account. Use an admin email with OTP enabled in Clerk.",
          );
        }

        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId: emailFactor.emailAddressId,
        });

        setEmail(normalized);
        setStep("otp");
      } catch (err) {
        setError(clerkErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [client, loaded],
  );

  const verifyCode = useCallback(
    async (code: string) => {
      if (!loaded || !client?.signIn) {
        setError("Authentication is still loading. Please wait.");
        return;
      }

      const trimmed = code.trim();
      if (!trimmed) {
        setError("Enter the verification code from your email.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await client.signIn.attemptFirstFactor({
          strategy: "email_code",
          code: trimmed,
        });

        if (result.status === "complete" && result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          return;
        }

        throw new Error("Verification could not be completed. Try again.");
      } catch (err) {
        setError(clerkErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [client, loaded, setActive],
  );

  const resetToEmail = useCallback(() => {
    setStep("email");
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    step,
    email,
    isLoading,
    error,
    sendCode,
    verifyCode,
    resetToEmail,
    clearError,
  };
}
