import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  ChevronRight,
  Eye,
} from "lucide-react";

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, delay: i * 0.1, ease: "easeOut" },
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
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <div ref={ref} className={className}>
      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
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
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-500/10",
  },
  {
    icon: KeyRound,
    title: "Password Protection Made Easy",
    desc: "Simple habits anyone can follow: no more using your birthday or 1234. Create strong passwords you can actually remember.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-500/10",
  },
  {
    icon: Smartphone,
    title: "Safe Mobile Money Usage",
    desc: "Protect your MTN MoMo, Vodafone Cash, and AirtelTigo Money from fraudsters pretending to be network agents.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-500/10",
  },
  {
    icon: Baby,
    title: "Protecting Your Children Online",
    desc: "Keep your kids safe on YouTube, TikTok, and WhatsApp. Learn about parental controls and cyberbullying.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-500/10",
  },
  {
    icon: Users,
    title: "Safe Social Media Habits",
    desc: "Stop oversharing on Facebook and TikTok. Learn what scammers look for on your profile and how to lock down accounts.",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-500/10",
  },
  {
    icon: AlertTriangle,
    title: "What To Do If You've Been Scammed",
    desc: "Step-by-step recovery guide: who to call, how to report, and how to get your money back in Ghana.",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-100 dark:bg-rose-500/10",
  },
];

const audienceCards = [
  {
    icon: Heart,
    title: "Parents & Families",
    desc: "Protect your household from scams and keep your children safe in the digital world.",
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-100 dark:bg-pink-500/10",
  },
  {
    icon: Briefcase,
    title: "Small Business Owners",
    desc: "Safeguard your MoMo business account, customer data, and online transactions from fraud.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-500/10",
  },
  {
    icon: GraduationCap,
    title: "Students & Young People",
    desc: "Stay sharp on social media, avoid romance scams, and protect your future career from identity theft.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-500/10",
  },
  {
    icon: Eye,
    title: "Senior Citizens",
    desc: "Written in plain, simple language with real Ghana examples. No jargon, no confusion, just practical safety tips.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-500/10",
  },
];

