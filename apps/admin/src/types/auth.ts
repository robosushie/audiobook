export type LoginStep = "email" | "otp";

export type EmailOtpSignInState = {
  step: LoginStep;
  email: string;
  isLoading: boolean;
  error: string | null;
};
