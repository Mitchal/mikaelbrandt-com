import { test } from "node:test";
import assert from "node:assert/strict";
import { checkFields, readSubmission } from "../src/read-submission.js";

test("accepts an email alone", () => {
  const result = checkFields({ email: " ada@example.com ", lang: "sv", offer: "b" });
  assert.deepEqual(result, { ok: true, value: { email: "ada@example.com", message: "", offer: "b", lang: "sv", page: "" } });
});

test("rejects a missing or malformed email", () => {
  assert.deepEqual(checkFields({}), { ok: false, error: "email" });
  assert.deepEqual(checkFields({ email: "ada at example" }), { ok: false, error: "email" });
});

test("rejects an overlong message", () => {
  assert.deepEqual(checkFields({ email: "a@b.se", message: "x".repeat(5001) }), { ok: false, error: "message" });
});

test("falls back on unknown offer and language", () => {
  const { value } = checkFields({ email: "a@b.se", offer: "z", lang: "de" });
  assert.equal(value.offer, "");
  assert.equal(value.lang, "en");
});

test("flags the trap field as spam", () => {
  assert.deepEqual(checkFields({ email: "a@b.se", website: "http://spam" }), { ok: true, spam: true });
});

test("reads JSON and plain form posts", async () => {
  const asJson = new Request("https://x/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "a@b.se" }) });
  assert.equal((await readSubmission(asJson)).ok, true);
  const asForm = new Request("https://x/", { method: "POST", body: new URLSearchParams({ email: "a@b.se", message: "Hej" }) });
  assert.equal((await readSubmission(asForm)).value.message, "Hej");
  const broken = new Request("https://x/", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" });
  assert.deepEqual(await readSubmission(broken), { ok: false, error: "body" });
});
