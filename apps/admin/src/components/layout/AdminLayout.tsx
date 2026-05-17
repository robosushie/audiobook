import { Outlet } from "react-router-dom";

import { Sidebar } from "@/components/layout/Sidebar";

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="min-h-screen flex-1 overflow-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
