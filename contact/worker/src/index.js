// Receives the site's contact form and files each message as an issue in a
// private GitHub repo. The site is static (GitHub Pages), so this Worker is
// the only moving part. The script on the page posts JSON and gets JSON
// back; a plain form post (JavaScript off) gets a small thank-you page.
import { readSubmission } from "./read-submission.js";
import { createIssue } from "./github-issue.js";
import { thanksPage } from "./thanks-page.js";

function corsHeaders(env, origin) {
  const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  if (!allowed.includes(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

const json = (body, status, headers) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });

async function underLimit(env, request) {
  if (!env.LIMITER) return true;
  const { success } = await env.LIMITER.limit({ key: request.headers.get("CF-Connecting-IP") || "unknown" });
  return success;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(env, origin);
    const wantsJson = (request.headers.get("Accept") || "").includes("application/json");

    if (request.method === "OPTIONS") return new Response(null, { status: cors ? 204 : 403, headers: cors || {} });
    if (request.method !== "POST") return new Response("Not found", { status: 404 });
    // Browsers always send Origin on a cross-site post; anything else is not our form.
    if (!cors) return new Response("Forbidden", { status: 403 });
    if (!(await underLimit(env, request))) return json({ error: "busy" }, 429, cors);

    const result = await readSubmission(request);
    const reply = (status, error) =>
      wantsJson
        ? json(error ? { error } : { sent: true }, status, cors)
        : thanksPage({ lang: result.value?.lang, sent: !error, back: request.headers.get("Referer") });

    if (!result.ok) return reply(400, result.error);
    if (result.spam) return reply(200);
    try {
      await createIssue(env, result.value);
      return reply(200);
    } catch (err) {
      console.error(err);
      return reply(502, "delivery");
    }
  },
};
