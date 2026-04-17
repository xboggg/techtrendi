import { useState } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  Shield, Download, FileText, BookOpen, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, Lock, Smartphone, Wifi, ShoppingCart,
  Users, Heart, Briefcase, Brain, Eye, Zap, Star, ArrowRight,
  MessageSquare, Phone, CreditCard, Globe, Award, Clock,
  ChevronRight, ExternalLink, BadgeCheck
} from "lucide-react";

const SELAR_URL = "https://selar.com/z3al17i0f5";

// ─── Chapter data ───────────────────────────────────────────────
const chapters = [
  { num: "Intro", title: "Why Cybercriminals Want You (And What You Can Do About It)" },
  { num: "1", title: "The Invisible War: Understanding Cybercrime in the Modern World" },
  { num: "2", title: "Inside the Mind of a Hacker: The Psychology Behind Cyber Attacks" },
  { num: "3", title: "Phishing: How to Spot the Most Dangerous Emails, Texts, and Messages" },
  { num: "4", title: "Social Engineering: When Hackers Use Trust as a Weapon" },
  { num: "5", title: "Passwords: Your First and Most Important Line of Defence" },
  { num: "6", title: "Your Smartphone Is a Goldmine: How to Lock It Down" },
  { num: "7", title: "Public WiFi: The Hidden Danger You Connect to Every Day" },
  { num: "8", title: "Online Shopping: How to Buy Safely Without Getting Scammed" },
  { num: "9", title: "Social Media: Protecting Your Life from Digital Predators" },
  { num: "10", title: "Mobile Money and Banking: Keeping Your Money Safe in Ghana" },
  { num: "11", title: "Identity Theft: How Criminals Steal Your Name and Ruin Your Life" },
  { num: "12", title: "Malware, Ransomware, and Viruses: The Silent Invaders" },
  { num: "13", title: "The 25 Most Dangerous Scams Targeting Ghanaians Right Now" },
  { num: "14", title: "Cyber Safety for Children and Teenagers" },
  { num: "15", title: "Workplace Cybersecurity: Protecting Your Organisation and Your Job" },
  { num: "16", title: "Cyber Safety for Small Business Owners" },
  { num: "17", title: "Romance Scams and Online Dating Fraud" },
  { num: "18", title: "Fake News, Deepfakes, and Misinformation" },
  { num: "19", title: "What to Do If You Get Hacked: Your Emergency Response Guide" },
  { num: "20", title: "Building a Lifetime of Cyber Safety" },
  { num: "End", title: "Think Before You Click: The Habit That Changes Everything" },
  { num: "Bonus", title: "The Cyber Safety Toolkit" },
  { num: "A", title: "Real Scam Messages: Learn to Spot Them" },
  { num: "B", title: "Your MoMo Security Checklist" },
];

// ─── Scam teaser data (real from the book) ──────────────────────
const scamTeasers = [
  {
    type: "WhatsApp",
    label: "WhatsApp OTP Hijack",
    message: "Hello Abena, please I need ur help. I mistakenly sent a 6-digit code to ur number. Can u pls forward it to me? It's very urgent. Thank u so much, God bless.",
    chapter: 6,
    danger: "Within minutes, Abena lost access to her WhatsApp. The scammer used her account to request money from all her contacts.",
  },
  {
    type: "SMS",
    label: "Boss/CEO Fraud",
    message: "Hello Daniel, this is Director Mensah. I am in an important meeting right now and I cannot make calls. Kindly buy me 5 pieces MTN scratch cards of GHS 50 each and send the PIN codes here. I will reimburse you immediately after the meeting. It is very urgent.",
    chapter: 7,
    danger: "Daniel lost GHS 250. His Director never sent that message. The scammer used his boss's name and photo from the ministry website.",
  },
  {
    type: "Social Media",
    label: "Fake Job Offer",
    message: "URGENT RECRUITMENT!!! Shell Ghana / Tullow Oil is hiring! No experience needed. Salary: GHS 1,500/DAY. Positions: 50. WhatsApp your CV + Ghana Card photo to: +233XXXXXXXXX. Registration fee: GHS 200 only. Limited slots!!",
    chapter: 8,
    danger: "Victims lose the registration fee AND their Ghana Card details are sold on the dark web for identity theft.",
  },
];

