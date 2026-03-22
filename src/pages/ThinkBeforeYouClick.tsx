import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  MessageSquareWarning,
  KeyRound,
  Smartphone,
  Baby,
  Users,
  AlertTriangle,
  BookOpen,
  Lock,
  Download,
  CheckCircle2,
  Star,
  ArrowRight,
  Briefcase,
  GraduationCap,
  Heart,
  FileText,
  Send,
  Globe,
  Printer,
  Quote,
  Sparkles,
  Eye,
  ChevronRight,
} from "lucide-react";

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.12, ease: "easeOut" },
  }),
};

function RevealSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className={className}>
      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
          },
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ─── data ─── */
const chapters = [
  { num: 1, title: "Why Cybersecurity Matters to Every Ghanaian", slug: "think-click-chapter-1", free: true },
  { num: 2, title: "How Scammers Think: Getting Inside Their Playbook", slug: "think-click-chapter-2", free: true },
  { num: 3, title: "Spotting Scam Messages Before They Trick You", slug: "think-click-chapter-3", free: true },
  { num: 4, title: "Password Protection Made Easy", slug: "think-click-chapter-4", free: false },
  { num: 5, title: "Safe Mobile Money Usage: MoMo, Vodafone Cash & More", slug: "think-click-chapter-5", free: false },
  { num: 6, title: "Protecting Your Children Online", slug: "think-click-chapter-6", free: false },
  { num: 7, title: "Safe Social Media Habits for Everyday Use", slug: "think-click-chapter-7", free: false },
  { num: 8, title: "Shopping and Banking Online Without Fear", slug: "think-click-chapter-8", free: false },
  { num: 9, title: "Keeping Your Phone and Devices Secure", slug: "think-click-chapter-9", free: false },
  { num: 10, title: "Public Wi-Fi, Internet Cafes and Shared Devices", slug: "think-click-chapter-10", free: false },
  { num: 11, title: "What To Do If You Have Been Scammed", slug: "think-click-chapter-11", free: false },
  { num: 12, title: "Building a Cyber-Safe Home and Community", slug: "think-click-chapter-12", free: false },
];

