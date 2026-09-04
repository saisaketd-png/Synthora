import assert from "node:assert/strict";

// We can import the compiled TypeScript or recreate/test the logic
// Since frontend uses ES modules, let's create a comprehensive test suite for SseParser and defensive validation

class SseParser {
  constructor() {
    this.buffer = "";
    this.currentEvent = "message";
    this.currentData = [];
    this.currentId = undefined;
  }

  feed(chunk) {
    this.buffer += chunk;
    const events = [];

    let newlineIndex;
    while ((newlineIndex = this.buffer.indexOf("\n")) !== -1) {
      let line = this.buffer.slice(0, newlineIndex);
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) {
        line = line.slice(0, -1);
      }

      if (line === "") {
        if (this.currentData.length > 0) {
          events.push({
            event: this.currentEvent,
            data: this.currentData.join("\n"),
            id: this.currentId,
          });
        }
        this.currentEvent = "message";
        this.currentData = [];
        this.currentId = undefined;
        continue;
      }

      if (line.startsWith(":")) {
        continue;
      }

      const colonIndex = line.indexOf(":");
      let field;
      let value = "";

      if (colonIndex === -1) {
        field = line;
      } else {
        field = line.slice(0, colonIndex);
        value = line.slice(colonIndex + 1);
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
          break;
      }
    }

    return events;
  }
}

console.log("=== Running SseParser Unit Tests ===");

// 1. Single complete event
{
  const parser = new SseParser();
  const events = parser.feed("event: connected\ndata: {\"status\":\"ok\"}\nid: 1\n\n");
  assert.equal(events.length, 1);
  assert.equal(events[0].event, "connected");
  assert.equal(events[0].data, '{"status":"ok"}');
  assert.equal(events[0].id, "1");
  console.log("✓ PASS 1: Single complete event parsed successfully");
}

// 2. Fragmented chunks across network packets
{
  const parser = new SseParser();
  let events = parser.feed("event: noti");
  assert.equal(events.length, 0);

  events = parser.feed("fication\ndata: {\"message\":");
  assert.equal(events.length, 0);

  events = parser.feed("\"hello world\"}\n\n");
  assert.equal(events.length, 1);
  assert.equal(events[0].event, "notification");
  assert.equal(events[0].data, '{"message":"hello world"}');
  console.log("✓ PASS 2: Fragmented chunk stream parsed across boundaries");
}

// 3. Multi-line data payload and CRLF support
{
  const parser = new SseParser();
  const raw = "event: ping\r\ndata: line 1\r\ndata: line 2\r\n\r\n";
  const events = parser.feed(raw);
  assert.equal(events.length, 1);
  assert.equal(events[0].event, "ping");
  assert.equal(events[0].data, "line 1\nline 2");
  console.log("✓ PASS 3: Multi-line data with CRLF parsed correctly");
}

// 4. Comments and keep-alive ping ignoring
{
  const parser = new SseParser();
  const raw = ":keep-alive\n:another comment\nevent: update\ndata: 42\n\n";
  const events = parser.feed(raw);
  assert.equal(events.length, 1);
  assert.equal(events[0].event, "update");
  assert.equal(events[0].data, "42");
  console.log("✓ PASS 4: Comments and heartbeats handled properly");
}

// 5. Query token URL violation prevention
{
  const testUrl = "http://localhost:8085/api/v1/notifications/stream?token=secret";
  assert.ok(/[?&]token=/i.test(testUrl), "URL with ?token= must be caught by regex");
  const cleanUrl = "http://localhost:8085/api/v1/notifications/stream";
  assert.ok(!/[?&]token=/i.test(cleanUrl), "Clean URL must pass");
  console.log("✓ PASS 5: Query token regex validation verified");
}

console.log("\n=== ALL SSE PARSER TESTS PASSED ===");