// ─── What you'll learn items ────────────────────────────────────
const learnings = [
  { icon: Brain, text: "How cybercriminals think and choose their victims" },
  { icon: Eye, text: "How to spot phishing emails, texts, and fake websites instantly" },
  { icon: CreditCard, text: "How to protect your MoMo and bank accounts from fraud" },
  { icon: Lock, text: "Password security that actually works in real life" },
  { icon: Smartphone, text: "Smartphone and public WiFi safety essentials" },
  { icon: ShoppingCart, text: "Online shopping without getting scammed" },
  { icon: Users, text: "Social media protection for you and your family" },
  { icon: Shield, text: "Cyber safety for your children and teenagers" },
  { icon: Briefcase, text: "Workplace cybersecurity for government and private sector" },
  { icon: AlertTriangle, text: "What to do if you get hacked — your emergency plan" },
  { icon: Zap, text: "The 25 most dangerous scams in Ghana right now — exposed" },
  { icon: CheckCircle2, text: "Complete Cyber Safety Toolkit with checklists and action plans" },
];

// ─── Stats ──────────────────────────────────────────────────────
const stats = [
  { icon: AlertTriangle, value: "2x", label: "Cyber fraud losses doubled between 2024-2025" },
  { icon: CreditCard, value: "GHS Billions", label: "MoMo fraud costs across Africa annually" },
  { icon: MessageSquare, value: "90%", label: "Of cyber attacks start with a phishing message" },
  { icon: Eye, value: "Unreported", label: "Most victims never report the crime" },
];

// ─── Testimonials (placeholder) ─────────────────────────────────
const testimonials = [
  { quote: "I almost fell for a MoMo scam last month. After reading this book, I can now spot them instantly. Every Ghanaian needs this.", name: "Kwame A.", role: "Teacher, Kumasi" },
  { quote: "I bought this for my entire family. The chapter on children's safety alone is worth ten times the price.", name: "Ama D.", role: "Mother & Entrepreneur, Accra" },
  { quote: "As an HR manager, I have shared this with my whole team. The workplace cybersecurity chapter is gold.", name: "Francis O.", role: "HR Manager, Takoradi" },
];

// ─── FAQ ────────────────────────────────────────────────────────
const faqs = [
  { q: "What format is the ebook?", a: "PDF format — readable on any phone, tablet, laptop, or desktop computer." },
  { q: "Is this book only for tech people?", a: "Absolutely not. This book is written in plain, everyday language for everyone — students, parents, workers, retirees, business owners. No technical background needed." },
  { q: "Is this book only for Ghanaians?", a: "It was written with Ghana in mind (MoMo, GES, SSNIT scams, etc.) but the cybersecurity principles apply to anyone, anywhere in the world." },
  { q: "How do I download after purchase?", a: "You receive an instant download link immediately after payment on Selar. The ebook is delivered to your email as well." },
  { q: "Can I read this on my phone?", a: "Yes. The PDF is optimised for reading on any device — phone, tablet, or computer." },
  { q: "Is there a refund policy?", a: "Due to the digital nature of this product, refunds are not available once the ebook has been downloaded." },
  { q: "How many pages is the book?", a: "195 pages of actionable cybersecurity knowledge, including 20 chapters, a bonus toolkit, real scam messages appendix, and MoMo security checklist." },
];

