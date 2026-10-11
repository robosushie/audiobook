import { Eye, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { DeleteUserModal } from "@/components/users/DeleteUserModal";
import { EditUserModal } from "@/components/users/EditUserModal";
import { StatusBadge } from "@/components/users/StatusBadge";
import { ViewUserModal } from "@/components/users/ViewUserModal";
import { cn } from "@/lib/utils";
import { formatUserName } from "@/lib/user";
import type { UserRow } from "@/types/api";

type UserTableProps = {
  users: UserRow[];
  loading: boolean;
  emptyMessage?: string;
  onRefresh: () => void;
};

function IconButton({
  label,
  onClick,
  children,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border bg-card text-foreground transition-colors duration-150",
        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        variant === "default" && "border-border",
        variant === "danger" &&
          "border-destructive/40 text-destructive hover:bg-destructive/10",
      )}
    >
      {children}
    </button>
  );
}

export function UserTable({
  users,
  loading,
  emptyMessage = "No users found.",
  onRefresh,
}: UserTableProps) {
  const [viewUser, setViewUser] = useState<UserRow | null>(null);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [deleteUserState, setDeleteUserState] = useState<UserRow | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Joined
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{formatUserName(user.name)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <StatusBadge active={user.verified} />
                      <IconButton label="View user" onClick={() => setViewUser(user)}>
                        <Eye className="h-4 w-4" />
                      </IconButton>
                      <IconButton label="Edit user" onClick={() => setEditUser(user)}>
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label="Delete user"
                        variant="danger"
                        onClick={() => setDeleteUserState(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ViewUserModal user={viewUser} onClose={() => setViewUser(null)} />
      <EditUserModal
        user={editUser}
        onClose={() => setEditUser(null)}
        onSuccess={onRefresh}
      />
      <DeleteUserModal
        user={deleteUserState}
        onClose={() => setDeleteUserState(null)}
        onSuccess={onRefresh}
      />
    </>
  );
}
