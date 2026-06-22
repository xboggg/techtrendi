// vite.config.ts
import { defineConfig } from "file:///C:/Users/CyberAware/OneDrive%20-%20Government%20of%20Ghana%20-%20CAGD/ZeroTrust/Visual%20Studio%20Code%20Workspace/techtrendi/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/CyberAware/OneDrive%20-%20Government%20of%20Ghana%20-%20CAGD/ZeroTrust/Visual%20Studio%20Code%20Workspace/techtrendi/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/CyberAware/OneDrive%20-%20Government%20of%20Ghana%20-%20CAGD/ZeroTrust/Visual%20Studio%20Code%20Workspace/techtrendi/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\CyberAware\\OneDrive - Government of Ghana - CAGD\\ZeroTrust\\Visual Studio Code Workspace\\techtrendi";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    rollupOptions: {}
  },
  // CommonJS deps that break the SSR/SSG build when externalized as ESM.
  // Bundling them lets Vite handle the CJS->ESM interop so named imports work.
  ssr: {
    noExternal: ["react-helmet-async"]
  },
  ssgOptions: {
    // Not pre-rendered (work client-side; ~no SEO value as static snapshots):
    //  - admin: auth-gated dashboards
    //  - arcade: purely interactive games
    //  - dynamic :param routes: need getStaticPaths + build-time data (later phase)
    includedRoutes(paths) {
      const skip = ["admin", "arcade", "auth", "profile", "dashboard", "design-demo"];
      return paths.filter((p) => !p.includes(":") && !skip.some((s) => p.includes(s)));
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxDeWJlckF3YXJlXFxcXE9uZURyaXZlIC0gR292ZXJubWVudCBvZiBHaGFuYSAtIENBR0RcXFxcWmVyb1RydXN0XFxcXFZpc3VhbCBTdHVkaW8gQ29kZSBXb3Jrc3BhY2VcXFxcdGVjaHRyZW5kaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcQ3liZXJBd2FyZVxcXFxPbmVEcml2ZSAtIEdvdmVybm1lbnQgb2YgR2hhbmEgLSBDQUdEXFxcXFplcm9UcnVzdFxcXFxWaXN1YWwgU3R1ZGlvIENvZGUgV29ya3NwYWNlXFxcXHRlY2h0cmVuZGlcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0N5YmVyQXdhcmUvT25lRHJpdmUlMjAtJTIwR292ZXJubWVudCUyMG9mJTIwR2hhbmElMjAtJTIwQ0FHRC9aZXJvVHJ1c3QvVmlzdWFsJTIwU3R1ZGlvJTIwQ29kZSUyMFdvcmtzcGFjZS90ZWNodHJlbmRpL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogODA4MCxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtyZWFjdCgpLCBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCldLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgcm9sbHVwT3B0aW9uczoge30sXHJcbiAgfSxcclxuICAvLyBDb21tb25KUyBkZXBzIHRoYXQgYnJlYWsgdGhlIFNTUi9TU0cgYnVpbGQgd2hlbiBleHRlcm5hbGl6ZWQgYXMgRVNNLlxyXG4gIC8vIEJ1bmRsaW5nIHRoZW0gbGV0cyBWaXRlIGhhbmRsZSB0aGUgQ0pTLT5FU00gaW50ZXJvcCBzbyBuYW1lZCBpbXBvcnRzIHdvcmsuXHJcbiAgc3NyOiB7XHJcbiAgICBub0V4dGVybmFsOiBbXCJyZWFjdC1oZWxtZXQtYXN5bmNcIl0sXHJcbiAgfSxcclxuICBzc2dPcHRpb25zOiB7XHJcbiAgICAvLyBOb3QgcHJlLXJlbmRlcmVkICh3b3JrIGNsaWVudC1zaWRlOyB+bm8gU0VPIHZhbHVlIGFzIHN0YXRpYyBzbmFwc2hvdHMpOlxyXG4gICAgLy8gIC0gYWRtaW46IGF1dGgtZ2F0ZWQgZGFzaGJvYXJkc1xyXG4gICAgLy8gIC0gYXJjYWRlOiBwdXJlbHkgaW50ZXJhY3RpdmUgZ2FtZXNcclxuICAgIC8vICAtIGR5bmFtaWMgOnBhcmFtIHJvdXRlczogbmVlZCBnZXRTdGF0aWNQYXRocyArIGJ1aWxkLXRpbWUgZGF0YSAobGF0ZXIgcGhhc2UpXHJcbiAgICBpbmNsdWRlZFJvdXRlcyhwYXRoczogc3RyaW5nW10pIHtcclxuICAgICAgLy8gRXhjbHVkZSBhdXRoLWdhdGVkL3BlcnNvbmFsaXplZC9pbnRlcm5hbCBwYWdlcyAobm8gU0VPIHZhbHVlKSBhbmRcclxuICAgICAgLy8gZHluYW1pYyA6cGFyYW0gcm91dGVzICh0aG9zZSB0aGF0IG5lZWQgZGF0YSB1c2UgZ2V0U3RhdGljUGF0aHMgaW5zdGVhZCkuXHJcbiAgICAgIGNvbnN0IHNraXAgPSBbXCJhZG1pblwiLCBcImFyY2FkZVwiLCBcImF1dGhcIiwgXCJwcm9maWxlXCIsIFwiZGFzaGJvYXJkXCIsIFwiZGVzaWduLWRlbW9cIl07XHJcbiAgICAgIHJldHVybiBwYXRocy5maWx0ZXIoKHApID0+ICFwLmluY2x1ZGVzKFwiOlwiKSAmJiAhc2tpcC5zb21lKChzKSA9PiBwLmluY2x1ZGVzKHMpKSk7XHJcbiAgICB9LFxyXG4gIH0sXHJcbn0pKTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFtaEIsU0FBUyxvQkFBb0I7QUFDaGpCLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsU0FBUyxDQUFDLE1BQU0sR0FBRyxTQUFTLGlCQUFpQixnQkFBZ0IsQ0FBQyxFQUFFLE9BQU8sT0FBTztBQUFBLEVBQzlFLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLGVBQWUsQ0FBQztBQUFBLEVBQ2xCO0FBQUE7QUFBQTtBQUFBLEVBR0EsS0FBSztBQUFBLElBQ0gsWUFBWSxDQUFDLG9CQUFvQjtBQUFBLEVBQ25DO0FBQUEsRUFDQSxZQUFZO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUtWLGVBQWUsT0FBaUI7QUFHOUIsWUFBTSxPQUFPLENBQUMsU0FBUyxVQUFVLFFBQVEsV0FBVyxhQUFhLGFBQWE7QUFDOUUsYUFBTyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxTQUFTLEdBQUcsS0FBSyxDQUFDLEtBQUssS0FBSyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO0FBQUEsSUFDakY7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
