import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {},
  },
  // CommonJS deps that break the SSR/SSG build when externalized as ESM.
  // Bundling them lets Vite handle the CJS->ESM interop so named imports work.
  ssr: {
    noExternal: ["react-helmet-async"],
  },
  ssgOptions: {
    // Not pre-rendered (work client-side; ~no SEO value as static snapshots):
    //  - admin: auth-gated dashboards
    //  - arcade: purely interactive games
    //  - dynamic :param routes: need getStaticPaths + build-time data (later phase)
    includedRoutes(paths: string[]) {
      return paths.filter(
        (p) => !p.includes("admin") && !p.includes("arcade") && !p.includes(":")
      );
    },
  },
}));
