/**
 * Type-safe, zero-dependency Server-Sent Events (SSE) client using fetch() and ReadableStream.
 *
 * Designed to replace native EventSource to support:
 * 1. Authorization: Bearer <access-token> request headers (EventSource cannot send custom headers).
 * 2. Absolute prohibition of tokens in URL query strings.
 * 3. Robust chunked stream decoding with CRLF / LF line normalization.
 * 4. Clean abort handling via standard AbortSignal.
 */

export interface SseEvent {
  event: string;
  data: string;
  id?: string;
}

export interface SseSubscriberOptions {
  url: string;
  token: string;
  signal: AbortSignal;
  onOpen?: (response: Response) => void;
  onEvent: (event: SseEvent) => void;
  onError?: (error: Error, status?: number) => void;
}

/**
 * State-preserving parser for SSE streams that handles chunk boundaries,
 * multi-line data payloads, comments, and empty-line event dispatches.
 */
export class SseParser {
  private buffer = "";
  private currentEvent = "message";
  private currentData: string[] = [];
  private currentId: string | undefined = undefined;

  /**
   * Feeds raw UTF-8 chunk text into the parser, returning any complete SSE events parsed.
   */
  public feed(chunk: string): SseEvent[] {
    this.buffer += chunk;
    const events: SseEvent[] = [];

    // Normalize \r\n to \n for consistent line splitting
    let newlineIndex: number;
    while ((newlineIndex = this.buffer.indexOf("\n")) !== -1) {
      let line = this.buffer.slice(0, newlineIndex);
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) {
        line = line.slice(0, -1);
      }

      // Empty line indicates event boundary in SSE specification
      if (line === "") {
        if (this.currentData.length > 0) {
          events.push({
            event: this.currentEvent,
            data: this.currentData.join("\n"),
            id: this.currentId,
          });
        }
        // Reset state for next event
        this.currentEvent = "message";
        this.currentData = [];
        this.currentId = undefined;
        continue;
      }

      // Lines starting with colon are comments/keep-alives
      if (line.startsWith(":")) {
        continue;
      }

      const colonIndex = line.indexOf(":");
      let field: string;
      let value = "";

      if (colonIndex === -1) {
        field = line;
      } else {
        field = line.slice(0, colonIndex);
        value = line.slice(colonIndex + 1);
        // Strip single leading space if present (SSE spec rule)
        if (value.startsWith(" ")) {
          value = value.slice(1);
        }
      }

      switch (field) {
        case "event":
          this.currentEvent = value;
          break;
        case "data":
          this.currentData.push(value);
          break;
        case "id":
          this.currentId = value;
          break;
        default:
          // Ignore unsupported fields (e.g. retry)
          break;
      }
    }

    return events;
  }

  public reset(): void {
    this.buffer = "";
    this.currentEvent = "message";
    this.currentData = [];
    this.currentId = undefined;
  }
}

/**
 * Connects to an SSE endpoint using fetch() and streams events to the callback.
 * Completely prohibits tokens in the URL; attaches the access token strictly in the Authorization header.
 */
export async function subscribeSse(options: SseSubscriberOptions): Promise<void> {
  const { url, token, signal, onOpen, onEvent, onError } = options;

  // Defensive validation: ensure no token was passed in the query string
  if (/[?&]token=/i.test(url)) {
    const err = new Error("Security Violation: Access token must not be passed in the URL query string.");
    onError?.(err);
    throw err;
  }

  if (signal.aborted) {
    return;
  }

  try {
    const headers: Record<string, string> = {
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const error = new Error(`SSE HTTP error: ${response.status} ${response.statusText}`);
      onError?.(error, response.status);
      return;
    }

    if (!response.body) {
      const error = new Error("SSE response has no readable body");
      onError?.(error, response.status);
      return;
    }

    onOpen?.(response);

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    const parser = new SseParser();

    try {
      while (!signal.aborted) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        if (value) {
          const textChunk = decoder.decode(value, { stream: true });
          const events = parser.feed(textChunk);
          for (const evt of events) {
            onEvent(evt);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (err: unknown) {
    if (signal.aborted) {
      // Aborted gracefully by client; do not treat as error
      return;
    }
    const error = err instanceof Error ? err : new Error(String(err));
    onError?.(error);
  }
}
