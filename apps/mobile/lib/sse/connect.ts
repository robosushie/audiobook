import { getApiBaseUrl } from '@/lib/env';
import type { UserEventType, UserSSEMessage } from '@/lib/sse/types';

type EventHandler = (message: UserSSEMessage) => void;

type ConnectOptions = {
  onDisconnect?: () => void;
};

function parseSSEBlock(block: string): { event?: string; data?: string } {
  const lines = block.split('\n');
  let event: string | undefined;
  let data: string | undefined;
  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      data = line.slice(5).trim();
    }
  }
  return { event, data };
}

/** Connect to the user SSE stream using fetch (works on native when ReadableStream is available). */
export function connectUserEvents(
  token: string,
  onEvent: EventHandler,
  options?: ConnectOptions,
): () => void {
  const controller = new AbortController();
  let closed = false;

  async function run() {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/events/stream`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!closed) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';

        for (const chunk of chunks) {
          if (!chunk.trim() || chunk.startsWith(':')) continue;
          const { event, data } = parseSSEBlock(chunk);
          if (!event || !data) continue;
          try {
            const parsed = JSON.parse(data) as UserSSEMessage['data'];
            onEvent({
              type: event as UserEventType,
              data: parsed,
            });
          } catch {
            // Ignore malformed frames.
          }
        }
      }
    } catch {
      // Aborted or network error.
    } finally {
      if (!closed) {
        options?.onDisconnect?.();
      }
    }
  }

  void run();

  return () => {
    closed = true;
    controller.abort();
  };
}
