// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

// `npm run build:native` sets this to produce a static single-page app (dist/client/index.html)
// for Capacitor. The normal `vite build` used for the published site is unchanged.
const nativeBuild = process.env['VITE_FITRAH_NATIVE'] === "true";

const pwa = VitePWA({
  strategies: "generateSW",
  outDir: "dist/client",
  filename: "sw.js",
  registerType: "autoUpdate",
  injectRegister: null,
  devOptions: { enabled: false },
  manifest: false,
  workbox: {
    globPatterns: ["**/*.{js,css,png,jpg,woff2}"],
    navigateFallback: null,
    runtimeCaching: [
      { urlPattern: ({ request, url }) => request.mode === "navigate" && !url.pathname.startsWith("/~oauth"), handler: "NetworkFirst", options: { cacheName: "fitrah-pages", networkTimeoutSeconds: 5 } },
      { urlPattern: ({ url, sameOrigin }) => sameOrigin && /\/assets\/.+-[a-zA-Z0-9_-]{8,}\.(js|css|png|jpg|woff2)$/.test(url.pathname), handler: "CacheFirst", options: { cacheName: "fitrah-assets", expiration: { maxEntries: 100, maxAgeSeconds: 2592000 } } },
    ],
  },
});

export default defineConfig({
  vite: {
    // Kept in the native build too; the guarded registrar never registers it on localhost.
    plugins: [pwa],
  },
  // Outside Lovable (e.g. GitHub Actions) nitro defaults to .output/public; pin the native
  // build's static output to dist/client so Capacitor's webDir gets index.html + assets.
  ...(nativeBuild
    ? { nitro: { output: { dir: "dist", publicDir: "dist/client", serverDir: "dist/server" } } }
    : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    ...(nativeBuild ? { spa: { enabled: true, prerender: { outputPath: "/index" } } } : {}),
  },
});
