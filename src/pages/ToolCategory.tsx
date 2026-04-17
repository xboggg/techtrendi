import { Link, useParams, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Shield, QrCode, Image, ArrowRight, Smartphone, FileText, Lock, Braces, Binary,
  Palette, Scale, Type, Gauge, Eye, Globe, Hash, Link2, AlignJustify, DollarSign,
  Calculator, Mail, Clock, CreditCard, CheckSquare, Briefcase, LinkIcon, Crown,
  Receipt, FileSignature, Users, Calendar, Zap, Building, PenTool, Share2,
  BarChart3, Megaphone, GraduationCap, Code, Timer, KeyRound, FileCode, Paintbrush,
  Keyboard, TrendingUp, Lightbulb, Disc3, Wallet, ImageIcon, Tags, ScrollText,
  Send, Hourglass, AtSign, Monitor, CircleDollarSign, PieChart, MessageSquare,
  Droplets, Target, BookOpen, Rocket, User, Leaf, Compass, SquareAsterisk,
  ShoppingBag, List, Instagram, ClipboardList, ChevronLeft, Sparkles, Star,
  ArrowUpRight, Play, Wifi, Database, Globe2, Heart, Home, Timer as TimerIcon,
  Volume2, Pipette, FileImage, Receipt as ReceiptIcon, Youtube, Wand2, ArrowRightLeft,
  Cake, Coins, HashIcon, Flame, History, ParkingCircle, PiggyBank, Percent, Banknote,
  ImagePlus, Activity, CreditCard as CreditCardIcon, Brain, Armchair, HeartHandshake, Swords,
  LayoutGrid, GanttChart, Map, Percent as PercentIcon,
  Flame as FlameIcon, MapPin, FileSearch, ShieldAlert, Layers, TrendingDown,
  Search, Sprout, Bell, Utensils, ClipboardCheck, CalendarRange, HandCoins
} from "lucide-react";
import { cn } from "@/lib/utils";

type ToolTier = "free" | "free-account" | "premium";

interface Tool {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  tier: ToolTier;
  isNew?: boolean;
  gradient: string;
}

interface CategoryData {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  bgGradient: string;
  tools: Tool[];
  illustration: string;
}

