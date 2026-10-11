import { Headphones } from "lucide-react";

import {
  APP_NAME,
  LOGIN_HEADLINE,
  LOGIN_HEADLINE_ACCENT,
  LOGIN_SUBTITLE,
} from "@/constants/app";
import { BRAND } from "@/constants/brand";

const BLOCKS = [
  { className: "absolute left-[10%] top-20 h-36 w-24", color: BRAND.coverGradients.blue },
  { className: "absolute right-[14%] top-32 h-28 w-40", color: BRAND.coverGradients.green },
  { className: "absolute bottom-40 left-[22%] h-24 w-32", color: BRAND.coverGradients.yellow },
  { className: "absolute bottom-28 right-[16%] h-32 w-20", color: BRAND.coverGradients.pink },
] as const;

export function LoginHeroPanel() {
  return (
    <div className="relative hidden min-h-screen overflow-hidden bg-background lg:flex lg:flex-col">
      {BLOCKS.map((block) => (
        <div
          key={block.className}
          className={block.className}
          style={{ backgroundColor: block.color }}
        />
      ))}
      <div className="relative z-10 flex flex-1 flex-col justify-end p-12 xl:p-16">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-foreground">
            <Headphones className="h-5 w-5" strokeWidth={2} />
          </div>
          <span className="text-2xl font-semibold tracking-wide">{APP_NAME}</span>
        </div>

        <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-wide">
          {LOGIN_HEADLINE}
          <br />
          <span className="bg-cotton px-1 text-foreground">{LOGIN_HEADLINE_ACCENT}</span>
        </h2>
        <p className="mt-4 max-w-sm text-lg text-muted-foreground">{LOGIN_SUBTITLE}</p>
      </div>
    </div>
  );
}
