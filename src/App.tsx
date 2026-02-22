import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as HotToast } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CartProvider } from "@/contexts/CartContext";
import { BookmarkProvider } from "@/components/ui/bookmark-system";
import { ReadingHistoryProvider } from "@/components/ui/reading-history";
import { AIChatInterface } from "@/components/ai";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { CartDrawer } from "@/components/store/CartDrawer";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ScrollToTop } from "@/components/ScrollToTop";
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
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminArticles from "./pages/admin/AdminArticles";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminComments from "./pages/admin/AdminComments";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminProducts from "./pages/admin/AdminProducts";
import PasswordGenerator from "./pages/tools/PasswordGenerator";
import QRGenerator from "./pages/tools/QRGenerator";
import ImageCompressor from "./pages/tools/ImageCompressor";
import PhoneComparison from "./pages/tools/PhoneComparison";
import PasswordChecker from "./pages/tools/PasswordChecker";
import UpgradeCalculator from "./pages/tools/UpgradeCalculator";
import JsonFormatter from "./pages/tools/JsonFormatter";
import Base64Encoder from "./pages/tools/Base64Encoder";
import ColorPicker from "./pages/tools/ColorPicker";
import LoremIpsum from "./pages/tools/LoremIpsum";
import UnitConverter from "./pages/tools/UnitConverter";
import SpeedTest from "./pages/tools/SpeedTest";
import PrivacyChecker from "./pages/tools/PrivacyChecker";
import IPLookup from "./pages/tools/IPLookup";
import HashGenerator from "./pages/tools/HashGenerator";
import URLParser from "./pages/tools/URLParser";
import TextCounter from "./pages/tools/TextCounter";
import MeetingCostCalculator from "./pages/tools/MeetingCostCalculator";
import EmailSubjectTester from "./pages/tools/EmailSubjectTester";
import PomodoroTimer from "./pages/tools/PomodoroTimer";
import SubscriptionTracker from "./pages/tools/SubscriptionTracker";
import HabitTracker from "./pages/tools/HabitTracker";
import JobTracker from "./pages/tools/JobTracker";
import LinkInBio from "./pages/tools/LinkInBio";
import InvoiceGenerator from "./pages/tools/InvoiceGenerator";
import InvoiceChaser from "./pages/tools/InvoiceChaser";
import ContentRepurposer from "./pages/tools/ContentRepurposer";
import ProposalGenerator from "./pages/tools/ProposalGenerator";
import SimpleCRM from "./pages/tools/SimpleCRM";
import AppointmentBooking from "./pages/tools/AppointmentBooking";
import ClientPortal from "./pages/tools/ClientPortal";
import ResumeBuilder from "./pages/tools/ResumeBuilder";
import NetworkCRM from "./pages/tools/NetworkCRM";
import URLShortener from "./pages/tools/URLShortener";
import CreatorAnalytics from "./pages/tools/CreatorAnalytics";
import RegexTester from "./pages/tools/RegexTester";
import CronBuilder from "./pages/tools/CronBuilder";
import JWTDecoder from "./pages/tools/JWTDecoder";
import MarkdownEditor from "./pages/tools/MarkdownEditor";
import GradientGenerator from "./pages/tools/GradientGenerator";
import TypingTest from "./pages/tools/TypingTest";
import SalaryComparison from "./pages/tools/SalaryComparison";
import BusinessNameGenerator from "./pages/tools/BusinessNameGenerator";
import DecisionWheel from "./pages/tools/DecisionWheel";
import ExpenseTracker from "./pages/tools/ExpenseTracker";
import FaviconGenerator from "./pages/tools/FaviconGenerator";
import MetaTagGenerator from "./pages/tools/MetaTagGenerator";
import ContractGenerator from "./pages/tools/ContractGenerator";
import CoverLetterGenerator from "./pages/tools/CoverLetterGenerator";
import ColdEmailWriter from "./pages/tools/ColdEmailWriter";
import LifeProgressBar from "./pages/tools/LifeProgressBar";
import UsernameGenerator from "./pages/tools/UsernameGenerator";
import ScreenTimeCalculator from "./pages/tools/ScreenTimeCalculator";
import PricingCalculator from "./pages/tools/PricingCalculator";
import ROICalculator from "./pages/tools/ROICalculator";
import DailyStandup from "./pages/tools/DailyStandup";
import TimeTracker from "./pages/tools/TimeTracker";
import DailyJournal from "./pages/tools/DailyJournal";
import WaterTracker from "./pages/tools/WaterTracker";
import FocusScore from "./pages/tools/FocusScore";
import SideHustleCalculator from "./pages/tools/SideHustleCalculator";
import StartupValidator from "./pages/tools/StartupValidator";
import PersonalBrandAudit from "./pages/tools/PersonalBrandAudit";
import CarbonFootprint from "./pages/tools/CarbonFootprint";
import CareerMatcher from "./pages/tools/CareerMatcher";
import PlaceholderImage from "./pages/tools/PlaceholderImage";
import ProductDescriptionGenerator from "./pages/tools/ProductDescriptionGenerator";
import BlogOutlineGenerator from "./pages/tools/BlogOutlineGenerator";
import SocialCaptionGenerator from "./pages/tools/SocialCaptionGenerator";
import MeetingNotesSummarizer from "./pages/tools/MeetingNotesSummarizer";
import NotFound from "./pages/NotFound";
import DesignDemo from "./pages/DesignDemo";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import Contact from "./pages/Contact";
import Disclosure from "./pages/Disclosure";
import { Phones, Security, Productivity, HowTo, AITech, MakeMoney } from "./pages/categories";
import DigiStore from "./pages/DigiStore";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <AuthProvider>
              <CartProvider>
                <BookmarkProvider>
                  <ReadingHistoryProvider>
                    <Toaster />
                    <Sonner />
                    <HotToast
                      position="top-right"
                      toastOptions={{
                        duration: 3000,
                        style: {
                          background: 'hsl(var(--card))',
                          color: 'hsl(var(--foreground))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.75rem',
                          padding: '16px',
                        },
                      }}
                    />
                    <BrowserRouter>
                    <ScrollToTop />
                    <GoogleAnalytics />
                    <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/premium" element={<Premium />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/tools" element={<Tools />} />
                  <Route path="/tools/password-generator" element={<PasswordGenerator />} />
                  <Route path="/tools/qr-generator" element={<QRGenerator />} />
                  <Route path="/tools/image-compressor" element={<ImageCompressor />} />
                  <Route path="/tools/phone-comparison" element={<PhoneComparison />} />
                  <Route path="/tools/password-checker" element={<PasswordChecker />} />
                  <Route path="/tools/upgrade-calculator" element={<UpgradeCalculator />} />
                  <Route path="/tools/json-formatter" element={<JsonFormatter />} />
                  <Route path="/tools/base64-encoder" element={<Base64Encoder />} />
                  <Route path="/tools/color-picker" element={<ColorPicker />} />
                  <Route path="/tools/lorem-ipsum" element={<LoremIpsum />} />
                  <Route path="/tools/unit-converter" element={<UnitConverter />} />
                  <Route path="/tools/speed-test" element={<SpeedTest />} />
                  <Route path="/tools/privacy-checker" element={<PrivacyChecker />} />
                  <Route path="/tools/ip-lookup" element={<IPLookup />} />
                  <Route path="/tools/hash-generator" element={<HashGenerator />} />
                  <Route path="/tools/url-parser" element={<URLParser />} />
                  <Route path="/tools/text-counter" element={<TextCounter />} />
                  <Route path="/tools/meeting-cost-calculator" element={<MeetingCostCalculator />} />
                  <Route path="/tools/email-subject-tester" element={<EmailSubjectTester />} />
                  <Route path="/tools/pomodoro-timer" element={<PomodoroTimer />} />
                  <Route path="/tools/subscription-tracker" element={<SubscriptionTracker />} />
                  <Route path="/tools/habit-tracker" element={<HabitTracker />} />
                  <Route path="/tools/job-tracker" element={<JobTracker />} />
                  <Route path="/tools/link-in-bio" element={<LinkInBio />} />
                  <Route path="/tools/invoice-generator" element={<InvoiceGenerator />} />
                  <Route path="/tools/invoice-chaser" element={<InvoiceChaser />} />
                  <Route path="/tools/content-repurposer" element={<ContentRepurposer />} />
                  <Route path="/tools/proposal-generator" element={<ProposalGenerator />} />
                  <Route path="/tools/simple-crm" element={<SimpleCRM />} />
                  <Route path="/tools/appointment-booking" element={<AppointmentBooking />} />
                  <Route path="/tools/client-portal" element={<ClientPortal />} />
                  <Route path="/tools/resume-builder" element={<ResumeBuilder />} />
                  <Route path="/tools/network-crm" element={<NetworkCRM />} />
                  <Route path="/tools/url-shortener" element={<URLShortener />} />
                  <Route path="/tools/creator-analytics" element={<CreatorAnalytics />} />
                  <Route path="/tools/regex-tester" element={<RegexTester />} />
                  <Route path="/tools/cron-builder" element={<CronBuilder />} />
                  <Route path="/tools/jwt-decoder" element={<JWTDecoder />} />
                  <Route path="/tools/markdown-editor" element={<MarkdownEditor />} />
                  <Route path="/tools/gradient-generator" element={<GradientGenerator />} />
                  <Route path="/tools/typing-test" element={<TypingTest />} />
                  <Route path="/tools/salary-comparison" element={<SalaryComparison />} />
                  <Route path="/tools/business-name-generator" element={<BusinessNameGenerator />} />
                  <Route path="/tools/decision-wheel" element={<DecisionWheel />} />
                  <Route path="/tools/expense-tracker" element={<ExpenseTracker />} />
                  <Route path="/tools/favicon-generator" element={<FaviconGenerator />} />
                  <Route path="/tools/meta-tag-generator" element={<MetaTagGenerator />} />
                  <Route path="/tools/contract-generator" element={<ContractGenerator />} />
                  <Route path="/tools/cover-letter-generator" element={<CoverLetterGenerator />} />
                  <Route path="/tools/cold-email-writer" element={<ColdEmailWriter />} />
                  <Route path="/tools/life-progress-bar" element={<LifeProgressBar />} />
                  <Route path="/tools/username-generator" element={<UsernameGenerator />} />
                  <Route path="/tools/screen-time-calculator" element={<ScreenTimeCalculator />} />
                  <Route path="/tools/pricing-calculator" element={<PricingCalculator />} />
                  <Route path="/tools/roi-calculator" element={<ROICalculator />} />
                  <Route path="/tools/daily-standup" element={<DailyStandup />} />
                  <Route path="/tools/time-tracker" element={<TimeTracker />} />
                  <Route path="/tools/daily-journal" element={<DailyJournal />} />
                  <Route path="/tools/water-tracker" element={<WaterTracker />} />
                  <Route path="/tools/focus-score" element={<FocusScore />} />
                  <Route path="/tools/side-hustle-calculator" element={<SideHustleCalculator />} />
                  <Route path="/tools/startup-validator" element={<StartupValidator />} />
                  <Route path="/tools/personal-brand-audit" element={<PersonalBrandAudit />} />
                  <Route path="/tools/carbon-footprint" element={<CarbonFootprint />} />
                  <Route path="/tools/career-matcher" element={<CareerMatcher />} />
                  <Route path="/tools/placeholder-image" element={<PlaceholderImage />} />
                  <Route path="/tools/product-description-generator" element={<ProductDescriptionGenerator />} />
                  <Route path="/tools/blog-outline-generator" element={<BlogOutlineGenerator />} />
                  <Route path="/tools/social-caption-generator" element={<SocialCaptionGenerator />} />
                  <Route path="/tools/meeting-notes-summarizer" element={<MeetingNotesSummarizer />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogArticle />} />
                  <Route path="/phones" element={<Phones />} />
                  <Route path="/security" element={<Security />} />
                  <Route path="/productivity" element={<Productivity />} />
                  <Route path="/how-to" element={<HowTo />} />
                  <Route path="/ai-tech" element={<AITech />} />
                  <Route path="/make-money" element={<MakeMoney />} />
                  <Route path="/deals" element={<MakeMoney />} />
                  <Route path="/reviews" element={<Reviews />} />
                  <Route path="/reviews/:slug" element={<ReviewDetail />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/articles" element={<AdminArticles />} />
                  <Route path="/admin/reviews" element={<AdminReviews />} />
                  <Route path="/admin/comments" element={<AdminComments />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/messages" element={<AdminMessages />} />
                  <Route path="/admin/products" element={<AdminProducts />} />
                  <Route path="/guides" element={<Guides />} />
                  <Route path="/guides/:category" element={<Guides />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/cookies" element={<Cookies />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/disclosure" element={<Disclosure />} />
                  <Route path="/store" element={<DigiStore />} />
                  <Route path="/design-demo" element={<DesignDemo />} />
                  <Route path="*" element={<NotFound />} />
                    </Routes>
                    <AIChatInterface />
                    <CartDrawer />
                    <CookieConsent />
                    </BrowserRouter>
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

export default App;
