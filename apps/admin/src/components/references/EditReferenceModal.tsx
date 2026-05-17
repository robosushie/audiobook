import { useEffect, useState } from "react";

import { updateReference } from "@/api/references";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { REFERENCE_LANGUAGES } from "@/constants/languages";
import { useApi } from "@/hooks/useApi";
import type { ReferenceLanguage, ReferenceRow } from "@/types/api";

type EditReferenceModalProps = {
  reference: ReferenceRow | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function EditReferenceModal({ reference, onClose, onSuccess }: EditReferenceModalProps) {
  const { request } = useApi();
  const [language, setLanguage] = useState<ReferenceLanguage>("english");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!reference) return;
    setLanguage(reference.language);
    setText(reference.text);
    setError(null);
  }, [reference]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!reference) return;
    setLoading(true);
    setError(null);
    try {
      await updateReference(request, reference.id, {
        language,
        text: text.trim(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update reference");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={reference !== null}
      onClose={onClose}
      title="Edit reference"
      description="Update language or passage text"
      className="max-w-lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-reference-form" disabled={loading}>
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      {reference ? (
        <form id="edit-reference-form" className="space-y-3" onSubmit={handleSubmit}>
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
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      ) : null}
    </Modal>
  );
}
