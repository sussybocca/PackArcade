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
  const parts = host.split('.');

  // Handle [lang].packarcade.xyz
  if (parts.length === 3 && parts[1] === 'packarcade') {
    const lang = parts[0];
    if (url.pathname === '/' || url.pathname === '') {
      return context.rewrite(new URL(`/public/${lang}/index.html`, request.url));
    }
    return context.rewrite(new URL(`/public/${lang}${url.pathname}`, request.url));
  }

  return context.next();
};