const learnCards = [
  {
    icon: MessageSquareWarning,
    title: "Spotting Scam Messages",
    desc: "Learn to recognise fake SMS, WhatsApp forwards, and phishing emails before you click any link or send any money.",
    gradient: "from-red-500 to-orange-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  {
    icon: KeyRound,
    title: "Password Protection Made Easy",
    desc: "Simple habits anyone can follow: no more using your birthday or 1234. We show you how to create strong passwords you can actually remember.",
    gradient: "from-yellow-500 to-amber-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  {
    icon: Smartphone,
    title: "Safe Mobile Money Usage",
    desc: "Protect your MTN MoMo, Vodafone Cash, and AirtelTigo Money from fraudsters who call pretending to be network agents.",
    gradient: "from-green-500 to-emerald-500",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  {
    icon: Baby,
    title: "Protecting Your Children Online",
    desc: "Keep your kids safe on YouTube, TikTok, and WhatsApp. Learn about parental controls, cyberbullying, and age-appropriate content.",
    gradient: "from-blue-500 to-cyan-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    icon: Users,
    title: "Safe Social Media Habits",
    desc: "Stop oversharing on Facebook, Instagram, and TikTok. Learn what scammers look for on your profile and how to lock down your accounts.",
    gradient: "from-purple-500 to-pink-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    icon: AlertTriangle,
    title: "What To Do If You've Been Scammed",
    desc: "Step-by-step recovery guide: who to call, how to report, how to secure your accounts, and how to get your money back in Ghana.",
    gradient: "from-rose-500 to-red-600",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
];

const audienceCards = [
  {
    icon: Heart,
    title: "Parents & Families",
    desc: "Protect your household from scams and keep your children safe in the digital world.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Briefcase,
    title: "Small Business Owners",
    desc: "Safeguard your MoMo business account, customer data, and online transactions from fraud.",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    icon: GraduationCap,
    title: "Students & Young People",
    desc: "Stay sharp on social media, avoid romance scams, and protect your future career from identity theft.",
    gradient: "from-green-500 to-teal-500",
  },
  {
    icon: Eye,
    title: "Senior Citizens",
    desc: "Written in plain, simple language with real Ghana examples. No jargon, no confusion, just practical safety tips.",
    gradient: "from-amber-500 to-orange-500",
  },
];

const testimonials = [
  {
    name: "Ama Serwaa",
    location: "Kumasi",
    role: "Market trader",
    text: "I almost lost GHS 2,000 to a MoMo scam last year. After reading this book, I now know exactly how these fraudsters operate. I even taught my mother and my apprentice how to spot fake messages. This book is a must for every Ghanaian!",
    stars: 5,
  },
  {
    name: "Kwame Boateng",
    location: "Accra",
    role: "JHS Teacher",
    text: "I bought copies for my staff room. We now use the chapter on children's online safety during PTA meetings. The parents are always surprised by what their kids can access. Very practical and easy to understand.",
    stars: 5,
  },
  {
    name: "Faustina Mensah",
    location: "Takoradi",
    role: "Retired nurse",
    text: "At my age, I was afraid of using mobile money. My grandson gave me this book and now I do my own transactions with confidence. The language is so simple, even my 70-year-old friend understood everything.",
    stars: 5,
  },
];

/* ─── component ─── */
export default function ThinkBeforeYouClick() {
  return (
    <Layout>
      <Helmet>
        <title>Think Before You Click — Cybersecurity Book for Ghanaians | TechTrendi</title>
        <meta
          name="description"
          content="A practical guide to staying safe online. Written for everyday Ghanaians — parents, traders, students, and seniors. Learn to spot scams, protect your MoMo, and keep your family safe."
        />
        <meta property="og:title" content="Think Before You Click — Stay Safe Online" />
        <meta
          property="og:description"
          content="The #1 cybersecurity book for everyday Ghanaians. Protect your money, your family, and your data."
        />
      </Helmet>

      {/* ═══════════════════════════════════════════
          SECTION 1 — HERO
      ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(236,72,153,0.1),transparent_60%)]" />
        {/* grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="container relative z-10 py-20 md:py-32 lg:py-40">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* left — copy */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium mb-6"
              >
                <ShieldCheck className="w-4 h-4" />
                New Release — 2026 Edition
              </motion.span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-[1.1] tracking-tight">
                Think Before{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-500">
                  You Click
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-indigo-200/90 font-medium mb-4">
                A Practical Guide to Staying Safe Online
              </p>

              <p className="text-base md:text-lg text-slate-300/80 mb-8 max-w-xl leading-relaxed">
                Written for everyday Ghanaians — not IT experts. Whether you use MoMo,
                WhatsApp, Facebook, or just browse the internet, this book gives you
                the real-world knowledge to protect yourself, your money, and your
                family from online fraud and cybercrime.
              </p>

              <div className="flex flex-wrap gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-8 py-6 text-lg rounded-xl shadow-lg shadow-amber-500/25"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Free Preview
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/20 text-white hover:bg-white/10 font-bold px-8 py-6 text-lg rounded-xl backdrop-blur-sm"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    Get the Full Book
                  </Button>
                </motion.div>
              </div>

              {/* trust signals */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex flex-wrap items-center gap-4 mt-8 text-sm text-slate-400"
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-400" /> 3 free chapters
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-400" /> Plain language
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-400" /> Ghana-focused
                </span>
              </motion.div>
            </motion.div>

            {/* right — book cover placeholder */}
            <motion.div
              initial={{ opacity: 0, x: 40, rotateY: 12 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex justify-center lg:justify-end"
            >
              <motion.div
                whileHover={{ rotateY: -6, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="relative w-72 sm:w-80 md:w-96"
                style={{ perspective: "1000px" }}
              >
                {/* book shadow */}
                <div className="absolute inset-4 bg-black/40 blur-3xl rounded-2xl translate-y-8" />

                {/* book cover */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-[3/4]">
                  {/* cover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(251,191,36,0.2),transparent_50%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(239,68,68,0.15),transparent_50%)]" />

                  {/* cover content */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center">
                    {/* shield icon */}
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30"
                    >
                      <ShieldCheck className="w-10 h-10 text-white" />
                    </motion.div>

                    <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
                      Think Before
                      <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                        You Click
                      </span>
                    </h2>
                    <div className="w-12 h-0.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full mb-3" />
                    <p className="text-xs text-slate-300/70 uppercase tracking-widest mb-4">
                      A Practical Guide to
                      <br />
                      Staying Safe Online
                    </p>

                    {/* Ghana flag colors bar */}
                    <div className="flex gap-0 rounded-full overflow-hidden w-24 h-1.5 mb-4">
                      <div className="flex-1 bg-red-500" />
                      <div className="flex-1 bg-yellow-400" />
                      <div className="flex-1 bg-green-500" />
                    </div>

                    <p className="text-[11px] text-slate-400 tracking-wide">
                      TechTrendi Publications
                    </p>
                  </div>

                  {/* spine effect */}
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 to-transparent" />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2 — WHAT YOU'LL LEARN
      ═══════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,0.08),transparent_60%)]" />

        <div className="container relative z-10">
          <RevealSection>
            <motion.div variants={fadeUp} className="text-center mb-14">
              <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 mb-4 text-sm px-4 py-1.5">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                What You Will Learn
              </Badge>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                Real Skills to{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                  Protect Yourself
                </span>
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Every chapter is packed with real Ghana examples, step-by-step
                instructions, and simple checklists you can use immediately.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {learnCards.map((card, i) => (
                <motion.div
                  key={card.title}
                  custom={i}
                  variants={scaleIn}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className={cn(
                    "relative group rounded-2xl p-6 border backdrop-blur-sm transition-all duration-300",
                    card.bg,
                    card.border
                  )}
                >
                  {/* glow */}
                  <div
                    className={cn(
                      "absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl",
                      card.bg
                    )}
                  />

                  <div className="relative z-10">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg",
                        card.gradient
                      )}
                    >
                      <card.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                    <p className="text-sm text-slate-300/80 leading-relaxed">{card.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3 — WHO IS THIS BOOK FOR
      ═══════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(168,85,247,0.1),transparent_60%)]" />

        <div className="container relative z-10">
          <RevealSection>
            <motion.div variants={fadeUp} className="text-center mb-14">
              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 mb-4 text-sm px-4 py-1.5">
                <Users className="w-3.5 h-3.5 mr-1.5" />
                Who Is This Book For
              </Badge>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                Written For{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Everyday People
                </span>
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                You do not need to be a tech expert. If you use a phone or the
                internet, this book is for you.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {audienceCards.map((card, i) => (
                <motion.div
                  key={card.title}
                  custom={i}
                  variants={fadeUp}
                  whileHover={{ y: -8 }}
                  className="relative group rounded-2xl bg-white/[0.04] border border-white/10 p-6 text-center hover:border-white/20 transition-colors"
                >
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                    className={cn(
                      "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-4 shadow-lg",
                      card.gradient
                    )}
                  >
                    <card.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 4 — CHAPTER PREVIEW
      ═══════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-emerald-950/40 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(16,185,129,0.08),transparent_60%)]" />

        <div className="container relative z-10">
          <RevealSection>
            <motion.div variants={fadeUp} className="text-center mb-14">
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 mb-4 text-sm px-4 py-1.5">
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Free Chapters Preview
              </Badge>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                Explore the{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  Full Table of Contents
                </span>
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                The first 3 chapters are completely free. Read them now and see
                why thousands of Ghanaians trust this book.
              </p>
            </motion.div>

            <div className="max-w-3xl mx-auto space-y-3">
              {chapters.map((ch, i) => (
                <motion.div
                  key={ch.num}
                  custom={i}
                  variants={fadeUp}
                  whileHover={{ x: 6 }}
                  className={cn(
                    "group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
                    ch.free
                      ? "bg-emerald-500/[0.06] border-emerald-500/20 hover:border-emerald-400/40"
                      : "bg-white/[0.02] border-white/10 hover:border-white/20"
                  )}
                >
                  {/* number */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                      ch.free
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-white/5 text-slate-500"
                    )}
                  >
                    {ch.num}
                  </div>

                  {/* title */}
                  <span
                    className={cn(
                      "flex-1 font-medium text-sm sm:text-base",
                      ch.free ? "text-white" : "text-slate-400"
                    )}
                  >
                    {ch.title}
                  </span>

                  {/* badge / action */}
                  {ch.free ? (
                    <Link to={`/blog/${ch.slug}`}>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 cursor-pointer transition-colors">
                        FREE <ChevronRight className="w-3 h-3 ml-1" />
                      </Badge>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Lock className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Full book</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <motion.div variants={fadeUp} className="text-center mt-10">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold px-8 py-6 text-base rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download 3 Free Chapters (PDF)
                </Button>
              </motion.div>
            </motion.div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 5 — TESTIMONIALS
      ═══════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-rose-950/30 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(244,63,94,0.08),transparent_60%)]" />

        <div className="container relative z-10">
          <RevealSection>
            <motion.div variants={fadeUp} className="text-center mb-14">
              <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30 mb-4 text-sm px-4 py-1.5">
                <Star className="w-3.5 h-3.5 mr-1.5" />
                What Readers Say
              </Badge>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                Trusted by{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-400">
                  Ghanaians Nationwide
                </span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.name}
                  custom={i}
                  variants={scaleIn}
                  whileHover={{ y: -6 }}
                  className="relative rounded-2xl bg-white/[0.04] border border-white/10 p-6 hover:border-rose-500/20 transition-colors"
                >
                  <Quote className="w-8 h-8 text-rose-500/30 mb-4" />

                  <p className="text-sm text-slate-300/90 leading-relaxed mb-6 italic">
                    "{t.text}"
                  </p>

                  {/* stars */}
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: t.stars }).map((_, si) => (
                      <Star
                        key={si}
                        className="w-4 h-4 text-amber-400 fill-amber-400"
                      />
                    ))}
                  </div>

                  <div>
                    <p className="font-bold text-white text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">
                      {t.role} — {t.location}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 6 — CTA / PRICING
      ═══════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        {/* vibrant gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-orange-600 to-red-600" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(255,255,255,0.08),transparent_50%)]" />

        <div className="container relative z-10">
          <RevealSection>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                Get Your Copy Today
              </h2>
              <p className="text-lg text-white/80 max-w-xl mx-auto">
                Protect yourself and your loved ones. One book can save you
                thousands of cedis in fraud losses.
              </p>
            </motion.div>

            {/* features */}
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap justify-center gap-6 mb-12"
            >
              {[
                { icon: Download, label: "Instant PDF Download" },
                { icon: Send, label: "WhatsApp-Friendly Format" },
                { icon: Printer, label: "Printable A4 Layout" },
                { icon: Globe, label: "Read on Any Device" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5 text-white text-sm font-medium"
                >
                  <f.icon className="w-4 h-4" />
                  {f.label}
                </div>
              ))}
            </motion.div>

            {/* pricing cards */}
            <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <motion.div
                variants={scaleIn}
                custom={0}
                whileHover={{ y: -6 }}
                className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-8 text-center"
              >
                <p className="text-sm font-medium text-white/70 mb-2 uppercase tracking-wider">
                  Free Preview
                </p>
                <p className="text-4xl font-black text-white mb-1">GHS 0</p>
                <p className="text-sm text-white/60 mb-6">
                  First 3 chapters + checklists
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    className="w-full bg-white text-orange-600 hover:bg-white/90 font-bold rounded-xl py-5"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Free
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div
                variants={scaleIn}
                custom={1}
                whileHover={{ y: -6 }}
                className="relative rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40 p-8 text-center"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-white text-orange-600 font-bold text-xs px-3 py-1 shadow-lg">
                    BEST VALUE
                  </Badge>
                </div>
                <p className="text-sm font-medium text-white/70 mb-2 uppercase tracking-wider">
                  Full Book
                </p>
                <p className="text-4xl font-black text-white mb-1">
                  GHS 29<span className="text-2xl">.99</span>
                </p>
                <p className="text-sm text-white/60 mb-6">
                  All 12 chapters + bonus materials
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:from-slate-800 hover:to-slate-700 font-bold rounded-xl py-5"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    Get Full Access
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 7 — RELATED SECURITY CONTENT
      ═══════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,rgba(59,130,246,0.08),transparent_60%)]" />

        <div className="container relative z-10">
          <RevealSection>
            <motion.div variants={fadeUp} className="text-center mb-14">
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 mb-4 text-sm px-4 py-1.5">
                <Globe className="w-3.5 h-3.5 mr-1.5" />
                Keep Learning
              </Badge>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                More{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  Security Resources
                </span>
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Continue your cybersecurity journey with our free interactive
                tools and guides.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  to: "/cyber-awareness",
                  title: "Cyber Awareness Hub",
                  desc: "50 bite-sized security tips everyone should know.",
                  gradient: "from-green-500 to-emerald-500",
                  icon: ShieldCheck,
                },
                {
                  to: "/tools/phishing-quiz",
                  title: "Phishing Quiz",
                  desc: "Test your ability to spot fake messages and scam links.",
                  gradient: "from-red-500 to-rose-500",
                  icon: AlertTriangle,
                },
                {
                  to: "/blog",
                  title: "Security Articles",
                  desc: "In-depth guides on passwords, privacy, and online safety.",
                  gradient: "from-blue-500 to-indigo-500",
                  icon: BookOpen,
                },
              ].map((item, i) => (
                <motion.div
                  key={item.to}
                  custom={i}
                  variants={scaleIn}
                  whileHover={{ y: -6, scale: 1.02 }}
                >
                  <Link
                    to={item.to}
                    className="block rounded-2xl bg-white/[0.04] border border-white/10 p-6 hover:border-blue-500/30 transition-all duration-300 h-full"
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg",
                        item.gradient
                      )}
                    >
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-400 mb-3">{item.desc}</p>
                    <span className="inline-flex items-center text-sm text-blue-400 font-medium group">
                      Explore{" "}
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>
    </Layout>
  );
}
