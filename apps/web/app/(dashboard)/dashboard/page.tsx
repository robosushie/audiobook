import Link from "next/link";
import {
  Users,
  Headphones,
  CheckCircle,
  Loader2,
  ListTodo,
  XCircle,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UsersChart } from "./users-chart";
import { AudiobooksChart } from "./audiobooks-chart";

const MOCK_STATS = {
  totalUsers: 1247,
  usersByPlan: { free: 800, pro: 250, premium: 197 },
  totalBooks: 89,
  audiobooksSuccess: 456,
  audiobooksInProgress: 12,
  audiobooksQueued: 8,
  audiobooksFailed: 23,
};

export default function DashboardPage() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of your audiobook platform
        </p>
      </div>

      {/* Section: Users — card boundary */}
      <Card className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Users
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/users">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xl border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total users
              </CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {MOCK_STATS.totalUsers.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Free
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {MOCK_STATS.usersByPlan.free}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {MOCK_STATS.usersByPlan.pro}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Premium
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {MOCK_STATS.usersByPlan.premium}
              </p>
            </CardContent>
          </Card>
        </div>
        <Card className="rounded-xl border border-border bg-muted/30 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Users over time
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <UsersChart />
          </CardContent>
        </Card>
        </CardContent>
      </Card>

      {/* Section: Books — card boundary */}
      <Card className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            Books
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/books">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-1 max-w-xs">
            <Card className="rounded-xl border border-border bg-muted/30 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total books
                </CardTitle>
                <BookOpen className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {MOCK_STATS.totalBooks}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Section: Audiobook triggers — card boundary */}
      <Card className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Headphones className="size-5 text-primary" />
            Audiobook triggers
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/audiobooks">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xl border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Success
              </CardTitle>
              <CheckCircle className="size-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {MOCK_STATS.audiobooksSuccess}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In progress
              </CardTitle>
              <Loader2 className="size-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {MOCK_STATS.audiobooksInProgress}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Queued
              </CardTitle>
              <ListTodo className="size-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {MOCK_STATS.audiobooksQueued}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed
              </CardTitle>
              <XCircle className="size-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {MOCK_STATS.audiobooksFailed}
              </p>
            </CardContent>
          </Card>
        </div>
        <Card className="rounded-xl border border-border bg-muted/30 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Audiobook triggers over time
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <AudiobooksChart />
          </CardContent>
        </Card>
        </CardContent>
      </Card>
    </div>
  );
}
