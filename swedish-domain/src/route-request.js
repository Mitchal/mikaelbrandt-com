// Decides where a request to mikaelbrandt.se goes. The site itself lives on
// GitHub Pages at mikaelbrandt.com, which allows only one domain, so the
// Swedish pages sit there under /sv/. Here they are served from the root:
// mikaelbrandt.se/produkt/ is mikaelbrandt.com/sv/produkt/. Files (css,
// scripts, the favicon) are shared by both languages and keep their path;
// build.mjs already writes the Swedish pages' links to resolve that way.

export const ORIGIN = "https://mikaelbrandt.com";
export const HOME = "https://mikaelbrandt.se";

const lastSegment = (path) => path.slice(path.lastIndexOf("/") + 1);

// Returns { redirect } to send the visitor elsewhere, or { fetch } with the
// address on GitHub Pages to serve from.
export function routeRequest(url) {
  if (url.hostname !== new URL(HOME).hostname) return { redirect: `${HOME}${url.pathname}${url.search}` };
  const path = url.pathname;
  if (path === "/sv" || path.startsWith("/sv/")) return { redirect: `${HOME}${path.slice(3) || "/"}${url.search}` };
  // A page address without its trailing slash: add it here, or GitHub Pages
  // would redirect the visitor to its own .com address.
  if (!path.endsWith("/") && !lastSegment(path).includes(".")) return { redirect: `${HOME}${path}/${url.search}` };
  const page = path.endsWith("/");
  return { fetch: `${ORIGIN}${page ? `/sv${path}` : path}${url.search}` };
}
