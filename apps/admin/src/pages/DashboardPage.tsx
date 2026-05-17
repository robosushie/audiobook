import { BookOpen, Shield, User, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { fetchDashboardOverview } from "@/api/stats";
import { AudiobookActivityChart } from "@/components/dashboard/AudiobookActivityChart";
import { GenreBreakdown } from "@/components/dashboard/GenreBreakdown";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { useApi } from "@/hooks/useApi";
import type { DashboardOverview } from "@/types/api";

export function DashboardPage() {
  const { request } = useApi();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const overview = await fetchDashboardOverview(request);
        if (!cancelled) setData(overview);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [request]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Platform overview and generation activity"
      />

      {error ? (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={loading ? "—" : (data?.total_users ?? 0)} icon={Users} />
        <StatCard
          label="Regular users"
          value={loading ? "—" : (data?.regular_users ?? 0)}
          icon={User}
        />
        <StatCard label="Admin users" value={loading ? "—" : (data?.admin_users ?? 0)} icon={Shield} />
        <StatCard label="Total books" value={loading ? "—" : (data?.total_books ?? 0)} icon={BookOpen} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <GenreBreakdown items={data?.books_by_genre ?? []} />
        <AudiobookActivityChart data={data?.audiobooks_last_30_days ?? []} />
      </div>
    </div>
  );
}
