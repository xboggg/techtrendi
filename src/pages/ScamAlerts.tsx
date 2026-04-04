import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { SEOHead } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ShieldAlert,
  Search,
  ChevronLeft,
  ChevronRight,
  Share2,
  Copy,
  AlertTriangle,
  Clock,
  Filter,
  Loader2,
  MessageCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

interface ScamAlert {
  id: string;
  emoji: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  scam_type: string;
  description: string;
  affected_platforms: string[];
  what_to_do: string;
  created_at: string;
}

interface ThreatLevel {
  level: string;
  message: string;
  updated_at: string;
}

const ALERTS_PER_PAGE = 10;

const scamTypeFilters = [
  "All",
  "SMS",
  "WhatsApp",
  "Email",
  "Phone Call",
  "Website",
  "Mobile Money",
  "Social Media",
];

const severityConfig: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  low: {
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    label: "Low Risk",
  },
  medium: {
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    label: "Medium Risk",
  },
  high: {
    bg: "bg-orange-50 dark:bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-400",
    dot: "bg-orange-500",
    label: "High Risk",
  },
  critical: {
    bg: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
    label: "Critical",
  },
};

const threatLevelConfig: Record<string, { bg: string; text: string; dot: string }> = {
  low: {
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  moderate: {
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  elevated: {
    bg: "bg-orange-50 dark:bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  high: {
    bg: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
  },
  critical: {
    bg: "bg-red-100 dark:bg-red-500/15",
    text: "text-red-800 dark:text-red-400",
    dot: "bg-red-600",
  },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ScamAlerts() {
  const [alerts, setAlerts] = useState<ScamAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [threatLevel, setThreatLevel] = useState<ThreatLevel | null>(null);
  const [showShareMenu, setShowShareMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchThreatLevel();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [page, searchQuery, activeFilter]);

  const fetchThreatLevel = async () => {
    try {
      const { data, error } = await supabase
        .from("security_threat_level")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setThreatLevel(data);
    } catch (err) {
      console.error("Error fetching threat level:", err);
    }
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("security_scam_alerts")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (activeFilter !== "All") {
        query = query.ilike("scam_type", activeFilter);
      }

      if (searchQuery.trim()) {
        query = query.or(
          `title.ilike.%${searchQuery.trim()}%,description.ilike.%${searchQuery.trim()}%`
        );
      }

      const from = (page - 1) * ALERTS_PER_PAGE;
      const to = from + ALERTS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      setAlerts(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("Error fetching scam alerts:", err);
      toast.error("Failed to load scam alerts.");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ALERTS_PER_PAGE);

  const shareToWhatsApp = (alert: ScamAlert) => {
    const text = `${alert.emoji} SCAM ALERT: ${alert.title}\n\n${alert.description}\n\nStay safe! Read more at ${window.location.origin}/scam-alerts`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    setShowShareMenu(null);
  };

  const copyLink = (alert: ScamAlert) => {
    navigator.clipboard.writeText(`${window.location.origin}/scam-alerts`);
    toast.success("Link copied to clipboard!");
    setShowShareMenu(null);
  };

  const tlConfig = threatLevel
    ? threatLevelConfig[threatLevel.level] || threatLevelConfig.moderate
    : null;

  return (
    <Layout>
      <SEOHead
        title="Scam Alerts - Latest Scam Warnings"
        description="Stay informed about the latest scams and fraud attempts. Real-time scam alerts to protect you and your family."
        canonical="/scam-alerts"
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-50 via-orange-50/30 to-background dark:from-red-950/30 dark:via-orange-950/15 dark:to-background border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-3 mb-4"
              >
                <div className="p-2 rounded-xl bg-red-500 shadow-sm shadow-red-500/20">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Live Feed
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="text-3xl md:text-4xl font-bold text-foreground mb-2"
              >
                Scam Alerts
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-muted-foreground text-lg max-w-lg"
              >
                Real-time warnings about scams targeting people in Ghana.
              </motion.p>
            </div>

            {/* Threat Level */}
            {threatLevel && tlConfig && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="flex-shrink-0"
              >
                <div className={cn("rounded-xl border border-border bg-card p-5 text-center min-w-[180px]")}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Current Threat Level
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", tlConfig.dot)} />
                      <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", tlConfig.dot)} />
                    </span>
                    <span className={cn("text-lg font-bold uppercase tracking-wide", tlConfig.text)}>
                      {threatLevel.level}
                    </span>
                  </div>
                  {threatLevel.message && (
                    <p className="text-xs text-muted-foreground">{threatLevel.message}</p>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-5">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <Button asChild className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white">
            <Link to="/report-scam">
              <ShieldAlert className="w-4 h-4 mr-2" />
              Report a Scam
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Filter className="w-4 h-4 text-muted-foreground mr-1" />
          {scamTypeFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                activeFilter === filter
                  ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400"
                  : "bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        {!loading && (
          <p className="text-sm text-muted-foreground mb-4">
            {totalCount} alert{totalCount !== 1 ? "s" : ""} found
            {activeFilter !== "All" ? ` for "${activeFilter}"` : ""}
            {searchQuery ? ` matching "${searchQuery}"` : ""}
          </p>
        )}
      </section>

      {/* Alerts Feed */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-20">
            <ShieldCheck className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No alerts found</h3>
            <p className="text-muted-foreground">
              {searchQuery || activeFilter !== "All"
                ? "Try adjusting your search or filters."
                : "No scam alerts have been published yet."}
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={`${page}-${activeFilter}-${searchQuery}`}
            className="space-y-4"
          >
            {alerts.map((alert, i) => {
              const severity = severityConfig[alert.severity] || severityConfig.medium;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                  className="rounded-xl border border-border bg-card p-5 md:p-6 hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-3">
                    <span className="text-2xl flex-shrink-0">{alert.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-foreground">{alert.title}</h3>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                            severity.bg,
                            severity.text
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", severity.dot)} />
                          {severity.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {timeAgo(alert.created_at)}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-muted text-xs">
                          {alert.scam_type}
                        </span>
                      </div>
                    </div>

                    {/* Share */}
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() =>
                          setShowShareMenu(showShareMenu === alert.id ? null : alert.id)
                        }
                        className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {showShareMenu === alert.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            className="absolute right-0 top-11 z-10 bg-popover border border-border rounded-xl p-1.5 shadow-xl min-w-[150px]"
                          >
                            <button
                              onClick={() => shareToWhatsApp(alert)}
                              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                            >
                              <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                              WhatsApp
                            </button>
                            <button
                              onClick={() => copyLink(alert)}
                              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                            >
                              <Copy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              Copy Link
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed mb-4">{alert.description}</p>

                  {/* Affected Platforms */}
                  {alert.affected_platforms && alert.affected_platforms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {alert.affected_platforms.map((platform) => (
                        <span
                          key={platform}
                          className="px-2 py-0.5 rounded-md bg-muted border border-border text-xs text-muted-foreground"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* What to do */}
                  {alert.what_to_do && (
                    <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
                          What to do
                        </p>
                        <p className="text-sm text-emerald-800 dark:text-emerald-300/80">{alert.what_to_do}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-sm font-medium transition-all",
                      page === pageNum
                        ? "bg-red-600 text-white"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-16">
          <div className="rounded-xl border border-border bg-card p-8 md:p-10 text-center">
            <AlertTriangle className="w-10 h-10 text-orange-500 dark:text-orange-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Encountered a scam?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Help protect the community by reporting scams you've come across. Every report makes a difference.
            </p>
            <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white">
              <Link to="/report-scam">
                <ShieldAlert className="w-5 h-5 mr-2" />
                Report a Scam Now
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
