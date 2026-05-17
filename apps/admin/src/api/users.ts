import type { UserRow, UserUpdateBody } from "@/types/api";

export function fetchUsers(
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
  role?: "regular" | "admin",
) {
  const query = role ? `?role=${encodeURIComponent(role)}` : "";
  return request<UserRow[]>(`/api/users/${query}`);
}

export function getUser(
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
  userId: string,
) {
  return request<UserRow>(`/api/users/${userId}`);
}

export function updateUser(
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
  userId: string,
  body: UserUpdateBody,
) {
  return request<UserRow>(`/api/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteUser(
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
  userId: string,
) {
  return request<{ id: string; deleted: boolean }>(`/api/users/${userId}`, {
    method: "DELETE",
  });
}

export function inviteUser(
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
  body: {
    email: string;
    first_name: string;
    last_name: string;
    role: "regular" | "admin";
  },
) {
  return request<{ clerk_id: string; action: string }>("/api/users/invite", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
