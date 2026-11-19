import { assertEquals, assertMatch } from "jsr:@std/assert@1";
import {
  createHandoffCode,
  HANDOFF_TTL_MS,
  handoffExpiresAt,
  hashHandoffCode,
  isValidHandoffCode,
} from "./adminHandoff.ts";

Deno.test("creates a cryptographically random 256-bit hex code", () => {
  const code = createHandoffCode();
  assertEquals(code.length, 64);
  assertMatch(code, /^[0-9a-f]{64}$/);
});

Deno.test("rejects malformed handoff codes", () => {
  assertEquals(isValidHandoffCode(null), false);
  assertEquals(isValidHandoffCode(""), false);
  assertEquals(isValidHandoffCode("a".repeat(63)), false);
  assertEquals(isValidHandoffCode("g".repeat(64)), false);
  assertEquals(isValidHandoffCode("A".repeat(64)), false);
  assertEquals(isValidHandoffCode("a".repeat(64)), true);
});

Deno.test("hashes the code with SHA-256", async () => {
  assertEquals(
    await hashHandoffCode("a".repeat(64)),
    "ffe054fe7ae0cb6dc65c3af9b61d5209f439851db43d0ba5997337df154668eb",
  );
});

Deno.test("handoff codes expire after exactly 60 seconds", () => {
  assertEquals(HANDOFF_TTL_MS, 60_000);
  assertEquals(
    handoffExpiresAt(1_000),
    "1970-01-01T00:01:01.000Z",
  );
});
