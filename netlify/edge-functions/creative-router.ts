// netlify/edge-functions/creative-router.ts
import type { Context } from "https://edge.netlify.com/";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const host = url.hostname;

  // Map specific creative subdomains to custom pages
  const creativeMap: Record<string, string> = {
    "languages.sites.packarcade.xyz": "/languages/index.html",
    "portal.packarcade.xyz": "/portal/index.html",
    "secret.packarcade.xyz": "/secret/index.html",  // another hidden page
  };

  if (creativeMap[host]) {
    return context.rewrite(new URL(creativeMap[host], request.url));
  }

  return context.next();
};
