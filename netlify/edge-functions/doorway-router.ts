// netlify/edge-functions/doorway-router.ts
import type { Context } from "https://edge.netlify.com/";

const SECRET_KEY = "OpenSesame123"; // Change this to your secret

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const host = url.hostname;

  // Only handle door.way.packarcade.xyz
  if (host !== "door.way.packarcade.xyz") {
    return context.next();
  }

  // Check for secret in query param, header, or cookie
  const secret = url.searchParams.get("key") ||
                 request.headers.get("X-Secret") ||
                 context.cookies.get("doorway_key");

  if (secret !== SECRET_KEY) {
    // Return a 404 to hide the doorway
    return new Response("Not found", { status: 404 });
  }

  // Serve the immersive doorway page
  return context.rewrite(new URL("/doorway/index.html", request.url));
};
