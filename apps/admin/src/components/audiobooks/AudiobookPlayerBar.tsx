import { Loader2, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { formatDuration } from "@/lib/format";
import type { AdminAudiobookRow } from "@/types/api";

type AudiobookPlayerBarProps = {
  audiobook: AdminAudiobookRow | null;
  audioUrl: string | null;
  loading: boolean;
  onClose: () => void;
};

export function AudiobookPlayerBar({
  audiobook,
  audioUrl,
  loading,
  onClose,
}: AudiobookPlayerBarProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    void audio.play().catch(() => undefined);
  }, [audioUrl]);

  if (!audiobook) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{audiobook.book_title ?? "Untitled book"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {audiobook.user_email ?? "Unknown account"} · {formatDuration(audiobook.duration)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : audioUrl ? (
            <audio ref={audioRef} controls src={audioUrl} className="h-10 max-w-xs sm:max-w-md" />
          ) : (
            <span className="text-xs text-muted-foreground">Audio unavailable</span>
          )}

          <button
            type="button"
            aria-label="Close player"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}