const categoriesData: Record<string, CategoryData> = {
  business: {
    id: "business",
    title: "Business & Freelancer",
    description: "Tools to run your business and manage clients",
    longDescription: "Everything you need to run a successful business - from invoicing and proposals to CRM and client management. Built for freelancers, agencies, and entrepreneurs.",
    icon: Briefcase,
    gradient: "from-blue-500 via-blue-600 to-indigo-700",
    bgGradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
    illustration: "💼",
    tools: [
      { icon: Receipt, title: "Invoice Generator", description: "Create professional invoices in minutes with customizable templates", href: "/tools/invoice-generator", tier: "free", gradient: "from-blue-500 to-indigo-600" },
      { icon: ScrollText, title: "Contract Generator", description: "Generate professional contracts, NDAs, service agreements", href: "/tools/contract-generator", tier: "free", isNew: true, gradient: "from-slate-500 to-zinc-600" },
      { icon: CircleDollarSign, title: "Pricing Calculator", description: "Calculate your freelance rates or product pricing", href: "/tools/pricing-calculator", tier: "free", isNew: true, gradient: "from-emerald-500 to-green-600" },
      { icon: PieChart, title: "ROI Calculator", description: "Calculate return on investment for business decisions", href: "/tools/roi-calculator", tier: "free", isNew: true, gradient: "from-amber-500 to-yellow-600" },
      { icon: Lightbulb, title: "AI Business Name Generator", description: "20 brandable names with domain hints and taglines", href: "/tools/business-name-generator", tier: "free", isNew: true, gradient: "from-yellow-500 to-orange-600" },
      { icon: CircleDollarSign, title: "Side Hustle Revenue Projector", description: "12-month revenue projection with charts", href: "/tools/side-hustle-calculator", tier: "free", isNew: true, gradient: "from-lime-500 to-green-600" },
      { icon: Rocket, title: "App Idea Validator", description: "AI-powered validation with market and competition scores", href: "/tools/startup-validator", tier: "free", isNew: true, gradient: "from-red-500 to-pink-600" },
      { icon: User, title: "Personal Brand Audit", description: "Audit your personal brand and online presence", href: "/tools/personal-brand-audit", tier: "free", isNew: true, gradient: "from-violet-500 to-purple-600" },
      { icon: Home, title: "Loan Calculator", description: "Calculate loan payments with charts and multi-currency support", href: "/tools/mortgage-calculator", tier: "free", isNew: true, gradient: "from-cyan-500 to-blue-600" },
      { icon: Sparkles, title: "AI Startup Name Generator", description: "Generate creative startup names with AI", href: "/tools/ai-startup-name-generator", tier: "free", isNew: true, gradient: "from-fuchsia-500 to-pink-600" },
      { icon: BarChart3, title: "AdSense Calculator", description: "Estimate your AdSense earnings potential", href: "/tools/adsense-calculator", tier: "free", isNew: true, gradient: "from-sky-500 to-blue-600" },
      { icon: Calculator, title: "Freelance Rate Calculator", description: "Calculate your ideal freelance hourly rate", href: "/tools/freelance-rate-calculator", tier: "free", isNew: true, gradient: "from-orange-500 to-amber-600" },
      { icon: Building, title: "Startup Cost Calculator", description: "Estimate total startup costs and runway", href: "/tools/startup-cost-calculator", tier: "free", isNew: true, gradient: "from-violet-500 to-purple-600" },
      { icon: PercentIcon, title: "Compound Interest Calculator", description: "See how investments grow with visual charts", href: "/tools/compound-interest", tier: "free", isNew: true, gradient: "from-green-500 to-emerald-600" },
      { icon: FlameIcon, title: "FIRE Calculator", description: "Calculate your path to financial independence", href: "/tools/fire-calculator", tier: "free", isNew: true, gradient: "from-amber-500 to-orange-600" },
      { icon: Calculator, title: "Ghana Tax Calculator", description: "PAYE + SSNIT breakdown with 2026 GRA bands", href: "/tools/ghana-tax-calculator", tier: "free", isNew: true, gradient: "from-green-600 to-emerald-700" },
      { icon: Home, title: "Rent vs Buy Calculator", description: "Compare renting vs buying property over time", href: "/tools/rent-vs-buy", tier: "free", isNew: true, gradient: "from-sky-500 to-blue-600" },
      { icon: PieChart, title: "Pay Yourself First Budget", description: "Budget planner that prioritizes savings first", href: "/tools/pay-yourself-first", tier: "free", isNew: true, gradient: "from-emerald-500 to-green-600" },
      { icon: BarChart3, title: "Variable Income Budget", description: "Budget planner for freelancers with irregular income", href: "/tools/variable-income-budget", tier: "free", isNew: true, gradient: "from-amber-500 to-orange-600" },
      { icon: Sprout, title: "Farm Input Calculator", description: "Calculate seeds, fertilizer, costs and profits", href: "/tools/farm-calculator", tier: "free", isNew: true, gradient: "from-green-600 to-emerald-700" },
      { icon: Bell, title: "Stock Price Alert", description: "Set price alerts for stocks and get notified", href: "/tools/stock-alert", tier: "free", isNew: true, gradient: "from-blue-500 to-cyan-600" },
      { icon: ClipboardCheck, title: "Startup Readiness Quiz", description: "15-question startup readiness assessment", href: "/tools/startup-readiness", tier: "free", isNew: true, gradient: "from-violet-500 to-purple-600" },
      { icon: Building, title: "Business Registration Guide", description: "AI step-by-step registration guide for Africa", href: "/tools/business-registration", tier: "free", isNew: true, gradient: "from-teal-500 to-cyan-600" },
    ],
  },
  productivity: {
    id: "productivity",
    title: "Productivity",
    description: "Boost your efficiency and stay organized",
    longDescription: "Supercharge your daily workflow with timers, trackers, and tools designed to help you focus, track habits, and accomplish more every day.",
    icon: Zap,
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    bgGradient: "from-orange-500/10 via-amber-500/5 to-transparent",
    illustration: "⚡",
    tools: [
      { icon: Calculator, title: "Meeting Cost Calculator", description: "See the real cost of meetings based on attendee salaries", href: "/tools/meeting-cost-calculator", tier: "free", isNew: true, gradient: "from-orange-500 to-red-600" },
      { icon: Clock, title: "Pomodoro Timer", description: "Stay focused with timed work sessions and breaks", href: "/tools/pomodoro-timer", tier: "free", gradient: "from-red-500 to-rose-600" },
      { icon: CreditCard, title: "Subscription Tracker", description: "Track all your subscriptions and monthly spending", href: "/tools/subscription-tracker", tier: "free", gradient: "from-purple-500 to-violet-600" },
      { icon: CheckSquare, title: "Habit Tracker", description: "Build habits with streaks, heatmap, and daily tracking", href: "/tools/habit-tracker", tier: "free", gradient: "from-green-500 to-emerald-600" },
      { icon: Scale, title: "Unit Converter", description: "Convert between units of length, weight, temperature", href: "/tools/unit-converter", tier: "free", gradient: "from-blue-500 to-indigo-600" },
      { icon: Wallet, title: "Budget Tracker", description: "Track budget vs actual spending with charts", href: "/tools/expense-tracker", tier: "free", isNew: true, gradient: "from-emerald-500 to-teal-600" },
      { icon: Keyboard, title: "Typing Speed Test", description: "Test your typing speed in WPM with friends", href: "/tools/typing-test", tier: "free", isNew: true, gradient: "from-pink-500 to-rose-600" },
      { icon: Disc3, title: "Decision Wheel", description: "Spin the wheel to make random decisions", href: "/tools/decision-wheel", tier: "free", isNew: true, gradient: "from-amber-500 to-orange-600" },
      { icon: MessageSquare, title: "Daily Standup Generator", description: "Generate formatted standup notes for your team", href: "/tools/daily-standup", tier: "free", isNew: true, gradient: "from-blue-500 to-cyan-600" },
      { icon: Timer, title: "Time Tracker", description: "Track billable hours and see your earnings", href: "/tools/time-tracker", tier: "free", isNew: true, gradient: "from-indigo-500 to-purple-600" },
      { icon: BookOpen, title: "Daily Journal", description: "Gratitude journal with mood tracking", href: "/tools/daily-journal", tier: "free", isNew: true, gradient: "from-rose-500 to-pink-600" },
      { icon: Droplets, title: "Water Tracker", description: "Track your daily water intake and build streaks", href: "/tools/water-tracker", tier: "free", isNew: true, gradient: "from-cyan-500 to-blue-600" },
      { icon: Target, title: "Focus Score", description: "Rate your daily productivity over time", href: "/tools/focus-score", tier: "free", isNew: true, gradient: "from-violet-500 to-indigo-600" },
      { icon: ReceiptIcon, title: "Bill Splitter", description: "Split bills fairly among friends with per-item assignment", href: "/tools/bill-splitter", tier: "free", isNew: true, gradient: "from-green-500 to-teal-600" },
      { icon: Globe2, title: "World Clock", description: "Track time across cities with meeting planner", href: "/tools/world-clock", tier: "free", isNew: true, gradient: "from-blue-500 to-sky-600" },
      { icon: TimerIcon, title: "Countdown Timer", description: "Beautiful flip-style countdown with themes and confetti", href: "/tools/countdown-timer", tier: "free", isNew: true, gradient: "from-purple-500 to-fuchsia-600" },
      { icon: Volume2, title: "Text to Speech", description: "Convert text to speech and speech to text", href: "/tools/text-to-speech", tier: "free", isNew: true, gradient: "from-orange-500 to-amber-600" },
      { icon: PiggyBank, title: "Savings Goal Visualizer", description: "Track multiple savings goals with visual progress", href: "/tools/savings-goal-visualizer", tier: "free", isNew: true, gradient: "from-green-500 to-emerald-600" },
      { icon: Banknote, title: "Paycheck Calculator", description: "Calculate take-home pay after taxes", href: "/tools/paycheck-calculator", tier: "free", isNew: true, gradient: "from-emerald-500 to-green-600" },
      { icon: CreditCardIcon, title: "Loan EMI Calculator", description: "Calculate loan payments with amortization", href: "/tools/loan-emi-calculator", tier: "free", isNew: true, gradient: "from-rose-500 to-pink-600" },
      { icon: TrendingUp, title: "Net Worth Tracker", description: "Track assets and liabilities over time", href: "/tools/net-worth-tracker", tier: "free", isNew: true, gradient: "from-blue-500 to-indigo-600" },
      { icon: Lightbulb, title: "Idea Parking Lot", description: "Quick capture ideas and revisit later", href: "/tools/idea-parking-lot", tier: "free", isNew: true, gradient: "from-yellow-500 to-amber-600" },
      { icon: Armchair, title: "Sitting Time Calculator", description: "Calculate health impact of desk work", href: "/tools/sitting-time-calculator", tier: "free", isNew: true, gradient: "from-red-500 to-orange-600" },
      { icon: LayoutGrid, title: "Decision Matrix", description: "Weighted scoring matrix with radar charts", href: "/tools/decision-matrix", tier: "free", isNew: true, gradient: "from-indigo-500 to-purple-600" },
      { icon: GanttChart, title: "Project Timeline", description: "Visual Gantt chart to plan and track tasks", href: "/tools/project-timeline", tier: "free", isNew: true, gradient: "from-blue-500 to-cyan-600" },
      { icon: Brain, title: "AI Concept Explainer", description: "Understand any concept at your level", href: "/tools/concept-explainer", tier: "free", isNew: true, gradient: "from-purple-500 to-violet-600" },
      { icon: BarChart3, title: "Statistics Visualizer", description: "Visualize data with mean, median, mode, and charts", href: "/tools/statistics-visualizer", tier: "free", isNew: true, gradient: "from-indigo-500 to-blue-600" },
    ],
  },
  career: {
    id: "career",
    title: "Career",
    description: "Land your dream job and grow your network",
    longDescription: "Tools to help you build a standout resume, track job applications, compare salaries, and find your perfect career path.",
    icon: GraduationCap,
    gradient: "from-emerald-500 via-green-500 to-teal-600",
    bgGradient: "from-emerald-500/10 via-green-500/5 to-transparent",
    illustration: "🎓",
    tools: [
      { icon: Briefcase, title: "Job Application Tracker", description: "Track applications, statuses, and follow-ups", href: "/tools/job-tracker", tier: "free", gradient: "from-blue-500 to-indigo-600" },
      { icon: FileText, title: "Resume Builder", description: "Create professional resumes with beautiful templates", href: "/tools/resume-builder", tier: "free", isNew: true, gradient: "from-emerald-500 to-green-600" },
      { icon: ScrollText, title: "Cover Letter Generator", description: "Create professional cover letters for applications", href: "/tools/cover-letter-generator", tier: "free", isNew: true, gradient: "from-pink-500 to-rose-600" },
      { icon: TrendingUp, title: "Salary Comparison", description: "Compare your salary to market rates", href: "/tools/salary-comparison", tier: "free", isNew: true, gradient: "from-green-500 to-teal-600" },
      { icon: Compass, title: "Career Matcher", description: "Find careers that match your skills and interests", href: "/tools/career-matcher", tier: "free", isNew: true, gradient: "from-orange-500 to-amber-600" },
      { icon: FileSearch, title: "Resume Roaster", description: "Brutally honest AI feedback with fix-it plan", href: "/tools/resume-roaster", tier: "free", isNew: true, gradient: "from-red-500 to-orange-600" },
    ],
  },
  creator: {
    id: "creator",
    title: "Creator & Marketing",
    description: "Grow your audience and monetize your content",
    longDescription: "Everything creators need to grow their audience - from social media tools and content generators to analytics and link management.",
    icon: Megaphone,
    gradient: "from-purple-500 via-violet-500 to-fuchsia-600",
    bgGradient: "from-purple-500/10 via-violet-500/5 to-transparent",
    illustration: "📣",
    tools: [
      { icon: Share2, title: "Content Repurposer", description: "Turn one blog post into tweets, LinkedIn posts, and more", href: "/tools/content-repurposer", tier: "free", gradient: "from-purple-500 to-violet-600" },
      { icon: LinkIcon, title: "Link in Bio", description: "Create a beautiful link page for your social profiles", href: "/tools/link-in-bio", tier: "free", gradient: "from-pink-500 to-rose-600" },
      { icon: Link2, title: "URL Shortener", description: "Shorten URLs and track clicks and devices", href: "/tools/url-shortener", tier: "free", isNew: true, gradient: "from-blue-500 to-indigo-600" },
      { icon: Mail, title: "Email Subject Tester", description: "Test your email subject lines for open rates", href: "/tools/email-subject-tester", tier: "free", gradient: "from-amber-500 to-orange-600" },
      { icon: BarChart3, title: "Creator Analytics", description: "Unified dashboard for YouTube, Instagram, Twitter", href: "/tools/creator-analytics", tier: "free", isNew: true, gradient: "from-green-500 to-emerald-600" },
      { icon: AtSign, title: "Username Generator", description: "Generate unique usernames for social media", href: "/tools/username-generator", tier: "free", isNew: true, gradient: "from-cyan-500 to-blue-600" },
      { icon: ShoppingBag, title: "Product Description Generator", description: "Generate compelling product descriptions", href: "/tools/product-description-generator", tier: "free", isNew: true, gradient: "from-teal-500 to-emerald-600" },
      { icon: List, title: "Blog Outline Generator", description: "Create structured blog outlines for any topic", href: "/tools/blog-outline-generator", tier: "free", isNew: true, gradient: "from-violet-500 to-purple-600" },
      { icon: Instagram, title: "Social Caption Generator", description: "Generate captions for Instagram, Twitter, LinkedIn", href: "/tools/social-caption-generator", tier: "free", isNew: true, gradient: "from-pink-500 to-fuchsia-600" },
      { icon: ClipboardList, title: "Meeting Notes Summarizer", description: "Turn messy notes into structured summaries", href: "/tools/meeting-notes-summarizer", tier: "free", isNew: true, gradient: "from-slate-500 to-zinc-600" },
      { icon: Wand2, title: "AI Prompt Improver", description: "Improve prompts with AI — 5 modes for coding, writing, and more", href: "/tools/ai-prompt-generator", tier: "free", isNew: true, gradient: "from-indigo-500 to-violet-600" },
      { icon: Lightbulb, title: "AI Content Idea Generator", description: "Generate content ideas for any platform", href: "/tools/ai-content-idea-generator", tier: "free", isNew: true, gradient: "from-amber-500 to-yellow-600" },
      { icon: Youtube, title: "YouTube Thumbnail Downloader", description: "Download thumbnails from any YouTube video", href: "/tools/youtube-thumbnail-downloader", tier: "free", isNew: true, gradient: "from-red-500 to-rose-600" },
      { icon: Flame, title: "AI Hook Generator", description: "Generate viral hooks for videos and posts", href: "/tools/hook-generator", tier: "free", isNew: true, gradient: "from-orange-500 to-red-600" },
      { icon: ImagePlus, title: "Thumbnail A/B Tester", description: "Compare thumbnails side-by-side with AI analysis", href: "/tools/thumbnail-tester", tier: "free", isNew: true, gradient: "from-purple-500 to-fuchsia-600" },
      { icon: Activity, title: "Hashtag Analyzer", description: "Get popularity and competition scores for hashtags", href: "/tools/hashtag-analyzer", tier: "free", isNew: true, gradient: "from-green-500 to-teal-600" },
      { icon: TrendingDown, title: "Viral Post Analyzer", description: "AI scores your post for viral potential", href: "/tools/viral-post-analyzer", tier: "free", isNew: true, gradient: "from-orange-500 to-red-600" },
      { icon: Youtube, title: "YouTube Title Optimizer", description: "10 high-CTR titles ranked by AI", href: "/tools/youtube-title-optimizer", tier: "free", isNew: true, gradient: "from-red-500 to-rose-600" },
      { icon: Search, title: "Blog SEO Auditor", description: "Audit blog posts for SEO with score and recommendations", href: "/tools/seo-auditor", tier: "free", isNew: true, gradient: "from-indigo-500 to-purple-600" },
      { icon: Brain, title: "AI Brain Dump Organizer", description: "Turn messy thoughts into structured outlines", href: "/tools/brain-dump", tier: "free", isNew: true, gradient: "from-violet-500 to-purple-600" },
      { icon: Target, title: "AI Hook Scorer", description: "Score your hooks for viral potential with AI", href: "/tools/hook-scorer", tier: "free", isNew: true, gradient: "from-orange-500 to-red-600" },
      { icon: CalendarRange, title: "AI Content Calendar", description: "Generate a weekly content calendar with AI", href: "/tools/content-calendar", tier: "free", isNew: true, gradient: "from-blue-500 to-indigo-600" },
      { icon: Megaphone, title: "AI Brand Pitch Generator", description: "Generate brand collaboration pitch emails", href: "/tools/brand-pitch", tier: "free", isNew: true, gradient: "from-pink-500 to-fuchsia-600" },
      { icon: HandCoins, title: "Creator Monetization Calculator", description: "Calculate earnings across platforms", href: "/tools/creator-monetization", tier: "free", isNew: true, gradient: "from-green-500 to-emerald-600" },
    ],
  },
  developer: {
    id: "developer",
    title: "Developer Tools",
    description: "Tools for developers and technical users",
    longDescription: "Essential utilities for developers - JSON formatters, regex testers, encoders, and more tools to speed up your development workflow.",
    icon: Braces,
    gradient: "from-slate-600 via-slate-700 to-zinc-800",
    bgGradient: "from-slate-600/10 via-zinc-700/5 to-transparent",
    illustration: "👨‍💻",
    tools: [
      { icon: Braces, title: "JSON Formatter", description: "Format, validate, and minify JSON data", href: "/tools/json-formatter", tier: "free", gradient: "from-slate-500 to-zinc-600" },
      { icon: Binary, title: "Base64 Encoder", description: "Encode text to Base64 or decode Base64 strings", href: "/tools/base64-encoder", tier: "free", gradient: "from-green-500 to-emerald-600" },
      { icon: Hash, title: "Hash Generator", description: "Generate SHA-1, SHA-256, SHA-384, SHA-512 hashes", href: "/tools/hash-generator", tier: "free", gradient: "from-blue-500 to-indigo-600" },
      { icon: Link2, title: "URL Parser", description: "Parse URLs to extract protocol, hostname, path", href: "/tools/url-parser", tier: "free", gradient: "from-purple-500 to-violet-600" },
      { icon: Code, title: "Regex Tester", description: "Test and debug regular expressions with highlighting", href: "/tools/regex-tester", tier: "free", isNew: true, gradient: "from-orange-500 to-red-600" },
      { icon: Timer, title: "Cron Builder", description: "Build and test cron expressions visually", href: "/tools/cron-builder", tier: "free", isNew: true, gradient: "from-cyan-500 to-blue-600" },
      { icon: KeyRound, title: "JWT Decoder", description: "Decode and inspect JWT tokens", href: "/tools/jwt-decoder", tier: "free", isNew: true, gradient: "from-yellow-500 to-amber-600" },
      { icon: FileCode, title: "Markdown Editor", description: "Write markdown with live preview", href: "/tools/markdown-editor", tier: "free", isNew: true, gradient: "from-pink-500 to-rose-600" },
      { icon: Database, title: "Fake Data Generator", description: "Generate realistic test data in multiple formats", href: "/tools/fake-data-generator", tier: "free", isNew: true, gradient: "from-teal-500 to-emerald-600" },
      { icon: ArrowRightLeft, title: "File Converter", description: "Convert between JSON, CSV, YAML, Markdown formats", href: "/tools/file-converter", tier: "free", isNew: true, gradient: "from-emerald-500 to-green-600" },
      { icon: Layers, title: "AI Tech Stack Recommender", description: "Get AI-powered stack recommendations", href: "/tools/tech-stack-recommender", tier: "free", isNew: true, gradient: "from-violet-500 to-purple-600" },
    ],
  },
  security: {
    id: "security",
    title: "Security & Privacy",
    description: "Protect yourself online",
    longDescription: "Keep your digital life secure with password generators, privacy checkers, and security tools that help protect your online presence.",
    icon: Shield,
    gradient: "from-red-500 via-rose-500 to-pink-600",
    bgGradient: "from-red-500/10 via-rose-500/5 to-transparent",
    illustration: "🛡️",
    tools: [
      { icon: Shield, title: "Password Generator", description: "Create strong, secure passwords with options", href: "/tools/password-generator", tier: "free", gradient: "from-red-500 to-rose-600" },
      { icon: Lock, title: "Password Analyzer", description: "Real-time strength analysis with entropy, crack time, and suggestions", href: "/tools/password-checker", tier: "free", gradient: "from-orange-500 to-red-600" },
      { icon: Eye, title: "Privacy Checker", description: "Analyze your browser's privacy settings", href: "/tools/privacy-checker", tier: "free", gradient: "from-purple-500 to-violet-600" },
      { icon: Globe, title: "IP Lookup", description: "Get geolocation for any IP address", href: "/tools/ip-lookup", tier: "free", gradient: "from-blue-500 to-indigo-600" },
      { icon: Gauge, title: "Speed Test", description: "Test your internet download, upload, and ping", href: "/tools/speed-test", tier: "free", gradient: "from-green-500 to-emerald-600" },
      { icon: ShieldAlert, title: "Cybersecurity Risk Scorecard", description: "15-question personal security assessment", href: "/tools/cyber-risk-scorecard", tier: "free", isNew: true, gradient: "from-cyan-500 to-blue-600" },
      { icon: ShieldAlert, title: "Ghana Scam Analyzer", description: "AI-powered scam message detection for Ghana", href: "/tools/scam-analyzer", tier: "free", isNew: true, gradient: "from-red-500 to-rose-600" },
      { icon: Target, title: "Phishing or Real? Quiz", description: "10-question quiz — spot Ghana scam messages", href: "/tools/phishing-quiz", tier: "free", isNew: true, gradient: "from-orange-500 to-amber-600" },
      { icon: MessageSquare, title: "WhatsApp Security Audit", description: "12-question WhatsApp settings audit", href: "/tools/whatsapp-audit", tier: "free", isNew: true, gradient: "from-green-500 to-emerald-600" },
      { icon: Lock, title: "Password Strength Analyzer", description: "Ghana-specific password analysis", href: "/tools/password-strength", tier: "free", isNew: true, gradient: "from-purple-500 to-violet-600" },
      { icon: Shield, title: "Incident Response Guide", description: "Step-by-step plan when you've been hacked", href: "/tools/incident-response", tier: "free", isNew: true, gradient: "from-red-600 to-orange-600" },
    ],
  },
  design: {
    id: "design",
    title: "Design & Writing",
    description: "Create beautiful content",
    longDescription: "Tools for designers and content creators - from color pickers and gradient generators to image compressors and text utilities.",
    icon: PenTool,
    gradient: "from-pink-500 via-rose-400 to-red-400",
    bgGradient: "from-pink-500/10 via-rose-400/5 to-transparent",
    illustration: "🎨",
    tools: [
      { icon: Palette, title: "Color Picker", description: "Pick colors and convert between HEX, RGB, HSL", href: "/tools/color-picker", tier: "free", gradient: "from-pink-500 to-rose-600" },
      { icon: Type, title: "Lorem Ipsum", description: "Generate placeholder text for your designs", href: "/tools/lorem-ipsum", tier: "free", gradient: "from-purple-500 to-violet-600" },
      { icon: AlignJustify, title: "Text Counter", description: "Count characters, words, sentences", href: "/tools/text-counter", tier: "free", gradient: "from-blue-500 to-indigo-600" },
      { icon: QrCode, title: "QR Generator", description: "Generate QR codes for URLs, text, WiFi", href: "/tools/qr-generator", tier: "free", gradient: "from-slate-500 to-zinc-600" },
      { icon: Image, title: "Image Compressor", description: "Compress images without losing quality", href: "/tools/image-compressor", tier: "free", gradient: "from-green-500 to-emerald-600" },
      { icon: Paintbrush, title: "Gradient Generator", description: "Create beautiful CSS gradients with visual controls", href: "/tools/gradient-generator", tier: "free", isNew: true, gradient: "from-orange-500 to-red-600" },
      { icon: ImageIcon, title: "Favicon Generator", description: "Create favicons from text or images", href: "/tools/favicon-generator", tier: "free", isNew: true, gradient: "from-amber-500 to-yellow-600" },
      { icon: Tags, title: "Meta Tag Generator", description: "Generate SEO meta tags with OpenGraph support", href: "/tools/meta-tag-generator", tier: "free", isNew: true, gradient: "from-cyan-500 to-blue-600" },
      { icon: Pipette, title: "Color Palette Extractor", description: "Extract color palettes from any image", href: "/tools/color-palette-extractor", tier: "free", isNew: true, gradient: "from-rose-500 to-pink-600" },
      { icon: FileImage, title: "Image Converter", description: "Convert images between PNG, JPG, WebP, BMP with resize", href: "/tools/image-converter", tier: "free", isNew: true, gradient: "from-indigo-500 to-blue-600" },
    ],
  },
  other: {
    id: "other",
    title: "Lifestyle & Fun",
    description: "More useful utilities",
    longDescription: "Fun and useful tools for everyday life - track your screen time, calculate your carbon footprint, or see your life in perspective.",
    icon: Smartphone,
    gradient: "from-teal-500 via-cyan-500 to-sky-500",
    bgGradient: "from-teal-500/10 via-cyan-500/5 to-transparent",
    illustration: "🌟",
    tools: [
      { icon: Smartphone, title: "Phone Comparison", description: "Compare smartphone specs side by side", href: "/tools/phone-comparison", tier: "free", gradient: "from-slate-500 to-zinc-600" },
      { icon: FileText, title: "Should I Upgrade?", description: "AI-powered calculator to determine if upgrading is worth it", href: "/tools/upgrade-calculator", tier: "free", gradient: "from-blue-500 to-indigo-600" },
      { icon: Hourglass, title: "Life Progress Bar", description: "See your life in perspective with fascinating stats", href: "/tools/life-progress-bar", tier: "free", isNew: true, gradient: "from-purple-500 to-violet-600" },
      { icon: Monitor, title: "Screen Time Calculator", description: "Calculate how much time you spend on screens", href: "/tools/screen-time-calculator", tier: "free", isNew: true, gradient: "from-red-500 to-rose-600" },
      { icon: Leaf, title: "Carbon Footprint Calculator", description: "Detailed CO₂ breakdown with reduction tips", href: "/tools/carbon-footprint", tier: "free", isNew: true, gradient: "from-green-500 to-emerald-600" },
      { icon: SquareAsterisk, title: "Placeholder Image Generator", description: "Generate placeholder images for designs", href: "/tools/placeholder-image", tier: "free", isNew: true, gradient: "from-amber-500 to-orange-600" },
      { icon: Wifi, title: "WiFi QR Generator", description: "Generate QR codes that connect phones to your WiFi", href: "/tools/wifi-qr-generator", tier: "free", isNew: true, gradient: "from-blue-500 to-cyan-600" },
      { icon: Heart, title: "BMI & Health Calculator", description: "BMI, body fat, calories, and waist-to-hip ratio", href: "/tools/bmi-calculator", tier: "free", isNew: true, gradient: "from-rose-500 to-pink-600" },
      { icon: ImageIcon, title: "Meme Generator", description: "Create hilarious memes with templates and custom images", href: "/tools/meme-generator", tier: "free", isNew: true, gradient: "from-yellow-500 to-orange-600" },
      { icon: Coins, title: "Currency Converter", description: "Convert 55+ currencies with real-time rates", href: "/tools/currency-converter", tier: "free", isNew: true, gradient: "from-green-500 to-emerald-600" },
      { icon: History, title: "This Day in History", description: "Discover what happened on any date in history", href: "/tools/this-day-in-history", tier: "free", isNew: true, gradient: "from-amber-500 to-orange-600" },
      { icon: HeartHandshake, title: "Compatibility Calculator", description: "Fun name and zodiac compatibility checker", href: "/tools/compatibility-calculator", tier: "free", isNew: true, gradient: "from-red-500 to-pink-600" },
      { icon: Brain, title: "Tech Trivia Generator", description: "Test your knowledge with AI trivia questions", href: "/tools/tech-trivia-generator", tier: "free", isNew: true, gradient: "from-purple-500 to-violet-600" },
      { icon: Swords, title: "Math Tug of War", description: "Multiplayer math battle — answer questions to pull the rope", href: "/tools/math-tug-of-war", tier: "free", isNew: true, gradient: "from-blue-500 to-orange-600" },
      { icon: MapPin, title: "Cost of Living Comparator", description: "Compare cost of living between 20 cities", href: "/tools/cost-of-living", tier: "free", isNew: true, gradient: "from-orange-500 to-red-600" },
      { icon: Heart, title: "Couples Finance Quiz", description: "Financial compatibility quiz for couples", href: "/tools/couples-finance", tier: "free", isNew: true, gradient: "from-pink-500 to-rose-600" },
      { icon: Utensils, title: "Meal Nutrition Analyzer", description: "AI nutrition breakdown of your meals", href: "/tools/nutrition-analyzer", tier: "free", isNew: true, gradient: "from-green-500 to-teal-600" },
    ],
  },
};

