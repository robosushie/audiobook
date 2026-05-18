import { Headphones } from "lucide-react";

import heroImage from "@/assets/hero.png";
import {
  APP_NAME,
  LOGIN_HEADLINE,
  LOGIN_HEADLINE_ACCENT,
  LOGIN_SUBTITLE,
} from "@/constants/app";
import { BRAND } from "@/constants/brand";
import { cn } from "@/lib/utils";

const COVERS = [
  {
    className: "absolute -top-4 left-[8%] h-52 w-40 -rotate-12",
    image: heroImage,
  },
  {
    className: "absolute top-16 right-[10%] h-48 w-36 rotate-6",
    style: { background: BRAND.coverGradients.amber },
  },
  {
    className: "absolute bottom-20 left-[18%] h-44 w-32 rotate-3",
    style: { background: BRAND.coverGradients.rose },
  },
  {
    className: "absolute bottom-8 right-[20%] h-36 w-28 -rotate-6",
    style: { background: BRAND.coverGradients.teal },
  },
] as const;

export function LoginHeroPanel() {
  return (
    <div
      className="relative hidden min-h-screen overflow-hidden lg:flex lg:flex-col"
      style={{
        background: `linear-gradient(to bottom, ${BRAND.loginHeroTop} 0%, ${BRAND.loginHeroMid} 38%, ${BRAND.background} 72%, ${BRAND.background} 100%)`,
      }}
    >
      <CoverScene />
      <motionHeroFade />
      <motionHeroFooter />
    </div>
  );
}

function motionHeroFade() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background: `linear-gradient(to bottom, transparent 0%, transparent 45%, rgba(250, 248, 245, 0.92) 85%, ${BRAND.background} 100%)`,
      }}
    />
  );
}

function motionHeroFooter() {
  return (
    <div className="relative z-10 flex flex-1 flex-col justify-end p-12 xl:p-16">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card text-foreground shadow-pop">
          <Headphones className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <span className="text-2xl font-bold tracking-tight">{APP_NAME}</span>
      </div>

      <h2 className="max-w-md text-4xl font-bold leading-tight xl:text-5xl">
        {LOGIN_HEADLINE}
        <br />
        <span className="text-accent">{LOGIN_HEADLINE_ACCENT}</span>
      </h2>
      <p className="mt-4 max-w-sm text-lg text-muted-foreground">{LOGIN_SUBTITLE}</p>
    </div>
  );
}

function CoverScene() {
  return (
    <div className="absolute inset-0">
      {COVERS.map((cover) => (
        <div
          key={cover.className}
          className={cn(
            "overflow-hidden rounded-3xl shadow-pop",
            "image" in cover && "bg-background",
            cover.className,
          )}
        >
          {"image" in cover ? (
            <img
              src={cover.image}
              alt=""
              className="h-full w-full object-contain p-3"
              style={{ backgroundColor: BRAND.background }}
            />
          ) : (
            <div className="h-full w-full" style={cover.style} />
          )}
        </div>
      ))}
    </div>
  );
}
