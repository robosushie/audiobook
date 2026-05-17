import { useAuth } from "@clerk/react";
import { useCallback } from "react";

import { apiFetch } from "@/api/client";

export function useApi() {
  const { getToken } = useAuth();

  const request = useCallback(
    async <T>(path: string, init?: RequestInit) => {
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }
      return apiFetch<T>(path, { ...init, token });
    },
    [getToken],
  );

  return { request };
}
