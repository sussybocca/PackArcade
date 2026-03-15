import type { Context } from "https://edge.netlify.com/";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  
  // CRITICAL: Never intercept Netlify Functions
  if (url.pathname.startsWith('/.netlify/functions/')) {
    return context.next();
  }

  // CRITICAL: Never intercept static assets that already exist
  // Let Netlify try to serve them normally first
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|json|webp|avif|woff|woff2|ttf|eot)$/)) {
    return context.next();
  }

  const host = url.hostname;

  // Portal subdomain - map to /portal/
  if (host === "portal.packarcade.xyz") {
    // If requesting root, serve index.html
    if (url.pathname === '/' || url.pathname === '') {
      return context.rewrite(new URL('/portal/index.html', request.url));
    }
    // Otherwise serve the exact file from /portal/
    return context.rewrite(new URL(`/portal${url.pathname}`, request.url));
  }

  // Language sites subdomain
  if (host === "languages.sites.packarcade.xyz") {
    if (url.pathname === '/' || url.pathname === '') {
      return context.rewrite(new URL('/public/languages/index.html', request.url));
    }
    return context.rewrite(new URL(`/public/languages${url.pathname}`, request.url));
  }

  // Secret subdomain
  if (host === "secret.packarcade.xyz") {
    if (url.pathname === '/' || url.pathname === '') {
      return context.rewrite(new URL('/public/secret/index.html', request.url));
    }
    return context.rewrite(new URL(`/public/secret${url.pathname}`, request.url));
  }

  // Doorway subdomain
  if (host === "door.way.packarcade.xyz") {
    if (url.pathname === '/' || url.pathname === '') {
      return context.rewrite(new URL('/public/doorway/index.html', request.url));
    }
    return context.rewrite(new URL(`/public/doorway${url.pathname}`, request.url));
  }

  // Language subdomains (fr, es, en, de)
  const langMatch = host.match(/^(fr|es|en|de)\.packarcade\.xyz$/);
  if (langMatch) {
    const lang = langMatch[1];
    if (url.pathname === '/' || url.pathname === '') {
      return context.rewrite(new URL(`/public/${lang}/index.html`, request.url));
    }
    return context.rewrite(new URL(`/public/${lang}${url.pathname}`, request.url));
  }

  return context.next();
};
