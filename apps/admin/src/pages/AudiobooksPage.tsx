import { useAuth } from "@clerk/react";
import { RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchAdminAudiobookAudioBlob, fetchAdminAudiobooks } from "@/api/audiobooks";
import { fetchUsers } from "@/api/users";
import { AudiobookPlayerBar } from "@/components/audiobooks/AudiobookPlayerBar";
import { AudiobookTable } from "@/components/audiobooks/AudiobookTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/useApi";
import { useUserEventSubscription } from "@/contexts/user-events";
import { formatUserName } from "@/lib/user";
import type { AudiobookSSEPayload } from "@/lib/sse/types";
import type { AdminAudiobookRow, AudiobookStatusFilter, UserRow } from "@/types/api";

export function AudiobooksPage() {
  const { request } = useApi();
  const { getToken } = useAuth();
  const [audiobooks, setAudiobooks] = useState<AdminAudiobookRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<AudiobookStatusFilter>("queued_completed");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<AdminAudiobookRow | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [playLoadingId, setPlayLoadingId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [rows, accountRows] = await Promise.all([
        fetchAdminAudiobooks(
          request,
          accountFilter === "all" ? undefined : { userId: accountFilter },
        ),
        fetchUsers(request, "regular"),
      ]);
      setAudiobooks(rows);
      setUsers(accountRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audiobooks");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [request, accountFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const audiobookIdsRef = useRef<Set<string>>(new Set());
  audiobookIdsRef.current = new Set(audiobooks.map((row) => row.id));

  useUserEventSubscription((message) => {
    if (message.type !== "audiobook.created" && message.type !== "audiobook.updated") return;
    const data = message.data as AudiobookSSEPayload;
    if (!audiobookIdsRef.current.has(data.id)) {
      void load(true);
      return;
    }
    setAudiobooks((prev) => {
      const index = prev.findIndex((row) => row.id === data.id);
      if (index === -1) return prev;
      const next = [...prev];
      next[index] = {
        ...next[index],
        status: data.status,
        content_url: data.content_url ?? next[index].content_url,
        duration: data.duration ?? next[index].duration,
        book_title: data.book_title ?? next[index].book_title,
        book_cover_url: data.book_cover_url ?? next[index].book_cover_url,
      };
      return next;
    });
  });

  const hasPending = useMemo(
    () => audiobooks.some((row) => row.status === "queued" || row.status === "processing"),
    [audiobooks],
  );

  useEffect(() => {
    if (!hasPending) return;
    const timer = setInterval(() => {
      void load(true);
    }, 8000);
    return () => clearInterval(timer);
  }, [hasPending, load]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return audiobooks.filter((row) => {
      if (statusFilter === "queued_completed") {
        if (row.status !== "queued" && row.status !== "completed") return false;
      } else if (statusFilter !== "all" && row.status !== statusFilter) {
        return false;
      }

      if (!q) return true;
      const userName = row.user_name ? formatUserName(row.user_name).toLowerCase() : "";
      return (
        (row.book_title ?? "").toLowerCase().includes(q) ||
        (row.user_email ?? "").toLowerCase().includes(q) ||
        userName.includes(q) ||
        row.status.toLowerCase().includes(q)
      );
    });
  }, [audiobooks, query, statusFilter]);

  const closePlayer = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setPlaying(null);
    setPlayLoadingId(null);
  }, [audioUrl]);

  const handlePlay = useCallback(
    async (row: AdminAudiobookRow) => {
      if (row.status !== "completed") return;

      if (playing?.id === row.id && audioUrl) {
        closePlayer();
        return;
      }

      setPlayLoadingId(row.id);
      setAudioLoading(true);
      setError(null);

      try {
        const token = await getToken();
        if (!token) throw new Error("Not authenticated");
        const blob = await fetchAdminAudiobookAudioBlob(token, row.id);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
        setPlaying(row);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load audiobook audio");
      } finally {
        setAudioLoading(false);
        setPlayLoadingId(null);
      }
    },
    [audioUrl, closePlayer, getToken, playing?.id],
  );

  return (
    <div className={playing ? "pb-24" : undefined}>
      <PageHeader
        title="Audiobooks"
        subtitle="Queued and completed audiobooks across listener accounts"
        action={
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Refresh
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative max-w-xl flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 bg-card pl-10"
            placeholder="Search by book, account, or status…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <select
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm lg:w-64"
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
        >
          <option value="all">All accounts</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {formatUserName(user.name)} ({user.email})
            </option>
          ))}
        </select>

        <select
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm lg:w-52"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AudiobookStatusFilter)}
        >
          <option value="queued_completed">Queued & completed</option>
          <option value="all">All statuses</option>
          <option value="queued">Queued</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <AudiobookTable
        audiobooks={filtered}
        loading={loading}
        playingId={playing?.id ?? null}
        playLoadingId={playLoadingId}
        onPlay={(row) => void handlePlay(row)}
      />

      <AudiobookPlayerBar
        audiobook={playing}
        audioUrl={audioUrl}
        loading={audioLoading}
        onClose={closePlayer}
      />
    </div>
  );
}
