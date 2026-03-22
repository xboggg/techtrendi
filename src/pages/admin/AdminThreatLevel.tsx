import { useState, useEffect } from "react";
import { AdminLayout } from "./AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Save, RefreshCw, Shield, AlertTriangle, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ThreatLevel {
  id: string;
  level: string;
  title: string;
  description: string;
  active_threats: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const LEVELS = ["low", "moderate", "elevated", "high", "critical"] as const;

const levelConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
  low: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/40", label: "Low" },
  moderate: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/40", label: "Moderate" },
  elevated: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/40", label: "Elevated" },
  high: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/40", label: "High" },
  critical: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/40", label: "Critical" },
};

export default function AdminThreatLevel() {
  const [current, setCurrent] = useState<ThreatLevel | null>(null);
  const [history, setHistory] = useState<ThreatLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form
  const [form, setForm] = useState({
    level: "low",
    title: "",
    description: "",
    active_threats: "",
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("security_threat_level")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load threat levels");
      console.error(error);
    } else {
      const items = data || [];
      const active = items.find((t) => t.is_active) || null;
      setCurrent(active);
      setHistory(items.filter((t) => t.id !== active?.id));

      if (active) {
        setForm({
          level: active.level,
          title: active.title || "",
          description: active.description || "",
          active_threats: (active.active_threats || []).join(", "),
        });
      }
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);

    // Deactivate all existing
    await supabase
      .from("security_threat_level")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("is_active", true);

    const payload = {
      level: form.level,
      title: form.title.trim(),
      description: form.description.trim(),
      active_threats: form.active_threats ? form.active_threats.split(",").map((s) => s.trim()).filter(Boolean) : [],
      is_active: true,
    };

    // If editing current, update it; otherwise create new
    if (current && form.level === current.level) {
      const { error } = await supabase
        .from("security_threat_level")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", current.id);

      if (error) toast.error("Failed to update");
      else { toast.success("Threat level updated"); fetchData(); }
    } else {
      const { error } = await supabase
        .from("security_threat_level")
        .insert([payload]);

      if (error) toast.error("Failed to create");
      else { toast.success("Threat level updated"); fetchData(); }
    }
    setSaving(false);
  };

  const cfg = levelConfig[form.level] || levelConfig.low;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6" /> Threat Level
            </h1>
            <p className="text-muted-foreground text-sm">Manage the current threat level indicator</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Current Threat Level Display */}
            <div className={cn("border-2 rounded-xl p-8 mb-8 text-center", cfg.bg, cfg.border)}>
              <div className="mb-2 text-sm text-muted-foreground uppercase tracking-wider">Current Threat Level</div>
              <div className={cn("text-5xl font-bold mb-2", cfg.text)}>
                {cfg.label}
              </div>
              {current && (
                <>
                  <div className="text-lg font-medium text-foreground mb-1">{current.title}</div>
                  <div className="text-sm text-muted-foreground max-w-md mx-auto">{current.description}</div>
                  {current.active_threats && current.active_threats.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      {current.active_threats.map((threat, i) => (
                        <Badge key={i} variant="outline" className={cn("text-xs", cfg.text)}>
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {threat}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-4">
                    Last updated: {new Date(current.updated_at || current.created_at).toLocaleString()}
                  </div>
                </>
              )}
              {!current && (
                <div className="text-muted-foreground mt-2">No active threat level set</div>
              )}
            </div>

            {/* Edit Form */}
            <div className="bg-card border border-border rounded-xl p-6 mb-8">
              <h2 className="text-lg font-bold text-foreground mb-4">Update Threat Level</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Level</label>
                  <div className="flex gap-2 flex-wrap">
                    {LEVELS.map((lvl) => {
                      const lc = levelConfig[lvl];
                      return (
                        <button
                          key={lvl}
                          onClick={() => setForm({ ...form, level: lvl })}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all",
                            form.level === lvl
                              ? cn(lc.bg, lc.text, lc.border)
                              : "border-border text-muted-foreground hover:border-muted-foreground"
                          )}
                        >
                          {lc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Title *</label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Heightened Phishing Activity"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Brief description of the current threat landscape..."
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Active Threats (comma-separated)</label>
                  <Input
                    value={form.active_threats}
                    onChange={(e) => setForm({ ...form, active_threats: e.target.value })}
                    placeholder="Phishing campaigns, MoMo fraud, SIM swap"
                  />
                </div>

                <Button onClick={handleUpdate} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Update Threat Level
                </Button>
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">History</h2>
                <div className="space-y-3">
                  {history.map((item) => {
                    const hc = levelConfig[item.level] || levelConfig.low;
                    return (
                      <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg border border-border/50 hover:bg-muted/30">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-bold", hc.bg, hc.text)}>
                          {hc.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground text-sm">{item.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
