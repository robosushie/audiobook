import { Loader2, Play } from "lucide-react";

import { AudiobookStatusBadge } from "@/components/audiobooks/AudiobookStatusBadge";
import { resolveCoverUrl } from "@/lib/covers";
import { formatDateTime, formatDuration } from "@/lib/format";
import { formatUserName } from "@/lib/user";
import { cn } from "@/lib/utils";
import type { AdminAudiobookRow } from "@/types/api";

type AudiobookTableProps = {
  audiobooks: AdminAudiobookRow[];
  loading: boolean;
  playingId: string | null;
  playLoadingId: string | null;
  emptyMessage?: string;
  onPlay: (audiobook: AdminAudiobookRow) => void;
};

export function AudiobookTable({
  audiobooks,
  loading,
  playingId,
  playLoadingId,
  emptyMessage = "No audiobooks found for this filter.",
  onPlay,
}: AudiobookTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-muted/40">
          <tr>
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Book
            </th>
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Account
            </th>
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Duration
            </th>
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Created
            </th>
            <th className="w-24 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Listen
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                Loading…
              </td>
            </tr>
          ) : audiobooks.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            audiobooks.map((row) => {
              const canPlay = row.status === "completed";
              const isPlaying = playingId === row.id;
              const isLoading = playLoadingId === row.id;

              return (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {resolveCoverUrl(row.book_cover_url, row.book_id) ? (
                        <img
                          src={resolveCoverUrl(row.book_cover_url, row.book_id) ?? undefined}
                          alt=""
                          className="h-10 w-8 rounded object-cover ring-1 ring-border"
                        />
                      ) : (
                        <div className="flex h-10 w-8 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
                          AB
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{row.book_title ?? "Untitled book"}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {row.book_language ?? "Unknown language"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="truncate font-medium">
                      {row.user_name ? formatUserName(row.user_name) : "Unknown user"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{row.user_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <AudiobookStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDuration(row.duration)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(row.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      aria-label={
                        canPlay
                          ? isPlaying
                            ? "Replay audiobook"
                            : "Play audiobook"
                          : "Playback unavailable until completed"
                      }
                      title={
                        canPlay
                          ? isPlaying
                            ? "Replay"
                            : "Play"
                          : "Available when status is completed"
                      }
                      disabled={!canPlay || isLoading}
                      onClick={() => onPlay(row)}
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        canPlay
                          ? isPlaying
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-foreground hover:bg-muted"
                          : "cursor-not-allowed border-border bg-muted/40 text-muted-foreground",
                      )}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
