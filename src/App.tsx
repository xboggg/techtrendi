import { lazy, Suspense } from "react";
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
import { ToolsProvider } from "@/contexts/ToolsContext";
import { AIChatInterface } from "@/components/ai";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { OnboardingTour } from "@/components/ui/onboarding-tour";
import { CartDrawer } from "@/components/store/CartDrawer";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Loader2 } from "lucide-react";

// Core pages - load immediately
import Index from "./pages/Index";
import Tools from "./pages/Tools";
import NotFound from "./pages/NotFound";

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// Lazy loaded pages
const ToolCategory = lazy(() => import("./pages/ToolCategory"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Guides = lazy(() => import("./pages/Guides"));
const About = lazy(() => import("./pages/About"));
const Auth = lazy(() => import("./pages/Auth"));
const Premium = lazy(() => import("./pages/Premium"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const News = lazy(() => import("./pages/News"));
const NewsArticle = lazy(() => import("./pages/NewsArticle"));
const Reviews = lazy(() => import("./pages/Reviews"));
const ReviewDetail = lazy(() => import("./pages/ReviewDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const DigiStore = lazy(() => import("./pages/DigiStore"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Contact = lazy(() => import("./pages/Contact"));
const Disclosure = lazy(() => import("./pages/Disclosure"));
const DesignDemo = lazy(() => import("./pages/DesignDemo"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminNews = lazy(() => import("./pages/admin/AdminNews"));
const AdminArticles = lazy(() => import("./pages/admin/AdminArticles"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminComments = lazy(() => import("./pages/admin/AdminComments"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminCreepyTech = lazy(() => import("./pages/admin/AdminCreepyTech"));
const AdminCyberAwareness = lazy(() => import("./pages/admin/AdminCyberAwareness"));
const AdminGuides = lazy(() => import("./pages/admin/AdminGuides"));
const AdminToolFeedback = lazy(() => import("./pages/admin/AdminToolFeedback"));

// Category pages
const Phones = lazy(() => import("./pages/categories/Phones"));
const Security = lazy(() => import("./pages/categories/Security"));
const Productivity = lazy(() => import("./pages/categories/Productivity"));
const HowTo = lazy(() => import("./pages/categories/HowTo"));
const AITech = lazy(() => import("./pages/categories/AITech"));
const MakeMoney = lazy(() => import("./pages/categories/MakeMoney"));
const Gaming = lazy(() => import("./pages/categories/Gaming"));
const Accessories = lazy(() => import("./pages/categories/Accessories"));
const CareerInTech = lazy(() => import("./pages/categories/CareerInTech"));
const HealthTech = lazy(() => import("./pages/categories/HealthTech"));
const RemoteWork = lazy(() => import("./pages/categories/RemoteWork"));
const GreenTech = lazy(() => import("./pages/categories/GreenTech"));

// Special pages
const CreepyTech = lazy(() => import("./pages/CreepyTech"));
const CyberAwareness = lazy(() => import("./pages/CyberAwareness"));
const StartHere = lazy(() => import("./pages/StartHere"));

// Tool pages - all lazy loaded
const PasswordGenerator = lazy(() => import("./pages/tools/PasswordGenerator"));
const QRGenerator = lazy(() => import("./pages/tools/QRGenerator"));
const ImageCompressor = lazy(() => import("./pages/tools/ImageCompressor"));
const PhoneComparison = lazy(() => import("./pages/tools/PhoneComparison"));
const PasswordChecker = lazy(() => import("./pages/tools/PasswordChecker"));
const UpgradeCalculator = lazy(() => import("./pages/tools/UpgradeCalculator"));
const JsonFormatter = lazy(() => import("./pages/tools/JsonFormatter"));
const Base64Encoder = lazy(() => import("./pages/tools/Base64Encoder"));
const ColorPicker = lazy(() => import("./pages/tools/ColorPicker"));
const LoremIpsum = lazy(() => import("./pages/tools/LoremIpsum"));
const UnitConverter = lazy(() => import("./pages/tools/UnitConverter"));
const SpeedTest = lazy(() => import("./pages/tools/SpeedTest"));
const PrivacyChecker = lazy(() => import("./pages/tools/PrivacyChecker"));
const IPLookup = lazy(() => import("./pages/tools/IPLookup"));
const HashGenerator = lazy(() => import("./pages/tools/HashGenerator"));
const URLParser = lazy(() => import("./pages/tools/URLParser"));
const TextCounter = lazy(() => import("./pages/tools/TextCounter"));
const MeetingCostCalculator = lazy(() => import("./pages/tools/MeetingCostCalculator"));
const EmailSubjectTester = lazy(() => import("./pages/tools/EmailSubjectTester"));
const PomodoroTimer = lazy(() => import("./pages/tools/PomodoroTimer"));
const SubscriptionTracker = lazy(() => import("./pages/tools/SubscriptionTracker"));
const HabitTracker = lazy(() => import("./pages/tools/HabitTracker"));
const JobTracker = lazy(() => import("./pages/tools/JobTracker"));
const LinkInBio = lazy(() => import("./pages/tools/LinkInBio"));
const InvoiceGenerator = lazy(() => import("./pages/tools/InvoiceGenerator"));
const InvoiceChaser = lazy(() => import("./pages/tools/InvoiceChaser"));
const ContentRepurposer = lazy(() => import("./pages/tools/ContentRepurposer"));
const ProposalGenerator = lazy(() => import("./pages/tools/ProposalGenerator"));
const SimpleCRM = lazy(() => import("./pages/tools/SimpleCRM"));
const AppointmentBooking = lazy(() => import("./pages/tools/AppointmentBooking"));
const ClientPortal = lazy(() => import("./pages/tools/ClientPortal"));
const ResumeBuilder = lazy(() => import("./pages/tools/ResumeBuilder"));
const NetworkCRM = lazy(() => import("./pages/tools/NetworkCRM"));
const URLShortener = lazy(() => import("./pages/tools/URLShortener"));
const CreatorAnalytics = lazy(() => import("./pages/tools/CreatorAnalytics"));
const RegexTester = lazy(() => import("./pages/tools/RegexTester"));
const CronBuilder = lazy(() => import("./pages/tools/CronBuilder"));
const JWTDecoder = lazy(() => import("./pages/tools/JWTDecoder"));
const MarkdownEditor = lazy(() => import("./pages/tools/MarkdownEditor"));
const GradientGenerator = lazy(() => import("./pages/tools/GradientGenerator"));
const TypingTest = lazy(() => import("./pages/tools/TypingTest"));
const SalaryComparison = lazy(() => import("./pages/tools/SalaryComparison"));
const BusinessNameGenerator = lazy(() => import("./pages/tools/BusinessNameGenerator"));
const DecisionWheel = lazy(() => import("./pages/tools/DecisionWheel"));
const ExpenseTracker = lazy(() => import("./pages/tools/ExpenseTracker"));
const FaviconGenerator = lazy(() => import("./pages/tools/FaviconGenerator"));
const MetaTagGenerator = lazy(() => import("./pages/tools/MetaTagGenerator"));
const ContractGenerator = lazy(() => import("./pages/tools/ContractGenerator"));
const CoverLetterGenerator = lazy(() => import("./pages/tools/CoverLetterGenerator"));
const ColdEmailWriter = lazy(() => import("./pages/tools/ColdEmailWriter"));
const LifeProgressBar = lazy(() => import("./pages/tools/LifeProgressBar"));
const UsernameGenerator = lazy(() => import("./pages/tools/UsernameGenerator"));
const ScreenTimeCalculator = lazy(() => import("./pages/tools/ScreenTimeCalculator"));
const PricingCalculator = lazy(() => import("./pages/tools/PricingCalculator"));
const ROICalculator = lazy(() => import("./pages/tools/ROICalculator"));
const DailyStandup = lazy(() => import("./pages/tools/DailyStandup"));
const TimeTracker = lazy(() => import("./pages/tools/TimeTracker"));
const DailyJournal = lazy(() => import("./pages/tools/DailyJournal"));
const WaterTracker = lazy(() => import("./pages/tools/WaterTracker"));
const FocusScore = lazy(() => import("./pages/tools/FocusScore"));
const SideHustleCalculator = lazy(() => import("./pages/tools/SideHustleCalculator"));
const StartupValidator = lazy(() => import("./pages/tools/StartupValidator"));
const PersonalBrandAudit = lazy(() => import("./pages/tools/PersonalBrandAudit"));
const CarbonFootprint = lazy(() => import("./pages/tools/CarbonFootprint"));
const CareerMatcher = lazy(() => import("./pages/tools/CareerMatcher"));
const PlaceholderImage = lazy(() => import("./pages/tools/PlaceholderImage"));
const ProductDescriptionGenerator = lazy(() => import("./pages/tools/ProductDescriptionGenerator"));
const BlogOutlineGenerator = lazy(() => import("./pages/tools/BlogOutlineGenerator"));
const SocialCaptionGenerator = lazy(() => import("./pages/tools/SocialCaptionGenerator"));
const MeetingNotesSummarizer = lazy(() => import("./pages/tools/MeetingNotesSummarizer"));
const AIContentIdeaGenerator = lazy(() => import("./pages/tools/AIContentIdeaGenerator"));
const AIPromptGenerator = lazy(() => import("./pages/tools/AIPromptGenerator"));
const AIStartupNameGenerator = lazy(() => import("./pages/tools/AIStartupNameGenerator"));
const AdSenseCalculator = lazy(() => import("./pages/tools/AdSenseCalculator"));
const BillSplitter = lazy(() => import("./pages/tools/BillSplitter"));
const BmiCalculator = lazy(() => import("./pages/tools/BmiCalculator"));
const ColorPaletteExtractor = lazy(() => import("./pages/tools/ColorPaletteExtractor"));
const CountdownTimer = lazy(() => import("./pages/tools/CountdownTimer"));
const FakeDataGenerator = lazy(() => import("./pages/tools/FakeDataGenerator"));
const FileConverter = lazy(() => import("./pages/tools/FileConverter"));
const FreelanceRateCalculator = lazy(() => import("./pages/tools/FreelanceRateCalculator"));
const ImageConverter = lazy(() => import("./pages/tools/ImageConverter"));
const MemeGenerator = lazy(() => import("./pages/tools/MemeGenerator"));
const MortgageCalculator = lazy(() => import("./pages/tools/MortgageCalculator"));
const StartupCostCalculator = lazy(() => import("./pages/tools/StartupCostCalculator"));
const TextToSpeech = lazy(() => import("./pages/tools/TextToSpeech"));
const WifiQrGenerator = lazy(() => import("./pages/tools/WifiQrGenerator"));
const WorldClock = lazy(() => import("./pages/tools/WorldClock"));
const YouTubeThumbnailDownloader = lazy(() => import("./pages/tools/YouTubeThumbnailDownloader"));

// New addictive tools
const AgeCalculator = lazy(() => import("./pages/tools/AgeCalculator"));
const CurrencyConverter = lazy(() => import("./pages/tools/CurrencyConverter"));
const HashtagGenerator = lazy(() => import("./pages/tools/HashtagGenerator"));
const HookGenerator = lazy(() => import("./pages/tools/HookGenerator"));
const ThisDayInHistory = lazy(() => import("./pages/tools/ThisDayInHistory"));
const IdeaParkingLot = lazy(() => import("./pages/tools/IdeaParkingLot"));
const SavingsGoalVisualizer = lazy(() => import("./pages/tools/SavingsGoalVisualizer"));
const CompoundInterestCalculator = lazy(() => import("./pages/tools/CompoundInterestCalculator"));
const PaycheckCalculator = lazy(() => import("./pages/tools/PaycheckCalculator"));
const ThumbnailTester = lazy(() => import("./pages/tools/ThumbnailTester"));
const HashtagAnalyzer = lazy(() => import("./pages/tools/HashtagAnalyzer"));
const LoanEmiCalculator = lazy(() => import("./pages/tools/LoanEmiCalculator"));
const NetWorthTracker = lazy(() => import("./pages/tools/NetWorthTracker"));
const CompatibilityCalculator = lazy(() => import("./pages/tools/CompatibilityCalculator"));
const TechTriviaGenerator = lazy(() => import("./pages/tools/TechTriviaGenerator"));
const SittingTimeCalculator = lazy(() => import("./pages/tools/SittingTimeCalculator"));

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
                    <ToolsProvider>
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
                    <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/premium" element={<Premium />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/dashboard" element={<Dashboard />} />
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
                      <Route path="/tools/ai-content-idea-generator" element={<AIContentIdeaGenerator />} />
                      <Route path="/tools/ai-prompt-generator" element={<AIPromptGenerator />} />
                      <Route path="/tools/ai-startup-name-generator" element={<AIStartupNameGenerator />} />
                      <Route path="/tools/adsense-calculator" element={<AdSenseCalculator />} />
                      <Route path="/tools/bill-splitter" element={<BillSplitter />} />
                      <Route path="/tools/bmi-calculator" element={<BmiCalculator />} />
                      <Route path="/tools/color-palette-extractor" element={<ColorPaletteExtractor />} />
                      <Route path="/tools/countdown-timer" element={<CountdownTimer />} />
                      <Route path="/tools/fake-data-generator" element={<FakeDataGenerator />} />
                      <Route path="/tools/file-converter" element={<FileConverter />} />
                      <Route path="/tools/freelance-rate-calculator" element={<FreelanceRateCalculator />} />
                      <Route path="/tools/image-converter" element={<ImageConverter />} />
                      <Route path="/tools/meme-generator" element={<MemeGenerator />} />
                      <Route path="/tools/mortgage-calculator" element={<MortgageCalculator />} />
                      <Route path="/tools/startup-cost-calculator" element={<StartupCostCalculator />} />
                      <Route path="/tools/text-to-speech" element={<TextToSpeech />} />
                      <Route path="/tools/wifi-qr-generator" element={<WifiQrGenerator />} />
                      <Route path="/tools/world-clock" element={<WorldClock />} />
                      <Route path="/tools/youtube-thumbnail-downloader" element={<YouTubeThumbnailDownloader />} />
                      <Route path="/tools/age-calculator" element={<AgeCalculator />} />
                      <Route path="/tools/currency-converter" element={<CurrencyConverter />} />
                      <Route path="/tools/hashtag-generator" element={<HashtagGenerator />} />
                      <Route path="/tools/hook-generator" element={<HookGenerator />} />
                      <Route path="/tools/this-day-in-history" element={<ThisDayInHistory />} />
                      <Route path="/tools/idea-parking-lot" element={<IdeaParkingLot />} />
                      <Route path="/tools/savings-goal-visualizer" element={<SavingsGoalVisualizer />} />
                      <Route path="/tools/compound-interest-calculator" element={<CompoundInterestCalculator />} />
                      <Route path="/tools/paycheck-calculator" element={<PaycheckCalculator />} />
                      <Route path="/tools/thumbnail-tester" element={<ThumbnailTester />} />
                      <Route path="/tools/hashtag-analyzer" element={<HashtagAnalyzer />} />
                      <Route path="/tools/loan-emi-calculator" element={<LoanEmiCalculator />} />
                      <Route path="/tools/net-worth-tracker" element={<NetWorthTracker />} />
                      <Route path="/tools/compatibility-calculator" element={<CompatibilityCalculator />} />
                      <Route path="/tools/tech-trivia-generator" element={<TechTriviaGenerator />} />
                      <Route path="/tools/sitting-time-calculator" element={<SittingTimeCalculator />} />
                      <Route path="/tools/:categoryId" element={<ToolCategory />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:slug" element={<BlogArticle />} />
                      <Route path="/news" element={<News />} />
                      <Route path="/news/:slug" element={<NewsArticle />} />
                      <Route path="/phones" element={<Phones />} />
                      <Route path="/security" element={<Security />} />
                      <Route path="/productivity" element={<Productivity />} />
                      <Route path="/how-to" element={<HowTo />} />
                      <Route path="/ai-tech" element={<AITech />} />
                      <Route path="/make-money" element={<MakeMoney />} />
                      <Route path="/deals" element={<MakeMoney />} />
                      <Route path="/gaming" element={<Gaming />} />
                      <Route path="/accessories" element={<Accessories />} />
                      <Route path="/career-in-tech" element={<CareerInTech />} />
                      <Route path="/health-tech" element={<HealthTech />} />
                      <Route path="/remote-work" element={<RemoteWork />} />
                      <Route path="/green-tech" element={<GreenTech />} />
                      <Route path="/creepy-tech" element={<CreepyTech />} />
                      <Route path="/cyber-awareness" element={<CyberAwareness />} />
                      <Route path="/start-here" element={<StartHere />} />
                      <Route path="/reviews" element={<Reviews />} />
                      <Route path="/reviews/:slug" element={<ReviewDetail />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin/news" element={<AdminNews />} />
                      <Route path="/admin/articles" element={<AdminArticles />} />
                      <Route path="/admin/reviews" element={<AdminReviews />} />
                      <Route path="/admin/comments" element={<AdminComments />} />
                      <Route path="/admin/users" element={<AdminUsers />} />
                      <Route path="/admin/messages" element={<AdminMessages />} />
                      <Route path="/admin/products" element={<AdminProducts />} />
                      <Route path="/admin/analytics" element={<AdminAnalytics />} />
                      <Route path="/admin/creepy-tech" element={<AdminCreepyTech />} />
                      <Route path="/admin/cyber-awareness" element={<AdminCyberAwareness />} />
                      <Route path="/admin/guides" element={<AdminGuides />} />
                      <Route path="/admin/tool-feedback" element={<AdminToolFeedback />} />
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
                    </Suspense>
                    <AIChatInterface />
                    <CartDrawer />
                    <CookieConsent />
                    <OnboardingTour />
                    </BrowserRouter>
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

export default App;
