import { useEffect, useRef, useState } from "react";
import { Check, Copy, Facebook, MessageCircle, Share2, Twitter } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { alertUrl } from "@/lib/scamAlerts";

// Share one scam alert (21 Nov 2026): every button shares the alert's OWN page
// (/scam-alerts/<slug>), so WhatsApp/Facebook/X show that scam's title and picture
// and the link opens straight on it. WhatsApp first: it is where Ghana shares links.
// Links are built from fixed values only, so the prerendered HTML and the browser agree.

type Alert = { slug?: string | null; title: string };

function links(a: Alert) {
  const url = alertUrl(a);
  const u = encodeURIComponent(url);
  const text = `🚨 SCAM ALERT: ${a.title}`;
  return {
    url,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${u}`,
  };
}

function useCopy(url: string) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Press and hold the address bar to copy the link.");
    }
  };
  return { copied, copy };
}

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

/** Row of share buttons (alert page and the /security pop-up). */
export function ScamAlertShareBar({ alert, className }: { alert: Alert; className?: string }) {
  const l = links(alert);
  const { copied, copy } = useCopy(l.url);
  const btn = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors";
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <a href={l.whatsapp} {...ext} className={cn(btn, "bg-[#25D366] text-white hover:bg-[#1ebe5a]")}>
        <MessageCircle className="w-4 h-4" /> WhatsApp
      </a>
      <a href={l.facebook} {...ext} className={cn(btn, "bg-[#1877F2] text-white hover:bg-[#1468d6]")}>
        <Facebook className="w-4 h-4" /> Facebook
      </a>
      <a href={l.x} {...ext} className={cn(btn, "bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200")}>
        <Twitter className="w-4 h-4" /> X
      </a>
      <button type="button" onClick={copy} className={cn(btn, "bg-muted text-foreground hover:bg-muted/70")}>
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />} {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

/** Small share icon with a drop-down (cards on the /scam-alerts list). */
export function ScamAlertShareMenu({ alert }: { alert: Alert }) {
  const l = links(alert);
  const { copied, copy } = useCopy(l.url);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors";
  return (
    <div ref={box} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Share this alert"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Share2 className="w-4 h-4" /> Share
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-10 bg-popover border border-border rounded-xl p-1.5 shadow-xl min-w-[160px]">
          <a href={l.whatsapp} {...ext} onClick={() => setOpen(false)} className={item}>
            <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" /> WhatsApp
          </a>
          <a href={l.facebook} {...ext} onClick={() => setOpen(false)} className={item}>
            <Facebook className="w-4 h-4 text-[#1877F2]" /> Facebook
          </a>
          <a href={l.x} {...ext} onClick={() => setOpen(false)} className={item}>
            <Twitter className="w-4 h-4" /> X (Twitter)
          </a>
          <button type="button" onClick={() => { copy(); setOpen(false); }} className={item}>
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-blue-600 dark:text-blue-400" />} Copy link
          </button>
        </div>
      )}
    </div>
  );
}
