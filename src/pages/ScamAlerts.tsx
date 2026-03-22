import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
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
  ExternalLink,
  AlertTriangle,
  Clock,
  Filter,
  Loader2,
  MessageCircle,
  Shield,
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
  { bg: string; text: string; border: string; glow: string; label: string }
> = {
  low: {
    bg: "bg-green-500/15",
    text: "text-green-400",
    border: "border-green-500/30",
    glow: "shadow-green-500/10",
    label: "Low Risk",
  },
  medium: {
    bg: "bg-yellow-500/15",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
    glow: "shadow-yellow-500/10",
    label: "Medium Risk",
  },
  high: {
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    border: "border-orange-500/30",
    glow: "shadow-orange-500/10",
    label: "High Risk",
  },
  critical: {
    bg: "bg-red-500/15",
    text: "text-red-400",
    border: "border-red-500/30",
    glow: "shadow-red-500/10",
    label: "Critical",
  },
};

const threatLevelColors: Record<string, { gradient: string; pulse: string; text: string }> = {
  low: {
    gradient: "from-green-500 to-emerald-500",
    pulse: "bg-green-500",
    text: "text-green-400",
  },
  moderate: {
    gradient: "from-yellow-500 to-amber-500",
    pulse: "bg-yellow-500",
    text: "text-yellow-400",
  },
  elevated: {
    gradient: "from-orange-500 to-red-500",
    pulse: "bg-orange-500",
    text: "text-orange-400",
  },
  high: {
    gradient: "from-red-500 to-rose-600",
    pulse: "bg-red-500",
    text: "text-red-400",
  },
  critical: {
    gradient: "from-red-600 to-pink-600",
    pulse: "bg-red-600",
    text: "text-red-400",
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
    ? threatLevelColors[threatLevel.level] || threatLevelColors.moderate
    : null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  };

  return (
    <Layout>
      <Helmet>
        <title>Scam Alerts | TechTrendi</title>
        <meta
          name="description"
          content="Live scam alerts and warnings for Ghana. Stay informed about the latest SMS, WhatsApp, email, and mobile money scams."
        />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-red-950/30 to-orange-950/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-red-500/8 via-transparent to-transparent" />
        <div className="absolute top-10 right-20 w-80 h-80 bg-red-500/8 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-3 mb-4"
              >
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/20">
                  <ShieldAlert className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Live Feed
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="text-4xl md:text-5xl font-bold text-white mb-3"
              >
                Scam Alerts
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="text-gray-400 text-lg max-w-lg"
              >
                Real-time warnings about scams targeting people in Ghana. Stay informed, stay safe.
              </motion.p>
            </div>

            {/* Threat Level Indicator */}
            {threatLevel && tlConfig && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex-shrink-0"
              >
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 text-center min-w-[200px]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                    Current Threat Level
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="relative flex h-3 w-3">
                      <span
                        className={cn(
                          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                          tlConfig.pulse
                        )}
                      />
                      <span
                        className={cn(
                          "relative inline-flex rounded-full h-3 w-3",
                          tlConfig.pulse
                        )}
                      />
                    </span>
                    <span
                      className={cn(
                        "text-xl font-bold uppercase tracking-wide",
                        tlConfig.text
                      )}
                    >
                      {threatLevel.level}
                    </span>
                  </div>
                  {threatLevel.message && (
                    <p className="text-xs text-gray-400 mt-1">{threatLevel.message}</p>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="max-w-5xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col md:flex-row md:items-center gap-4 mb-6"
        >
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-orange-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Report CTA */}
          <Link to="/report-scam">
            <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/15">
              <ShieldAlert className="w-4 h-4 mr-2" />
              Report a Scam
            </Button>
          </Link>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          <Filter className="w-4 h-4 text-gray-500 mt-2 mr-1" />
          {scamTypeFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                activeFilter === filter
                  ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 border-orange-500/40 text-orange-400"
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300"
              )}
            >
              {filter}
            </button>
          ))}
        </motion.div>

        {/* Results count */}
        {!loading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-500 mb-4"
          >
            {totalCount} alert{totalCount !== 1 ? "s" : ""} found
            {activeFilter !== "All" ? ` for "${activeFilter}"` : ""}
            {searchQuery ? ` matching "${searchQuery}"` : ""}
          </motion.p>
        )}
      </section>

      {/* Alerts Feed */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No alerts found</h3>
            <p className="text-gray-500">
              {searchQuery || activeFilter !== "All"
                ? "Try adjusting your search or filters."
                : "No scam alerts have been published yet."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={`${page}-${activeFilter}-${searchQuery}`}
            className="space-y-4"
          >
            {alerts.map((alert) => {
              const severity = severityConfig[alert.severity] || severityConfig.medium;
              return (
                <motion.div
                  key={alert.id}
                  variants={cardVariants}
                  whileHover={{ scale: 1.005, y: -2 }}
                  className={cn(
                    "rounded-2xl border backdrop-blur-sm p-5 md:p-6 transition-shadow hover:shadow-xl relative",
                    severity.border,
                    severity.glow,
                    "bg-gradient-to-r from-white/[0.04] to-white/[0.02]"
                  )}
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-3">
                    <span className="text-3xl flex-shrink-0">{alert.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white">{alert.title}</h3>
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border",
                            severity.bg,
                            severity.text,
                            severity.border
                          )}
                        >
                          {severity.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {timeAgo(alert.created_at)}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400 text-xs">
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
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {showShareMenu === alert.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -5 }}
                            className="absolute right-0 top-11 z-10 bg-gray-900 border border-white/10 rounded-xl p-2 shadow-xl min-w-[160px]"
                          >
                            <button
                              onClick={() => shareToWhatsApp(alert)}
                              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              <MessageCircle className="w-4 h-4 text-green-400" />
                              WhatsApp
                            </button>
                            <button
                              onClick={() => copyLink(alert)}
                              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              <Copy className="w-4 h-4 text-blue-400" />
                              Copy Link
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 leading-relaxed mb-4">{alert.description}</p>

                  {/* Affected Platforms */}
                  {alert.affected_platforms && alert.affected_platforms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {alert.affected_platforms.map((platform) => (
                        <span
                          key={platform}
                          className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs text-gray-400"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* What to do */}
                  {alert.what_to_do && (
                    <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-green-500/5 border border-green-500/15">
                      <Shield className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">
                          What to do
                        </p>
                        <p className="text-sm text-gray-300">{alert.what_to_do}</p>
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-4 mt-10"
          >
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border-white/10 text-gray-400 hover:bg-white/5"
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
                        ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                        : "text-gray-500 hover:text-white hover:bg-white/10"
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
              className="border-white/10 text-gray-400 hover:bg-white/5"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 p-8 md:p-12">
            <AlertTriangle className="w-10 h-10 text-orange-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Encountered a scam?
            </h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Help protect the community by reporting scams you've come across.
              Every report makes a difference.
            </p>
            <Link to="/report-scam">
              <Button
                size="lg"
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/20"
              >
                <ShieldAlert className="w-5 h-5 mr-2" />
                Report a Scam Now
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </Layout>
  );
}
