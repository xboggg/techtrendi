import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import {
  Shield, QrCode, Image, ArrowRight, Smartphone, FileText, Lock, Braces, Binary,
  Palette, Scale, Type, Gauge, Eye, Globe, Hash, Link2, AlignJustify, DollarSign,
  Calculator, Mail, Clock, CreditCard, CheckSquare, Briefcase, LinkIcon, Crown,
  Receipt, FileSignature, Users, Calendar, Zap, Building, PenTool, Share2,
  BarChart3, Megaphone, GraduationCap, Code, Timer, KeyRound, FileCode, Paintbrush,
  Keyboard, TrendingUp, Lightbulb, Disc3, Wallet, ImageIcon, Tags, ScrollText,
  Send, Hourglass, AtSign, Monitor, CircleDollarSign, PieChart, MessageSquare,
  Droplets, Target, BookOpen, Rocket, User, Leaf, Compass, SquareAsterisk,
  ShoppingBag, List, Instagram, ClipboardList
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ToolTier = "free" | "free-account" | "premium";

interface Tool {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  tier: ToolTier;
  isNew?: boolean;
  isComingSoon?: boolean;
}

interface ToolCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  cardIconBg: string;
  tools: Tool[];
}

const toolCategories: ToolCategory[] = [
  {
    id: "business",
    title: "Business & Freelancer",
    description: "Tools to run your business and manage clients",
    icon: Briefcase,
    iconBg: "bg-blue-600",
    cardIconBg: "bg-blue-600",
    tools: [
      {
        icon: Receipt,
        title: "Invoice Generator",
        description: "Create professional invoices in minutes with customizable templates.",
        href: "/tools/invoice-generator",
        tier: "premium",
      },
      {
        icon: DollarSign,
        title: "Invoice Chaser",
        description: "Automated payment reminders that chase late-paying clients for you.",
        href: "/tools/invoice-chaser",
        tier: "premium",
      },
      {
        icon: FileSignature,
        title: "Proposal Generator",
        description: "Create professional proposals and quotes that win clients.",
        href: "/tools/proposal-generator",
        tier: "premium",
        isNew: true,
      },
      {
        icon: Users,
        title: "Simple CRM",
        description: "Track customers, deals, and follow-ups in one simple dashboard.",
        href: "/tools/simple-crm",
        tier: "premium",
        isNew: true,
      },
      {
        icon: Calendar,
        title: "Appointment Booking",
        description: "Let clients book appointments with WhatsApp confirmations.",
        href: "/tools/appointment-booking",
        tier: "premium",
        isNew: true,
      },
      {
        icon: Building,
        title: "Client Portal",
        description: "Share files, invoices, and messages with clients in one place.",
        href: "/tools/client-portal",
        tier: "premium",
        isNew: true,
      },
      {
        icon: ScrollText,
        title: "Contract Generator",
        description: "Generate professional contracts for freelancers. NDA, service agreements, and more.",
        href: "/tools/contract-generator",
        tier: "free-account",
        isNew: true,
      },
      {
        icon: CircleDollarSign,
        title: "Pricing Calculator",
        description: "Calculate your freelance rates or product pricing. Factor in expenses and taxes.",
        href: "/tools/pricing-calculator",
        tier: "free",
        isNew: true,
      },
      {
        icon: PieChart,
        title: "ROI Calculator",
        description: "Calculate return on investment for marketing, investments, and business decisions.",
        href: "/tools/roi-calculator",
        tier: "free",
        isNew: true,
      },
      {
        icon: Lightbulb,
        title: "Business Name Generator",
        description: "Generate creative business names with domain availability checks.",
        href: "/tools/business-name-generator",
        tier: "free",
        isNew: true,
      },
      {
        icon: CircleDollarSign,
        title: "Side Hustle Calculator",
        description: "Calculate your side hustle income potential. See when you could go full-time.",
        href: "/tools/side-hustle-calculator",
        tier: "free",
        isNew: true,
      },
      {
        icon: Rocket,
        title: "Startup Idea Validator",
        description: "Score your startup idea across key factors. Get actionable feedback.",
        href: "/tools/startup-validator",
        tier: "free",
        isNew: true,
      },
      {
        icon: User,
        title: "Personal Brand Audit",
        description: "Audit your personal brand and online presence. Get improvement tips.",
        href: "/tools/personal-brand-audit",
        tier: "free",
        isNew: true,
      },
      {
        icon: Calculator,
        title: "Mortgage Calculator",
        description: "Calculate mortgage payments, compare loans, amortization schedule.",
        href: "/tools/mortgage-calculator",
        tier: "free",
        isNew: true,
      },
      {
        icon: DollarSign,
        title: "AdSense Revenue Calculator",
        description: "Estimate your Google AdSense earnings with traffic projections.",
        href: "/tools/adsense-calculator",
        tier: "free",
        isNew: true,
      },
      {
        icon: DollarSign,
        title: "Freelance Rate Calculator",
        description: "Calculate your ideal hourly and project rates as a freelancer.",
        href: "/tools/freelance-rate-calculator",
        tier: "free",
        isNew: true,
      },
      {
        icon: Rocket,
        title: "Startup Cost Calculator",
        description: "Estimate startup costs, runway, and break-even with presets.",
        href: "/tools/startup-cost-calculator",
        tier: "free",
        isNew: true,
      },
      {
        icon: Rocket,
        title: "AI Startup Name Generator",
        description: "Generate creative startup names with taglines and domain hints.",
        href: "/tools/ai-startup-name-generator",
        tier: "free",
        isNew: true,
      },
    ],
  },
  {
    id: "productivity",
    title: "Productivity",
    description: "Boost your efficiency and stay organized",
    icon: Zap,
    iconBg: "bg-orange-600",
    cardIconBg: "bg-orange-600",
    tools: [
      {
        icon: Calculator,
        title: "Meeting Cost Calculator",
        description: "See the real cost of meetings based on attendee salaries. Eye-opening!",
        href: "/tools/meeting-cost-calculator",
        tier: "free",
        isNew: true,
      },
      {
        icon: Clock,
        title: "Pomodoro Timer",
        description: "Stay focused with timed work sessions and breaks. Track your productivity.",
        href: "/tools/pomodoro-timer",
        tier: "free",
      },
      {
        icon: CreditCard,
        title: "Subscription Tracker",
        description: "Track all your subscriptions and see how much you're really spending.",
        href: "/tools/subscription-tracker",
        tier: "free-account",
      },
      {
        icon: CheckSquare,
        title: "Habit Tracker",
        description: "Build better habits with daily tracking, streaks, and analytics.",
        href: "/tools/habit-tracker",
        tier: "free-account",
      },
      {
        icon: Scale,
        title: "Unit Converter",
        description: "Convert between units of length, weight, temperature, data, time, and area.",
        href: "/tools/unit-converter",
        tier: "free",
      },
      {
        icon: Wallet,
        title: "Expense Tracker",
        description: "Track your daily expenses by category. See where your money goes.",
        href: "/tools/expense-tracker",
        tier: "free-account",
        isNew: true,
      },
      {
        icon: Keyboard,
        title: "Typing Speed Test",
        description: "Test your typing speed in WPM. Share your results and compete with friends.",
        href: "/tools/typing-test",
        tier: "free",
        isNew: true,
      },
      {
        icon: Disc3,
        title: "Decision Wheel",
        description: "Spin the wheel to make decisions. Perfect for choices, prizes, or random picks.",
        href: "/tools/decision-wheel",
        tier: "free",
        isNew: true,
      },
      {
        icon: MessageSquare,
        title: "Daily Standup Generator",
        description: "Generate formatted daily standup notes for your team. Perfect for Slack or Teams.",
        href: "/tools/daily-standup",
        tier: "free-account",
        isNew: true,
      },
      {
        icon: Timer,
        title: "Time Tracker",
        description: "Track billable hours and see how much you're earning. Perfect for freelancers.",
        href: "/tools/time-tracker",
        tier: "free-account",
        isNew: true,
      },
      {
        icon: BookOpen,
        title: "Daily Journal",
        description: "Gratitude journal with mood tracking, highlights, and reflections.",
        href: "/tools/daily-journal",
        tier: "free-account",
        isNew: true,
      },
      {
        icon: Droplets,
        title: "Water Tracker",
        description: "Track your daily water intake. Set goals, build streaks, and stay hydrated.",
        href: "/tools/water-tracker",
        tier: "free-account",
        isNew: true,
      },
      {
        icon: Target,
        title: "Focus Score",
        description: "Rate your daily productivity and track your focus over time.",
        href: "/tools/focus-score",
        tier: "free-account",
        isNew: true,
      },
      {
        icon: Receipt,
        title: "Bill Splitter",
        description: "Split bills and expenses among friends fairly.",
        href: "/tools/bill-splitter",
        tier: "free",
        isNew: true,
      },
      {
        icon: Globe,
        title: "World Clock",
        description: "Live clocks, timezone converter, and meeting planner.",
        href: "/tools/world-clock",
        tier: "free",
        isNew: true,
      },
      {
        icon: Clock,
        title: "Countdown Timer",
        description: "Beautiful countdowns to any event with themes and sharing.",
        href: "/tools/countdown-timer",
        tier: "free",
        isNew: true,
      },
      {
        icon: Type,
        title: "Text to Speech",
        description: "Convert text to speech and speech to text in your browser.",
        href: "/tools/text-to-speech",
        tier: "free",
        isNew: true,
      },
    ],
  },
  {
    id: "career",
    title: "Career",
    description: "Land your dream job and grow your network",
    icon: GraduationCap,
    iconBg: "bg-green-600",
    cardIconBg: "bg-green-600",
    tools: [
      {
        icon: Briefcase,
        title: "Job Application Tracker",
        description: "Track applications, statuses, and follow-ups. Never lose track again.",
        href: "/tools/job-tracker",
        tier: "free-account",
      },
      {
        icon: FileText,
        title: "Resume Builder",
        description: "Create professional resumes with beautiful templates. Export to PDF.",
        href: "/tools/resume-builder",
        tier: "free-account",
        isNew: true,
      },
      {
        icon: Users,
        title: "Network CRM",
        description: "Keep in touch with your professional network. Never forget a contact.",
        href: "/tools/network-crm",
        tier: "free-account",
        isNew: true,
      },
      {
        icon: ScrollText,
        title: "Cover Letter Generator",
        description: "Create professional cover letters tailored to each job application.",
        href: "/tools/cover-letter-generator",
        tier: "free-account",
        isNew: true,
      },
      {
        icon: TrendingUp,
        title: "Salary Comparison",
        description: "Compare your salary to market rates. See where you stand in your field.",
        href: "/tools/salary-comparison",
        tier: "free",
        isNew: true,
      },
      {
        icon: Compass,
        title: "Career Matcher",
        description: "Find careers that match your skills, interests, and work style preferences.",
        href: "/tools/career-matcher",
        tier: "free",
        isNew: true,
      },
    ],
  },
  {
    id: "creator",
    title: "Creator & Marketing",
    description: "Grow your audience and monetize your content",
    icon: Megaphone,
    iconBg: "bg-purple-600",
    cardIconBg: "bg-purple-600",
    tools: [
      {
        icon: Share2,
        title: "Content Repurposer",
        description: "Turn one blog post into tweets, LinkedIn posts, and more with AI.",
        href: "/tools/content-repurposer",
        tier: "premium",
      },
      {
        icon: LinkIcon,
        title: "Link in Bio",
        description: "Create a beautiful link page for your social profiles. Free forever.",
        href: "/tools/link-in-bio",
        tier: "free-account",
      },
      {
        icon: Link2,
        title: "URL Shortener",
        description: "Shorten URLs and track clicks, locations, and devices.",
        href: "/tools/url-shortener",
        tier: "free-account",
        isNew: true,
      },
      {
        icon: Mail,
        title: "Email Subject Tester",
        description: "Test your email subject lines for open rates before you send.",
        href: "/tools/email-subject-tester",
        tier: "free",
      },
      {
        icon: BarChart3,
        title: "Creator Analytics",
        description: "Unified dashboard for YouTube, Instagram, Twitter, and more.",
        href: "/tools/creator-analytics",
        tier: "premium",
        isNew: true,
      },
      {
        icon: Send,
        title: "Cold Email Writer",
        description: "Write effective cold emails that get responses. Templates for any situation.",
        href: "/tools/cold-email-writer",
        tier: "free-account",
        isNew: true,
      },
      {
        icon: AtSign,
        title: "Username Generator",
        description: "Generate unique usernames for gaming, social media, and more.",
        href: "/tools/username-generator",
        tier: "free",
        isNew: true,
      },
      {
        icon: ShoppingBag,
        title: "Product Description Generator",
        description: "Generate compelling product descriptions for e-commerce and sales.",
        href: "/tools/product-description-generator",
        tier: "free",
        isNew: true,
      },
      {
        icon: List,
        title: "Blog Outline Generator",
        description: "Create structured blog outlines for any topic. Multiple formats available.",
        href: "/tools/blog-outline-generator",
        tier: "free",
        isNew: true,
      },
      {
        icon: Instagram,
        title: "Social Caption Generator",
        description: "Generate engaging captions for Instagram, Twitter, and LinkedIn.",
        href: "/tools/social-caption-generator",
        tier: "free",
        isNew: true,
      },
      {
        icon: ClipboardList,
        title: "Meeting Notes Summarizer",
        description: "Turn messy meeting notes into structured summaries with action items.",
        href: "/tools/meeting-notes-summarizer",
        tier: "free",
        isNew: true,
      },
      {
        icon: Lightbulb,
        title: "AI Content Idea Generator",
        description: "Generate content ideas for blogs, YouTube, TikTok, and more.",
        href: "/tools/ai-content-idea-generator",
        tier: "free",
        isNew: true,
      },
      {
        icon: PenTool,
        title: "AI Prompt Generator",
        description: "Craft optimized prompts for ChatGPT, Claude, Midjourney, and more.",
        href: "/tools/ai-prompt-generator",
        tier: "free",
        isNew: true,
      },
      {
        icon: ImageIcon,
        title: "YouTube Thumbnail Downloader",
        description: "Download YouTube video thumbnails in all resolutions.",
        href: "/tools/youtube-thumbnail-downloader",
        tier: "free",
        isNew: true,
      },
    ],
  },
  {
    id: "developer",
    title: "Developer",
    description: "Tools for developers and technical users",
    icon: Braces,
    iconBg: "bg-slate-700",
    cardIconBg: "bg-slate-700",
    tools: [
      {
        icon: Braces,
        title: "JSON Formatter",
        description: "Format, validate, and minify JSON data. Perfect for API work.",
        href: "/tools/json-formatter",
        tier: "free",
      },
      {
        icon: Binary,
        title: "Base64 Encoder",
        description: "Encode text to Base64 or decode Base64 strings instantly.",
        href: "/tools/base64-encoder",
        tier: "free",
      },
      {
        icon: Hash,
        title: "Hash Generator",
        description: "Generate SHA-1, SHA-256, SHA-384, and SHA-512 hashes.",
        href: "/tools/hash-generator",
        tier: "free",
      },
      {
        icon: Link2,
        title: "URL Parser",
        description: "Parse URLs to extract protocol, hostname, path, and query params.",
        href: "/tools/url-parser",
        tier: "free",
      },
      {
        icon: Code,
        title: "Regex Tester",
        description: "Test and debug regular expressions with live highlighting and common patterns.",
        href: "/tools/regex-tester",
        tier: "free",
        isNew: true,
      },
      {
        icon: Timer,
        title: "Cron Builder",
        description: "Build and test cron expressions visually. Never get the syntax wrong again.",
        href: "/tools/cron-builder",
        tier: "free",
        isNew: true,
      },
      {
        icon: KeyRound,
        title: "JWT Decoder",
        description: "Decode and inspect JWT tokens. View header, payload, and verify expiration.",
        href: "/tools/jwt-decoder",
        tier: "free",
        isNew: true,
      },
      {
        icon: FileCode,
        title: "Markdown Editor",
        description: "Write markdown with live preview. Export to HTML or copy formatted text.",
        href: "/tools/markdown-editor",
        tier: "free",
        isNew: true,
      },
      {
        icon: Braces,
        title: "Fake Data Generator",
        description: "Generate realistic test data: names, emails, addresses, UUIDs.",
        href: "/tools/fake-data-generator",
        tier: "free",
        isNew: true,
      },
      {
        icon: FileText,
        title: "File Converter",
        description: "Convert between JSON, CSV, YAML, Markdown, HTML and more.",
        href: "/tools/file-converter",
        tier: "free",
        isNew: true,
      },
    ],
  },
  {
    id: "security",
    title: "Security & Privacy",
    description: "Protect yourself online",
    icon: Shield,
    iconBg: "bg-red-600",
    cardIconBg: "bg-red-600",
    tools: [
      {
        icon: Shield,
        title: "Password Generator",
        description: "Create strong, secure passwords with customizable options.",
        href: "/tools/password-generator",
        tier: "free",
      },
      {
        icon: Lock,
        title: "Password Checker",
        description: "Check password strength and get improvement suggestions.",
        href: "/tools/password-checker",
        tier: "free",
      },
      {
        icon: Eye,
        title: "Privacy Checker",
        description: "Analyze your browser's privacy settings and tracking vulnerabilities.",
        href: "/tools/privacy-checker",
        tier: "free",
      },
      {
        icon: Globe,
        title: "IP Lookup",
        description: "Get geolocation for any IP address including country and ISP.",
        href: "/tools/ip-lookup",
        tier: "free",
      },
      {
        icon: Gauge,
        title: "Speed Test",
        description: "Test your internet download, upload, and ping speeds.",
        href: "/tools/speed-test",
        tier: "free",
      },
    ],
  },
  {
    id: "design",
    title: "Design & Writing",
    description: "Create beautiful content",
    icon: PenTool,
    iconBg: "bg-pink-600",
    cardIconBg: "bg-pink-600",
    tools: [
      {
        icon: Palette,
        title: "Color Picker",
        description: "Pick colors and convert between HEX, RGB, HSL. Generate palettes.",
        href: "/tools/color-picker",
        tier: "free",
      },
      {
        icon: Type,
        title: "Lorem Ipsum",
        description: "Generate placeholder text for your designs and mockups.",
        href: "/tools/lorem-ipsum",
        tier: "free",
      },
      {
        icon: AlignJustify,
        title: "Text Counter",
        description: "Count characters, words, sentences. Calculate reading time.",
        href: "/tools/text-counter",
        tier: "free",
      },
      {
        icon: QrCode,
        title: "QR Generator",
        description: "Generate QR codes for URLs, text, WiFi, and more.",
        href: "/tools/qr-generator",
        tier: "free",
      },
      {
        icon: Image,
        title: "Image Compressor",
        description: "Compress images without losing quality. Perfect for web.",
        href: "/tools/image-compressor",
        tier: "free",
      },
      {
        icon: Paintbrush,
        title: "Gradient Generator",
        description: "Create beautiful CSS gradients with visual controls. Copy CSS instantly.",
        href: "/tools/gradient-generator",
        tier: "free",
        isNew: true,
      },
      {
        icon: ImageIcon,
        title: "Favicon Generator",
        description: "Create favicons from text or images. Download all sizes for your website.",
        href: "/tools/favicon-generator",
        tier: "free",
        isNew: true,
      },
      {
        icon: Tags,
        title: "Meta Tag Generator",
        description: "Generate SEO meta tags with OpenGraph and Twitter Card support.",
        href: "/tools/meta-tag-generator",
        tier: "free",
        isNew: true,
      },
      {
        icon: Palette,
        title: "Color Palette Extractor",
        description: "Extract dominant colors from any image with export options.",
        href: "/tools/color-palette-extractor",
        tier: "free",
        isNew: true,
      },
      {
        icon: Image,
        title: "Image Converter",
        description: "Convert images between PNG, JPG, WebP, BMP with resize options.",
        href: "/tools/image-converter",
        tier: "free",
        isNew: true,
      },
    ],
  },
  {
    id: "other",
    title: "Lifestyle & Fun",
    description: "More useful utilities",
    icon: Smartphone,
    iconBg: "bg-teal-600",
    cardIconBg: "bg-teal-600",
    tools: [
      {
        icon: Smartphone,
        title: "Phone Comparison",
        description: "Compare smartphone specs side by side. Make informed decisions.",
        href: "/tools/phone-comparison",
        tier: "free",
      },
      {
        icon: FileText,
        title: "Should I Upgrade?",
        description: "AI-powered calculator to determine if upgrading is worth it.",
        href: "/tools/upgrade-calculator",
        tier: "free",
      },
      {
        icon: Hourglass,
        title: "Life Progress Bar",
        description: "See your life in perspective. Track years lived, remaining time, and life stats.",
        href: "/tools/life-progress-bar",
        tier: "free",
        isNew: true,
      },
      {
        icon: Monitor,
        title: "Screen Time Calculator",
        description: "Calculate how much time you spend on screens. See the shocking lifetime impact.",
        href: "/tools/screen-time-calculator",
        tier: "free",
        isNew: true,
      },
      {
        icon: Leaf,
        title: "Carbon Footprint Calculator",
        description: "Calculate your annual carbon emissions and get tips to reduce your impact.",
        href: "/tools/carbon-footprint",
        tier: "free",
        isNew: true,
      },
      {
        icon: SquareAsterisk,
        title: "Placeholder Image Generator",
        description: "Generate placeholder images for designs and mockups. Customizable sizes and colors.",
        href: "/tools/placeholder-image",
        tier: "free",
        isNew: true,
      },
      {
        icon: LinkIcon,
        title: "WiFi QR Generator",
        description: "Generate QR codes that connect phones to your WiFi instantly.",
        href: "/tools/wifi-qr-generator",
        tier: "free",
        isNew: true,
      },
      {
        icon: Scale,
        title: "BMI & Health Calculator",
        description: "BMI, body fat, calories, and waist-to-hip ratio calculator.",
        href: "/tools/bmi-calculator",
        tier: "free",
        isNew: true,
      },
      {
        icon: ImageIcon,
        title: "Meme Generator",
        description: "Create hilarious memes with templates, custom images, and Impact text.",
        href: "/tools/meme-generator",
        tier: "free",
        isNew: true,
      },
    ],
  },
];

