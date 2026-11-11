import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { EiTechMeme } from "@/data/eiTech";

// 😂 laughs (every meme) and Team votes (memes with `vote`), stored anonymously
// through the techtrendi.ei_tech_react / ei_tech_counts functions
// (supabase/migrations/20261111_ei_tech_reactions.sql).
//
// Everything that depends on the visitor (their id, what they already tapped,
// the live totals) is loaded AFTER mount, so the first render always matches
// the prerendered page (no hydration mismatch).

type Counts = { laugh: number; a: number; b: number };
type Mine = { laugh?: boolean; vote?: "a" | "b" };

const ZERO: Counts = { laugh: 0, a: 0, b: 0 };
const VOTER_KEY = "eitech_voter";
const mineKey = (slug: string) => `eitech_mine_${slug}`;

function voterId(): string {
  try {
    let id = localStorage.getItem(VOTER_KEY);
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      id = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
          });
      localStorage.setItem(VOTER_KEY, id);
    }
    return id;
  } catch {
    return "00000000-0000-4000-8000-000000000000"; // storage blocked: still lets the tap through
  }
}

function readMine(slug: string): Mine {
  try { return JSON.parse(localStorage.getItem(mineKey(slug)) || "{}") as Mine; } catch { return {}; }
}
function saveMine(slug: string, m: Mine) {
  try { localStorage.setItem(mineKey(slug), JSON.stringify(m)); } catch { /* ignore */ }
}

// All cards on a page ask for their totals in the same moment; collect the
// slugs and make ONE database call instead of one per meme.
let pending: { slugs: Set<string>; waiters: ((c: Record<string, Counts>) => void)[] } | null = null;
function loadCounts(slug: string): Promise<Counts> {
  return new Promise((resolve) => {
    if (!pending) {
      pending = { slugs: new Set(), waiters: [] };
      setTimeout(async () => {
        const batch = pending!;
        pending = null;
        let result: Record<string, Counts> = {};
        try {
          const { data } = await (supabase as any).rpc("ei_tech_counts", { p_slugs: [...batch.slugs] });
          if (data && typeof data === "object") result = data;
        } catch { /* offline: show no numbers */ }
        batch.waiters.forEach((w) => w(result));
      }, 0);
    }
    pending.slugs.add(slug);
    pending.waiters.push((all) => resolve(all[slug] ?? ZERO));
  });
}

const short = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : String(n));

export function useEiTechReactions(meme: EiTechMeme) {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [mine, setMine] = useState<Mine>({});

  useEffect(() => {
    let alive = true;
    setMine(readMine(meme.slug));
    loadCounts(meme.slug).then((c) => { if (alive) setCounts(c); });
    return () => { alive = false; };
  }, [meme.slug]);

  const react = async (kind: "laugh" | "vote", choice: "laugh" | "a" | "b") => {
    const before = mine;
    const next: Mine = kind === "laugh" ? { ...mine, laugh: true } : { ...mine, vote: choice as "a" | "b" };
    // Show the result straight away; the database answer corrects it a moment later.
    setMine(next);
    saveMine(meme.slug, next);
    setCounts((c) => {
      const n = { ...(c ?? ZERO) };
      if (kind === "laugh" && !before.laugh) n.laugh += 1;
      if (kind === "vote") {
        if (before.vote) n[before.vote] = Math.max(0, n[before.vote] - 1);
        n[choice as "a" | "b"] += 1;
      }
      return n;
    });
    try {
      const { data } = await (supabase as any).rpc("ei_tech_react", {
        p_slug: meme.slug, p_kind: kind, p_choice: choice, p_voter: voterId(),
      });
      if (data && typeof data === "object") setCounts(data as Counts);
    } catch { /* keep the optimistic numbers */ }
  };

  return { counts, mine, react };
}

export function EiTechLaughButton({ count, laughed, onLaugh }: { count: number | null; laughed: boolean; onLaugh: () => void }) {
  const [pop, setPop] = useState(0);
  return (
    <button
      type="button"
      onClick={() => { setPop((p) => p + 1); if (!laughed) onLaugh(); }}
      aria-label={laughed ? "You laughed at this" : "Laugh at this"}
      aria-pressed={laughed}
      className={cn(
        "relative inline-flex items-center justify-center gap-1 h-12 px-2.5 sm:px-3 shrink-0 rounded-xl border font-bold transition-colors",
        laughed
          ? "border-amber-400 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
          : "border-border bg-card text-foreground hover:bg-amber-50 dark:hover:bg-amber-900/20"
      )}
    >
      <motion.span key={pop} className="text-2xl leading-none" initial={pop ? { scale: 1.6, rotate: -15 } : false} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 12 }}>
        😂
      </motion.span>
      <span className="tabular-nums">{count === null ? "Ei!" : short(count)}</span>
    </button>
  );
}

export function EiTechVote({ meme, counts, mine, onVote }: {
  meme: EiTechMeme;
  counts: Counts | null;
  mine: Mine;
  onVote: (side: "a" | "b") => void;
}) {
  if (!meme.vote) return null;
  const total = counts ? counts.a + counts.b : 0;
  const voted = mine.vote;
  const sides = (["a", "b"] as const).map((k) => ({ k, ...meme.vote![k], n: counts?.[k] ?? 0 }));

  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-foreground mb-2">Which team are you? 🤔</p>
      <div className="grid grid-cols-2 gap-2">
        {sides.map((s) => {
          const pct = voted && total > 0 ? Math.round((s.n / total) * 100) : 0;
          const isMine = voted === s.k;
          return (
            <button
              key={s.k}
              type="button"
              onClick={() => { if (!isMine) onVote(s.k); }}
              aria-pressed={isMine}
              className={cn(
                "relative overflow-hidden min-h-14 rounded-xl border-2 text-left px-3 py-2 font-bold transition-colors",
                isMine ? "border-orange-500 text-foreground" : "border-border text-foreground hover:border-orange-300"
              )}
            >
              {voted && (
                <motion.span
                  className={cn("absolute inset-y-0 left-0", isMine ? "bg-orange-500/20" : "bg-muted")}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <span className="text-xl leading-none shrink-0">{s.emoji}</span>
                <span className="text-sm sm:text-base leading-tight">{s.label}</span>
              </span>
              {voted ? (
                <span className="relative mt-1 flex items-center gap-1 text-sm tabular-nums">
                  {pct}%{isMine && <Check className="w-4 h-4 text-orange-500" />}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {voted
          ? `${short(total)} vote${total === 1 ? "" : "s"} · tap the other side to change`
          : counts && total > 0 ? `${short(total)} vote${total === 1 ? "" : "s"} so far · tap to vote and see results` : "Tap to vote and see results"}
      </p>
    </div>
  );
}
