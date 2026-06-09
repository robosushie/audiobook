import { apiFetch } from '@/api/client';
import type { ReferenceRow } from '@/types/api';

export function fetchReferences(token: string) {
  return apiFetch<ReferenceRow[]>('/api/references/', { token });
}
