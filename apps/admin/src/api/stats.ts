import type { DashboardOverview } from "@/types/api";

export function fetchDashboardOverview(request: <T>(path: string, init?: RequestInit) => Promise<T>) {
  return request<DashboardOverview>("/api/stats/dashboard/overview");
}