// ─── Component ──────────────────────────────────────────────────
export default function ThinkBeforeYouClick() {
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const visibleChapters = showAllChapters ? chapters : chapters.slice(0, 10);

  return (
    <>
      <SEOHead
        title="Think Before You Click — Cyber Safety Ebook for Ghana | TechTrendi"
        description="The complete guide to staying safe online in Ghana. Learn to protect your MoMo, passwords, and family from scams. 20 chapters, 25 real scams exposed. 195 pages."
        canonical="/books/think-before-you-click"
        image="/images/books/think-before-you-click-og.jpg"
        type="product"
        author="Edmund Adjekum"
        keywords={["cyber safety", "Ghana", "ebook", "MoMo fraud", "phishing", "online scams", "cybersecurity", "Think Before You Click", "Edmund Adjekum", "TechTrendi"]}
      />

      <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

        {/* ─── MINIMAL HEADER ─────────────────────────────── */}
        <header className="bg-[#1B365D] border-b border-[#C9A227]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <img src="/logo-icon.png" alt="TechTrendi" className="w-8 h-8" />
              <span className="text-white font-bold text-lg group-hover:text-[#C9A227] transition-colors">TechTrendi</span>
            </Link>
            <Link to="/" className="text-white/70 hover:text-[#C9A227] text-sm transition-colors flex items-center gap-1">
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to TechTrendi
            </Link>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════
            SECTION 1 — HERO
        ═══════════════════════════════════════════════════ */}
        <section className="relative bg-[#1B365D] overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#C9A227]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#C9A227]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEiIGZpbGw9InJnYmEoMjAxLDE2MiwzOSwwLjA3KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Book Cover */}
              <div className="flex justify-center lg:justify-start order-2 lg:order-1">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-[#C9A227]/30 to-transparent rounded-2xl blur-2xl" />
                  <img
                    src="/images/books/think-before-you-click-cover.png"
                    alt="Think Before You Click — The Simple Guide to Cyber Safety for Everyday People, Ghana Edition by Edmund Adjekum"
                    className="relative w-[280px] sm:w-[320px] md:w-[360px] rounded-lg shadow-2xl shadow-black/50 hover:scale-[1.02] transition-transform duration-500"
                  />
                  {/* Floating badge */}
                  <div className="absolute -top-3 -right-3 bg-[#C9A227] text-[#1B365D] font-bold text-xs px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                    NEW RELEASE
                  </div>
                </div>
              </div>

              {/* Hero Text */}
              <div className="order-1 lg:order-2 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-[#C9A227]/15 border border-[#C9A227]/30 rounded-full px-4 py-1.5 mb-6">
                  <Shield className="w-4 h-4 text-[#C9A227]" />
                  <span className="text-[#C9A227] text-sm font-semibold tracking-wide uppercase">The Ghana Edition</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-4">
                  Think Before<br />
                  <span className="text-[#C9A227]">You Click</span>
                </h1>

                <p className="text-lg sm:text-xl text-white/80 mb-6 max-w-xl">
                  The Simple Guide to Cyber Safety for Everyday People
                </p>

                <p className="text-white/60 text-sm mb-8">
                  by <span className="text-white/90 font-medium">Edmund Adjekum</span> &bull; A TechTrendi Publication
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-3 justify-center lg:justify-start mb-8">
                  <span className="text-white/40 line-through text-xl">GHS 250</span>
                  <span className="text-[#C9A227] text-4xl font-black">GHS 100</span>
                  <span className="bg-red-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase">60% Off</span>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                  <a
                    href={SELAR_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-[#C9A227] hover:bg-[#D4AF37] text-white font-bold px-8 py-4 rounded-xl text-lg shadow-lg shadow-[#C9A227]/30 hover:shadow-[#C9A227]/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Buy Now — GHS 100
                    <ExternalLink className="w-5 h-5" />
                  </a>
                  <a
                    href="#chapters"
                    className="inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:border-[#C9A227] text-white hover:text-[#C9A227] font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-300"
                  >
                    <BookOpen className="w-5 h-5" />
                    See What is Inside
                  </a>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-white/60 text-sm">
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-[#C9A227]" />
                    Instant Download
                  </span>
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#C9A227]" />
                    PDF Format
                  </span>
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#C9A227]" />
                    195 Pages
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="white" />
            </svg>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            SECTION 2 — THE PROBLEM
        ═══════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <span className="inline-flex items-center gap-2 text-red-600 font-semibold text-sm uppercase tracking-wider mb-4">
                <AlertTriangle className="w-4 h-4" />
                The Reality
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-[#1B365D] mb-6">
                Ghanaians Are Losing Millions<br className="hidden sm:block" /> to Online Scams
              </h2>
              <p className="text-[#2D2D2D]/70 text-lg leading-relaxed">
                MoMo fraud. WhatsApp scams. Fake job offers. Phishing attacks. Romance scams.
                Investment fraud. Every day, ordinary Ghanaians lose their hard-earned money to
                criminals who have made online theft their full-time profession. The most dangerous
                myth is believing <em>"it will not happen to me."</em>
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="relative bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-2xl p-6 text-center group hover:shadow-lg hover:shadow-red-100/50 transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                    <stat.icon className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="text-2xl font-black text-[#1B365D] mb-2">{stat.value}</div>
                  <p className="text-[#2D2D2D]/60 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-[#1B365D] font-semibold text-lg">
                You do not need to be a victim. You just need the right knowledge.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            SECTION 3 — WHAT YOU WILL LEARN
        ═══════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 text-[#C9A227] font-semibold text-sm uppercase tracking-wider mb-4">
                <BookOpen className="w-4 h-4" />
                Inside the Book
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-[#1B365D] mb-4">
                What This Book Teaches You
              </h2>
              <p className="text-[#2D2D2D]/60 max-w-2xl mx-auto">
                195 pages of practical, no-jargon cybersecurity knowledge written specifically for everyday people in Ghana.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {learnings.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 bg-white rounded-xl p-5 border border-gray-100 hover:border-[#C9A227]/30 hover:shadow-md transition-all duration-300 group"
                >
                  <div className="shrink-0 w-10 h-10 bg-[#1B365D]/5 group-hover:bg-[#C9A227]/10 rounded-lg flex items-center justify-center transition-colors">
                    <item.icon className="w-5 h-5 text-[#1B365D] group-hover:text-[#C9A227] transition-colors" />
                  </div>
                  <p className="text-[#2D2D2D] font-medium text-[15px] leading-snug">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            SECTION 4 — BOOK CONTENTS (Chapters)
        ═══════════════════════════════════════════════════ */}
        <section id="chapters" className="py-16 md:py-24 bg-white scroll-mt-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-[#1B365D] mb-4">
                Full Table of Contents
              </h2>
              <p className="text-[#2D2D2D]/60">
                20 chapters + Bonus Toolkit + Appendices — everything you need to stay safe online.
              </p>
            </div>

            <div className="space-y-2">
              {visibleChapters.map((ch, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-[#1B365D]/[0.03] transition-colors group"
                >
                  <div className="shrink-0 w-12 h-12 bg-[#1B365D] text-white rounded-xl flex items-center justify-center text-sm font-bold group-hover:bg-[#C9A227] transition-colors">
                    {ch.num === "Intro" ? "I" : ch.num === "End" ? "C" : ch.num === "Bonus" ? "B+" : ch.num}
                  </div>
                  <div>
                    <span className="text-[#2D2D2D]/40 text-xs font-medium uppercase tracking-wider">
                      {ch.num === "Intro" ? "Introduction" : ch.num === "End" ? "Conclusion" : ch.num === "Bonus" ? "Bonus Section" : ch.num === "A" || ch.num === "B" ? `Appendix ${ch.num}` : `Chapter ${ch.num}`}
                    </span>
                    <p className="text-[#2D2D2D] font-semibold text-[15px]">{ch.title}</p>
                  </div>
                </div>
              ))}
            </div>

            {!showAllChapters && (
              <button
                onClick={() => setShowAllChapters(true)}
                className="mt-6 mx-auto flex items-center gap-2 text-[#C9A227] hover:text-[#D4AF37] font-semibold transition-colors"
              >
                Show all {chapters.length} sections
                <ChevronDown className="w-5 h-5" />
              </button>
            )}
            {showAllChapters && (
              <button
                onClick={() => setShowAllChapters(false)}
                className="mt-6 mx-auto flex items-center gap-2 text-[#C9A227] hover:text-[#D4AF37] font-semibold transition-colors"
              >
                Show less
                <ChevronUp className="w-5 h-5" />
              </button>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            SECTION 5 — CAN YOU SPOT THE SCAM?
        ═══════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 bg-[#1B365D] relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEiIGZpbGw9InJnYmEoMjAxLDE2MiwzOSwwLjA3KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 text-red-400 font-semibold text-sm uppercase tracking-wider mb-4">
                <AlertTriangle className="w-4 h-4" />
                Real Scams From The Book
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                Can You Spot the Scam?
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                These are real scam messages targeting Ghanaians every day. Could you tell they were fake?
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {scamTeasers.map((scam, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-[#C9A227]/30 transition-all duration-300">
                  {/* Phone header */}
                  <div className="bg-white/10 px-4 py-3 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${scam.type === "WhatsApp" ? "bg-green-400" : scam.type === "SMS" ? "bg-blue-400" : "bg-purple-400"}`} />
                    <span className="text-white/80 text-xs font-medium">{scam.type}</span>
                    <span className="ml-auto text-white/40 text-xs">{scam.label}</span>
                  </div>
                  {/* Message bubble */}
                  <div className="p-4">
                    <div className="bg-white/10 rounded-2xl rounded-tl-sm p-4 mb-4">
                      <p className="text-white/90 text-sm leading-relaxed italic">"{scam.message}"</p>
                    </div>
                    {/* Danger reveal */}
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                      <p className="text-red-300 text-xs leading-relaxed">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        {scam.danger}
                      </p>
                    </div>
                    <p className="text-[#C9A227] text-xs font-semibold flex items-center gap-1">
                      Learn to protect yourself in Chapter {scam.chapter}
                      <ChevronRight className="w-3 h-3" />
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-white/80 text-lg font-medium mb-6">
                The book exposes <span className="text-[#C9A227] font-bold">25 real scams</span> targeting Ghanaians right now — with exact scripts criminals use.
              </p>
              <a
                href={SELAR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#C9A227] hover:bg-[#D4AF37] text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-[#C9A227]/30 hover:shadow-[#C9A227]/50 transition-all duration-300 hover:scale-[1.02]"
              >
                Protect Yourself — Get the Book
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            SECTION 6 — ABOUT THE AUTHOR
        ═══════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-[280px_1fr] gap-10 items-center">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-br from-[#C9A227]/20 to-[#1B365D]/20 rounded-2xl blur-xl" />
                  <img
                    src="/images/books/author-edmund-adjekum.jpg"
                    alt="Edmund Adjekum — Author"
                    className="relative w-56 h-56 md:w-64 md:h-64 rounded-2xl object-cover shadow-xl"
                  />
                </div>
              </div>
              <div>
                <span className="text-[#C9A227] font-semibold text-sm uppercase tracking-wider mb-2 block">About the Author</span>
                <h2 className="text-3xl font-black text-[#1B365D] mb-4">Edmund Adjekum</h2>
                <div className="space-y-4 text-[#2D2D2D]/70 leading-relaxed">
                  <p>
                    Edmund Adjekum is an IT professional and cybersecurity advocate based in Accra, Ghana.
                    He works in the public sector and is the founder of <a href="https://techtrendi.com" className="text-[#C9A227] font-medium hover:underline">TechTrendi</a>,
                    a technology education platform helping everyday people stay safe, productive, and informed in the digital age.
                  </p>
                  <p>
                    This book was born from watching colleagues, friends, and family members fall victim to scams that could
                    have been prevented with the right knowledge. Every chapter is informed by real threats facing Ghanaians today.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 mt-6">
                  <span className="inline-flex items-center gap-1.5 bg-[#1B365D]/5 text-[#1B365D] text-xs font-medium px-3 py-1.5 rounded-full">
                    <Briefcase className="w-3 h-3" /> IT Professional
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-[#1B365D]/5 text-[#1B365D] text-xs font-medium px-3 py-1.5 rounded-full">
                    <Shield className="w-3 h-3" /> Cybersecurity Advocate
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-[#1B365D]/5 text-[#1B365D] text-xs font-medium px-3 py-1.5 rounded-full">
                    <Globe className="w-3 h-3" /> TechTrendi Founder
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            SECTION 7 — TESTIMONIALS
        ═══════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-[#1B365D] mb-4">
                What Readers Are Saying
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-[#C9A227] text-[#C9A227]" />
                    ))}
                  </div>
                  <p className="text-[#2D2D2D]/70 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1B365D] rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[#2D2D2D] font-semibold text-sm">{t.name}</p>
                      <p className="text-[#2D2D2D]/50 text-xs">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            SECTION 8 — PRICING / CTA
        ═══════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-[#1B365D] via-[#1B365D] to-[#0f2340] relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#C9A227]/5 rounded-full blur-3xl" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              Protect Yourself Today
            </h2>
            <p className="text-white/60 mb-10 max-w-xl mx-auto">
              One book. 20 chapters. 25 real scams exposed. Everything you need to stay safe online in Ghana.
            </p>

            <div className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 md:p-10 max-w-lg">
              <img
                src="/images/books/think-before-you-click-cover.png"
                alt="Book Cover"
                className="w-32 mx-auto mb-6 rounded-lg shadow-xl"
              />

              <div className="flex items-baseline gap-3 justify-center mb-6">
                <span className="text-white/40 line-through text-lg">GHS 250</span>
                <span className="text-[#C9A227] text-5xl font-black">GHS 100</span>
              </div>

              <a
                href={SELAR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-[#C9A227] hover:bg-[#D4AF37] text-white font-bold px-8 py-4 rounded-xl text-lg shadow-lg shadow-[#C9A227]/30 hover:shadow-[#C9A227]/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mb-6"
              >
                Buy Now — GHS 100
              </a>

              <div className="grid grid-cols-2 gap-3 text-left">
                {[
                  { icon: Download, text: "Instant Download" },
                  { icon: FileText, text: "PDF Format" },
                  { icon: Clock, text: "Lifetime Access" },
                  { icon: Smartphone, text: "Read on Any Device" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/70 text-sm">
                    <item.icon className="w-4 h-4 text-[#C9A227] shrink-0" />
                    {item.text}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-white/50 text-xs">
                <BadgeCheck className="w-4 h-4 text-green-400" />
                Secure payment via Selar
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            SECTION 9 — FAQ
        ═══════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-[#1B365D] mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-xl overflow-hidden hover:border-[#C9A227]/30 transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-[#2D2D2D] font-semibold pr-4">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-[#C9A227] shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-40" : "max-h-0"}`}>
                    <p className="px-5 pb-5 text-[#2D2D2D]/60 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            SECTION 10 — FOOTER CTA
        ═══════════════════════════════════════════════════ */}
        <section className="bg-[#1B365D] py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
              Think Before You Click — <span className="text-[#C9A227]">Get Your Copy Now</span>
            </h2>
            <p className="text-white/60 mb-8 max-w-lg mx-auto">
              Do not wait until you or someone you love becomes a victim. The knowledge in this book could save you thousands.
            </p>
            <a
              href={SELAR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#C9A227] hover:bg-[#D4AF37] text-white font-bold px-10 py-4 rounded-xl text-lg shadow-lg shadow-[#C9A227]/30 hover:shadow-[#C9A227]/50 transition-all duration-300 hover:scale-[1.02]"
            >
              Buy Now — GHS 100
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </section>

        {/* ─── MINIMAL FOOTER ─────────────────────────────── */}
        <footer className="bg-[#0f2340] py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <img src="/logo-icon.png" alt="TechTrendi" className="w-6 h-6" />
                <span className="text-white/50 text-sm">A TechTrendi Publication</span>
              </div>
              <div className="flex items-center gap-6 text-white/40 text-sm">
                <Link to="/" className="hover:text-[#C9A227] transition-colors">Home</Link>
                <Link to="/store" className="hover:text-[#C9A227] transition-colors">DigiStore</Link>
                <Link to="/about" className="hover:text-[#C9A227] transition-colors">About</Link>
                <Link to="/contact" className="hover:text-[#C9A227] transition-colors">Contact</Link>
              </div>
              <p className="text-white/30 text-xs">&copy; {new Date().getFullYear()} TechTrendi. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
