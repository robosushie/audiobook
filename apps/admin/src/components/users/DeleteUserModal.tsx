import { useState } from "react";

import { deleteUser } from "@/api/users";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useApi } from "@/hooks/useApi";
import { formatUserName } from "@/lib/user";
import type { UserRow } from "@/types/api";

type DeleteUserModalProps = {
  user: UserRow | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function DeleteUserModal({ user, onClose, onSuccess }: DeleteUserModalProps) {
  const { request } = useApi();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await deleteUser(request, user.id);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={user !== null}
      onClose={onClose}
      title="Delete user"
      description="This removes the user from the database. This action cannot be undone."
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
      {user ? (
        <p className="text-sm text-foreground">
          Delete <span className="font-semibold">{formatUserName(user.name)}</span> (
          {user.email})?
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </Modal>
  );
}
