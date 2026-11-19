// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from 'vite-plugin-pwa';
import { offlineRuntimeCaching } from './src/game/offlinePolicy';

export default defineConfig({
  vite: {
    plugins: [VitePWA({
      strategies: 'generateSW', outDir: 'dist/client', filename: 'sw.js', registerType: 'autoUpdate', injectRegister: null,
      devOptions: { enabled: false }, manifest: false,
      includeAssets: ['manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
      workbox: {
        globPatterns: ['assets/*.{js,css}'], maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: null, cleanupOutdatedCaches: true, skipWaiting: true, clientsClaim: true,
        runtimeCaching: offlineRuntimeCaching,
      },
    })],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
