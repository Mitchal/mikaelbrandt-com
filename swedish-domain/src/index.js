// Serves the Swedish site on mikaelbrandt.se by fetching it from GitHub
// Pages (see route-request.js for which address maps to which). A push to
// main updates both domains; this Worker only needs redeploying if the
// mapping itself changes.
import { routeRequest } from "./route-request.js";

export default {
  async fetch(request) {
    if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
    const route = routeRequest(new URL(request.url));
    if (route.redirect) return Response.redirect(route.redirect, 301);

    const response = await fetch(route.fetch, { method: request.method, redirect: "manual" });
    const served = new Response(response.body, response);
    // Should GitHub Pages redirect, keep the visitor on .se.
    const location = response.headers.get("Location");
    if (location) served.headers.set("Location", location.replace(/^https?:\/\/mikaelbrandt\.com\/sv\//, "https://mikaelbrandt.se/"));
    return served;
  },
};
