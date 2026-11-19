import { test } from "node:test";
import assert from "node:assert/strict";
import { routeRequest } from "../src/route-request.js";

const route = (address) => routeRequest(new URL(address));

test("serves Swedish pages from /sv/ on GitHub Pages", () => {
  assert.deepEqual(route("https://mikaelbrandt.se/"), { fetch: "https://mikaelbrandt.com/sv/" });
  assert.deepEqual(route("https://mikaelbrandt.se/produkt/"), { fetch: "https://mikaelbrandt.com/sv/produkt/" });
  assert.deepEqual(route("https://mikaelbrandt.se/integrationer/?a=1"), { fetch: "https://mikaelbrandt.com/sv/integrationer/?a=1" });
});

test("serves shared files from where they are", () => {
  assert.deepEqual(route("https://mikaelbrandt.se/base.css"), { fetch: "https://mikaelbrandt.com/base.css" });
  assert.deepEqual(route("https://mikaelbrandt.se/contact/contact.js"), { fetch: "https://mikaelbrandt.com/contact/contact.js" });
});

test("adds a missing trailing slash on .se", () => {
  assert.deepEqual(route("https://mikaelbrandt.se/produkt"), { redirect: "https://mikaelbrandt.se/produkt/" });
});

test("sends www and /sv/ addresses to the one .se address", () => {
  assert.deepEqual(route("https://www.mikaelbrandt.se/produkt/"), { redirect: "https://mikaelbrandt.se/produkt/" });
  assert.deepEqual(route("https://mikaelbrandt.se/sv/produkt/"), { redirect: "https://mikaelbrandt.se/produkt/" });
  assert.deepEqual(route("https://mikaelbrandt.se/sv"), { redirect: "https://mikaelbrandt.se/" });
});
