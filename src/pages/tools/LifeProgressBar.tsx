import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LIFE_EXPECTANCY_BY_COUNTRY } from "@/data/lifeExpectancyByCountry";
import {
  Clock, Calendar, Heart, Target, Share2, Sun, Wind, Star,
  Coffee, Utensils, Bed, Briefcase, Sparkles, Timer, TrendingUp,
  Gift, Users, Zap, Cake, Download, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { renderLifeCard, LIFE_CARD_THEMES, type LifeCardTheme, type LifeCardStats } from "@/lib/lifeCardCanvas";
import { buildLifeShareUrl } from "@/lib/lifeShareLink";

interface LifeStats {
  birthDate: string;
  lifeExpectancy: number;
  country: string;
}

const defaultStats: LifeStats = {
  birthDate: "",
  lifeExpectancy: 80,
  country: "",
};

const zodiacSigns = [
  { name: "Capricorn", emoji: "", start: [12, 22], end: [1, 19] },
  { name: "Aquarius", emoji: "", start: [1, 20], end: [2, 18] },
  { name: "Pisces", emoji: "", start: [2, 19], end: [3, 20] },
  { name: "Aries", emoji: "", start: [3, 21], end: [4, 19] },
  { name: "Taurus", emoji: "", start: [4, 20], end: [5, 20] },
  { name: "Gemini", emoji: "", start: [5, 21], end: [6, 20] },
  { name: "Cancer", emoji: "", start: [6, 21], end: [7, 22] },
  { name: "Leo", emoji: "", start: [7, 23], end: [8, 22] },
  { name: "Virgo", emoji: "", start: [8, 23], end: [9, 22] },
  { name: "Libra", emoji: "", start: [9, 23], end: [10, 22] },
  { name: "Scorpio", emoji: "", start: [10, 23], end: [11, 21] },
  { name: "Sagittarius", emoji: "", start: [11, 22], end: [12, 21] },
];

const getZodiacSign = (month: number, day: number): { name: string; emoji: string } => {
  for (const sign of zodiacSigns) {
    const [startMonth, startDay] = sign.start;
    const [endMonth, endDay] = sign.end;

    if (sign.name === "Capricorn") {
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
        return { name: sign.name, emoji: sign.emoji };
      }
    } else {
      if (
        (month === startMonth && day >= startDay) ||
        (month === endMonth && day <= endDay)
      ) {
        return { name: sign.name, emoji: sign.emoji };
      }
    }
  }
  return { name: "Capricorn", emoji: "" };
};

const getGeneration = (birthYear: number): { name: string; description: string } => {
  if (birthYear >= 2013) return { name: "Gen Alpha", description: "Digital natives from birth" };
  if (birthYear >= 1997) return { name: "Gen Z", description: "True digital natives" };
  if (birthYear >= 1981) return { name: "Millennial", description: "The connected generation" };
  if (birthYear >= 1965) return { name: "Gen X", description: "The independent generation" };
  if (birthYear >= 1946) return { name: "Baby Boomer", description: "Post-war prosperity" };
  if (birthYear >= 1928) return { name: "Silent Generation", description: "The traditionalists" };
  return { name: "Greatest Generation", description: "The war generation" };
};