const TierBadge = ({ tier }: { tier: ToolTier }) => {
  if (tier === "free") {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
        Free
      </span>
    );
  }
  if (tier === "free-account") {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        Free + Account
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
      <Crown className="w-3 h-3" />
      Premium
    </span>
  );
};

export default function ToolCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  const category = categoryId ? categoriesData[categoryId] : null;

  if (!category) {
    return <Navigate to="/tools" replace />;
  }

  return (
    <Layout>
      <SEOHead
        title={`${category.title} Tools - Free Online Utilities | TechTrendi`}
        description={category.longDescription}
        canonicalUrl={`https://techtrendi.com/tools/${category.id}`}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className={cn("absolute inset-0 bg-gradient-to-br", category.bgGradient)} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        {/* Animated Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={cn(
            "absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-30 animate-pulse",
            `bg-gradient-to-br ${category.gradient}`
          )} />
          <div className={cn(
            "absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-20 animate-pulse delay-1000",
            `bg-gradient-to-br ${category.gradient}`
          )} />
        </div>

        <div className="container relative py-16 md:py-24">
          {/* Back Link */}
          <Link
            to="/tools"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>All Tools</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center gap-8">
            {/* Icon */}
            <div
              className={cn(
                "w-24 h-24 md:w-32 md:h-32 rounded-3xl flex items-center justify-center shadow-2xl",
                "bg-gradient-to-br",
                category.gradient
              )}
            >
              <category.icon className="w-12 h-12 md:w-16 md:h-16 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-4xl md:text-5xl font-black text-foreground">
                  {category.title}
                </h1>
                <span className="text-5xl">{category.illustration}</span>
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl">
                {category.longDescription}
              </p>
              <div className="flex items-center gap-4 mt-6">
                <span className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold text-white",
                  `bg-gradient-to-r ${category.gradient}`
                )}>
                  {category.tools.length} Tools Available
                </span>
                <span className="text-sm text-muted-foreground">
                  {category.tools.filter(t => t.tier === "free").length} completely free
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.tools.map((tool, index) => (
              <Link
                key={tool.title}
                to={tool.href}
                className="group relative"
                onMouseEnter={() => setHoveredTool(tool.title)}
                onMouseLeave={() => setHoveredTool(null)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn(
                  "relative h-full overflow-hidden rounded-2xl border border-border/50 bg-card p-6",
                  "transition-all duration-500 ease-out",
                  "hover:shadow-2xl hover:-translate-y-2 hover:border-transparent",
                  hoveredTool === tool.title && "shadow-2xl -translate-y-2"
                )}>
                  {/* Gradient Border on Hover */}
                  <div className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500",
                    "bg-gradient-to-r p-[1px]",
                    tool.gradient,
                    hoveredTool === tool.title && "opacity-100"
                  )}>
                    <div className="absolute inset-[1px] rounded-2xl bg-card" />
                  </div>

                  {/* Content */}
                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      {/* Icon with Gradient */}
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center",
                        "bg-gradient-to-br shadow-lg",
                        tool.gradient,
                        "transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                      )}>
                        <tool.icon className="w-7 h-7 text-white" />
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2">
                        {tool.isNew && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500 text-white uppercase tracking-wider animate-pulse">
                            New
                          </span>
                        )}
                        <TierBadge tier={tool.tier} />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {tool.title}
                    </h3>

                    {/* Description */}
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      {tool.description}
                    </p>

                    {/* Action */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <span className="text-primary font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                        <Play className="w-4 h-4" />
                        Use Tool
                      </span>
                      <ArrowUpRight className={cn(
                        "w-5 h-5 text-muted-foreground transition-all duration-300",
                        "group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1"
                      )} />
                    </div>
                  </div>

                  {/* Shine Effect */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none",
                    "bg-gradient-to-r from-transparent via-white/5 to-transparent",
                    "-translate-x-full group-hover:translate-x-full group-hover:opacity-100",
                    "transition-transform duration-1000"
                  )} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Other Categories */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            Explore Other Categories
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {Object.values(categoriesData)
              .filter(cat => cat.id !== category.id)
              .map(cat => (
                <Link
                  key={cat.id}
                  to={`/tools/${cat.id}`}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 rounded-xl border border-border bg-card",
                    "hover:border-primary/50 hover:shadow-lg transition-all duration-300",
                    "hover:-translate-y-1"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    "bg-gradient-to-br",
                    cat.gradient
                  )}>
                    <cat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{cat.title}</div>
                    <div className="text-xs text-muted-foreground">{cat.tools.length} tools</div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
