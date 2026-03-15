// netlify/edge-functions/game-version-router.ts
import type { Config, Context } from "https://edge.netlify.com/";

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);
  const host = url.hostname;

  // Only handle subdomains of packarcade.xyz
  if (!host.endsWith("packarcade.xyz")) {
    return context.next();
  }

  const parts = host.split(".");
  // parts = [sub1, sub2, "packarcade", "xyz"]  (at least 2 subdomain parts)
  if (parts.length < 4) {
    // Single‑part subdomains (e.g., "nebula") are handled by explicit redirects above
    return context.next();
  }

  const version = parts[0]; // e.g., "v2", "beta", "test"
  const game = parts[1];     // e.g., "run", "mario", "quantum"

  // Build the base path inside /public/imagine
  let basePath = `/public/imagine/${game}/${version}`;

  // Append the rest of the request path
  let fullPath = basePath + url.pathname;

  // If the path ends with '/', append 'index.html'
  if (fullPath.endsWith("/")) {
    fullPath += "index.html";
  }

  // Edge Functions can rewrite to an internal path using context.rewrite()
  // This tells Netlify to serve the file from that location.
  return context.rewrite(new URL(fullPath, request.url));
}
