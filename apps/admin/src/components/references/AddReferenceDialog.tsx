import { Plus } from "lucide-react";
import { useState } from "react";

import { createReference } from "@/api/references";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { REFERENCE_LANGUAGES } from "@/constants/languages";
import { useApi } from "@/hooks/useApi";
import type { ReferenceLanguage } from "@/types/api";

type AddReferenceDialogProps = {
  onSuccess: () => void;
};

export function AddReferenceDialog({ onSuccess }: AddReferenceDialogProps) {
  const { request } = useApi();
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<ReferenceLanguage>("english");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setLanguage("english");
    setText("");
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createReference(request, { language, text: text.trim() });
      setOpen(false);
      resetForm();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add reference");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add reference
      </Button>
    );
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setOpen(false);
        resetForm();
      }}
      title="Add reference passage"
      description="Short reading text for voice cloning and STT alignment (under ~1 minute when spoken)."
      className="max-w-lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button type="submit" form="add-reference-form" disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <form id="add-reference-form" className="space-y-3" onSubmit={handleSubmit}>
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
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Passage text</span>
          <textarea
            className="min-h-[120px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            placeholder="Enter a short story or sample paragraph…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </Modal>
  );
}
