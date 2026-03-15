import type { Context } from "https://edge.netlify.com/";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  
  // CRITICAL: Let ALL files with extensions pass through
  if (url.pathname.match(/\.([a-zA-Z0-9]+)$/)) {
    return context.next();
  }

  // Skip functions
  if (url.pathname.startsWith('/.netlify/functions/')) {
    return context.next();
  }

  const host = url.hostname;
  if (!host.endsWith("packarcade.xyz")) return context.next();

  const parts = host.split(".");
  // Must have at least version.game.packarcade.xyz (4 parts)
  if (parts.length !== 4) return context.next();

  const version = parts[0];
  const game = parts[1];

  // Construct path to versioned game
  const basePath = `/public/imagine/${game}/${version}`;
  
  // If requesting root, serve index.html
  if (url.pathname === '/' || url.pathname === '') {
    return context.rewrite(new URL(`${basePath}/index.html`, request.url));
  }

  // Otherwise serve the requested file
  return context.rewrite(new URL(`${basePath}${url.pathname}`, request.url));
};
