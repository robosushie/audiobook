import { useSignIn } from '@clerk/expo';
import { useCallback, useState } from 'react';

export type LoginStep = 'email' | 'otp';

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
  if (error && typeof error === 'object' && 'errors' in error) {
    const errors = (error as { errors?: { message?: string; longMessage?: string }[] }).errors;
    const first = errors?.[0];
    if (first?.longMessage) return first.longMessage;
    if (first?.message) return first.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export function useEmailOtpSignIn(): UseEmailOtpSignInResult {
  const { signIn, errors, fetchStatus } = useSignIn();
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isLoading = fetchStatus === 'fetching';

  const sendCode = useCallback(
    async (nextEmail: string) => {
      const normalized = nextEmail.trim().toLowerCase();
      if (!normalized) {
        setError('Enter your email address.');
        return;
      }

      setError(null);

      try {
        const { error: createError } = await signIn.create({ identifier: normalized });
        if (createError) {
          setError(
            errors?.fields?.identifier?.message ??
              createError.longMessage ??
              createError.message ??
              clerkErrorMessage(createError),
          );
          return;
        }

        const { error: sendError } = await signIn.emailCode.sendCode();
        if (sendError) {
          setError(sendError.longMessage ?? sendError.message ?? clerkErrorMessage(sendError));
          return;
        }

        setEmail(normalized);
        setStep('otp');
      } catch (err) {
        setError(clerkErrorMessage(err));
      }
    },
    [errors?.fields, signIn],
  );

  const verifyCode = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) {
        setError('Enter the verification code from your email.');
        return;
      }

      setError(null);

      try {
        const { error: verifyError } = await signIn.emailCode.verifyCode({ code: trimmed });
        if (verifyError) {
          setError(
            errors?.fields?.code?.message ??
              verifyError.longMessage ??
              verifyError.message ??
              clerkErrorMessage(verifyError),
          );
          return;
        }

        if (signIn.status === 'needs_client_trust') {
          setError('Additional verification is required before this device can sign in.');
          return;
        }

        if (signIn.status === 'complete') {
          await signIn.finalize();
          return;
        }

        setError('Verification could not be completed. Try again.');
      } catch (err) {
        setError(clerkErrorMessage(err));
      }
    },
    [errors?.fields, signIn],
  );

  const resetToEmail = useCallback(() => {
    setStep('email');
    setError(null);
    signIn.reset().catch(() => {
      // ignore reset errors when returning to email step
    });
  }, [signIn]);

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
