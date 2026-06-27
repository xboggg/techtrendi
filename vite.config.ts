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
      // Exclude auth-gated/personalized/internal pages (no SEO value) and
      // dynamic :param routes (those that need data use getStaticPaths instead).
      const skip = ["admin", "arcade", "auth", "profile", "dashboard", "design-demo", "tools-preview", "rundown-preview"];
      return paths.filter((p) => !p.includes(":") && !skip.some((s) => p.includes(s)));
    },
  },
}));
