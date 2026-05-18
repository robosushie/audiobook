import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { generateAudiobook } from "@/api/audiobooks";
import { fetchBooks } from "@/api/books";
import { fetchVoiceProfiles } from "@/api/voice";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { REFERENCE_LANGUAGES } from "@/constants/languages";
import { ROUTES } from "@/constants/routes";
import { useApi } from "@/hooks/useApi";
import type { BookRow, ReferenceLanguage, VoiceProfileRow } from "@/types/api";

export function SimulateAudiobookPage() {
  const { request } = useApi();

  const [language, setLanguage] = useState<ReferenceLanguage>("english");
  const [books, setBooks] = useState<BookRow[]>([]);
  const [voices, setVoices] = useState<VoiceProfileRow[]>([]);
  const [bookId, setBookId] = useState("");
  const [voiceProfileId, setVoiceProfileId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allBooks, userVoices] = await Promise.all([
        fetchBooks(request),
        fetchVoiceProfiles(request, { language }),
      ]);
      setBooks(allBooks);
      setVoices(userVoices);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [request, language]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const booksForLanguage = useMemo(
    () => books.filter((book) => book.language === language && book.is_active),
    [books, language],
  );

  const readyVoices = useMemo(
    () => voices.filter((voice) => voice.status === "ready"),
    [voices],
  );

  useEffect(() => {
    if (booksForLanguage.length > 0) {
      setBookId(booksForLanguage[0].id);
    } else {
      setBookId("");
    }
  }, [booksForLanguage]);

  useEffect(() => {
    if (readyVoices.length > 0) {
      setVoiceProfileId(readyVoices[0].id);
    } else {
      setVoiceProfileId("");
    }
  }, [readyVoices]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!bookId || !voiceProfileId) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const audiobook = await generateAudiobook(request, {
        book_id: bookId,
        voice_profile_id: voiceProfileId,
      });
      setSuccess(
        `Audiobook generation queued (id: ${audiobook.id}). Inngest will process it — check the database for status.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to queue generation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link
        to={ROUTES.simulate}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to simulate
      </Link>

      <PageHeader
        title="Simulate audiobook"
        subtitle="Queue clone + upload for a book using a ready voice profile"
      />

      <form
        className="max-w-2xl space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm"
        onSubmit={handleSubmit}
      >
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Language</span>
          <select
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            value={language}
            onChange={(e) => setLanguage(e.target.value as ReferenceLanguage)}
          >
            {REFERENCE_LANGUAGES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading books and voice profiles…</p>
        ) : (
          <>
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Book</span>
              <select
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                disabled={booksForLanguage.length === 0}
              >
                {booksForLanguage.length === 0 ? (
                  <option value="">No active books for this language</option>
                ) : (
                  booksForLanguage.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">
                Voice profile (ready, {language})
              </span>
              <select
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                value={voiceProfileId}
                onChange={(e) => setVoiceProfileId(e.target.value)}
                disabled={readyVoices.length === 0}
              >
                {readyVoices.length === 0 ? (
                  <option value="">No ready voice profiles — run simulate voice first</option>
                ) : (
                  readyVoices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.label} ({voice.status})
                    </option>
                  ))
                )}
              </select>
              {voices.length > 0 && readyVoices.length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {voices.length} profile(s) found but none are ready yet.
                </p>
              ) : null}
            </label>
          </>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={
            submitting ||
            loading ||
            !bookId ||
            !voiceProfileId
          }
        >
          {submitting ? "Submitting…" : "Submit & queue generation"}
        </Button>
      </form>
    </div>
  );
}
