import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Heart, Sparkles, Users, Calendar, Share2, RotateCcw, Trash2, Star,
  Twitter, Facebook, Copy, Check, Flame, HeartHandshake, PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────────
interface CompatibilityResult {
  id: string;
  person1: string;
  person2: string;
  person1Birthday?: string;
  person2Birthday?: string;
  person1Zodiac?: ZodiacSign;
  person2Zodiac?: ZodiacSign;
  nameCompatibility: number;
  zodiacCompatibility: number;
  lovePercentage: number;
  friendshipScore: number;
  overallScore: number;
  timestamp: Date;
}

interface ZodiacSign {
  name: string;
  symbol: string;
  element: string;
  traits: string[];
  compatible: string[];
  dates: string;
}

// ─── Zodiac Data ────────────────────────────────────────────────────
const ZODIAC_SIGNS: Record<string, ZodiacSign> = {
  aries: {
    name: "Aries",
    symbol: "♈",
    element: "Fire",
    traits: ["Bold", "Ambitious", "Passionate", "Confident"],
    compatible: ["Leo", "Sagittarius", "Gemini", "Aquarius"],
    dates: "Mar 21 - Apr 19",
  },
  taurus: {
    name: "Taurus",
    symbol: "♉",
    element: "Earth",
    traits: ["Reliable", "Patient", "Devoted", "Sensual"],
    compatible: ["Virgo", "Capricorn", "Cancer", "Pisces"],
    dates: "Apr 20 - May 20",
  },
  gemini: {
    name: "Gemini",
    symbol: "♊",
    element: "Air",
    traits: ["Adaptable", "Curious", "Witty", "Expressive"],
    compatible: ["Libra", "Aquarius", "Aries", "Leo"],
    dates: "May 21 - Jun 20",
  },
  cancer: {
    name: "Cancer",
    symbol: "♋",
    element: "Water",
    traits: ["Intuitive", "Sentimental", "Protective", "Loyal"],
    compatible: ["Scorpio", "Pisces", "Taurus", "Virgo"],
    dates: "Jun 21 - Jul 22",
  },
  leo: {
    name: "Leo",
    symbol: "♌",
    element: "Fire",
    traits: ["Creative", "Generous", "Warm", "Charismatic"],
    compatible: ["Aries", "Sagittarius", "Gemini", "Libra"],
    dates: "Jul 23 - Aug 22",
  },
  virgo: {
    name: "Virgo",
    symbol: "♍",
    element: "Earth",
    traits: ["Analytical", "Practical", "Kind", "Hardworking"],
    compatible: ["Taurus", "Capricorn", "Cancer", "Scorpio"],
    dates: "Aug 23 - Sep 22",
  },
  libra: {
    name: "Libra",
    symbol: "♎",
    element: "Air",
    traits: ["Diplomatic", "Fair", "Social", "Romantic"],
    compatible: ["Gemini", "Aquarius", "Leo", "Sagittarius"],
    dates: "Sep 23 - Oct 22",
  },
  scorpio: {
    name: "Scorpio",
    symbol: "♏",
    element: "Water",
    traits: ["Passionate", "Determined", "Mysterious", "Loyal"],
    compatible: ["Cancer", "Pisces", "Virgo", "Capricorn"],
    dates: "Oct 23 - Nov 21",
  },
  sagittarius: {
    name: "Sagittarius",
    symbol: "♐",
    element: "Fire",
    traits: ["Optimistic", "Adventurous", "Honest", "Philosophical"],
    compatible: ["Aries", "Leo", "Libra", "Aquarius"],
    dates: "Nov 22 - Dec 21",
  },
  capricorn: {
    name: "Capricorn",
    symbol: "♑",
    element: "Earth",
    traits: ["Responsible", "Disciplined", "Ambitious", "Patient"],
    compatible: ["Taurus", "Virgo", "Scorpio", "Pisces"],
    dates: "Dec 22 - Jan 19",
  },
  aquarius: {
    name: "Aquarius",
    symbol: "♒",
    element: "Air",
    traits: ["Independent", "Original", "Humanitarian", "Inventive"],
    compatible: ["Gemini", "Libra", "Aries", "Sagittarius"],
    dates: "Jan 20 - Feb 18",
  },
  pisces: {
    name: "Pisces",
    symbol: "♓",
    element: "Water",
    traits: ["Compassionate", "Artistic", "Intuitive", "Gentle"],
    compatible: ["Cancer", "Scorpio", "Taurus", "Capricorn"],
    dates: "Feb 19 - Mar 20",
  },
};

