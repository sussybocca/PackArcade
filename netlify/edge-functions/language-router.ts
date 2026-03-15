// netlify/edge-functions/language-router.ts
import type { Context } from "https://edge.netlify.com/";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const host = url.hostname;
  const parts = host.split('.');

  // Match patterns like fr.packarcade.xyz (3 parts) or es.something.packarcade.xyz (4 parts)
  // We'll handle the simple case: [lang].packarcade.xyz
  if (parts.length === 3 && parts[1] === 'packarcade') {
    const lang = parts[0]; // e.g., "fr", "es", "de"
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    const filePath = `/${lang}${path}`;
    return context.rewrite(new URL(filePath, request.url));
  }

  return context.next();
};
