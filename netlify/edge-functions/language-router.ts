import type { Context } from "https://edge.netlify.com/";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  
  // Skip functions
  if (url.pathname.startsWith('/.netlify/functions/')) {
    return context.next();
  }

  // Skip static assets with extensions
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|json|webp|avif|woff|woff2|ttf|eot)$/)) {
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