// ─── Fun Advice Messages ────────────────────────────────────────────
const ADVICE_MESSAGES: Record<string, string[]> = {
  perfect: [
    "You two are made for each other! Start planning the wedding!",
    "Soulmate alert! This connection is written in the stars!",
    "Wow! The universe definitely wants you two together!",
    "This is the kind of love stories are written about!",
    "Twin flames detected! Your souls are perfectly aligned!",
  ],
  excellent: [
    "Amazing chemistry! You complement each other beautifully!",
    "This is a match that could stand the test of time!",
    "Your energies flow together like a perfect dance!",
    "The stars are definitely smiling on this connection!",
    "A beautiful blend of personalities - cherish this bond!",
  ],
  good: [
    "Great potential here! With effort, this could be beautiful!",
    "You have a solid foundation for a meaningful relationship!",
    "There's real chemistry brewing between you two!",
    "Good vibes all around - keep nurturing this connection!",
    "A promising match with room to grow even stronger!",
  ],
  moderate: [
    "Opposites can attract! Your differences can be your strength!",
    "There's something intriguing here - explore it!",
    "With understanding and patience, magic can happen!",
    "Sometimes the best relationships need a little work!",
    "Challenge accepted? This could be a rewarding journey!",
  ],
  challenging: [
    "Every love story has its challenges - this one's an adventure!",
    "They say the best things in life don't come easy!",
    "A unique pairing that requires creativity and patience!",
    "Different paths can lead to the same destination!",
    "Love works in mysterious ways - don't give up!",
  ],
  difficult: [
    "This is a true test of compatibility - are you up for it?",
    "Sometimes the universe tests us - this might be one!",
    "A challenging match, but impossible is just a word!",
    "If you're both determined, anything is possible!",
    "The heart wants what it wants - follow it wisely!",
  ],
};

// ─── Utility Functions ──────────────────────────────────────────────
const getZodiacSign = (birthday: string): ZodiacSign | undefined => {
  const date = new Date(birthday);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return ZODIAC_SIGNS.aries;
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return ZODIAC_SIGNS.taurus;
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return ZODIAC_SIGNS.gemini;
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return ZODIAC_SIGNS.cancer;
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return ZODIAC_SIGNS.leo;
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return ZODIAC_SIGNS.virgo;
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return ZODIAC_SIGNS.libra;
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return ZODIAC_SIGNS.scorpio;
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return ZODIAC_SIGNS.sagittarius;
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return ZODIAC_SIGNS.capricorn;
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return ZODIAC_SIGNS.aquarius;
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return ZODIAC_SIGNS.pisces;
  return undefined;
};

