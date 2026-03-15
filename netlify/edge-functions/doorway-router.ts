import type { Context } from "https://edge.netlify.com/";

const SECRET_KEY = "OpenSesame123";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  
  // CRITICAL: Prevent infinite recursion - if path already has /public/ multiple times, abort
  if (url.pathname.match(/\/public\/.*\/public\//)) {
    return context.next();
  }

  // CRITICAL: Let ALL files with extensions pass through
  if (url.pathname.match(/\.([a-zA-Z0-9]+)$/)) {
    return context.next();
  }

  // Skip functions
  if (url.pathname.startsWith('/.netlify/functions/')) {
    return context.next();
  }

  const host = url.hostname;
  if (host !== "door.way.packarcade.xyz") {
    return context.next();
  }

  // Check for secret
  const secret = url.searchParams.get("key") || 
                 request.headers.get("X-Secret") ||
                 context.cookies.get("doorway_key");

  if (secret !== SECRET_KEY) {
    return new Response("Not found", { status: 404 });
  }

  // Serve doorway page
  if (url.pathname === '/' || url.pathname === '') {
    return context.rewrite(new URL('/public/doorway/index.html', request.url));
  }
  
  return context.rewrite(new URL(`/public/doorway${url.pathname}`, request.url));
};
