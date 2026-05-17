import { ArrowRight, Mail } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EmailSignInFormProps = {
  isLoading: boolean;
  onSubmit: (email: string) => void;
};

export function EmailSignInForm({ isLoading, onSubmit }: EmailSignInFormProps) {
  const [email, setEmail] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(email);
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="relative">
        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="email"
          autoComplete="email"
          placeholder="Email address"
          className="pl-11"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <Button type="submit" variant="accent" className="group w-full" disabled={isLoading}>
        {isLoading ? "Sending code…" : "Continue"}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Button>
    </form>
  );
}
