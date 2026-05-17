import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchUsers } from "@/api/users";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { InviteUserDialog } from "@/components/users/InviteUserDialog";
import { UserTable } from "@/components/users/UserTable";
import { useApi } from "@/hooks/useApi";
import { formatUserName } from "@/lib/user";
import type { UserRow } from "@/types/api";

export function UsersPage() {
  const { request } = useApi();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchUsers(request, "regular");
      setUsers(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        formatUserName(u.name).toLowerCase().includes(q),
    );
  }, [users, query]);

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="App listeners — regular accounts only"
        action={<InviteUserDialog role="regular" label="Add user" onSuccess={load} />}
      />

      <div className="relative mb-4 max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-10 bg-card pl-10"
          placeholder="Search users by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <UserTable users={filtered} loading={loading} onRefresh={load} />
    </div>
  );
}
