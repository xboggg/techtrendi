import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Tools from "./pages/Tools";
import Guides from "./pages/Guides";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Premium from "./pages/Premium";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import Reviews from "./pages/Reviews";
import ReviewDetail from "./pages/ReviewDetail";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminComments from "./pages/admin/AdminComments";
import AdminUsers from "./pages/admin/AdminUsers";
import PasswordGenerator from "./pages/tools/PasswordGenerator";
import QRGenerator from "./pages/tools/QRGenerator";
import ImageCompressor from "./pages/tools/ImageCompressor";
import PhoneComparison from "./pages/tools/PhoneComparison";
import PasswordChecker from "./pages/tools/PasswordChecker";
import UpgradeCalculator from "./pages/tools/UpgradeCalculator";
import NotFound from "./pages/NotFound";
import DesignDemo from "./pages/DesignDemo";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/premium" element={<Premium />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/tools/password-generator" element={<PasswordGenerator />} />
              <Route path="/tools/qr-generator" element={<QRGenerator />} />
              <Route path="/tools/image-compressor" element={<ImageCompressor />} />
              <Route path="/tools/phone-comparison" element={<PhoneComparison />} />
              <Route path="/tools/password-checker" element={<PasswordChecker />} />
              <Route path="/tools/upgrade-calculator" element={<UpgradeCalculator />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogArticle />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/reviews/:slug" element={<ReviewDetail />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/reviews" element={<AdminReviews />} />
              <Route path="/admin/comments" element={<AdminComments />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/guides" element={<Guides />} />
              <Route path="/guides/:category" element={<Guides />} />
              <Route path="/about" element={<About />} />
              <Route path="/design-demo" element={<DesignDemo />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
