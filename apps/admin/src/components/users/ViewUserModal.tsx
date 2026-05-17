import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/users/StatusBadge";
import { formatGender, formatUserName } from "@/lib/user";
import type { UserRow } from "@/types/api";

type ViewUserModalProps = {
  user: UserRow | null;
  onClose: () => void;
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function ViewUserModal({ user, onClose }: ViewUserModalProps) {
  return (
    <Modal
      open={user !== null}
      onClose={onClose}
      title="View user"
      description="Account details"
    >
      {user ? (
        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="Name" value={formatUserName(user.name)} />
          <Detail label="Email" value={user.email} />
          <Detail label="Role" value={user.role} />
          <Detail label="Gender" value={formatGender(user.gender)} />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </dt>
            <dd className="mt-1">
              <StatusBadge active={user.verified} />
            </dd>
          </div>
          <Detail
            label="Joined"
            value={new Date(user.created_at).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
        </dl>
      ) : null}
    </Modal>
  );
}