const calculateNameCompatibility = (name1: string, name2: string): number => {
  const cleanName1 = name1.toLowerCase().replace(/[^a-z]/g, "");
  const cleanName2 = name2.toLowerCase().replace(/[^a-z]/g, "");

  if (!cleanName1 || !cleanName2) return 50;

  // Count matching letters
  let matches = 0;
  const letters1 = cleanName1.split("");
  const letters2 = cleanName2.split("");

  const letterCounts1: Record<string, number> = {};
  const letterCounts2: Record<string, number> = {};

  letters1.forEach(l => letterCounts1[l] = (letterCounts1[l] || 0) + 1);
  letters2.forEach(l => letterCounts2[l] = (letterCounts2[l] || 0) + 1);

  Object.keys(letterCounts1).forEach(letter => {
    if (letterCounts2[letter]) {
      matches += Math.min(letterCounts1[letter], letterCounts2[letter]);
    }
  });

  // Calculate based on letter frequency and name length
  const totalLetters = cleanName1.length + cleanName2.length;
  const matchRatio = (matches * 2) / totalLetters;

  // Add some variation based on first/last letter matching
  let bonus = 0;
  if (cleanName1[0] === cleanName2[0]) bonus += 10;
  if (cleanName1[cleanName1.length - 1] === cleanName2[cleanName2.length - 1]) bonus += 10;

  // Calculate vowel harmony
  const vowels = "aeiou";
  const vowelCount1 = letters1.filter(l => vowels.includes(l)).length;
  const vowelCount2 = letters2.filter(l => vowels.includes(l)).length;
  const vowelHarmony = 1 - Math.abs(vowelCount1 / cleanName1.length - vowelCount2 / cleanName2.length);

  const baseScore = Math.round(matchRatio * 60 + vowelHarmony * 20 + bonus);
  return Math.min(100, Math.max(20, baseScore + Math.floor(Math.random() * 15)));
};

const calculateZodiacCompatibility = (sign1?: ZodiacSign, sign2?: ZodiacSign): number => {
  if (!sign1 || !sign2) return 0;

  // Check if they're in each other's compatible list
  const isCompatible1 = sign1.compatible.includes(sign2.name);
  const isCompatible2 = sign2.compatible.includes(sign1.name);

  // Same sign bonus/penalty
  if (sign1.name === sign2.name) {
    return 75 + Math.floor(Math.random() * 15);
  }

  // Both compatible with each other
  if (isCompatible1 && isCompatible2) {
    return 85 + Math.floor(Math.random() * 15);
  }

  // One is compatible with the other
  if (isCompatible1 || isCompatible2) {
    return 65 + Math.floor(Math.random() * 15);
  }

  // Same element bonus
  if (sign1.element === sign2.element) {
    return 70 + Math.floor(Math.random() * 15);
  }

  // Complementary elements
  const complementary: Record<string, string> = {
    Fire: "Air",
    Air: "Fire",
    Water: "Earth",
    Earth: "Water",
  };

  if (complementary[sign1.element] === sign2.element) {
    return 60 + Math.floor(Math.random() * 15);
  }

  // Default moderate compatibility
  return 40 + Math.floor(Math.random() * 20);
};

const calculateLovePercentage = (name1: string, name2: string): number => {
  // Fun "FLAMES" style algorithm
  const combined = (name1 + name2).toLowerCase().replace(/[^a-z]/g, "");
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i);
    hash = hash & hash;
  }

  // Make it feel more "magical"
  const base = Math.abs(hash % 60) + 30;
  const bonus = (name1.length + name2.length) % 15;
  return Math.min(99, Math.max(25, base + bonus));
};

const calculateFriendshipScore = (name1: string, name2: string, zodiac1?: ZodiacSign, zodiac2?: ZodiacSign): number => {
  let score = 50;

  // Name length similarity
  const lengthDiff = Math.abs(name1.length - name2.length);
  score += Math.max(0, 20 - lengthDiff * 3);

  // First letter proximity in alphabet
  const firstLetterDiff = Math.abs(name1.toLowerCase().charCodeAt(0) - name2.toLowerCase().charCodeAt(0));
  score += Math.max(0, 15 - firstLetterDiff);

  // Element compatibility for friendship
  if (zodiac1 && zodiac2) {
    if (zodiac1.element === zodiac2.element) {
      score += 15;
    }
    // Air and Fire are social elements
    if ((zodiac1.element === "Air" || zodiac1.element === "Fire") &&
        (zodiac2.element === "Air" || zodiac2.element === "Fire")) {
      score += 10;
    }
  }

  return Math.min(100, Math.max(30, score + Math.floor(Math.random() * 10)));
};

