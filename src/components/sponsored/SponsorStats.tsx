import { useState } from "react";
import { Eye, MessageCircle, MousePointerClick, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SponsorStat } from "@/data/sponsors";

const PERIODS: { key: SponsorStat["period"]; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "all", label: "All time" },
];

// One ad's visits and taps (admin, /admin/sponsors). Visits come from page_views,
// taps from sponsor_clicks (counted from 3 Nov 2026).
export function SponsorStats({ stats }: { stats: SponsorStat[] }) {
  const [period, setPeriod] = useState<SponsorStat["period"]>("7d");
  const s = stats.find((r) => r.period === period);
  const tiles = [
    { icon: Eye, label: "Opened the ad page", value: s?.visits ?? 0, note: `${s?.visitors ?? 0} different people`, tone: "bg-blue-500" },
    { icon: MessageCircle, label: "Tapped WhatsApp", value: s?.whatsapp ?? 0, tone: "bg-[#25D366]" },
    { icon: Phone, label: "Tapped Call", value: s?.call ?? 0, tone: "bg-orange-500" },
    { icon: MousePointerClick, label: "Tapped the Sponsored card", value: s?.card ?? 0, tone: "bg-violet-600" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition",
              period === p.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border border-border bg-background p-4">
            <span className={cn("mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-white", t.tone)}>
              <t.icon className="h-5 w-5" />
            </span>
            <p className="text-3xl font-bold leading-none">{t.value}</p>
            <p className="mt-1 text-sm font-medium">{t.label}</p>
            {t.note && <p className="text-xs text-muted-foreground">{t.note}</p>}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Taps are counted from 3 Nov 2026. Your own taps (while logged in as admin) and robots are not counted.
      </p>
    </div>
  );
}
