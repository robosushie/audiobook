import { useAuth } from "@clerk/react";
import { ArrowLeft, Mic, Square } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { fetchReferences } from "@/api/references";
import { uploadVoiceProfile } from "@/api/voice";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { REFERENCE_LANGUAGES } from "@/constants/languages";
import { ROUTES } from "@/constants/routes";
import { useUserEventSubscription } from "@/contexts/user-events";
import { useApi } from "@/hooks/useApi";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { recordingToWavBlob } from "@/lib/audio";
import type { VoiceSSEPayload } from "@/lib/sse/types";
import type { ReferenceLanguage, ReferenceRow, VoiceProfileRow } from "@/types/api";

export function SimulateVoicePage() {
  const { request } = useApi();
  const { getToken } = useAuth();
  const recorder = useAudioRecorder();

  const [language, setLanguage] = useState<ReferenceLanguage>("english");
  const [references, setReferences] = useState<ReferenceRow[]>([]);
  const [referenceId, setReferenceId] = useState("");
  const [profileName, setProfileName] = useState("Simulate recording");
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracked, setTracked] = useState<VoiceProfileRow | null>(null);

  useUserEventSubscription((message) => {
    if (message.type !== "voice.created" && message.type !== "voice.updated") return;
    const data = message.data as VoiceSSEPayload;
    setTracked((current) => {
      if (!current || current.id !== data.id) return current;
      return {
        ...current,
        status: data.status,
        duration: data.duration,
        audio_url: data.audio_url ?? current.audio_url,
        label: data.label,
      };
    });
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingRefs(true);
      try {
        const rows = await fetchReferences(request);
        if (!cancelled) setReferences(rows);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load references");
        }
      } finally {
        if (!cancelled) setLoadingRefs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [request]);

  const languageReferences = useMemo(
    () => references.filter((row) => row.language === language),
    [references, language],
  );

  const selectedReference = useMemo(() => {
    if (referenceId) {
      return languageReferences.find((row) => row.id === referenceId) ?? null;
    }
    return languageReferences[0] ?? null;
  }, [languageReferences, referenceId]);

  useEffect(() => {
    if (languageReferences.length > 0) {
      setReferenceId(languageReferences[0].id);
    } else {
      setReferenceId("");
    }
  }, [language, languageReferences]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!recorder.blob || !selectedReference) return;

    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const wavBlob = await recordingToWavBlob(recorder.blob);
      const formData = new FormData();
      formData.append("file", wavBlob, "recording.wav");
      formData.append("name", profileName.trim() || "Simulate recording");
      formData.append("reference_id", selectedReference.id);

      const profile = await uploadVoiceProfile(token, formData);
      setTracked(profile);
      recorder.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
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
        title="Simulate voice"
        subtitle="Record against a reference passage and enqueue preprocess"
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

        {languageReferences.length > 1 ? (
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Reference passage</span>
            <select
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
            >
              {languageReferences.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.text.slice(0, 60)}
                  {row.text.length > 60 ? "…" : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Read aloud
          </p>
          {loadingRefs ? (
            <p className="mt-2 text-sm text-muted-foreground">Loading reference…</p>
          ) : selectedReference ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{selectedReference.text}</p>
          ) : (
            <p className="mt-2 text-sm text-destructive">
              No reference for this language. Add one on the Reference page or run bootstrap.
            </p>
          )}
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Profile name</span>
          <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          {recorder.state === "recording" ? (
            <Button type="button" variant="outline" onClick={recorder.stop}>
              <Square className="h-4 w-4 fill-current" />
              Stop recording
            </Button>
          ) : (
            <Button type="button" onClick={() => void recorder.start()} disabled={!selectedReference}>
              <Mic className="h-4 w-4" />
              {recorder.state === "recorded" ? "Record again" : "Start recording"}
            </Button>
          )}
          {recorder.state === "recorded" ? (
            <span className="text-sm text-muted-foreground">Recording ready</span>
          ) : null}
          {recorder.error ? <span className="text-sm text-destructive">{recorder.error}</span> : null}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {tracked ? (
          <p
            className={
              tracked.status === "failed"
                ? "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                : "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
            }
          >
            {tracked.label}: {tracked.status}
            {tracked.status === "ready" && tracked.duration
              ? ` (${Math.round(tracked.duration)}s)`
              : ""}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={
            submitting ||
            !recorder.blob ||
            !selectedReference ||
            recorder.state !== "recorded"
          }
        >
          {submitting ? "Submitting…" : "Submit & queue preprocess"}
        </Button>
      </form>
    </div>
  );
}
