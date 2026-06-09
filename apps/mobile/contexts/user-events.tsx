import { connectUserEvents } from '@/lib/sse/connect';
import type { UserSSEMessage } from '@/lib/sse/types';
import { useAuth } from '@clerk/expo';
import * as React from 'react';
import { AppState, type AppStateStatus } from 'react-native';

type UserEventsContextValue = {
  subscribe: (handler: (message: UserSSEMessage) => void) => () => void;
};

const UserEventsContext = React.createContext<UserEventsContextValue | null>(null);

const RECONNECT_DELAY_MS = 3000;

export function UserEventsProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  const getTokenRef = React.useRef(getToken);
  getTokenRef.current = getToken;

  const listenersRef = React.useRef(new Set<(message: UserSSEMessage) => void>());
  const disconnectRef = React.useRef<(() => void) | null>(null);
  const reconnectTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = React.useRef(true);

  const subscribe = React.useCallback((handler: (message: UserSSEMessage) => void) => {
    listenersRef.current.add(handler);
    return () => {
      listenersRef.current.delete(handler);
    };
  }, []);

  const clearReconnectTimer = React.useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connectRef = React.useRef<() => Promise<void>>(async () => {});

  const scheduleReconnect = React.useCallback(() => {
    clearReconnectTimer();
    if (!mountedRef.current || !isSignedIn) return;
    reconnectTimerRef.current = setTimeout(() => {
      void connectRef.current();
    }, RECONNECT_DELAY_MS);
  }, [clearReconnectTimer, isSignedIn]);

  const connect = React.useCallback(async () => {
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

  React.useEffect(() => {
    mountedRef.current = true;

    if (!isSignedIn) {
      disconnectRef.current?.();
      disconnectRef.current = null;
      clearReconnectTimer();
      return;
    }

    void connect();

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        void connect();
      }
    };
    const sub = AppState.addEventListener('change', onAppState);

    return () => {
      mountedRef.current = false;
      sub.remove();
      clearReconnectTimer();
      disconnectRef.current?.();
      disconnectRef.current = null;
    };
  }, [clearReconnectTimer, connect, isSignedIn]);

  const value = React.useMemo(() => ({ subscribe }), [subscribe]);

  return <UserEventsContext.Provider value={value}>{children}</UserEventsContext.Provider>;
}

export function useUserEvents() {
  const ctx = React.useContext(UserEventsContext);
  if (!ctx) {
    throw new Error('useUserEvents must be used within UserEventsProvider');
  }
  return ctx;
}

export function useUserEventSubscription(
  handler: (message: UserSSEMessage) => void,
  deps: React.DependencyList = [],
) {
  const { subscribe } = useUserEvents();
  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;

  React.useEffect(() => {
    return subscribe((message) => handlerRef.current(message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe, ...deps]);
}
