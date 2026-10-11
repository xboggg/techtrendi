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
      //
      // Match the FIRST PATH SEGMENT, not a substring. The previous
      // p.includes(s) silently dropped 5 published articles whose slugs merely
      // contained one of these words:
      //   "auth"      inside authentication  -> both 2FA guides, and the
      //                                         NIMC digital-identity-authority story
      //   "dashboard" inside the slug        -> both Paystack dashboard stories
      // They were never written to dist/, so Google could not index them at all.
      // Every route being excluded here is a top-level segment (auth, profile,
      // dashboard, admin and its children), so segment matching is exact and safe.
      const skip = ["admin", "arcade", "auth", "profile", "dashboard", "design-demo", "tools-preview", "rundown-preview"];
      return paths.filter((p) => {
        if (p.includes(":")) return false;
        const firstSegment = p.replace(/^\//, "").split("/")[0];
        return !skip.includes(firstSegment);
      });
    },
  },
}));
