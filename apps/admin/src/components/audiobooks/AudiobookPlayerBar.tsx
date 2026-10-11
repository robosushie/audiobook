import { Loader2, Pause, Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { resolveCoverUrl } from "@/lib/covers";
import { formatDuration } from "@/lib/format";
import { theme } from "@/constants/theme";
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
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    setProgress(0);
    void audio.play().catch(() => undefined);
  }, [audioUrl]);

  if (!audiobook) return null;

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-xl items-center gap-2 rounded-2xl border border-white/80 bg-white/75 px-2 py-1.5 shadow-sm backdrop-blur">
        {resolveCoverUrl(audiobook.book_cover_url, audiobook.book_id) ? (
          <img
            src={resolveCoverUrl(audiobook.book_cover_url, audiobook.book_id) ?? undefined}
            alt=""
            className="h-10 w-10 shrink-0 rounded-md object-cover"
          />
        ) : (
          <div
            className="h-10 w-10 shrink-0 rounded-md"
            style={{ backgroundColor: theme.colors.chart }}
          />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold">
            {audiobook.book_title ?? "Untitled book"}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {audiobook.user_email ?? "Unknown account"} · {formatDuration(audiobook.duration)}
          </p>
          <div className="mt-1 h-0.75 overflow-hidden bg-black/10">
            <div
              className="h-full bg-signal"
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </div>
        </div>

        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        ) : audioUrl ? (
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            onClick={togglePlay}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="text-[11px] text-muted-foreground">Unavailable</span>
        )}

        <button
          type="button"
          aria-label="Close player"
          onClick={onClose}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-white/70 text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {audioUrl ? (
          <audio
            ref={audioRef}
            src={audioUrl}
            className="hidden"
            onTimeUpdate={(event) => {
              const audio = event.currentTarget;
              if (!audio.duration) return;
              setProgress(audio.currentTime / audio.duration);
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        ) : null}
      </div>
    </div>
  );
}
