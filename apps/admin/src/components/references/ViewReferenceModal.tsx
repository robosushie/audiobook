import { Modal } from "@/components/ui/modal";
import { formatReferenceLanguage } from "@/constants/languages";
import type { ReferenceRow } from "@/types/api";

type ViewReferenceModalProps = {
  reference: ReferenceRow | null;
  onClose: () => void;
};

export function ViewReferenceModal({ reference, onClose }: ViewReferenceModalProps) {
  return (
    <Modal
      open={reference !== null}
      onClose={onClose}
      title="View reference"
      description="Full reading passage"
      className="max-w-lg"
    >
      {reference ? (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Language
            </p>
            <p className="mt-1 text-sm font-medium">
              {formatReferenceLanguage(reference.language)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Passage
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{reference.text}</p>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
