import { useState } from "react";

import { deleteReference } from "@/api/references";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatReferenceLanguage } from "@/constants/languages";
import { truncatePassage } from "@/lib/reference";
import { useApi } from "@/hooks/useApi";
import type { ReferenceRow } from "@/types/api";

type DeleteReferenceModalProps = {
  reference: ReferenceRow | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function DeleteReferenceModal({
  reference,
  onClose,
  onSuccess,
}: DeleteReferenceModalProps) {
  const { request } = useApi();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!reference) return;
    setLoading(true);
    setError(null);
    try {
      await deleteReference(request, reference.id);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete reference");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={reference !== null}
      onClose={onClose}
      title="Delete reference"
      description="This removes the passage from the database. References linked to voice profiles cannot be deleted."
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading}
            className="rounded-lg border border-destructive bg-card px-4 py-2 text-destructive hover:bg-destructive/10"
            onClick={() => void handleDelete()}
          >
            {loading ? "Deleting…" : "Delete"}
          </Button>
        </>
      }
    >
      {reference ? (
        <p className="text-sm text-foreground">
          Delete the{" "}
          <span className="font-semibold">{formatReferenceLanguage(reference.language)}</span>{" "}
          reference &ldquo;{truncatePassage(reference.text, 56)}&rdquo;?
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </Modal>
  );
}
