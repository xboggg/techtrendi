import type { RouteRecord } from "vite-react-ssg";
import RootLayout from "./RootLayout";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { loadToolContentSection } from "@/components/tools/toolContentLoader";
import Index from "../pages/Index";
import Tools from "../pages/Tools";
import NotFound from "../pages/NotFound";
import { Navigate } from "react-router-dom";
import { DATA_BUNDLES_ROUTE } from "@/data/dataBundlesRoute";
import { CAREERS_ROUTE } from "@/lib/careers";
import { SPONSORS } from "@/data/sponsors";
import { EI_TECH_MEMES } from "@/data/eiTech";
import { newsLoader, newsStaticPaths, blogLoader, blogStaticPaths, blogListLoader, newsListLoader, productsListLoader, securityPageLoader } from "./news-data";

// Adapt our default-export pages to vite-react-ssg's lazy ({ Component }).
// Also recover from stale-deploy chunk failures: after a deploy, a tab holding
// the old index.html requests now-missing hashed chunks → the dynamic import
// rejects ("Failed to fetch dynamically imported module") and the route crashes.
// Reload to pull the fresh index.html with the correct chunk names.
//
// Guard = a TIME-WINDOW cooldown (not a one-time flag). A long-lived tab can hit
// MANY deploys in one session, each producing a NEW stale chunk — each should
// recover. But a genuinely-broken chunk fails again within seconds of reload, so
// if we reloaded < COOLDOWN ago we DON'T reload again (prevents an infinite loop)
// and let the error surface instead.
const reloadForStaleChunk = (err: unknown) => {
  if (typeof window === "undefined") throw err; // SSR: never reload, just rethrow
  const KEY = "tt_chunk_reload_at";
  const COOLDOWN = 20_000; // ms
  const last = Number(sessionStorage.getItem(KEY) || 0);
  if (Date.now() - last > COOLDOWN) {
    sessionStorage.setItem(KEY, String(Date.now()));
    window.location.reload();
    // Never-resolving promise so React doesn't flash an error before the reload.
    return new Promise<never>(() => {});
  }
  throw err; // reloaded very recently → likely a real failure, surface it
};
const d = (imp: () => Promise<{ default: React.ComponentType }>) => () =>
  imp().then((m) => ({ Component: m.default })).catch(reloadForStaleChunk) as Promise<{ Component: React.ComponentType }>;

// Tool pages: same as d(), but the tool explanations file loads in the same step,
// so it is ready before prerender/hydration (see toolContentLoader.ts). A failed
// load takes the same stale-chunk path as a failed page file.
const t = (imp: () => Promise<{ default: React.ComponentType }>) =>
  d(() => Promise.all([imp(), loadToolContentSection()]).then(([m]) => m));

