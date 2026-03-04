import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const ADMIN_ROLE = "admin";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;

  if (role !== ADMIN_ROLE) {
    redirect("/sign-in?reason=admin_only");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-14 items-center justify-between gap-4 px-4">
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              Audiobook Admin
            </Link>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="rounded-lg gap-2" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="rounded-lg gap-2" asChild>
                <Link href="/dashboard/users">
                  <Users className="size-4" />
                  Users
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="rounded-lg gap-2" asChild>
                <Link href="/dashboard/books">
                  <BookOpen className="size-4" />
                  Books
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="rounded-lg gap-2" asChild>
                <Link href="/dashboard/audiobooks">
                  <Headphones className="size-4" />
                  Audiobooks
                </Link>
              </Button>
            </div>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