// Animates a number counting up from 0 to `value` over `duration` ms.
// Runs once per mount (keyed remount from the parent restarts it).
function CountUp({ value, duration = 1400, className }: { value: number; duration?: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let raf: number;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min(1, (ts - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setDisplay(Math.floor(eased * value));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{new Intl.NumberFormat().format(display)}</span>;
}

const THEME_ORDER: LifeCardTheme[] = ["signature", "midnight", "paper", "sunset", "forest", "ocean"];

// Scroll-reveal wrapper — fades + rises into view once as the visitor
// scrolls, so the page beneath the reveal sequence feels alive too instead
// of appearing all at once as a static block.
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  // Safety net: whileInView relies on IntersectionObserver, which can miss
  // an element (fast scroll, a section near the very bottom of a short
  // page, etc.) and leave it stuck at opacity:0 forever — invisible
  // content behind a visible border, which is worse than no animation at
  // all. Force full visibility after a short timeout regardless, so a
  // missed observer callback can never permanently hide real content.
  const [forceShow, setForceShow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setForceShow(true), 1200 + delay * 1000);
    return () => clearTimeout(id);
  }, [delay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      animate={forceShow ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: "0px 0px 200px 0px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// The emotional "OMG" moment: plays once after a birth date is entered,
// staging the same numbers the page already computes into a slow reveal
// (day count -> pause -> days remaining -> pause -> Saturdays left) before
// landing on a downloadable/shareable image card. The detailed stat grid
// below this is untouched — this is a dramatic entrance in front of it,
// not a replacement.
function LifeRevealSequence({ stats }: { stats: LifeCardStats }) {
  const [beat, setBeat] = useState(0); // 0=days lived, 1=days remaining, 2=saturdays, 3=card
  const [theme, setTheme] = useState<LifeCardTheme>("signature");
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const t = LIFE_CARD_THEMES[theme];

  // The parent recomputes `stats` every second (the page has a live-ticking
  // clock), but the reveal should tell one consistent story, not restart or
  // regenerate the card each second. Freeze the numbers on first mount —
  // then re-sync (without replaying the animation) whenever life expectancy
  // changes the underlying numbers, so the card never goes stale.
  const frozenStats = useRef(stats);
  const [statsVersion, setStatsVersion] = useState(0);
  // Rounded to 1 decimal so the once-a-second clock tick (which nudges
  // lifeProgress by a tiny fraction every render) never counts as a
  // "real" change — only an actual life-expectancy edit does. Without
  // this, the re-sync effect below fired every second forever, endlessly
  // re-triggering the Life Card render and never letting it settle.
  const roundedProgress = Math.round(stats.lifeProgress * 10) / 10;
  const prevRoundedProgress = useRef(roundedProgress);

  useEffect(() => {
    if (roundedProgress === prevRoundedProgress.current) return;
    prevRoundedProgress.current = roundedProgress;
    frozenStats.current = stats;
    setStatsVersion((v) => v + 1);
  }, [roundedProgress, stats]);

  useEffect(() => {
    if (beat >= 3) return;
    const id = setTimeout(() => setBeat((b) => b + 1), beat === 0 ? 2600 : 2200);
    return () => clearTimeout(id);
  }, [beat]);

  useEffect(() => {
    if (beat < 3) return;
    let cancelled = false;
    setGenerating(true);
    renderLifeCard(frozenStats.current, theme).then((blob) => {
      if (cancelled) return;
      setCardUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob); });
      setGenerating(false);
    });
    return () => { cancelled = true; };
  }, [beat, theme, statsVersion]);

  // Release the last object URL when the whole reveal unmounts (e.g. the
  // visitor changes the birth date and this component's `key` remounts it).
  useEffect(() => () => { if (cardUrl) URL.revokeObjectURL(cardUrl); }, [cardUrl]);

  const handleDownload = () => {
    if (!cardUrl) return;
    const a = document.createElement("a");
    a.href = cardUrl;
    a.download = "my-life-card.png";
    a.click();
  };

  const handleShare = async () => {
    if (!cardUrl) return;
    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      const file = new File([blob], "my-life-card.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My Life Card", text: "Made mine at TechTrendi — make yours:" });
        return;
      }
    } catch { /* fall through to download */ }
    handleDownload();
  };

  return (
    <div className="relative rounded-3xl overflow-hidden mb-10 shadow-2xl">
      <AnimatePresence mode="wait">
        {beat === 0 && (
          <motion.div key="beat0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-purple-700 via-pink-600 to-red-600 py-24 md:py-32 text-center px-6">
            <motion.p initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="text-white/70 text-lg mb-3">You've already lived</motion.p>
            <CountUp value={frozenStats.current.daysLived} className="block text-6xl md:text-8xl font-black text-white tabular-nums" />
            <motion.p initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="text-white/70 text-lg mt-3">days</motion.p>
          </motion.div>
        )}
        {beat === 1 && (
          <motion.div key="beat1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-indigo-700 via-purple-600 to-pink-600 py-24 md:py-32 text-center px-6">
            <motion.p initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="text-white/70 text-lg mb-3">You may have around</motion.p>
            <CountUp value={frozenStats.current.daysRemaining} className="block text-6xl md:text-8xl font-black text-white tabular-nums" />
            <motion.p initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="text-white/70 text-lg mt-3">days remaining</motion.p>
          </motion.div>
        )}
        {beat === 2 && (
          <motion.div key="beat2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 py-24 md:py-32 text-center px-6">
            <motion.p initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="text-white/70 text-lg mb-3">That means only</motion.p>
            <CountUp value={frozenStats.current.saturdaysRemaining} className="block text-6xl md:text-8xl font-black text-white tabular-nums" />
            <motion.p initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="text-white/70 text-lg mt-3">Saturdays left. Make every one count.</motion.p>
          </motion.div>
        )}
        {beat === 3 && (
          <motion.div key="beat3" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="p-6 md:p-10" style={{ background: `linear-gradient(135deg, ${t.bgGradient[0]}, ${t.bgGradient[1]}, ${t.bgGradient[2]})` }}>
            <div className="max-w-md mx-auto">
              <p className="text-center font-semibold mb-4" style={{ color: t.ink }}>Your Life Card is ready</p>
              <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[4/5] bg-black/10 flex items-center justify-center">
                {generating || !cardUrl ? (
                  <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <img src={cardUrl} alt="Your Life Card" className="w-full h-full object-contain" />
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                {THEME_ORDER.map((key) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                      theme === key ? "bg-white text-black border-white scale-105" : "bg-white/10 text-white border-white/25 hover:bg-white/20"
                    )}
                  >
                    {LIFE_CARD_THEMES[key].label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 justify-center mt-6">
                <Button onClick={handleDownload} disabled={!cardUrl} className="gap-2 bg-white text-black hover:bg-white/90">
                  <Download className="w-4 h-4" /> Download
                </Button>
                <Button onClick={handleShare} disabled={!cardUrl} variant="outline" className="gap-2 border-white/40 bg-white/10 text-white hover:bg-white/20">
                  <Share2 className="w-4 h-4" /> Share Image
                </Button>
              </div>
              <p className="text-center text-xs mt-4" style={{ color: t.inkSoft }}>
                See the full breakdown below <ArrowRight className="inline w-3 h-3" />
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LifeProgressBar() {
  const [stats, setStats] = useState<LifeStats>(defaultStats);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const saved = localStorage.getItem("techtrendi_life_progress");
    if (saved) {
      setStats((prev) => ({ ...prev, ...JSON.parse(saved) }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("techtrendi_life_progress", JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const calculations = useMemo(() => {
    if (!stats.birthDate) return null;

    const birth = new Date(stats.birthDate);
    const ageMs = now.getTime() - birth.getTime();
    const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
    const ageDays = ageMs / (24 * 60 * 60 * 1000);
    const ageWeeks = ageDays / 7;
    const ageMonths = ageYears * 12;
    const ageHours = ageMs / (60 * 60 * 1000);
    const ageMinutes = ageMs / (60 * 1000);
    const ageSeconds = ageMs / 1000;

    const totalLifeMs = stats.lifeExpectancy * 365.25 * 24 * 60 * 60 * 1000;
    const lifeProgress = (ageMs / totalLifeMs) * 100;
    const remainingMs = totalLifeMs - ageMs;
    const remainingYears = remainingMs / (365.25 * 24 * 60 * 60 * 1000);
    const remainingDays = remainingMs / (24 * 60 * 60 * 1000);
    const remainingWeeks = remainingDays / 7;
    const remainingMonths = remainingYears * 12;
    const remainingHours = remainingMs / (60 * 60 * 1000);
    const remainingSaturdays = remainingWeeks;

    // Year progress
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
    const yearProgress = ((now.getTime() - startOfYear.getTime()) / (endOfYear.getTime() - startOfYear.getTime())) * 100;

    // Day progress
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayProgress = ((now.getTime() - startOfDay.getTime()) / (24 * 60 * 60 * 1000)) * 100;

    // Week progress (starting Monday)
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);
    const weekProgress = ((now.getTime() - startOfWeek.getTime()) / (7 * 24 * 60 * 60 * 1000)) * 100;

    // Month progress
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthProgress = ((now.getTime() - startOfMonth.getTime()) / (endOfMonth.getTime() - startOfMonth.getTime())) * 100;

    // Estimates (assuming 8 hours sleep, 8 hours work, etc.)
    const sleepHoursLived = (ageDays * 8);
    const workHoursLived = (ageYears - 18 > 0 ? (ageYears - 18) * 250 * 8 : 0); // 250 work days per year
    const mealsEaten = Math.floor(ageDays * 3);
    const heartbeats = Math.floor(ageMinutes * 70); // ~70 bpm average
    const breaths = Math.floor(ageMinutes * 15); // ~15 breaths per minute

    // Days until next birthday
    let nextBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBirthday <= now) {
      nextBirthday = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate());
    }
    const daysUntilBirthday = Math.ceil((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const nextBirthdayAge = nextBirthday.getFullYear() - birth.getFullYear();

    // Zodiac sign
    const zodiac = getZodiacSign(birth.getMonth() + 1, birth.getDate());

    // Generation
    const generation = getGeneration(birth.getFullYear());

    return {
      ageYears,
      ageDays: Math.floor(ageDays),
      ageWeeks: Math.floor(ageWeeks),
      ageMonths: Math.floor(ageMonths),
      ageHours: Math.floor(ageHours),
      ageMinutes: Math.floor(ageMinutes),
      ageSeconds: Math.floor(ageSeconds),
      lifeProgress: Math.min(lifeProgress, 100),
      remainingYears: Math.max(remainingYears, 0),
      remainingDays: Math.max(Math.floor(remainingDays), 0),
      remainingWeeks: Math.max(Math.floor(remainingWeeks), 0),
      remainingMonths: Math.max(Math.floor(remainingMonths), 0),
      remainingHours: Math.max(Math.floor(remainingHours), 0),
      remainingSaturdays: Math.max(Math.floor(remainingSaturdays), 0),
      yearProgress,
      dayProgress,
      weekProgress,
      monthProgress,
      sleepHoursLived: Math.floor(sleepHoursLived),
      workHoursLived: Math.floor(workHoursLived),
      mealsEaten,
      heartbeats,
      breaths,
      daysUntilBirthday,
      nextBirthdayAge,
      zodiacSign: zodiac.name,
      zodiacEmoji: zodiac.emoji,
      generation: generation.name,
      generationDescription: generation.description,
    };
  }, [stats.birthDate, stats.lifeExpectancy, now]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.floor(num));
  };

  const shareStats = async () => {
    if (!calculations) return;

    const shareUrl = buildLifeShareUrl({
      lifeProgress: calculations.lifeProgress,
      daysLived: calculations.ageDays,
      daysRemaining: calculations.remainingDays,
      saturdaysRemaining: calculations.remainingSaturdays,
      zodiacSign: `${calculations.zodiacEmoji} ${calculations.zodiacSign}`.trim(),
      generation: calculations.generation,
      theme: "signature",
    });

    const text = `Life Progress: ${calculations.lifeProgress.toFixed(1)}%
Age: ${calculations.ageYears.toFixed(1)} years
Days lived: ${formatNumber(calculations.ageDays)}
Remaining: ~${formatNumber(calculations.remainingDays)} days
Zodiac: ${calculations.zodiacEmoji} ${calculations.zodiacSign}
Generation: ${calculations.generation}

Make every day count!`;

    if (navigator.share) {
      try {
        await navigator.share({ text, url: shareUrl });
      } catch {
        navigator.clipboard.writeText(`${text}\nCheck yours: ${shareUrl}`);
        toast.success("Copied to clipboard!");
      }
    } else {
      navigator.clipboard.writeText(`${text}\nCheck yours: ${shareUrl}`);
      toast.success("Copied to clipboard!");
    }
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    gradient,
    animate = false,
  }: {
    icon: any;
    label: string;
    value: string | number;
    gradient: string;
    animate?: boolean;
  }) => (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-4 text-white",
        gradient,
        animate && "animate-pulse"
      )}
    >
      <div className="absolute top-0 right-0 w-20 h-20 opacity-20">
        <Icon className="w-full h-full" />
      </div>
      <div className="relative z-10">
        <Icon className="w-5 h-5 mb-2 opacity-80" />
        <p className="text-2xl md:text-3xl font-bold tabular-nums">{value}</p>
        <p className="text-sm opacity-80">{label}</p>
      </div>
    </div>
  );

  const LiveCounter = ({ value, label }: { value: number; label: string }) => (
    <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl">
      <p className="text-3xl md:text-4xl font-mono font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 bg-clip-text text-transparent tabular-nums">
        {formatNumber(value)}
      </p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );

  const ProgressBar = ({
    value,
    label,
    icon: Icon,
    gradientFrom = "from-purple-500",
    gradientTo = "to-pink-500",
    showPercent = true,
  }: {
    value: number;
    label: string;
    icon: any;
    gradientFrom?: string;
    gradientTo?: string;
    showPercent?: boolean;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        {showPercent && (
          <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">{value.toFixed(1)}%</span>
        )}
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-1000 rounded-full bg-gradient-to-r", gradientFrom, gradientTo)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );

  return (
    <Layout>
      <SEOHead
        title="Life Progress Bar - See Your Life in Perspective | TechTrendi"
        description="Visualize your life progress. See how much of your life you have lived, remaining time, and fascinating stats about your existence."
        canonicalUrl="https://techtrendi.com/tools/life-progress-bar"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-12">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 200 }}>
            <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
              <Sparkles className="w-3 h-3 mr-1" />
              Free Tool
            </Badge>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 bg-clip-text text-transparent">
              Life Progress Bar
            </span>
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See your life in perspective. Make every moment count.
          </motion.p>
        </motion.div>

        {/* Input */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card className="mb-8 border-2 border-purple-200 dark:border-purple-900 shadow-xl shadow-purple-500/10">
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2">
              <Cake className="w-5 h-5 text-pink-500" />
              Configure Your Life Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="birthdate">Your Birth Date</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={stats.birthDate}
                  onChange={(e) => setStats((prev) => ({ ...prev, birthDate: e.target.value }))}
                  max={new Date().toISOString().split("T")[0]}
                  className="text-center text-lg h-12 border-2 focus:border-purple-500"
                />
              </div>
              <div>
                <Label>Life Expectancy: {stats.lifeExpectancy} years</Label>
                <Slider
                  value={[stats.lifeExpectancy]}
                  onValueChange={([v]) =>
                    setStats((prev) => {
                      // Dragging away from the selected country's own figure
                      // means this is now a custom number, not that
                      // country's average — clear the dropdown so the two
                      // never show conflicting life expectancies at once.
                      const selectedCountry = LIFE_EXPECTANCY_BY_COUNTRY.find((c) => c.code === prev.country);
                      const stillMatches = selectedCountry && selectedCountry.years === v;
                      return {
                        ...prev,
                        lifeExpectancy: v,
                        country: stillMatches ? prev.country : "",
                      };
                    })
                  }
                  min={50}
                  max={120}
                  step={1}
                  className="mt-3"
                />
                <div className="mt-3">
                  <Label htmlFor="country-select" className="text-xs text-muted-foreground font-normal">
                    Not sure? Pick your country for an average estimate
                  </Label>
                  <Select
                    value={stats.country}
                    onValueChange={(code) => {
                      const match = LIFE_EXPECTANCY_BY_COUNTRY.find((c) => c.code === code);
                      setStats((prev) => ({
                        ...prev,
                        country: code,
                        lifeExpectancy: match ? match.years : prev.lifeExpectancy,
                      }));
                    }}
                  >
                    <SelectTrigger id="country-select" className="mt-1.5">
                      <SelectValue placeholder="Select a country..." />
                    </SelectTrigger>
                    <SelectContent>
                      {LIFE_EXPECTANCY_BY_COUNTRY.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name} ({c.years} years)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    National average, for fun — not medical advice. Fine-tune with the slider above.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {calculations ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* The emotional reveal — plays once per birth-date entry (key
                forces a remount/restart if the date changes), lands on a
                downloadable/shareable Life Card. Adjusting life expectancy
                afterward updates the frozen numbers/card in place without
                replaying the ~7s animation (see frozenStats sync effect
                inside LifeRevealSequence). Detailed stats below are the
                same content that already existed, untouched. */}
            <LifeRevealSequence
              key={stats.birthDate}
              stats={{
                daysLived: calculations.ageDays,
                daysRemaining: calculations.remainingDays,
                saturdaysRemaining: calculations.remainingSaturdays,
                lifeProgress: calculations.lifeProgress,
                zodiacSign: `${calculations.zodiacEmoji} ${calculations.zodiacSign}`.trim(),
                generation: calculations.generation,
              }}
            />

            {/* Main Life Progress */}
            <Reveal>
            <Card className="overflow-hidden border-0 shadow-2xl">
              <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 p-8 md:p-12 text-white text-center">
                <p className="text-sm uppercase tracking-widest opacity-80 mb-2">Your Life Progress</p>
                <p className="text-6xl md:text-8xl font-bold tabular-nums">
                  {calculations.lifeProgress.toFixed(2)}%
                </p>
                <p className="text-sm opacity-80 mt-2">
                  of your life has been lived
                </p>
              </div>
              <CardContent className="p-6 md:p-8 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
                {/* Main progress bar */}
                <div className="h-6 bg-muted rounded-full overflow-hidden mb-6">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-1000 rounded-full"
                    style={{ width: `${calculations.lifeProgress}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl">
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">{calculations.ageYears.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Years Old</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl">
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">{formatNumber(calculations.ageDays)}</p>
                    <p className="text-sm text-muted-foreground">Days Lived</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl">
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">{formatNumber(calculations.remainingDays)}</p>
                    <p className="text-sm text-muted-foreground">Days Remaining</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl">
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">{formatNumber(calculations.remainingSaturdays)}</p>
                    <p className="text-sm text-muted-foreground">Saturdays Left</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </Reveal>

            {/* Stats Grid — Colorful StatCards. "Total Seconds" lives only in
                the Live Counter card right below (same number, animated
                there) so it isn't shown twice in a row. */}
            <Reveal delay={0.05}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                icon={Calendar}
                label="Total Days"
                value={formatNumber(calculations.ageDays)}
                gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
              />
              <StatCard
                icon={Clock}
                label="Total Hours"
                value={formatNumber(calculations.ageHours)}
                gradient="bg-gradient-to-br from-purple-500 to-pink-500"
              />
              <StatCard
                icon={Timer}
                label="Total Minutes"
                value={formatNumber(calculations.ageMinutes)}
                gradient="bg-gradient-to-br from-orange-500 to-yellow-500"
              />
            </div>
            </Reveal>

            {/* Live Counter */}
            <Reveal delay={0.1}>
            <Card className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white overflow-hidden border-0 shadow-2xl">
              <CardContent className="pt-6 pb-6 text-center relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-red-500/10 animate-pulse" />
                <Timer className="w-8 h-8 mx-auto mb-3 text-pink-400" />
                <p className="text-4xl md:text-6xl font-mono font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent tabular-nums">
                  {formatNumber(calculations.ageSeconds)}
                </p>
                <p className="text-sm text-slate-400 mt-2">Total Seconds You Have Lived</p>
                <div className="flex justify-center gap-1 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-pink-500 animate-ping"
                      style={{ animationDelay: `${i * 200}ms` }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
            </Reveal>

            {/* Time Progress */}
            <Reveal delay={0.15}>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2 border-purple-200 dark:border-purple-900 shadow-xl shadow-purple-500/10">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    Time Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ProgressBar
                    value={calculations.dayProgress}
                    label="Today"
                    icon={Sun}
                    gradientFrom="from-yellow-400"
                    gradientTo="to-orange-500"
                  />
                  <ProgressBar
                    value={calculations.weekProgress}
                    label="This Week"
                    icon={Calendar}
                    gradientFrom="from-blue-500"
                    gradientTo="to-cyan-500"
                  />
                  <ProgressBar
                    value={calculations.monthProgress}
                    label="This Month"
                    icon={Calendar}
                    gradientFrom="from-purple-500"
                    gradientTo="to-pink-500"
                  />
                  <ProgressBar
                    value={calculations.yearProgress}
                    label={`Year ${now.getFullYear()}`}
                    icon={Target}
                    gradientFrom="from-green-500"
                    gradientTo="to-emerald-500"
                  />
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 dark:border-purple-900 shadow-xl shadow-purple-500/10">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-pink-500" />
                    Remaining Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <span>Years</span>
                      </div>
                      <span className="font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">{calculations.remainingYears.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span>Months</span>
                      </div>
                      <span className="font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">{formatNumber(calculations.remainingMonths)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <span>Weeks</span>
                      </div>
                      <span className="font-bold bg-gradient-to-r from-orange-600 to-yellow-500 bg-clip-text text-transparent">{formatNumber(calculations.remainingWeeks)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-500" />
                        <span>Hours</span>
                      </div>
                      <span className="font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">{formatNumber(calculations.remainingHours)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            </Reveal>

            {/* Next Birthday & Zodiac */}
            <Reveal delay={0.2}>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Next Birthday */}
              <Card className="overflow-hidden border-0 shadow-xl">
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-6 text-white">
                  <Gift className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-4xl font-bold tabular-nums">{calculations.daysUntilBirthday}</p>
                  <p className="text-sm opacity-80">Days Until Your Birthday</p>
                </div>
                <CardContent className="pt-4">
                  <p className="text-muted-foreground">
                    You will be turning <span className="font-bold text-foreground">{calculations.nextBirthdayAge}</span> years old!
                  </p>
                  {calculations.daysUntilBirthday <= 30 && (
                    <Badge className="mt-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      Birthday Coming Soon!
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Zodiac Sign */}
              <Card className="overflow-hidden border-0 shadow-xl">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                  <Star className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-4xl font-bold">{calculations.zodiacEmoji} {calculations.zodiacSign}</p>
                  <p className="text-sm opacity-80">Your Zodiac Sign</p>
                </div>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Generation:</span>
                  </div>
                  <p className="font-bold text-lg mt-1">{calculations.generation}</p>
                  <p className="text-sm text-muted-foreground">{calculations.generationDescription}</p>
                </CardContent>
              </Card>
            </div>
            </Reveal>

            {/* Fun Facts */}
            <Reveal delay={0.25}>
            <Card className="border-2 border-dashed border-pink-200 dark:border-pink-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Fun Facts About Your Life
                </CardTitle>
                <CardDescription>Based on average human statistics</CardDescription>
              </CardHeader>
              <CardContent>
                {/* One highlight row (Heartbeats + Breaths — the two most
                    visceral facts) plus a supporting tile grid, with no
                    stat repeated between the two. */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 rounded-xl">
                    <div className="p-3 bg-red-500 rounded-full text-white">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
                        {formatNumber(calculations.heartbeats)}
                      </p>
                      <p className="text-sm text-muted-foreground">Heartbeats (avg 70 bpm)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl">
                    <div className="p-3 bg-blue-500 rounded-full text-white">
                      <Wind className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                        {formatNumber(calculations.breaths)}
                      </p>
                      <p className="text-sm text-muted-foreground">Breaths Taken (avg 15/min)</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="relative overflow-hidden p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl text-center">
                    <Bed className="absolute top-1 right-1 w-12 h-12 opacity-10 text-blue-500" />
                    <Bed className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-lg font-bold">{formatNumber(calculations.sleepHoursLived)}</p>
                    <p className="text-xs text-muted-foreground">Hours Slept</p>
                  </div>
                  <div className="relative overflow-hidden p-4 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-xl text-center">
                    <Utensils className="absolute top-1 right-1 w-12 h-12 opacity-10 text-orange-500" />
                    <Utensils className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                    <p className="text-lg font-bold">{formatNumber(calculations.mealsEaten)}</p>
                    <p className="text-xs text-muted-foreground">Meals Eaten</p>
                  </div>
                  <div className="relative overflow-hidden p-4 bg-gradient-to-br from-slate-500/10 to-gray-500/10 rounded-xl text-center">
                    <Briefcase className="absolute top-1 right-1 w-12 h-12 opacity-10 text-slate-500" />
                    <Briefcase className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                    <p className="text-lg font-bold">{formatNumber(calculations.workHoursLived)}</p>
                    <p className="text-xs text-muted-foreground">Work Hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </Reveal>

            {/* Life Statistics Summary */}
            <Reveal delay={0.3}>
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Life Statistics Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <LiveCounter value={calculations.ageWeeks} label="Weeks Lived" />
                  <LiveCounter value={calculations.ageMonths} label="Months Lived" />
                  <LiveCounter value={calculations.remainingWeeks} label="Weeks Remaining" />
                  <LiveCounter value={calculations.remainingMonths} label="Months Remaining" />
                </div>
              </CardContent>
            </Card>
            </Reveal>

            {/* Share Button */}
            <Reveal delay={0.1}>
            <div className="flex justify-center">
              <Button
                onClick={shareStats}
                size="lg"
                className="gap-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25"
              >
                <Share2 className="w-4 h-4" />
                Share Your Life Stats
              </Button>
            </div>
            </Reveal>

            {/* Motivational Quote */}
            <Reveal delay={0.15}>
            <Card className="border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
              <CardContent className="pt-6 text-center">
                <Sparkles className="w-6 h-6 mx-auto mb-3 text-purple-500" />
                <p className="text-lg italic text-foreground">
                  "The trouble is, you think you have time."
                </p>
                <p className="text-sm text-muted-foreground mt-2">- Buddha</p>
              </CardContent>
            </Card>
            </Reveal>

            {/* More life & time calculators */}
            <Reveal delay={0.2}>
            <Link
              to="/tools/life-calculators"
              className="group flex items-center justify-between gap-4 p-5 rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-900 hover:border-solid hover:border-purple-400 dark:hover:border-purple-600 transition-colors"
            >
              <div>
                <p className="font-semibold text-foreground">More life & time calculators</p>
                <p className="text-sm text-muted-foreground">Birthday Countdown, Life in Weeks, Retirement Countdown, and more — coming soon</p>
              </div>
              <span className="shrink-0 text-primary font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                Explore <TrendingUp className="w-4 h-4" />
              </span>
            </Link>
            </Reveal>
          </div>
        ) : (
          <Card className="border-2 border-dashed border-purple-200 dark:border-purple-900">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
                <Clock className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                Enter Your Birth Date
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                See fascinating stats about your life journey and how much time you have left to make it count.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