const TierBadge = ({ tier }: { tier: ToolTier }) => {
  if (tier === "free") {
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 font-medium">
        Free
      </Badge>
    );
  }
  if (tier === "free-account") {
    return (
      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0 font-medium">
        Free + Account
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 font-medium">
      <Crown className="w-3 h-3 mr-1" />
      Premium
    </Badge>
  );
};

export default function Tools() {
  return (
    <Layout>
      <div className="container py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-sm font-medium text-primary mb-4">
            80+ Free & Premium Tools
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Powerful <span className="text-primary">Utilities</span> for Everyone
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From productivity boosters to business tools, we've got everything you need to work smarter.
          </p>

          {/* Tier Legend */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-foreground font-medium">Free</span>
              <span className="text-muted-foreground">- No login</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-foreground font-medium">Free + Account</span>
              <span className="text-muted-foreground">- Login to save</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-foreground font-medium">Premium</span>
              <span className="text-muted-foreground">- $4.99/month</span>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-16">
          {toolCategories.map((category) => (
            <section key={category.id} id={category.id}>
              {/* Category Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                  category.iconBg
                )}>
                  <category.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{category.title}</h2>
                  <p className="text-muted-foreground text-sm">{category.description}</p>
                </div>
              </div>

              {/* Tools Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.tools.map((tool) => (
                  <Link
                    key={tool.title}
                    to={tool.isComingSoon ? "#" : tool.href}
                    onClick={(e) => tool.isComingSoon && e.preventDefault()}
                    className={cn(
                      "group relative bg-card rounded-xl border border-border p-5 transition-all duration-300",
                      tool.isComingSoon
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
                    )}
                  >
                    {/* New/Coming Soon Badge */}
                    {tool.isNew && (
                      <span className="absolute -top-2 -right-2 px-2.5 py-1 text-xs font-bold bg-green-500 text-white rounded-full shadow-lg">
                        NEW
                      </span>
                    )}
                    {tool.isComingSoon && (
                      <span className="absolute -top-2 -right-2 px-2.5 py-1 text-xs font-bold bg-purple-500 text-white rounded-full shadow-lg">
                        SOON
                      </span>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div className={cn(
                        "w-11 h-11 rounded-lg flex items-center justify-center transition-transform duration-300",
                        category.cardIconBg,
                        !tool.isComingSoon && "group-hover:scale-110"
                      )}>
                        <tool.icon className="w-5 h-5 text-white" />
                      </div>
                      <TierBadge tier={tool.tier} />
                    </div>

                    <h3 className={cn(
                      "text-lg font-semibold text-foreground mb-2 transition-colors",
                      !tool.isComingSoon && "group-hover:text-primary"
                    )}>
                      {tool.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {tool.description}
                    </p>

                    {!tool.isComingSoon && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <span className="inline-flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                          Use Tool
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center p-10 rounded-2xl bg-gradient-to-r from-primary to-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="relative">
            <Crown className="w-12 h-12 text-white mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Unlock All Premium Tools
            </h2>
            <p className="text-white/90 mb-6 max-w-lg mx-auto">
              Get unlimited access to Invoice Chaser, Client Portal, Content Repurposer, CRM, and more premium tools.
            </p>
            <Link
              to="/premium"
              className="inline-flex items-center px-8 py-3.5 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              Get Premium - $4.99/month
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
