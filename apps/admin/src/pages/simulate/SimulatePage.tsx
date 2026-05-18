import { BookAudio, Mic } from "lucide-react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const CARDS = [
  {
    to: ROUTES.simulateVoice,
    title: "Simulate voice",
    description: "Record a sample against a reference passage and queue voice preprocess (Inngest).",
    icon: Mic,
  },
  {
    to: ROUTES.simulateAudiobook,
    title: "Simulate audiobook",
    description: "Pick a book and voice profile, then queue audiobook generation (Inngest).",
    icon: BookAudio,
  },
] as const;

export function SimulatePage() {
  return (
    <div>
      <PageHeader
        title="Simulate"
        subtitle="Trigger voice preprocess and audiobook generation pipelines"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map(({ to, title, description, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "group rounded-xl border border-border bg-card p-6 shadow-sm transition-colors",
              "hover:border-foreground/20 hover:bg-muted/30",
            )}
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-5 w-5 text-foreground" strokeWidth={1.75} />
            </div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            <p className="mt-4 text-sm font-medium text-foreground group-hover:underline">
              Open →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
