// Shared, environment-free rules for the Capacitor (native) app build.
// Android Capacitor serves the bundled app from https://localhost, iOS from capacitor://localhost.
export const NATIVE_APP_ORIGINS = ['https://localhost', 'capacitor://localhost'] as const;
export const DEFAULT_NATIVE_SERVER_ORIGIN = 'https://fitrah-productivity.lovable.app';

export function isNativeAppOrigin(origin: string | null | undefined): boolean {
 return !!origin && (NATIVE_APP_ORIGINS as readonly string[]).includes(origin);
}

/** Point relative server-function URLs at the hosted site; absolute URLs pass through untouched. */
export function toServerUrl(url: string, serverOrigin: string): string {
 if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
 return new URL(url, `${serverOrigin.replace(/\/+$/, '')}/`).toString();
}

/** CORS headers for the hosted site when the packaged app calls it. Only for allowlisted native origins. */
export function nativeCorsHeaders(origin: string, requestedHeaders: string | null): Record<string, string> {
 return {
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': requestedHeaders?.trim() || 'authorization, content-type, accept, x-tsr-serverfn',
  'Access-Control-Max-Age': '600',
  Vary: 'Origin',
 };
}
