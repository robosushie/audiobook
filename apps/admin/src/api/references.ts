import type { ReferenceCreateBody, ReferenceRow, ReferenceUpdateBody } from "@/types/api";

export function fetchReferences(
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
) {
  return request<ReferenceRow[]>("/api/references/");
}

export function getReference(
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
  referenceId: string,
) {
  return request<ReferenceRow>(`/api/references/${referenceId}`);
}

export function createReference(
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
  body: ReferenceCreateBody,
) {
  return request<ReferenceRow>("/api/references/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateReference(
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
  referenceId: string,
  body: ReferenceUpdateBody,
) {
  return request<ReferenceRow>(`/api/references/${referenceId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteReference(
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
  referenceId: string,
) {
  return request<{ id: string; deleted: boolean }>(`/api/references/${referenceId}`, {
    method: "DELETE",
  });
}
