import { UsersPageClient } from "./users-page-client";
import { mockUsers } from "@/lib/mock-data";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">Manage platform users</p>
      </div>
      <UsersPageClient initialUsers={mockUsers} />
    </div>
  );
}
