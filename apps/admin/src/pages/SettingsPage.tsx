import { Search, Shield } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchUsers } from "@/api/users";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { InviteUserDialog } from "@/components/users/InviteUserDialog";
import { UserTable } from "@/components/users/UserTable";
import { useApi } from "@/hooks/useApi";
import { formatUserName } from "@/lib/user";
import type { UserRow } from "@/types/api";

export function SettingsPage() {
  const { request } = useApi();
  const [admins, setAdmins] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAdmins(await fetchUsers(request, "admin"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admins");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        formatUserName(u.name).toLowerCase().includes(q),
    );
  }, [admins, query]);

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Admin access and platform operators"
        action={<InviteUserDialog role="admin" label="Add admin" onSuccess={load} />}
      />

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Admin users</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Only admins can access this console. New admins receive Clerk credentials with the
          admin role in public metadata.
        </p>

        <div className="relative mb-4 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 bg-card pl-10"
            placeholder="Search admins by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <UserTable
          users={filtered}
          loading={loading}
          emptyMessage="No admin users yet."
          onRefresh={load}
        />
      </div>
    </div>
  );
}
