import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Tools from "./pages/Tools";
import Guides from "./pages/Guides";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Premium from "./pages/Premium";
import PasswordGenerator from "./pages/tools/PasswordGenerator";
import QRGenerator from "./pages/tools/QRGenerator";
import ImageCompressor from "./pages/tools/ImageCompressor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
            <Route path="/guides" element={<Guides />} />
            <Route path="/guides/:category" element={<Guides />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
