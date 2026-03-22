import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, Siren, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface ThreatLevel {
  level: string;
  title: string;
  description: string;
  active_threats: string[];
}

const levelConfig: Record<string, { color: string; bg: string; border: string; icon: typeof Shield; pulse: boolean }> = {
  low: { color: "text-green-400", bg: "from-green-950/80 to-green-900/60", border: "border-green-500/30", icon: ShieldCheck, pulse: false },
  moderate: { color: "text-blue-400", bg: "from-blue-950/80 to-blue-900/60", border: "border-blue-500/30", icon: Shield, pulse: false },
  elevated: { color: "text-yellow-400", bg: "from-yellow-950/80 to-yellow-900/60", border: "border-yellow-500/30", icon: AlertTriangle, pulse: true },
  high: { color: "text-orange-400", bg: "from-orange-950/80 to-orange-900/60", border: "border-orange-500/30", icon: ShieldAlert, pulse: true },
  critical: { color: "text-red-400", bg: "from-red-950/80 to-red-900/60", border: "border-red-500/30", icon: Siren, pulse: true },
};

export function ThreatLevelBanner() {
  const [threat, setThreat] = useState<ThreatLevel | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("security_threat_level")
        .select("level, title, description, active_threats")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();
      if (data) setThreat(data);
    })();
  }, []);

  if (!threat) return null;

  const config = levelConfig[threat.level] || levelConfig.moderate;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "rounded-2xl border p-4 md:p-5 bg-gradient-to-r backdrop-blur-sm",
        config.bg, config.border
      )}
    >
      <div className="flex items-start gap-4">
        <motion.div
          className={cn("flex-shrink-0 mt-0.5", config.color)}
          animate={config.pulse ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Icon className="w-6 h-6" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-sm font-bold uppercase tracking-wider", config.color)}>
              Threat Level: {threat.level}
            </span>
            <span className="text-white/60 text-sm">—</span>
            <span className="text-white font-semibold text-sm">{threat.title}</span>
          </div>
          {threat.description && (
            <p className="text-white/60 text-sm mb-2">{threat.description}</p>
          )}
          {threat.active_threats && threat.active_threats.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {threat.active_threats.map((t, i) => (
                <span key={i} className={cn("px-2 py-0.5 rounded-full text-xs border", config.border, config.color, "bg-white/5")}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <Link
          to="/scam-alerts"
          className={cn("flex items-center gap-1 text-xs font-medium whitespace-nowrap", config.color, "hover:underline")}
        >
          View Alerts
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </motion.div>
  );
}
