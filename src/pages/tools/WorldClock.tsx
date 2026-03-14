import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Clock, Globe, Sun, Moon, Plus, Trash2, Search, Users,
  Star, Save, ChevronDown, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ── IANA Timezone List ──────────────────────────────────────────────
const ALL_TIMEZONES: string[] = (() => {
  // Use Intl if available, otherwise provide a comprehensive fallback
  if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
    try {
      return (Intl as any).supportedValuesOf("timeZone") as string[];
    } catch {
      // fallback below
    }
  }
  return [
    "UTC",
    "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "America/Anchorage", "America/Toronto", "America/Vancouver", "America/Mexico_City",
    "America/Sao_Paulo", "America/Buenos_Aires", "America/Bogota", "America/Lima",
    "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Europe/Rome",
    "Europe/Amsterdam", "Europe/Brussels", "Europe/Zurich", "Europe/Moscow",
    "Europe/Istanbul", "Europe/Warsaw", "Europe/Athens", "Europe/Helsinki",
    "Europe/Stockholm", "Europe/Oslo", "Europe/Copenhagen", "Europe/Dublin",
    "Europe/Lisbon", "Europe/Vienna", "Europe/Prague", "Europe/Budapest",
    "Asia/Tokyo", "Asia/Shanghai", "Asia/Hong_Kong", "Asia/Singapore",
    "Asia/Seoul", "Asia/Kolkata", "Asia/Dubai", "Asia/Bangkok",
    "Asia/Jakarta", "Asia/Taipei", "Asia/Manila", "Asia/Karachi",
    "Asia/Dhaka", "Asia/Riyadh", "Asia/Tehran", "Asia/Kuala_Lumpur",
    "Africa/Accra", "Africa/Lagos", "Africa/Cairo", "Africa/Nairobi",
    "Africa/Johannesburg", "Africa/Casablanca", "Africa/Addis_Ababa",
    "Africa/Dar_es_Salaam", "Africa/Kampala", "Africa/Lusaka",
    "Australia/Sydney", "Australia/Melbourne", "Australia/Perth",
    "Australia/Brisbane", "Australia/Adelaide",
    "Pacific/Auckland", "Pacific/Fiji", "Pacific/Honolulu",
    "Pacific/Guam", "Pacific/Samoa",
    "Indian/Maldives", "Indian/Mauritius",
  ];
})();

// ── Default Timezones ───────────────────────────────────────────────
const DEFAULT_TIMEZONES = [
  Intl.DateTimeFormat().resolvedOptions().timeZone,
  "UTC",
  "America/New_York",
  "Europe/London",
  "Asia/Tokyo",
  "Africa/Accra",
  "Africa/Lagos",
  "Asia/Dubai",
];

// ── Favorite sets storage key ───────────────────────────────────────
const STORAGE_KEY = "worldclock_favorites";
const SELECTED_TZ_KEY = "worldclock_selected";

// ── Helpers ─────────────────────────────────────────────────────────
function getTimeInTimezone(tz: string, date: Date = new Date()) {
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
    return {
      hour: parseInt(get("hour")),
      minute: get("minute"),
      second: get("second"),
      ampm: get("dayPeriod"),
      weekday: get("weekday"),
      month: get("month"),
      day: get("day"),
      year: get("year"),
      hour24: parseInt(
        new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(date)
      ),
    };
  } catch {
    return { hour: 12, minute: "00", second: "00", ampm: "PM", weekday: "Mon", month: "Jan", day: "1", year: "2026", hour24: 12 };
  }
}

function getUtcOffset(tz: string): string {
  try {
    const now = new Date();
    const tzStr = now.toLocaleString("en-US", { timeZone: tz, timeZoneName: "shortOffset" });
    const match = tzStr.match(/GMT([+-]\d{1,2}(?::\d{2})?)/);
    if (match) return `UTC${match[1]}`;
    // check if UTC
    const offsetStr = now.toLocaleString("en-US", { timeZone: tz, timeZoneName: "short" });
    if (offsetStr.includes("UTC") || offsetStr.includes("GMT")) return "UTC+0";
    return "";
  } catch {
    return "";
  }
}

function isDaytime(hour24: number): boolean {
  return hour24 >= 6 && hour24 < 18;
}

function getCityName(tz: string): string {
  if (tz === "UTC") return "UTC";
  const parts = tz.split("/");
  return parts[parts.length - 1].replace(/_/g, " ");
}