const testimonials = [
  {
    name: "Ama Serwaa",
    location: "Kumasi",
    role: "Market trader",
    text: "I almost lost GHS 2,000 to a MoMo scam last year. After reading this book, I now know exactly how these fraudsters operate. I even taught my mother and my apprentice how to spot fake messages.",
    stars: 5,
  },
  {
    name: "Kwame Boateng",
    location: "Accra",
    role: "JHS Teacher",
    text: "I bought copies for my staff room. We now use the chapter on children's online safety during PTA meetings. The parents are always surprised by what their kids can access.",
    stars: 5,
  },
  {
    name: "Faustina Mensah",
    location: "Takoradi",
    role: "Retired nurse",
    text: "At my age, I was afraid of using mobile money. My grandson gave me this book and now I do my own transactions with confidence. The language is so simple, even my 70-year-old friend understood.",
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
          content="A practical guide to staying safe online. Written for everyday Ghanaians — parents, traders, students, and seniors."
        />
      </Helmet>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(99,102,241,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(236,72,153,0.08),transparent_60%)]" />

        <div className="container relative z-10 py-16 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-sm font-medium mb-5">
                <ShieldCheck className="w-3.5 h-3.5" />
                2026 Edition
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.1] tracking-tight">
                Think Before{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-500">
                  You Click
                </span>
              </h1>

              <p className="text-lg text-indigo-200/80 font-medium mb-3">
                A Practical Guide to Staying Safe Online
              </p>

              <p className="text-slate-300/70 mb-8 max-w-xl leading-relaxed">
                Written for everyday Ghanaians — not IT experts. Whether you use MoMo,
                WhatsApp, Facebook, or just browse the internet, this book gives you
                the real-world knowledge to protect yourself, your money, and your
                family from online fraud.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 shadow-lg shadow-amber-500/20"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Free Preview
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 font-bold px-6"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Get Full Book
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-400" /> 3 free chapters
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-400" /> Plain language
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-400" /> Ghana-focused
                </span>
              </div>
            </motion.div>

            {/* Right — book cover */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="flex justify-center lg:justify-end"
            >
              <div className="relative w-64 sm:w-72 md:w-80">
                <div className="absolute inset-4 bg-black/30 blur-2xl rounded-2xl translate-y-6" />
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-[3/4]">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(251,191,36,0.15),transparent_50%)]" />

                  <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center">
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-5 shadow-lg shadow-amber-500/25"
                    >
                      <ShieldCheck className="w-8 h-8 text-white" />
                    </motion.div>

                    <h2 className="text-xl sm:text-2xl font-black text-white mb-1.5 leading-tight">
                      Think Before
                      <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                        You Click
                      </span>
                    </h2>
                    <div className="w-10 h-0.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full mb-2" />
                    <p className="text-[10px] text-slate-300/60 uppercase tracking-widest mb-3">
                      A Practical Guide to
                      <br />
                      Staying Safe Online
                    </p>

                    <div className="flex gap-0 rounded-full overflow-hidden w-20 h-1 mb-3">
                      <div className="flex-1 bg-red-500" />
                      <div className="flex-1 bg-yellow-400" />
                      <div className="flex-1 bg-green-500" />
                    </div>

                    <p className="text-[10px] text-slate-400 tracking-wide">
                      TechTrendi Publications
                    </p>
                  </div>

                  <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-black/30 to-transparent" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* WHAT YOU'LL LEARN */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <RevealSection>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-sm font-medium mb-4">
                What You Will Learn
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Real Skills to Protect Yourself
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Every chapter is packed with real Ghana examples, step-by-step
                instructions, and simple checklists you can use immediately.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {learnCards.map((card, i) => (
                <motion.div
                  key={card.title}
                  custom={i}
                  variants={scaleIn}
                  className="group rounded-xl border border-border bg-card p-5 hover:shadow-md hover:border-border/80 transition-all"
                >
                  <div className={cn("w-11 h-11 rounded-lg flex items-center justify-center mb-3", card.bg)}>
                    <card.icon className={cn("w-5 h-5", card.color)} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1.5">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* WHO IS THIS BOOK FOR */}
      <section className="py-16 md:py-24 bg-muted/30 dark:bg-muted/10 border-y border-border/50">
        <div className="container">
          <RevealSection>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400 text-sm font-medium mb-4">
                Who Is This Book For
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Written For Everyday People
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                You do not need to be a tech expert. If you use a phone or the
                internet, this book is for you.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {audienceCards.map((card, i) => (
                <motion.div
                  key={card.title}
                  custom={i}
                  variants={fadeUp}
                  className="rounded-xl border border-border bg-card p-5 text-center hover:shadow-md transition-all"
                >
                  <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3", card.bg)}>
                    <card.icon className={cn("w-7 h-7", card.color)} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* CHAPTER PREVIEW */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <RevealSection>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-4">
                <FileText className="w-3.5 h-3.5" />
                Table of Contents
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Explore the Full Book
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                The first 3 chapters are completely free. Read them now and see
                why thousands of Ghanaians trust this book.
              </p>
            </motion.div>

            <div className="max-w-3xl mx-auto space-y-2">
              {chapters.map((ch, i) => (
                <motion.div
                  key={ch.num}
                  custom={i}
                  variants={fadeUp}
                  className={cn(
                    "group flex items-center gap-3 p-3.5 rounded-lg border transition-all",
                    ch.free
                      ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/15 hover:border-emerald-300 dark:hover:border-emerald-500/30"
                      : "bg-card border-border hover:border-border/80"
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                      ch.free
                        ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {ch.num}
                  </div>

                  <span
                    className={cn(
                      "flex-1 font-medium text-sm sm:text-base",
                      ch.free ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {ch.title}
                  </span>

                  {ch.free ? (
                    <Link to={`/blog/${ch.slug}`}>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-500/25 transition-colors">
                        FREE <ChevronRight className="w-3 h-3" />
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Full book</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <motion.div variants={fadeUp} className="text-center mt-8">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold px-6"
              >
                <Download className="w-5 h-5 mr-2" />
                Download 3 Free Chapters (PDF)
              </Button>
            </motion.div>
          </RevealSection>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 md:py-24 bg-muted/30 dark:bg-muted/10 border-y border-border/50">
        <div className="container">
          <RevealSection>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm font-medium mb-4">
                <Star className="w-3.5 h-3.5" />
                What Readers Say
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Trusted by Ghanaians Nationwide
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.name}
                  custom={i}
                  variants={scaleIn}
                  className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all"
                >
                  <Quote className="w-7 h-7 text-rose-300 dark:text-rose-500/30 mb-3" />
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5 italic">
                    "{t.text}"
                  </p>

                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: t.stars }).map((_, si) => (
                      <Star key={si} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>

                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.role} — {t.location}
                  </p>
                </motion.div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* CTA / PRICING */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 dark:from-amber-600 dark:via-orange-600 dark:to-red-600">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(255,255,255,0.1),transparent_50%)]" />

        <div className="container relative z-10">
          <RevealSection>
            <motion.div variants={fadeUp} className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Get Your Copy Today
              </h2>
              <p className="text-lg text-white/80 max-w-xl mx-auto">
                Protect yourself and your loved ones. One book can save you
                thousands of cedis in fraud losses.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="flex flex-wrap justify-center gap-4 mb-10"
            >
              {[
                { icon: Download, label: "Instant PDF Download" },
                { icon: Send, label: "WhatsApp-Friendly" },
                { icon: Printer, label: "Printable Layout" },
                { icon: Globe, label: "Any Device" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-2 bg-white/15 rounded-full px-4 py-2 text-white text-sm font-medium"
                >
                  <f.icon className="w-4 h-4" />
                  {f.label}
                </div>
              ))}
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
              <motion.div
                variants={scaleIn}
                custom={0}
                className="rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 p-7 text-center"
              >
                <p className="text-sm font-medium text-white/70 mb-1.5 uppercase tracking-wider">
                  Free Preview
                </p>
                <p className="text-4xl font-black text-white mb-1">GHS 0</p>
                <p className="text-sm text-white/60 mb-5">First 3 chapters + checklists</p>
                <Button
                  size="lg"
                  className="w-full bg-white text-orange-600 hover:bg-white/90 font-bold"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Free
                </Button>
              </motion.div>

              <motion.div
                variants={scaleIn}
                custom={1}
                className="relative rounded-xl bg-white/25 backdrop-blur-sm border-2 border-white/40 p-7 text-center"
              >
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="bg-white text-orange-600 font-bold text-xs px-3 py-1 rounded-full shadow-md">
                    BEST VALUE
                  </span>
                </div>
                <p className="text-sm font-medium text-white/70 mb-1.5 uppercase tracking-wider">
                  Full Book
                </p>
                <p className="text-4xl font-black text-white mb-1">
                  GHS 29<span className="text-2xl">.99</span>
                </p>
                <p className="text-sm text-white/60 mb-5">All 12 chapters + bonus materials</p>
                <Button
                  size="lg"
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 font-bold"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Get Full Access
                </Button>
              </motion.div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* RELATED CONTENT */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <RevealSection>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 text-sm font-medium mb-4">
                <Globe className="w-3.5 h-3.5" />
                Keep Learning
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                More Security Resources
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Continue your cybersecurity journey with our free interactive
                tools and guides.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {[
                {
                  to: "/cyber-awareness",
                  title: "Cyber Awareness Hub",
                  desc: "50 bite-sized security tips everyone should know.",
                  icon: ShieldCheck,
                  color: "text-emerald-600 dark:text-emerald-400",
                  bg: "bg-emerald-100 dark:bg-emerald-500/10",
                },
                {
                  to: "/tools/phishing-quiz",
                  title: "Phishing Quiz",
                  desc: "Test your ability to spot fake messages and scam links.",
                  icon: AlertTriangle,
                  color: "text-red-600 dark:text-red-400",
                  bg: "bg-red-100 dark:bg-red-500/10",
                },
                {
                  to: "/blog",
                  title: "Security Articles",
                  desc: "In-depth guides on passwords, privacy, and online safety.",
                  icon: BookOpen,
                  color: "text-blue-600 dark:text-blue-400",
                  bg: "bg-blue-100 dark:bg-blue-500/10",
                },
              ].map((item, i) => (
                <motion.div key={item.to} custom={i} variants={scaleIn}>
                  <Link
                    to={item.to}
                    className="block rounded-xl border border-border bg-card p-5 hover:shadow-md hover:border-border/80 transition-all h-full group"
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", item.bg)}>
                      <item.icon className={cn("w-5 h-5", item.color)} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1.5">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{item.desc}</p>
                    <span className="inline-flex items-center text-sm text-primary font-medium">
                      Explore <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
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
