import { SignOutButton, useUser } from "@clerk/react";
import {
  BookAudio,
  BookOpen,
  FileText,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { APP_NAME } from "@/constants/app";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: ROUTES.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { to: ROUTES.users, label: "Users", icon: Users },
  { to: ROUTES.books, label: "Books", icon: BookOpen },
  { to: ROUTES.audiobooks, label: "Audiobooks", icon: BookAudio },
  { to: ROUTES.reference, label: "Reference", icon: FileText },
  { to: ROUTES.simulate, label: "Simulate", icon: FlaskConical },
  { to: ROUTES.settings, label: "Settings", icon: Settings },
] as const;

function initials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "AD";
}

type SidebarProps = {
  open: boolean;
  onNavigate: () => void;
};

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const { user } = useUser();
  const displayName = user?.fullName ?? user?.firstName ?? "Admin";
  const role = (user?.publicMetadata?.role as string | undefined) ?? "admin";

  return (
    <aside
      id="admin-sidebar"
      aria-hidden={!open}
      inert={!open ? true : undefined}
      className={cn(
        "fixed top-14 bottom-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-border bg-sidebar transition-transform duration-200 ease-out",
        "lg:static lg:top-auto lg:bottom-auto lg:z-auto lg:h-full",
        open ? "translate-x-0" : "-translate-x-full lg:hidden",
      )}
    >
      <div className="border-b border-border px-5 py-6">
        <p className="font-display text-2xl font-semibold tracking-wide text-foreground">
          {APP_NAME}
        </p>
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Admin console
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent font-medium text-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0 opacity-80" strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg px-1 py-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
            {initials(displayName, user?.primaryEmailAddress?.emailAddress)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {role}
            </p>
          </div>
        </div>

        <SignOutButton>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}
