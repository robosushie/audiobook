import { LoginFormPanel } from "@/components/auth/LoginFormPanel";
import { LoginHeroPanel } from "@/components/auth/LoginHeroPanel";

export function AuthLayout() {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <LoginFormPanel />
      <LoginHeroPanel />
    </div>
  );
}
