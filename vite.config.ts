import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { createHash } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { DATA_BUNDLES_PRERENDER, DATA_BUNDLES_ROUTE } from "./src/data/dataBundlesRoute";

// The data bundle pages' offline copy (public/sw-data-bundles.js): stamp a build id from the
// client build's file names into the copy in the output, so every build is a new worker and old
// caches are dropped, and the list of the data bundle route files (the pages' chunks, the chunks
// they import and their CSS), so one visit saves every network page. Only the client build (it
// has index.html) is touched.
type OutChunk = { type: string; fileName: string; moduleIds?: string[]; imports?: string[]; viteMetadata?: { importedCss?: Set<string> } };
export function dataBundlesRouteAssets(bundle: Record<string, OutChunk>, base = "/"): string[] {
  const out = new Set<string>();
  const add = (name: string) => {
    const c = bundle[name];
    if (!c || c.type !== "chunk" || out.has(name)) return;
    out.add(name);
    for (const css of c.viteMetadata?.importedCss ?? []) out.add(css);
    for (const i of c.imports ?? []) add(i);
  };
  for (const [name, c] of Object.entries(bundle)) {
    if (c.type === "chunk" && (c.moduleIds ?? []).some((m) => m.split("\\").join("/").includes("/src/pages/data-bundles/"))) add(name);
  }
  return [...out].sort().map((f) => (base.endsWith("/") ? base : base + "/") + f);
}
function dataBundlesSw() {
  let id = "";
  let dir = "";
  let base = "/";
  let routeAssets: string[] = [];
  return {
    name: "data-bundles-sw",
    apply: "build" as const,
    enforce: "post" as const,
    configResolved(c: { base: string }) { base = c.base || "/"; },
    generateBundle(_: unknown, bundle: Record<string, unknown>) {
      if (!Object.keys(bundle).some((f) => f.endsWith(".html"))) return;
      id = createHash("sha256").update(Object.keys(bundle).sort().join("|") + (process.env.DATA_BUNDLES_SW_SALT ?? "")).digest("hex").slice(0, 12);
      routeAssets = dataBundlesRouteAssets(bundle as Record<string, OutChunk>, base);
    },
    writeBundle(opts: { dir?: string }) {
      if (id && opts.dir) dir = opts.dir;
    },
    // After every file is written (the public/ copy included).
    closeBundle() {
      if (!id || !dir) return;
      const f = path.join(dir, "sw-data-bundles.js");
      if (!existsSync(f)) return;
      const src = readFileSync(f, "utf8");
      if (!src.includes("__BUILD_ID__")) throw new Error("sw-data-bundles.js: no __BUILD_ID__ to stamp");
      if (!src.includes("['__ROUTE_ASSETS__']")) throw new Error("sw-data-bundles.js: no __ROUTE_ASSETS__ to stamp");
      if (!routeAssets.length) throw new Error("sw-data-bundles.js: no data bundle route files found in the build");
      writeFileSync(f, src.replace("'__BUILD_ID__'", `'${id}'`).replace("['__ROUTE_ASSETS__']", JSON.stringify(routeAssets)));
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger(), dataBundlesSw()].filter(Boolean),
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
      // Data bundle pages: their routes have :country/:network params, so the concrete pages are
      // added here, only once DATA_BUNDLES_LAUNCHED is true (src/data/dataBundlesRoute.ts).
      return paths.filter((p) => {
        if (p.includes(":")) return false;
        // The bare data bundle address only redirects to its country page (nginx 301; the router's
        // Navigate): never a page of its own, so never prerendered or in the sitemap.
        if (p.replace(/^\//, "") === DATA_BUNDLES_ROUTE) return false;
        const firstSegment = p.replace(/^\//, "").split("/")[0];
        return !skip.includes(firstSegment);
      }).concat(DATA_BUNDLES_PRERENDER);
    },
  },
}));