const getAdviceCategory = (score: number): string => {
  if (score >= 90) return "perfect";
  if (score >= 75) return "excellent";
  if (score >= 60) return "good";
  if (score >= 45) return "moderate";
  if (score >= 30) return "challenging";
  return "difficult";
};

const getRandomAdvice = (score: number): string => {
  const category = getAdviceCategory(score);
  const messages = ADVICE_MESSAGES[category];
  return messages[Math.floor(Math.random() * messages.length)];
};

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// ─── Confetti Component ─────────────────────────────────────────────
const Confetti = ({ show }: { show: boolean }) => {
  if (!show) return null;

  const colors = ["#ff6b9d", "#c44569", "#e056fd", "#f8b500", "#ff4757", "#ff6348"];
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{ y: -20, x: `${piece.x}vw`, rotate: 0, opacity: 1 }}
          animate={{
            y: "110vh",
            rotate: piece.rotation * 3,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "linear",
          }}
          className="absolute w-3 h-3"
          style={{
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "0",
          }}
        />
      ))}
    </div>
  );
};

// ─── Floating Hearts Component ──────────────────────────────────────
const FloatingHearts = () => {
  const hearts = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: 10 + Math.random() * 20,
    delay: Math.random() * 5,
    duration: 5 + Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          initial={{ y: "100%", x: `${heart.x}%`, opacity: 0 }}
          animate={{
            y: "-20%",
            opacity: [0, 0.6, 0.6, 0],
          }}
          transition={{
            duration: heart.duration,
            delay: heart.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute text-pink-400/40"
          style={{ fontSize: heart.size }}
        >
          <Heart className="fill-current" />
        </motion.div>
      ))}
    </div>
  );
};

// ─── Love Meter Component ───────────────────────────────────────────
const LoveMeter = ({ score, label }: { score: number; label: string }) => {
  const getGradient = (value: number) => {
    if (value >= 80) return "from-pink-500 via-rose-500 to-red-500";
    if (value >= 60) return "from-purple-500 via-pink-500 to-rose-500";
    if (value >= 40) return "from-blue-500 via-purple-500 to-pink-500";
    return "from-slate-400 via-purple-400 to-pink-400";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
          {score}%
        </span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full bg-gradient-to-r",
            getGradient(score)
          )}
        />
      </div>
    </div>
  );
};

