import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { Sidebar } from "@/components/layout/Sidebar";
import { APP_NAME } from "@/constants/app";
import { cn } from "@/lib/utils";

const DESKTOP_QUERY = "(min-width: 1024px)";

function isDesktop(): boolean {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

export function AdminLayout() {
  const [open, setOpen] = useState(() => isDesktop());

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function closeIfMobile() {
    if (!isDesktop()) setOpen(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:px-6">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="admin-sidebar"
          aria-label={open ? "Close navigation" : "Open navigation"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-muted"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? (
            <X className="h-5 w-5" strokeWidth={1.75} />
          ) : (
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          )}
        </button>
        <p
          className={cn(
            "font-display text-lg font-semibold tracking-wide",
            open && "lg:sr-only",
          )}
        >
          {APP_NAME}
        </p>
      </header>

      <div className={cn("flex min-h-0 flex-1", open && "max-lg:overflow-hidden")}>
        {open ? (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-x-0 top-14 bottom-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setOpen(false)}
          />
        ) : null}
        <Sidebar open={open} onNavigate={closeIfMobile} />
        <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