function getRegionName(tz: string): string {
  if (tz === "UTC") return "Coordinated Universal Time";
  return tz.replace(/_/g, " ");
}

// Work hours overlap calculation
function getWorkHourStatus(timezones: string[], hour: number): "green" | "yellow" | "red" {
  // For a given UTC hour, check how many timezones are in 9-17 range
  const date = new Date();
  date.setUTCHours(hour, 0, 0, 0);
  let awakeCount = 0;
  for (const tz of timezones) {
    const info = getTimeInTimezone(tz, date);
    if (info.hour24 >= 9 && info.hour24 < 17) {
      awakeCount++;
    }
  }
  const ratio = awakeCount / timezones.length;
  if (ratio >= 0.8) return "green";
  if (ratio >= 0.4) return "yellow";
  return "red";
}

// ── Analog Clock Component ──────────────────────────────────────────
function AnalogClock({ hour24, minute, second, isDark }: { hour24: number; minute: string; second: string; isDark: boolean }) {
  const h = hour24 % 12;
  const m = parseInt(minute);
  const s = parseInt(second);
  const hourDeg = (h + m / 60) * 30;
  const minDeg = (m + s / 60) * 6;
  const secDeg = s * 6;

  return (
    <div className={cn(
      "relative w-28 h-28 rounded-full border-2 mx-auto",
      isDark ? "border-indigo-400 bg-indigo-950/50" : "border-amber-400 bg-amber-50/50"
    )}>
      {/* Hour markers */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 origin-center"
          style={{
            transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-48px)`,
          }}
        >
          <div className={cn(
            "rounded-full",
            i % 3 === 0 ? "w-1.5 h-1.5" : "w-1 h-1",
            isDark ? "bg-indigo-300" : "bg-amber-600"
          )} />
        </div>
      ))}

      {/* Hour hand */}
      <div
        className="absolute left-1/2 bottom-1/2 origin-bottom"
        style={{ transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
      >
        <div className={cn("w-1 h-8 rounded-full", isDark ? "bg-indigo-200" : "bg-amber-800")} />
      </div>

      {/* Minute hand */}
      <div
        className="absolute left-1/2 bottom-1/2 origin-bottom"
        style={{ transform: `translateX(-50%) rotate(${minDeg}deg)` }}
      >
        <div className={cn("w-0.5 h-10 rounded-full", isDark ? "bg-indigo-300" : "bg-amber-700")} />
      </div>

      {/* Second hand */}
      <div
        className="absolute left-1/2 bottom-1/2 origin-bottom"
        style={{ transform: `translateX(-50%) rotate(${secDeg}deg)` }}
      >
        <div className="w-[1px] h-11 bg-red-500 rounded-full" />
      </div>

      {/* Center dot */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500" />
    </div>
  );
}

// ── Timezone Card Component ─────────────────────────────────────────
function TimezoneCard({
  tz,
  now,
  showAnalog,
  onRemove,
  canRemove,
}: {
  tz: string;
  now: Date;
  showAnalog: boolean;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const info = getTimeInTimezone(tz, now);
  const offset = getUtcOffset(tz);
  const city = getCityName(tz);
  const dark = !isDaytime(info.hour24);
  const isLocal = tz === Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "relative overflow-hidden transition-all hover:shadow-lg",
        dark
          ? "bg-gradient-to-br from-indigo-950/80 to-slate-900/80 border-indigo-800/50"
          : "bg-gradient-to-br from-amber-50/80 to-orange-50/80 border-amber-200/50 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800/30"
      )}>
        {/* Day/night indicator strip */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1",
          dark ? "bg-indigo-500" : "bg-amber-400"
        )} />

        <CardContent className="pt-5 pb-4 px-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {dark ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <h3 className={cn(
                "font-semibold text-sm",
                dark ? "text-indigo-100" : "text-amber-900 dark:text-amber-200"
              )}>
                {city}
              </h3>
              {isLocal && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                  Local
                </Badge>
              )}
            </div>
            {canRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-50 hover:opacity-100"
                onClick={onRemove}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          {showAnalog && (
            <div className="mb-3">
              <AnalogClock
                hour24={info.hour24}
                minute={info.minute}
                second={info.second}
                isDark={dark}
              />
            </div>
          )}

          {/* Digital display */}
          <div className="text-center">
            <div className={cn(
              "text-2xl font-bold font-mono tabular-nums",
              dark ? "text-white" : "text-foreground"
            )}>
              {info.hour}:{info.minute}:{info.second}
              <span className={cn(
                "text-xs ml-1 font-normal",
                dark ? "text-indigo-300" : "text-amber-600 dark:text-amber-400"
              )}>
                {info.ampm}
              </span>
            </div>
            <div className={cn(
              "text-xs mt-1",
              dark ? "text-indigo-300" : "text-amber-700 dark:text-amber-400"
            )}>
              {info.weekday}, {info.month} {info.day}
            </div>
            <div className={cn(
              "text-[10px] mt-0.5",
              dark ? "text-indigo-400" : "text-amber-600 dark:text-amber-500"
            )}>
              {offset}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Searchable Timezone Dropdown ────────────────────────────────────
function TimezoneSearchDropdown({
  onSelect,
  excluded,
}: {
  onSelect: (tz: string) => void;
  excluded: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return ALL_TIMEZONES
      .filter((tz) => !excluded.includes(tz))
      .filter((tz) => tz.toLowerCase().includes(q) || getCityName(tz).toLowerCase().includes(q))
      .slice(0, 50);
  }, [query, excluded]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search timezone... (e.g. Tokyo, Lagos)"
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpen(!open)}
        >
          <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
        </Button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg"
          >
            {filtered.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No timezones found
              </div>
            ) : (
              filtered.map((tz) => (
                <button
                  key={tz}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between"
                  onClick={() => {
                    onSelect(tz);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <span className="font-medium">{getCityName(tz)}</span>
                  <span className="text-xs text-muted-foreground">{getRegionName(tz)}</span>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Meeting Planner Component ───────────────────────────────────────
function MeetingPlanner({ timezones }: { timezones: string[] }) {
  if (timezones.length < 2) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        Add at least 2 timezones to use the meeting planner.
      </div>
    );
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Green = all in work hours (9-5) | Yellow = some | Red = most outside work hours
      </p>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header - UTC hours */}
          <div className="flex gap-0.5 mb-1">
            <div className="w-24 shrink-0 text-xs font-medium text-muted-foreground">UTC Hour</div>
            {hours.map((h) => (
              <div
                key={h}
                className="flex-1 text-center text-[9px] text-muted-foreground font-mono"
              >
                {h.toString().padStart(2, "0")}
              </div>
            ))}
          </div>

          {/* Status row */}
          <div className="flex gap-0.5 mb-2">
            <div className="w-24 shrink-0 text-xs font-medium text-muted-foreground flex items-center">
              Overlap
            </div>
            {hours.map((h) => {
              const status = getWorkHourStatus(timezones, h);
              return (
                <div
                  key={h}
                  className={cn(
                    "flex-1 h-6 rounded-sm transition-colors",
                    status === "green" && "bg-green-500",
                    status === "yellow" && "bg-yellow-500",
                    status === "red" && "bg-red-400"
                  )}
                />
              );
            })}
          </div>

          {/* Per-timezone rows */}
          {timezones.map((tz) => (
            <div key={tz} className="flex gap-0.5 mb-0.5">
              <div className="w-24 shrink-0 text-[10px] font-medium text-muted-foreground truncate flex items-center">
                {getCityName(tz)}
              </div>
              {hours.map((utcH) => {
                const date = new Date();
                date.setUTCHours(utcH, 0, 0, 0);
                const info = getTimeInTimezone(tz, date);
                const isWork = info.hour24 >= 9 && info.hour24 < 17;
                const isSleep = info.hour24 < 6 || info.hour24 >= 22;
                return (
                  <div
                    key={utcH}
                    className={cn(
                      "flex-1 h-5 rounded-sm text-center text-[8px] leading-5 font-mono",
                      isWork && "bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-200",
                      !isWork && !isSleep && "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
                      isSleep && "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    )}
                    title={`${getCityName(tz)}: ${info.hour24}:00`}
                  >
                    {info.hour24}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 text-[10px] text-muted-foreground mt-2">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900/50" /> Work hours (9-17)
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-yellow-100 dark:bg-yellow-900/30" /> Evening/Morning
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-800" /> Sleep hours
        </span>
      </div>
    </div>
  );
}

// ── Time Converter Component ────────────────────────────────────────
function TimeConverter({ timezones }: { timezones: string[] }) {
  const [sourceZone, setSourceZone] = useState(timezones[0] || "UTC");
  const [inputTime, setInputTime] = useState("12:00");

  const convertedTimes = useMemo(() => {
    const [h, m] = inputTime.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return [];

    // Create a date in the source timezone
    // We find the UTC time that corresponds to h:m in the source timezone
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    // Brute force: find the UTC Date whose local representation in sourceZone = h:m
    // Approximate by using offset
    const approx = new Date(Date.UTC(year, month, day, h, m, 0));
    const sourceStr = approx.toLocaleString("en-US", { timeZone: sourceZone, hour: "numeric", minute: "2-digit", hour12: false });
    const [sh] = sourceStr.split(":").map(Number);
    const diff = h - (isNaN(sh) ? h : sh);
    const utcDate = new Date(approx.getTime() + diff * 3600000);

    return timezones.map((tz) => {
      const info = getTimeInTimezone(tz, utcDate);
      return {
        tz,
        city: getCityName(tz),
        time: `${info.hour}:${info.minute} ${info.ampm}`,
        weekday: info.weekday,
        dark: !isDaytime(info.hour24),
      };
    });
  }, [inputTime, sourceZone, timezones]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Source Timezone</label>
          <select
            value={sourceZone}
            onChange={(e) => setSourceZone(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>{getCityName(tz)} ({getRegionName(tz)})</option>
            ))}
          </select>
        </div>
        <div className="w-32">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Time</label>
          <Input
            type="time"
            value={inputTime}
            onChange={(e) => setInputTime(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {convertedTimes.map(({ tz, city, time, weekday, dark }) => (
          <div
            key={tz}
            className={cn(
              "p-3 rounded-lg border text-center",
              dark
                ? "bg-indigo-950/30 border-indigo-800/30"
                : "bg-amber-50/50 border-amber-200/30 dark:bg-amber-950/20 dark:border-amber-800/20"
            )}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              {dark ? <Moon className="w-3 h-3 text-indigo-400" /> : <Sun className="w-3 h-3 text-amber-500" />}
              <span className="text-xs font-medium truncate">{city}</span>
            </div>
            <div className="text-sm font-bold font-mono">{time}</div>
            <div className="text-[10px] text-muted-foreground">{weekday}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Favorite Sets ───────────────────────────────────────────────────
interface FavoriteSet {
  id: string;
  name: string;
  timezones: string[];
}

function loadFavorites(): FavoriteSet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFavorites(sets: FavoriteSet[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

function loadSelectedTimezones(): string[] {
  try {
    const raw = localStorage.getItem(SELECTED_TZ_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_TIMEZONES;
  } catch {
    return DEFAULT_TIMEZONES;
  }
}

function saveSelectedTimezones(tzs: string[]) {
  localStorage.setItem(SELECTED_TZ_KEY, JSON.stringify(tzs));
}

// ── Main Component ──────────────────────────────────────────────────
export default function WorldClock() {
  const [timezones, setTimezones] = useState<string[]>(loadSelectedTimezones);
  const [now, setNow] = useState(new Date());
  const [showAnalog, setShowAnalog] = useState(false);
  const [activeTab, setActiveTab] = useState<"clocks" | "converter" | "meeting">("clocks");
  const [favorites, setFavorites] = useState<FavoriteSet[]>(loadFavorites);
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  // Tick every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Persist selected timezones
  useEffect(() => {
    saveSelectedTimezones(timezones);
  }, [timezones]);

  const addTimezone = useCallback((tz: string) => {
    if (!timezones.includes(tz)) {
      setTimezones((prev) => [...prev, tz]);
    }
  }, [timezones]);

  const removeTimezone = useCallback((tz: string) => {
    setTimezones((prev) => prev.filter((t) => t !== tz));
  }, []);

  const saveFavoriteSet = () => {
    if (!saveName.trim()) return;
    const newSet: FavoriteSet = {
      id: Date.now().toString(),
      name: saveName.trim(),
      timezones: [...timezones],
    };
    const updated = [...favorites, newSet];
    setFavorites(updated);
    saveFavorites(updated);
    setSaveName("");
    setShowSaveInput(false);
  };

  const loadFavoriteSet = (set: FavoriteSet) => {
    setTimezones(set.timezones);
  };

  const deleteFavoriteSet = (id: string) => {
    const updated = favorites.filter((f) => f.id !== id);
    setFavorites(updated);
    saveFavorites(updated);
  };

  const resetToDefaults = () => {
    setTimezones([...DEFAULT_TIMEZONES]);
  };

  return (
    <Layout>
      <SEOHead
        title="World Clock & Timezone Converter - Live Clocks | TechTrendi"
        description="Free world clock showing current time in multiple timezones with live ticking. Convert time across timezones, plan meetings, and find overlapping work hours."
        canonicalUrl="https://techtrendi.com/tools/world-clock"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            World <span className="text-primary">Clock</span> & Timezone Converter
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            View current time across the globe, convert between timezones, and plan meetings across time zones.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-2 mb-6">
          {[
            { key: "clocks" as const, icon: Globe, label: "World Clocks" },
            { key: "converter" as const, icon: Clock, label: "Converter" },
            { key: "meeting" as const, icon: Users, label: "Meeting Planner" },
          ].map(({ key, icon: Icon, label }) => (
            <Button
              key={key}
              variant={activeTab === key ? "default" : "outline"}
              onClick={() => setActiveTab(key)}
              className="gap-2"
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Add Timezone + Controls */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1 w-full">
                    <TimezoneSearchDropdown
                      onSelect={addTimezone}
                      excluded={timezones}
                    />
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={showAnalog}
                        onCheckedChange={setShowAnalog}
                      />
                      <span className="text-xs text-muted-foreground">Analog</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={resetToDefaults}>
                      Reset
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clocks Tab */}
            {activeTab === "clocks" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {timezones.map((tz) => (
                    <TimezoneCard
                      key={tz}
                      tz={tz}
                      now={now}
                      showAnalog={showAnalog}
                      onRemove={() => removeTimezone(tz)}
                      canRemove={timezones.length > 1}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Converter Tab */}
            {activeTab === "converter" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Time Converter
                  </CardTitle>
                  <CardDescription>
                    Pick a time in one timezone and see it in all others instantly.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TimeConverter timezones={timezones} />
                </CardContent>
              </Card>
            )}

            {/* Meeting Planner Tab */}
            {activeTab === "meeting" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Meeting Planner
                  </CardTitle>
                  <CardDescription>
                    Find overlapping work hours (9 AM - 5 PM) across your selected timezones.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MeetingPlanner timezones={timezones} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Timezones */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Active Timezones
                </CardTitle>
                <CardDescription className="text-xs">
                  {timezones.length} timezone{timezones.length !== 1 ? "s" : ""} selected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {timezones.map((tz) => {
                    const info = getTimeInTimezone(tz, now);
                    return (
                      <div
                        key={tz}
                        className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isDaytime(info.hour24) ? (
                            <Sun className="w-3 h-3 text-amber-500 shrink-0" />
                          ) : (
                            <Moon className="w-3 h-3 text-indigo-400 shrink-0" />
                          )}
                          <span className="text-xs truncate">{getCityName(tz)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono text-muted-foreground">
                            {info.hour}:{info.minute}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100"
                            onClick={() => removeTimezone(tz)}
                            disabled={timezones.length <= 1}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Favorite Sets */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Saved Sets
                </CardTitle>
                <CardDescription className="text-xs">
                  Save and load timezone combinations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Save current */}
                {showSaveInput ? (
                  <div className="flex gap-2">
                    <Input
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder="Set name..."
                      className="h-8 text-xs"
                      onKeyDown={(e) => e.key === "Enter" && saveFavoriteSet()}
                    />
                    <Button size="sm" onClick={saveFavoriteSet} className="h-8 px-2">
                      <Save className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowSaveInput(false)}
                      className="h-8 px-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => setShowSaveInput(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Save Current Set
                  </Button>
                )}

                {/* Saved sets list */}
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {favorites.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground text-center py-4">
                      No saved sets yet
                    </p>
                  ) : (
                    favorites.map((set) => (
                      <div
                        key={set.id}
                        className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 group"
                      >
                        <button
                          onClick={() => loadFavoriteSet(set)}
                          className="text-xs font-medium text-left truncate flex-1 hover:text-primary"
                        >
                          {set.name}
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({set.timezones.length})
                          </span>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100"
                          onClick={() => deleteFavoriteSet(set.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li>• Search for any city or IANA timezone to add it</li>
                  <li>• Toggle analog clocks for a visual display</li>
                  <li>• Use the converter to plan across timezones</li>
                  <li>• Meeting planner shows overlapping work hours</li>
                  <li>• Save your favorite timezone sets for quick access</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