// ─── Zodiac Card Component ──────────────────────────────────────────
const ZodiacCard = ({ sign, name }: { sign: ZodiacSign; name: string }) => {
  const getElementColor = (element: string) => {
    switch (element) {
      case "Fire": return "text-orange-500 bg-orange-500/10 border-orange-500/30";
      case "Water": return "text-blue-500 bg-blue-500/10 border-blue-500/30";
      case "Earth": return "text-green-500 bg-green-500/10 border-green-500/30";
      case "Air": return "text-purple-500 bg-purple-500/10 border-purple-500/30";
      default: return "text-muted-foreground bg-muted border-border";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "p-4 rounded-xl border-2",
        getElementColor(sign.element)
      )}
    >
      <div className="text-center space-y-2">
        <div className="text-4xl">{sign.symbol}</div>
        <div className="font-semibold">{name}</div>
        <div className="text-2xl font-bold">{sign.name}</div>
        <div className="text-xs opacity-75">{sign.dates}</div>
        <div className="flex flex-wrap justify-center gap-1 mt-2">
          {sign.traits.map((trait) => (
            <span
              key={trait}
              className="text-xs px-2 py-0.5 rounded-full bg-background/50"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────
export default function CompatibilityCalculator() {
  const [person1, setPerson1] = useState("");
  const [person2, setPerson2] = useState("");
  const [birthday1, setBirthday1] = useState("");
  const [birthday2, setBirthday2] = useState("");
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [history, setHistory] = useState<CompatibilityResult[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("compatibility-history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem("compatibility-history", JSON.stringify(history));
  }, [history]);

  const calculateCompatibility = useCallback(() => {
    if (!person1.trim() || !person2.trim()) return;

    setIsCalculating(true);

    // Simulate calculation time for dramatic effect
    setTimeout(() => {
      const zodiac1 = birthday1 ? getZodiacSign(birthday1) : undefined;
      const zodiac2 = birthday2 ? getZodiacSign(birthday2) : undefined;

      const nameCompat = calculateNameCompatibility(person1, person2);
      const zodiacCompat = calculateZodiacCompatibility(zodiac1, zodiac2);
      const love = calculateLovePercentage(person1, person2);
      const friendship = calculateFriendshipScore(person1, person2, zodiac1, zodiac2);

      // Calculate overall score
      let overall: number;
      if (zodiacCompat > 0) {
        overall = Math.round(nameCompat * 0.25 + zodiacCompat * 0.25 + love * 0.3 + friendship * 0.2);
      } else {
        overall = Math.round(nameCompat * 0.35 + love * 0.4 + friendship * 0.25);
      }

      const newResult: CompatibilityResult = {
        id: generateId(),
        person1: person1.trim(),
        person2: person2.trim(),
        person1Birthday: birthday1 || undefined,
        person2Birthday: birthday2 || undefined,
        person1Zodiac: zodiac1,
        person2Zodiac: zodiac2,
        nameCompatibility: nameCompat,
        zodiacCompatibility: zodiacCompat,
        lovePercentage: love,
        friendshipScore: friendship,
        overallScore: overall,
        timestamp: new Date(),
      };

      setResult(newResult);
      setHistory((prev) => [newResult, ...prev.slice(0, 9)]);
      setIsCalculating(false);

      // Show confetti for high scores
      if (overall >= 75) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }, 1500);
  }, [person1, person2, birthday1, birthday2]);

  const resetForm = () => {
    setPerson1("");
    setPerson2("");
    setBirthday1("");
    setBirthday2("");
    setResult(null);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("compatibility-history");
  };

  const loadFromHistory = (record: CompatibilityResult) => {
    setPerson1(record.person1);
    setPerson2(record.person2);
    setBirthday1(record.person1Birthday || "");
    setBirthday2(record.person2Birthday || "");
    setResult(record);
  };

  const shareResult = async (platform: "twitter" | "facebook" | "copy") => {
    if (!result) return;

    const text = `I just calculated compatibility between ${result.person1} and ${result.person2}! They got ${result.overallScore}% overall! Check yours at TechTrendi!`;
    const url = window.location.href;

    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
          "_blank"
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
          "_blank"
        );
        break;
      case "copy":
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
    }
  };

  const getScoreEmoji = (score: number): string => {
    if (score >= 90) return "💖💖💖";
    if (score >= 75) return "💕💕";
    if (score >= 60) return "💗";
    if (score >= 45) return "💜";
    if (score >= 30) return "💙";
    return "🤍";
  };

  return (
    <Layout>
      <SEOHead
        title="Love & Compatibility Calculator - Fun Relationship Tool"
        description="Calculate your love compatibility! Enter two names and optional birthdates to discover your name compatibility, zodiac match, love percentage, and friendship score. Fun and shareable!"
        keywords="love calculator, compatibility test, zodiac compatibility, relationship calculator, name compatibility, love percentage"
        canonicalUrl="/tools/compatibility-calculator"
      />

      <Confetti show={showConfetti} />

      <div className="min-h-screen relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-rose-500/5" />
        <FloatingHearts />

        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Heart className="w-10 h-10 text-pink-500 fill-pink-500" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 bg-clip-text text-transparent">
                Compatibility Calculator
              </h1>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
              >
                <Sparkles className="w-10 h-10 text-purple-500" />
              </motion.div>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Discover your love compatibility! Enter two names and optional birthdates
              to reveal your cosmic connection.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Input Section */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-2 border-pink-200 dark:border-pink-900/30 bg-gradient-to-br from-white to-pink-50 dark:from-background dark:to-pink-950/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
                    <Users className="w-5 h-5" />
                    Enter Your Names
                  </CardTitle>
                  <CardDescription>
                    Add birthdates for zodiac compatibility bonus!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Person 1 */}
                    <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-pink-100/50 to-purple-100/50 dark:from-pink-950/30 dark:to-purple-950/30">
                      <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 font-semibold">
                        <Heart className="w-4 h-4 fill-current" />
                        Person 1
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="person1">Name</Label>
                        <Input
                          id="person1"
                          placeholder="Enter first name..."
                          value={person1}
                          onChange={(e) => setPerson1(e.target.value)}
                          className="bg-white dark:bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birthday1" className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Birthday (Optional)
                        </Label>
                        <Input
                          id="birthday1"
                          type="date"
                          value={birthday1}
                          onChange={(e) => setBirthday1(e.target.value)}
                          className="bg-white dark:bg-background"
                        />
                      </div>
                    </div>

                    {/* Heart Divider (Mobile) */}
                    <div className="flex md:hidden items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      >
                        <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
                      </motion.div>
                    </div>

                    {/* Person 2 */}
                    <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-purple-100/50 to-rose-100/50 dark:from-purple-950/30 dark:to-rose-950/30">
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold">
                        <Heart className="w-4 h-4 fill-current" />
                        Person 2
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="person2">Name</Label>
                        <Input
                          id="person2"
                          placeholder="Enter second name..."
                          value={person2}
                          onChange={(e) => setPerson2(e.target.value)}
                          className="bg-white dark:bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birthday2" className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Birthday (Optional)
                        </Label>
                        <Input
                          id="birthday2"
                          type="date"
                          value={birthday2}
                          onChange={(e) => setBirthday2(e.target.value)}
                          className="bg-white dark:bg-background"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={calculateCompatibility}
                      disabled={!person1.trim() || !person2.trim() || isCalculating}
                      className="flex-1 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 hover:from-pink-600 hover:via-rose-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all"
                      size="lg"
                    >
                      {isCalculating ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Heart className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <Heart className="w-5 h-5 fill-current" />
                      )}
                      {isCalculating ? "Calculating..." : "Calculate Love"}
                    </Button>
                    <Button
                      onClick={resetForm}
                      variant="outline"
                      className="border-pink-300 text-pink-600 hover:bg-pink-50 dark:border-pink-800 dark:text-pink-400 dark:hover:bg-pink-950/30"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Try Another Pair
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Results Section */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="border-2 border-purple-200 dark:border-purple-900/30 bg-gradient-to-br from-white to-purple-50 dark:from-background dark:to-purple-950/10 overflow-hidden">
                      <CardHeader className="relative">
                        <div className="absolute top-0 right-0 p-4 text-4xl">
                          {getScoreEmoji(result.overallScore)}
                        </div>
                        <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                          <Sparkles className="w-5 h-5" />
                          Your Results
                        </CardTitle>
                        <CardDescription>
                          {result.person1} + {result.person2}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Overall Score */}
                        <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950/30 dark:to-purple-950/30">
                          <div className="text-sm text-muted-foreground mb-2">Overall Compatibility</div>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className="relative inline-block"
                          >
                            <div className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 bg-clip-text text-transparent">
                              {result.overallScore}%
                            </div>
                            {result.overallScore >= 75 && (
                              <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                                className="absolute -top-2 -right-2"
                              >
                                <PartyPopper className="w-8 h-8 text-yellow-500" />
                              </motion.div>
                            )}
                          </motion.div>
                          <p className="mt-4 text-lg font-medium text-foreground">
                            {getRandomAdvice(result.overallScore)}
                          </p>
                        </div>

                        {/* Individual Scores */}
                        <div className="space-y-4">
                          <LoveMeter score={result.lovePercentage} label="Love Percentage" />
                          <LoveMeter score={result.nameCompatibility} label="Name Compatibility" />
                          <LoveMeter score={result.friendshipScore} label="Friendship Score" />
                          {result.zodiacCompatibility > 0 && (
                            <LoveMeter score={result.zodiacCompatibility} label="Zodiac Compatibility" />
                          )}
                        </div>

                        {/* Zodiac Cards */}
                        {(result.person1Zodiac || result.person2Zodiac) && (
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <Star className="w-5 h-5 text-yellow-500" />
                              Zodiac Signs
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                              {result.person1Zodiac && (
                                <ZodiacCard sign={result.person1Zodiac} name={result.person1} />
                              )}
                              {result.person2Zodiac && (
                                <ZodiacCard sign={result.person2Zodiac} name={result.person2} />
                              )}
                            </div>
                          </div>
                        )}

                        {/* Share Buttons */}
                        <div className="pt-4 border-t">
                          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                            <Share2 className="w-4 h-4" />
                            Share Your Results
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => shareResult("twitter")}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <Twitter className="w-4 h-4" />
                              Twitter
                            </Button>
                            <Button
                              onClick={() => shareResult("facebook")}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <Facebook className="w-4 h-4" />
                              Facebook
                            </Button>
                            <Button
                              onClick={() => shareResult("copy")}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              {copied ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                              {copied ? "Copied!" : "Copy Link"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* History Sidebar */}
            <div className="space-y-6">
              <Card className="border-2 border-rose-200 dark:border-rose-900/30">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                      <HeartHandshake className="w-5 h-5" />
                      History
                    </CardTitle>
                    <CardDescription>
                      Previous calculations
                    </CardDescription>
                  </div>
                  {history.length > 0 && (
                    <Button
                      onClick={clearHistory}
                      variant="ghost"
                      size="sm"
                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No calculations yet.</p>
                      <p className="text-xs">Your history will appear here!</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {history.map((record) => (
                        <motion.button
                          key={record.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => loadFromHistory(record)}
                          className={cn(
                            "w-full p-3 rounded-lg text-left transition-all",
                            "bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20",
                            "hover:from-pink-100 hover:to-purple-100 dark:hover:from-pink-950/40 dark:hover:to-purple-950/40",
                            "border border-pink-200 dark:border-pink-900/30",
                            result?.id === record.id && "ring-2 ring-pink-500"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Flame className="w-4 h-4 text-pink-500" />
                              <span className="font-medium text-sm">
                                {record.person1} + {record.person2}
                              </span>
                            </div>
                            <span className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                              {record.overallScore}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {record.person1Zodiac && (
                              <span>{record.person1Zodiac.symbol}</span>
                            )}
                            {record.person2Zodiac && (
                              <span>{record.person2Zodiac.symbol}</span>
                            )}
                            <span className="ml-auto">
                              {new Date(record.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Fun Facts Card */}
              <Card className="border-2 border-yellow-200 dark:border-yellow-900/30 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/10 dark:to-orange-950/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-lg">
                    <Sparkles className="w-5 h-5" />
                    Did You Know?
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3 text-muted-foreground">
                  <p>
                    <span className="text-2xl mr-2">🔥</span>
                    Fire signs (Aries, Leo, Sagittarius) are most compatible with Air signs!
                  </p>
                  <p>
                    <span className="text-2xl mr-2">💧</span>
                    Water signs (Cancer, Scorpio, Pisces) connect deeply with Earth signs!
                  </p>
                  <p>
                    <span className="text-2xl mr-2">✨</span>
                    Names with similar vowel patterns often share creative energy!
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
