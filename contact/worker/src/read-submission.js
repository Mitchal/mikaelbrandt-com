// Reads a contact form post (JSON from the script, or a plain form post when
// JavaScript is off) and checks it. Returns { ok: true, value } with clean
// fields, { ok: true, spam: true } when the hidden trap field was filled in,
// or { ok: false, error } when the visitor has something to fix.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OFFERS = new Set(["", "a", "b"]);
const LANGS = new Set(["en", "sv"]);
const LIMITS = { email: 254, message: 5000, page: 300 };

async function readFields(request) {
  const type = request.headers.get("Content-Type") || "";
  if (type.includes("application/json")) return await request.json();
  const form = await request.formData();
  return Object.fromEntries([...form].map(([k, v]) => [k, typeof v === "string" ? v : ""]));
}

const text = (value) => (typeof value === "string" ? value.trim() : "");

export function checkFields(fields) {
  if (text(fields.website)) return { ok: true, spam: true };

  const value = {
    email: text(fields.email),
    message: text(fields.message),
    offer: text(fields.offer),
    lang: LANGS.has(text(fields.lang)) ? text(fields.lang) : "en",
    page: text(fields.page).slice(0, LIMITS.page),
  };
  if (!EMAIL.test(value.email) || value.email.length > LIMITS.email) return { ok: false, error: "email" };
  if (value.message.length > LIMITS.message) return { ok: false, error: "message" };
  if (!OFFERS.has(value.offer)) value.offer = "";
  return { ok: true, value };
}

export async function readSubmission(request) {
  try {
    const fields = await readFields(request);
    return checkFields(fields && typeof fields === "object" ? fields : {});
  } catch {
    return { ok: false, error: "body" };
  }
}