// GENERATED from src/App.tsx by scripts/_ssg_gen_routes.cjs. 205 routes.
export const routes: RouteRecord[] = [
  {
    path: "/",
    element: <RootLayout />,
    entry: "src/ssg/RootLayout.tsx",
    children: [
      { index: true, element: <Index /> },
      { path: "auth", lazy: d(() => import("../pages/Auth")) },
      { path: "profile", lazy: d(() => import("../pages/Profile")) },
      { path: "dashboard", lazy: d(() => import("../pages/Dashboard")) },
      { path: "tools", element: <Tools /> },
      { path: "tools/:categoryId", lazy: d(() => import("../pages/ToolCategory")) },
      { path: "blog", lazy: d(() => import("../pages/Blog")), loader: blogListLoader },
      { path: "blog/:slug", lazy: d(() => import("../pages/BlogArticle")), loader: blogLoader, getStaticPaths: blogStaticPaths },
      { path: "news", lazy: d(() => import("../pages/News")), loader: newsListLoader },
      { path: "news/:slug", lazy: d(() => import("../pages/NewsArticle")), loader: newsLoader, getStaticPaths: newsStaticPaths },
      { path: "phones", lazy: d(() => import("../pages/categories/Phones")) },
      { path: "security", lazy: d(() => import("../pages/categories/Security")), loader: securityPageLoader },
      { path: "scam-alerts", lazy: d(() => import("../pages/ScamAlerts")) },
      { path: "tools-preview", lazy: d(() => import("../pages/ToolsPreview")) },
      // Careers jobs board: "careers" since 8 Nov 2026 (src/lib/careers.ts CAREERS_LAUNCHED). Prerendered
      // shell, noindex and kept out of the sitemap (generate-sitemap.mjs) until CAREERS_INDEXED.
      { path: CAREERS_ROUTE, lazy: d(() => import("../pages/careers/CareersBoard")) },
      // Data bundle pages. Preview: noindex, not prerendered, not in the sitemap. Launch: prerendered
      // (vite.config.ts includedRoutes adds DATA_BUNDLES_PRERENDER) and listed in the sitemap.
      // Countries come from src/data/dataBundleCountries.ts, so adding one is data only.
      // Path from src/data/dataBundlesRoute.ts: "tools-preview/data-bundles" (preview) or "data-bundles" (launch).
      // The bare address (with or without the slash) opens Ghana; nginx answers it with a 301 first (launch M2).
      { path: DATA_BUNDLES_ROUTE, element: <Navigate to={`/${DATA_BUNDLES_ROUTE}/ghana`} replace /> },
      { path: `${DATA_BUNDLES_ROUTE}/:country`, lazy: d(() => import("../pages/data-bundles/DataBundlesDashboard")) },
      { path: `${DATA_BUNDLES_ROUTE}/:country/:network`, lazy: d(() => import("../pages/data-bundles/DataBundlesNetwork")) },
      { path: "rundown-preview", lazy: d(() => import("../pages/RundownPreview")) },
      { path: "productivity", lazy: d(() => import("../pages/categories/Productivity")) },
      { path: "how-to", lazy: d(() => import("../pages/categories/HowTo")) },
      { path: "ai-tech", lazy: d(() => import("../pages/categories/AITech")) },
      { path: "smart-income", lazy: d(() => import("../pages/categories/SmartIncome")) },
      { path: "gaming", lazy: d(() => import("../pages/categories/Gaming")) },
      { path: "accessories", lazy: d(() => import("../pages/categories/Accessories")) },
      { path: "career-in-tech", lazy: d(() => import("../pages/categories/CareerInTech")) },
      { path: "health-tech", lazy: d(() => import("../pages/categories/HealthTech")) },
      { path: "remote-work", lazy: d(() => import("../pages/categories/RemoteWork")) },
      { path: "green-tech", lazy: d(() => import("../pages/categories/GreenTech")) },
      { path: "creepy-tech", lazy: d(() => import("../pages/CreepyTech")) },
      { path: "cyber-awareness", lazy: d(() => import("../pages/CyberAwareness")) },
      { path: "think-before-you-click", lazy: d(() => import("../pages/ThinkBeforeYouClick")) },
      { path: "scam-alerts", lazy: d(() => import("../pages/ScamAlerts")) },
      { path: "report-scam", lazy: d(() => import("../pages/ReportScam")) },
      { path: "scam-stories", lazy: d(() => import("../pages/ScamStories")) },
      // Ei Tech! funny tech memes (11 Nov 2026). One prerendered page per meme in src/data/eiTech.ts.
      { path: "ei-tech", lazy: d(() => import("../pages/ei-tech/EiTechHub")) },
      { path: "ei-tech/:slug", lazy: d(() => import("../pages/ei-tech/EiTechMemePage")), getStaticPaths: () => EI_TECH_MEMES.map((m) => `ei-tech/${m.slug}`) },
      // Reviews discontinued 2026-06-21 (focus = Africa Tech News · Tools · Security).
      // Routes removed so /reviews + /reviews/* stop prerendering; nginx 301s the
      // list to /blog and 410s the old detail URLs.
      { path: "admin", lazy: d(() => import("../pages/admin/AdminDashboard")) },
      { path: "admin/news", lazy: d(() => import("../pages/admin/AdminNews")) },
      { path: "admin/articles", lazy: d(() => import("../pages/admin/AdminArticles")) },
      { path: "admin/reviews", lazy: d(() => import("../pages/admin/AdminReviews")) },
      { path: "admin/comments", lazy: d(() => import("../pages/admin/AdminComments")) },
      { path: "admin/users", lazy: d(() => import("../pages/admin/AdminUsers")) },
      { path: "admin/messages", lazy: d(() => import("../pages/admin/AdminMessages")) },
      { path: "admin/products", lazy: d(() => import("../pages/admin/AdminProducts")) },
      { path: "admin/analytics", lazy: d(() => import("../pages/admin/AdminAnalytics")) },
      { path: "admin/creepy-tech", lazy: d(() => import("../pages/admin/AdminCreepyTech")) },
      { path: "admin/cyber-awareness", lazy: d(() => import("../pages/admin/AdminCyberAwareness")) },
      { path: "admin/scam-alerts", lazy: d(() => import("../pages/admin/AdminScamAlerts")) },
      { path: "admin/daily-tips", lazy: d(() => import("../pages/admin/AdminDailyTips")) },
      { path: "admin/ticker", lazy: d(() => import("../pages/admin/AdminTicker")) },
      { path: "admin/hero-images", lazy: d(() => import("../pages/admin/AdminHeroImages")) },
      { path: "admin/sponsors", lazy: d(() => import("../pages/admin/AdminSponsors")) },
      // A sponsor's owner edits their own ad (not prerendered: vite.config skip).
      { path: "my-ad", lazy: d(() => import("../pages/MyAd")) },
      { path: "admin/threat-level", lazy: d(() => import("../pages/admin/AdminThreatLevel")) },
      { path: "admin/scam-reports", lazy: d(() => import("../pages/admin/AdminScamReports")) },
      { path: "admin/scam-stories", lazy: d(() => import("../pages/admin/AdminScamStories")) },
      { path: "admin/tool-feedback", lazy: d(() => import("../pages/admin/AdminToolFeedback")) },
      { path: "admin/whatsapp-queue", lazy: d(() => import("../pages/admin/AdminWhatsAppQueue")) },
      { path: "admin/data-deals", lazy: d(() => import("../pages/admin/AdminDataDeals")) },
      { path: "arcade", lazy: d(() => import("../pages/Arcade")) },
      { path: "arcade/math-tug-of-war", lazy: d(() => import("../pages/arcade/MathTugOfWar")) },
      { path: "arcade/speed-typing-race", lazy: d(() => import("../pages/arcade/SpeedTypingRace")) },
      { path: "arcade/word-chain-battle", lazy: d(() => import("../pages/arcade/WordChainBattle")) },
      { path: "arcade/reflex-duel", lazy: d(() => import("../pages/arcade/ReflexDuel")) },
      { path: "arcade/trivia-challenge", lazy: d(() => import("../pages/arcade/TriviaChallenge")) },
      { path: "arcade/anagram-blitz", lazy: d(() => import("../pages/arcade/AnagramBlitz")) },
      { path: "arcade/wordle", lazy: d(() => import("../pages/arcade/WordleGame")) },
      { path: "arcade/word-bomb", lazy: d(() => import("../pages/arcade/WordBomb")) },
      { path: "arcade/crossword-sprint", lazy: d(() => import("../pages/arcade/CrosswordSprint")) },
      { path: "about", lazy: d(() => import("../pages/About")) },
      { path: "newsletter", lazy: d(() => import("../pages/NewsletterArchive")) },
      { path: "reading-list", lazy: d(() => import("../pages/ReadingList")) },
      { path: "privacy", lazy: d(() => import("../pages/Privacy")) },
      { path: "terms", lazy: d(() => import("../pages/Terms")) },
      { path: "cookies", lazy: d(() => import("../pages/Cookies")) },
      { path: "contact", lazy: d(() => import("../pages/Contact")) },
      { path: "disclosure", lazy: d(() => import("../pages/Disclosure")) },
      { path: "store", lazy: d(() => import("../pages/DigiStore")), loader: productsListLoader },
      { path: "books/think-before-you-click", lazy: d(() => import("../pages/books/ThinkBeforeYouClick")) },
      { path: "design-demo", lazy: d(() => import("../pages/DesignDemo")) },
      // Paid sponsors: one prerendered page each (noindex, not in the sitemap).
      ...SPONSORS.filter((s) => s.active).map((s) => ({
        path: `sponsored/${s.slug}`,
        lazy: d(() => import("../pages/sponsored/SponsorPage")),
      })),
      {
        element: <ToolPageLayout />,
        entry: "src/components/tools/ToolPageLayout.tsx",
        children: [
          { path: "tools/password-generator", lazy: t(() => import("../pages/tools/PasswordGenerator")) },
          { path: "tools/qr-generator", lazy: t(() => import("../pages/tools/QRGenerator")) },
          { path: "tools/image-compressor", lazy: t(() => import("../pages/tools/ImageCompressor")) },
          { path: "tools/phone-comparison", lazy: t(() => import("../pages/tools/PhoneComparison")) },
          { path: "tools/password-checker", lazy: t(() => import("../pages/tools/PasswordAnalyzer")) },
          { path: "tools/upgrade-calculator", lazy: t(() => import("../pages/tools/UpgradeCalculator")) },
          { path: "tools/json-formatter", lazy: t(() => import("../pages/tools/JsonFormatter")) },
          { path: "tools/base64-encoder", lazy: t(() => import("../pages/tools/Base64Encoder")) },
          { path: "tools/color-picker", lazy: t(() => import("../pages/tools/ColorPicker")) },
          { path: "tools/lorem-ipsum", lazy: t(() => import("../pages/tools/LoremIpsum")) },
          { path: "tools/unit-converter", lazy: t(() => import("../pages/tools/UnitConverter")) },
          { path: "tools/speed-test", lazy: t(() => import("../pages/tools/SpeedTest")) },
          { path: "tools/privacy-checker", lazy: t(() => import("../pages/tools/PrivacyChecker")) },
          { path: "tools/ip-lookup", lazy: t(() => import("../pages/tools/IPLookup")) },
          { path: "tools/hash-generator", lazy: t(() => import("../pages/tools/HashGenerator")) },
          { path: "tools/url-parser", lazy: t(() => import("../pages/tools/URLParser")) },
          { path: "tools/text-counter", lazy: t(() => import("../pages/tools/TextCounter")) },
          { path: "tools/meeting-cost-calculator", lazy: t(() => import("../pages/tools/MeetingCostCalculator")) },
          { path: "tools/email-subject-tester", lazy: t(() => import("../pages/tools/EmailSubjectTester")) },
          { path: "tools/pomodoro-timer", lazy: t(() => import("../pages/tools/PomodoroTimer")) },
          { path: "tools/subscription-tracker", lazy: t(() => import("../pages/tools/SubscriptionTracker")) },
          { path: "tools/habit-tracker", lazy: t(() => import("../pages/tools/HabitTrackerV2")) },
          { path: "tools/job-tracker", lazy: t(() => import("../pages/tools/JobTracker")) },
          { path: "tools/link-in-bio", lazy: t(() => import("../pages/tools/LinkInBio")) },
          { path: "tools/invoice-generator", lazy: t(() => import("../pages/tools/InvoiceGenerator")) },
          { path: "tools/content-repurposer", lazy: t(() => import("../pages/tools/ContentRepurposer")) },
          { path: "tools/resume-builder", lazy: t(() => import("../pages/tools/ResumeBuilder")) },
          { path: "tools/url-shortener", lazy: t(() => import("../pages/tools/URLShortener")) },
          { path: "tools/creator-analytics", lazy: t(() => import("../pages/tools/CreatorAnalytics")) },
          { path: "tools/regex-tester", lazy: t(() => import("../pages/tools/RegexTester")) },
          { path: "tools/cron-builder", lazy: t(() => import("../pages/tools/CronBuilder")) },
          { path: "tools/jwt-decoder", lazy: t(() => import("../pages/tools/JWTDecoder")) },
          { path: "tools/markdown-editor", lazy: t(() => import("../pages/tools/MarkdownEditor")) },
          { path: "tools/gradient-generator", lazy: t(() => import("../pages/tools/GradientGenerator")) },
          { path: "tools/typing-test", lazy: t(() => import("../pages/tools/TypingTest")) },
          { path: "tools/salary-comparison", lazy: t(() => import("../pages/tools/SalaryComparison")) },
          { path: "tools/business-name-generator", lazy: t(() => import("../pages/tools/AIBusinessNameGenerator")) },
          { path: "tools/decision-wheel", lazy: t(() => import("../pages/tools/DecisionWheel")) },
          { path: "tools/expense-tracker", lazy: t(() => import("../pages/tools/BudgetTracker")) },
          { path: "tools/favicon-generator", lazy: t(() => import("../pages/tools/FaviconGenerator")) },
          { path: "tools/meta-tag-generator", lazy: t(() => import("../pages/tools/MetaTagGenerator")) },
          { path: "tools/contract-generator", lazy: t(() => import("../pages/tools/ContractGenerator")) },
          { path: "tools/cover-letter-generator", lazy: t(() => import("../pages/tools/CoverLetterGenerator")) },
          { path: "tools/username-generator", lazy: t(() => import("../pages/tools/UsernameGenerator")) },
          { path: "tools/screen-time-calculator", lazy: t(() => import("../pages/tools/ScreenTimeCalculator")) },
          { path: "tools/pricing-calculator", lazy: t(() => import("../pages/tools/PricingCalculator")) },
          { path: "tools/roi-calculator", lazy: t(() => import("../pages/tools/ROICalculator")) },
          { path: "tools/daily-standup", lazy: t(() => import("../pages/tools/DailyStandup")) },
          { path: "tools/time-tracker", lazy: t(() => import("../pages/tools/TimeTracker")) },
          { path: "tools/daily-journal", lazy: t(() => import("../pages/tools/DailyJournal")) },
          { path: "tools/water-tracker", lazy: t(() => import("../pages/tools/WaterTracker")) },
          { path: "tools/focus-score", lazy: t(() => import("../pages/tools/FocusScore")) },
          { path: "tools/side-hustle-calculator", lazy: t(() => import("../pages/tools/SideHustleProjector")) },
          { path: "tools/startup-validator", lazy: t(() => import("../pages/tools/AppIdeaValidator")) },
          { path: "tools/personal-brand-audit", lazy: t(() => import("../pages/tools/PersonalBrandAudit")) },
          { path: "tools/carbon-footprint", lazy: t(() => import("../pages/tools/CarbonFootprintV2")) },
          { path: "tools/career-matcher", lazy: t(() => import("../pages/tools/CareerMatcher")) },
          { path: "tools/placeholder-image", lazy: t(() => import("../pages/tools/PlaceholderImage")) },
          { path: "tools/product-description-generator", lazy: t(() => import("../pages/tools/ProductDescriptionGenerator")) },
          { path: "tools/blog-outline-generator", lazy: t(() => import("../pages/tools/BlogOutlineGenerator")) },
          { path: "tools/social-caption-generator", lazy: t(() => import("../pages/tools/SocialCaptionGenerator")) },
          { path: "tools/meeting-notes-summarizer", lazy: t(() => import("../pages/tools/MeetingNotesSummarizer")) },
          { path: "tools/ai-content-idea-generator", lazy: t(() => import("../pages/tools/AIContentIdeaGenerator")) },
          { path: "tools/ai-prompt-generator", lazy: t(() => import("../pages/tools/AIPromptImprover")) },
          { path: "tools/ai-startup-name-generator", lazy: t(() => import("../pages/tools/AIStartupNameGenerator")) },
          { path: "tools/adsense-calculator", lazy: t(() => import("../pages/tools/AdSenseCalculator")) },
          { path: "tools/bill-splitter", lazy: t(() => import("../pages/tools/BillSplitter")) },
          { path: "tools/bmi-calculator", lazy: t(() => import("../pages/tools/BmiCalculator")) },
          { path: "tools/color-palette-extractor", lazy: t(() => import("../pages/tools/ColorPaletteExtractor")) },
          { path: "tools/countdown-timer", lazy: t(() => import("../pages/tools/CountdownTimer")) },
          { path: "tools/fake-data-generator", lazy: t(() => import("../pages/tools/FakeDataGenerator")) },
          { path: "tools/file-converter", lazy: t(() => import("../pages/tools/FileConverter")) },
          { path: "tools/freelance-rate-calculator", lazy: t(() => import("../pages/tools/FreelanceRateCalculator")) },
          { path: "tools/image-converter", lazy: t(() => import("../pages/tools/ImageConverter")) },
          { path: "tools/meme-generator", lazy: t(() => import("../pages/tools/MemeGenerator")) },
          { path: "tools/mortgage-calculator", lazy: t(() => import("../pages/tools/LoanCalculator")) },
          { path: "tools/startup-cost-calculator", lazy: t(() => import("../pages/tools/StartupCostCalculator")) },
          { path: "tools/text-to-speech", lazy: t(() => import("../pages/tools/TextToSpeech")) },
          { path: "tools/world-clock", lazy: t(() => import("../pages/tools/WorldClock")) },
          // youtube-thumbnail-downloader removed (AdSense policy: copyrighted-asset
          // download / targeting Google's own property). 301'd to thumbnail-tester in nginx.
          { path: "tools/currency-converter", lazy: t(() => import("../pages/tools/CurrencyConverter")) },
          { path: "tools/hook-generator", lazy: t(() => import("../pages/tools/HookGenerator")) },
          { path: "tools/idea-parking-lot", lazy: t(() => import("../pages/tools/IdeaParkingLot")) },
          { path: "tools/savings-goal-visualizer", lazy: t(() => import("../pages/tools/SavingsGoalVisualizer")) },
          { path: "tools/paycheck-calculator", lazy: t(() => import("../pages/tools/PaycheckCalculator")) },
          { path: "tools/thumbnail-tester", lazy: t(() => import("../pages/tools/ThumbnailTester")) },
          { path: "tools/hashtag-analyzer", lazy: t(() => import("../pages/tools/HashtagAnalyzer")) },
          { path: "tools/loan-emi-calculator", lazy: t(() => import("../pages/tools/LoanEmiCalculator")) },
          { path: "tools/net-worth-tracker", lazy: t(() => import("../pages/tools/NetWorthTracker")) },
          { path: "tools/compatibility-calculator", lazy: t(() => import("../pages/tools/CompatibilityCalculator")) },
          { path: "tools/tech-trivia-generator", lazy: t(() => import("../pages/tools/TechTriviaGenerator")) },
          { path: "tools/sitting-time-calculator", lazy: t(() => import("../pages/tools/SittingTimeCalculator")) },
          { path: "tools/math-tug-of-war", lazy: t(() => import("../pages/tools/MathTugOfWar")) },
          { path: "tools/decision-matrix", lazy: t(() => import("../pages/tools/DecisionMatrix")) },
          { path: "tools/project-timeline", lazy: t(() => import("../pages/tools/ProjectTimeline")) },
          { path: "tools/compound-interest", lazy: t(() => import("../pages/tools/CompoundInterest")) },
          { path: "tools/fire-calculator", lazy: t(() => import("../pages/tools/FIRECalculator")) },
          { path: "tools/cost-of-living", lazy: t(() => import("../pages/tools/CostOfLiving")) },
          { path: "tools/ghana-tax-calculator", lazy: t(() => import("../pages/tools/GhanaTaxCalculator")) },
          { path: "tools/momo-fee-calculator", lazy: t(() => import("../pages/tools/MoMoFeeCalculator")) },
          { path: "tools/ecg-bill-estimator", lazy: t(() => import("../pages/tools/ECGBillEstimator")) },
          { path: "tools/cyber-risk-scorecard", lazy: t(() => import("../pages/tools/CyberRiskScorecard")) },
          { path: "tools/tech-stack-recommender", lazy: t(() => import("../pages/tools/TechStackRecommender")) },
          { path: "tools/viral-post-analyzer", lazy: t(() => import("../pages/tools/ViralPostAnalyzer")) },
          { path: "tools/resume-roaster", lazy: t(() => import("../pages/tools/ResumeRoaster")) },
          { path: "tools/youtube-title-optimizer", lazy: t(() => import("../pages/tools/YouTubeTitleOptimizer")) },
          { path: "tools/concept-explainer", lazy: t(() => import("../pages/tools/ConceptExplainer")) },
          { path: "tools/seo-auditor", lazy: t(() => import("../pages/tools/BlogSEOAuditor")) },
          { path: "tools/rent-vs-buy", lazy: t(() => import("../pages/tools/RentVsBuy")) },
          { path: "tools/couples-finance", lazy: t(() => import("../pages/tools/CouplesFinance")) },
          { path: "tools/pay-yourself-first", lazy: t(() => import("../pages/tools/PayYourselfFirst")) },
          { path: "tools/variable-income-budget", lazy: t(() => import("../pages/tools/VariableIncomeBudget")) },
          { path: "tools/brain-dump", lazy: t(() => import("../pages/tools/BrainDumpOutline")) },
          { path: "tools/hook-scorer", lazy: t(() => import("../pages/tools/HookScorer")) },
          { path: "tools/content-calendar", lazy: t(() => import("../pages/tools/ContentCalendar")) },
          { path: "tools/brand-pitch", lazy: t(() => import("../pages/tools/BrandPitchGenerator")) },
          { path: "tools/farm-calculator", lazy: t(() => import("../pages/tools/FarmInputCalculator")) },
          { path: "tools/stock-alert", lazy: t(() => import("../pages/tools/StockAlertTool")) },
          { path: "tools/creator-monetization", lazy: t(() => import("../pages/tools/CreatorMonetization")) },
          { path: "tools/nutrition-analyzer", lazy: t(() => import("../pages/tools/MealNutritionAnalyzer")) },
          { path: "tools/startup-readiness", lazy: t(() => import("../pages/tools/StartupReadiness")) },
          { path: "tools/business-registration", lazy: t(() => import("../pages/tools/BusinessRegGuide")) },
          { path: "tools/statistics-visualizer", lazy: t(() => import("../pages/tools/StatisticsVisualizer")) },
          { path: "tools/phishing-quiz", lazy: t(() => import("../pages/tools/PhishingQuiz")) },
          { path: "tools/whatsapp-audit", lazy: t(() => import("../pages/tools/WhatsAppAudit")) },
          // scam-analyzer + password-strength merged 2026-11-02 (duplicates of
          // ghana-scam-checker / password-checker); nginx 301s the old URLs.
          // Page files kept (ScamAnalyzer.tsx, PasswordStrength.tsx) so this can be undone.
          { path: "tools/incident-response", lazy: t(() => import("../pages/tools/IncidentResponse")) },
          { path: "tools/wifi-qr-generator", lazy: t(() => import("../pages/tools/WifiQrGenerator")) },
          { path: "tools/this-day-in-history", lazy: t(() => import("../pages/tools/ThisDayInHistory")) },
          { path: "tools/life-progress-bar", lazy: t(() => import("../pages/tools/LifeProgressBar")) },
          { path: "tools/life-calculators", lazy: t(() => import("../pages/tools/LifeCalculatorsHub")) },
          { path: "tools/cybersecurity-playbook", lazy: t(() => import("../pages/tools/CybersecurityPlaybook")) },
          { path: "tools/momo-fee-calculator", lazy: t(() => import("../pages/tools/MoMoFeeCalculator")) },
          // ghana-electricity-calculator removed 2026-06-21: stale/inaccurate tariff
          // (orphan, never in catalog). Superseded by /tools/ecg-bill-estimator
          // (PURC-verified). nginx 301s the old URL to the new one.
          { path: "tools/ghana-scam-checker", lazy: t(() => import("../pages/tools/GhanaScamChecker")) },
          // ghs-exchange-rate merged 2026-11-02 into currency-converter (nginx 301);
          // GhsExchangeRate.tsx kept.
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
];
