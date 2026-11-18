import { test } from "node:test";
import assert from "node:assert/strict";
import { issueFor } from "../src/github-issue.js";

const base = { email: "ada@example.com", message: "", offer: "a", lang: "en", page: "https://mikaelbrandt.com/product/" };

test("titles the issue with the offer, language and email", () => {
  assert.equal(issueFor(base).title, "Product foundations (English): ada@example.com");
  assert.equal(issueFor({ ...base, offer: "", lang: "sv" }).title, "No offer picked (Swedish): ada@example.com");
});

test("names the situation and the site the visitor was on", () => {
  const { body } = issueFor({ ...base, offer: "b", lang: "sv", page: "https://mikaelbrandt.se/integrationer/" });
  assert.match(body, /\*\*Their situation:\*\* Agents connect CRM/);
  assert.match(body, /\*\*Language:\*\* Swedish/);
  assert.match(body, /\*\*Site:\*\* mikaelbrandt\.se/);
});

test("says so when there is no message", () => {
  assert.match(issueFor(base).body, /No message, only an email address/);
});

test("keeps the message inside a code block it cannot close", () => {
  const message = "Ping @someone about #12\n```\nbreak out?";
  const { body } = issueFor({ ...base, message });
  const fence = body.match(/^(`{3,})text$/m)[1];
  assert.equal(fence.length, 4);
  assert.ok(body.endsWith(`${message}\n${fence}`));
});
