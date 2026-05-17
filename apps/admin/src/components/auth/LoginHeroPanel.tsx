import { Headphones } from "lucide-react";

import heroImage from "@/assets/hero.png";
import {
  APP_NAME,
  LOGIN_HEADLINE,
  LOGIN_HEADLINE_ACCENT,
  LOGIN_SUBTITLE,
} from "@/constants/app";
import { cn } from "@/lib/utils";

const COVERS = [
  {
    className: "absolute -top-4 left-[8%] h-52 w-40 -rotate-12",
    image: heroImage,
  },
  {
    className: "absolute top-16 right-[10%] h-48 w-36 rotate-6",
    style: { background: "linear-gradient(145deg, #fcd34d 0%, #d97706 100%)" },
  },
  {
    className: "absolute bottom-20 left-[18%] h-44 w-32 rotate-3",
    style: { background: "linear-gradient(145deg, #fda4af 0%, #be123c 100%)" },
  },
  {
    className: "absolute bottom-8 right-[20%] h-36 w-28 -rotate-6",
    style: { background: "linear-gradient(145deg, #5eead4 0%, #0f766e 100%)" },
  },
] as const;

export function LoginHeroPanel() {
  return (
    <div className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-primary/15 via-background to-background lg:flex lg:flex-col">
      <CoverScene />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />

      <div className="relative z-10 flex flex-1 flex-col justify-end p-12 xl:p-16">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
            <Headphones className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold tracking-tight">{APP_NAME}</span>
        </div>

        <h2 className="max-w-md text-4xl font-bold leading-tight xl:text-5xl">
          {LOGIN_HEADLINE}
          <br />
          <span className="text-primary">{LOGIN_HEADLINE_ACCENT}</span>
        </h2>
        <p className="mt-4 max-w-sm text-lg text-muted-foreground">{LOGIN_SUBTITLE}</p>
      </div>
    </div>
  );
}

function CoverScene() {
  return (
    <div className="absolute inset-0">
      {COVERS.map((cover, index) => (
        <div
          key={index}
          className={cn("overflow-hidden rounded-3xl shadow-pop", cover.className)}
        >
          {"image" in cover ? (
            <img src={cover.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full" style={"style" in cover ? cover.style : undefined} />
          )}
        </div>
      ))}
    </div>
  );
}
