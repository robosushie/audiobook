import { ArrowRight, KeyRound } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type OtpVerifyFormProps = {
  email: string;
  isLoading: boolean;
  onSubmit: (code: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
};

export function OtpVerifyForm({
  email,
  isLoading,
  onSubmit,
  onResend,
  onChangeEmail,
}: OtpVerifyFormProps) {
  const [code, setCode] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(code);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        We sent a verification code to{" "}
        <span className="font-medium text-foreground">{email}</span>.
      </p>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="relative">
          <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            className="pl-11 tracking-widest"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            disabled={isLoading}
            maxLength={6}
          />
        </div>
        <Button type="submit" variant="accent" className="group w-full" disabled={isLoading || code.length < 6}>
          {isLoading ? "Verifying…" : "Verify & sign in"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={onResend}
          disabled={isLoading}
        >
          Resend code
        </button>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={onChangeEmail}
          disabled={isLoading}
        >
          Use a different email
        </button>
      </div>
    </div>
  );
}
