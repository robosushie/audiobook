import { useAuth } from "@clerk/react";
import { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { createContext, type ReactNode } from "react";

import { connectUserEvents } from "@/lib/sse/connect";
import type { UserSSEMessage } from "@/lib/sse/types";

type UserEventsContextValue = {
  subscribe: (handler: (message: UserSSEMessage) => void) => () => void;
};

const UserEventsContext = createContext<UserEventsContextValue | null>(null);

const RECONNECT_DELAY_MS = 3000;

export function UserEventsProvider({ children }: { children: ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const listenersRef = useRef(new Set<(message: UserSSEMessage) => void>());
  const disconnectRef = useRef<(() => void) | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const subscribe = useCallback((handler: (message: UserSSEMessage) => void) => {
    listenersRef.current.add(handler);
    return () => {
      listenersRef.current.delete(handler);
    };
  }, []);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connectRef = useRef<() => Promise<void>>(async () => {});

  const scheduleReconnect = useCallback(() => {
    clearReconnectTimer();
    if (!mountedRef.current || !isSignedIn) return;
    reconnectTimerRef.current = setTimeout(() => {
      void connectRef.current();
    }, RECONNECT_DELAY_MS);
  }, [clearReconnectTimer, isSignedIn]);

  const connect = useCallback(async () => {
    disconnectRef.current?.();
    disconnectRef.current = null;
    clearReconnectTimer();

    const token = await getTokenRef.current();
    if (!token || !mountedRef.current) return;

    disconnectRef.current = connectUserEvents(
      token,
      (message) => {
        for (const listener of listenersRef.current) {
          listener(message);
        }
      },
      {
        onDisconnect: () => {
          scheduleReconnect();
        },
      },
    );
  }, [clearReconnectTimer, scheduleReconnect]);

  connectRef.current = connect;

  useEffect(() => {
    mountedRef.current = true;

    if (!isSignedIn) {
      disconnectRef.current?.();
      disconnectRef.current = null;
      clearReconnectTimer();
      return;
    }

    void connect();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void connect();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      mountedRef.current = false;
      document.removeEventListener("visibilitychange", onVisible);
      clearReconnectTimer();
      disconnectRef.current?.();
      disconnectRef.current = null;
    };
  }, [clearReconnectTimer, connect, isSignedIn]);

  const value = useMemo(() => ({ subscribe }), [subscribe]);

  return <UserEventsContext.Provider value={value}>{children}</UserEventsContext.Provider>;
}

export function useUserEventSubscription(handler: (message: UserSSEMessage) => void) {
  const ctx = useContext(UserEventsContext);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!ctx) return;
    return ctx.subscribe((message) => handlerRef.current(message));
  }, [ctx]);

  if (!ctx) {
    throw new Error("useUserEventSubscription must be used within UserEventsProvider");
  }
}
