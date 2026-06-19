import { Outlet } from "react-router-dom";
import { ClientOnly } from "vite-react-ssg";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as HotToast } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CartProvider } from "@/contexts/CartContext";
import { BookmarkProvider } from "@/components/ui/bookmark-system";
import { ReadingHistoryProvider } from "@/components/ui/reading-history";
import { ToolsProvider } from "@/contexts/ToolsContext";
import { AIChatInterface } from "@/components/ai";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { OnboardingTour } from "@/components/ui/onboarding-tour";
import { CartDrawer } from "@/components/store/CartDrawer";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ScrollToTop } from "@/components/ScrollToTop";
import { NavigationProgress } from "@/components/ui/NavigationProgress";
import { PrerenderReady } from "@/components/PrerenderReady";

// QueryClient config copied verbatim from App.tsx (single source for the SSG entry).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Root layout for the SSG build. Mirrors the provider tree in App.tsx exactly,
 * but uses <Outlet /> (vite-react-ssg supplies the router) instead of
 * <BrowserRouter><Routes>. Page content renders into <Outlet /> and is
 * pre-rendered to static HTML at build time.
 *
 * Browser-only / non-content widgets are wrapped in <ClientOnly> so they run
 * only after hydration and never execute during the build-time render.
 */
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <TooltipProvider>
              <AuthProvider>
                <CartProvider>
                  <BookmarkProvider>
                    <ReadingHistoryProvider>
                      <ToolsProvider>
                        <ClientOnly>{() => <Toaster />}</ClientOnly>
                        <ClientOnly>{() => <Sonner />}</ClientOnly>
                        <ClientOnly>
                          {() => (
                            <HotToast
                              position="top-right"
                              toastOptions={{
                                duration: 3000,
                                style: {
                                  background: "hsl(var(--card))",
                                  color: "hsl(var(--foreground))",
                                  border: "1px solid hsl(var(--border))",
                                  borderRadius: "0.75rem",
                                  padding: "16px",
                                },
                              }}
                            />
                          )}
                        </ClientOnly>

                        <NavigationProgress />
                        <ScrollToTop />
                        <ClientOnly>{() => <GoogleAnalytics />}</ClientOnly>
                        <PrerenderReady />

                        <Outlet />

                        <ClientOnly>{() => <AIChatInterface />}</ClientOnly>
                        <ClientOnly>{() => <CartDrawer />}</ClientOnly>
                        <ClientOnly>{() => <CookieConsent />}</ClientOnly>
                        <ClientOnly>{() => <OnboardingTour />}</ClientOnly>
                      </ToolsProvider>
                    </ReadingHistoryProvider>
                  </BookmarkProvider>
                </CartProvider>
              </AuthProvider>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
