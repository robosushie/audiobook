import { useEffect, useState } from "react";

import { updateUser } from "@/api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useApi } from "@/hooks/useApi";
import type { UserGender, UserRow } from "@/types/api";

type EditUserModalProps = {
  user: UserRow | null;
  onClose: () => void;
  onSuccess: () => void;
};

const GENDERS: { value: UserGender; label: string }[] = [
  { value: "undisclosed", label: "Undisclosed" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export function EditUserModal({ user, onClose, onSuccess }: EditUserModalProps) {
  const { request } = useApi();
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<UserGender>("undisclosed");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.name.first);
    setMiddleName(user.name.middle ?? "");
    setLastName(user.name.last);
    setEmail(user.email);
    setGender(user.gender);
    setVerified(user.verified);
    setError(null);
  }, [user]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await updateUser(request, user.id, {
        name: {
          first: firstName,
          middle: middleName.trim() || null,
          last: lastName,
        },
        email,
        gender,
        verified,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={user !== null}
      onClose={onClose}
      title="Edit user"
      description="Update profile and account status"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-user-form" disabled={loading}>
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      {user ? (
        <form id="edit-user-form" className="space-y-3" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <Input
            placeholder="Middle name (optional)"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Gender</span>
            <select
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
              value={gender}
              onChange={(e) => setGender(e.target.value as UserGender)}
            >
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
            />
            <span>Active account (verified)</span>
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      ) : null}
    </Modal>
  );
}

