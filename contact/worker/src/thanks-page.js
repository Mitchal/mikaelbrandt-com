// The page a visitor lands on after sending the form with JavaScript off.
// With JavaScript the form shows its own confirmation and never sees this.

const WORDS = {
  en: { sent: "Thanks, your message is on its way. I'll reply within one working day.", failed: "That didn't go through. Please email me directly instead.", back: "Back" },
  sv: { sent: "Tack, ditt meddelande är skickat. Jag svarar inom en arbetsdag.", failed: "Det gick inte att skicka. Mejla mig direkt i stället.", back: "Tillbaka" },
};

const escape = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function thanksPage({ lang, sent, back }) {
  const words = WORDS[lang] || WORDS.en;
  const link = /^https?:\/\//.test(back || "") ? `<p><a href="${escape(back)}">${words.back}</a></p>` : "";
  const html = `<!doctype html>
<html lang="${lang === "sv" ? "sv" : "en"}">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mikael Brandt</title>
<style>body{margin:0;min-height:100vh;display:grid;place-content:center;padding:24px;background:#0b1a10;color:#e7eedc;font:1.15rem/1.6 "Helvetica Neue",Arial,sans-serif}a{color:#c4d896}</style>
<p>${sent ? words.sent : words.failed}</p>
${link}
</html>`;
  return new Response(html, { status: sent ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
