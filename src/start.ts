import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { isNativeAppOrigin, nativeCorsHeaders } from "@/lib/native/origins";
import { isNativeBuild, nativeServerFnFetch } from "@/lib/native/client";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Lets the packaged Capacitor app (https://localhost / capacitor://localhost) call server
// functions on the hosted site. Auth is a bearer token, never cookies, so this adds no CSRF exposure.
const nativeCorsMiddleware = createMiddleware().server(async ({ request, next, handlerType }) => {
  const origin = request.headers.get("Origin");
  if (handlerType !== "serverFn" || !origin || !isNativeAppOrigin(origin)) return next();
  const cors = nativeCorsHeaders(origin, request.headers.get("Access-Control-Request-Headers"));
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const result = await next();
  const headers = new Headers(result.response.headers);
  for (const [key, value] of Object.entries(cors)) headers.set(key, value);
  return {
    ...result,
    response: new Response(result.response.body, {
      status: result.response.status,
      statusText: result.response.statusText,
      headers,
    }),
  };
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
  secFetchSite: (site, ctx) => site === "same-origin" || isNativeAppOrigin(ctx.request.headers.get("Origin")),
  origin: (origin, ctx) => origin === new URL(ctx.request.url).origin || isNativeAppOrigin(origin),
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, nativeCorsMiddleware, csrfMiddleware],
  ...(isNativeBuild ? { serverFns: { fetch: nativeServerFnFetch } } : {}),
}));
