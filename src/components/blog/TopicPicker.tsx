// The topic filter as one tidy button (owner, 30 Oct 2026: preview 2 of 6, "Topic picker").
// It replaced six lines of wrapping category pills. Phone: the button opens a panel from the
// bottom with every topic in two columns. Computer: it opens a small menu under the button.
// The sort menu next to it (SortSelect) is a plain select, so it works with any keyboard or reader.
import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

export interface TopicOption {
  name: string;
  icon: React.ElementType;
  /** Tailwind gradient stops, e.g. "from-amber-500 to-orange-600" (the chosen topic's square). */
  gradient: string;
  /** Tailwind text colour for the icon when not chosen, e.g. "text-amber-500". */
  iconColor: string;
}

function TopicList({ options, value, onPick, cols }: { options: TopicOption[]; value: string; onPick: (n: string) => void; cols: string }) {
  return (
    <div role="listbox" aria-label="Topics" className={cn("grid gap-2", cols)}>
      {options.map((o) => {
        const on = o.name === value;
        const Icon = o.icon;
        return (
          <button
            key={o.name}
            type="button"
            role="option"
            aria-selected={on}
            onClick={() => onPick(o.name)}
            className={cn(
              "flex min-w-0 items-center gap-2.5 rounded-xl border-2 p-2.5 text-left text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              on ? "border-primary/60 bg-primary/10 text-foreground" : "border-border/60 bg-card hover:border-primary/30 hover:bg-muted/60"
            )}
          >
            <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", on ? `bg-gradient-to-br ${o.gradient} text-white` : `bg-muted ${o.iconColor}`)}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 truncate">{o.name}</span>
            {on && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

export function TopicPicker({ options, value, onChange, allName = "All", allLabel = "All topics" }: {
  options: TopicOption[];
  value: string;
  onChange: (name: string) => void;
  /** The option that means "no filter", shown on the button as allLabel. */
  allName?: string;
  allLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const current = options.find((o) => o.name === value) ?? options[0];
  const Icon = current.icon;
  const pick = (n: string) => { onChange(n); setOpen(false); };

  const trigger = (
    <button
      type="button"
      aria-haspopup="listbox"
      aria-expanded={open}
      onClick={isMobile ? () => setOpen(true) : undefined}
      className="flex h-11 w-full min-w-0 items-center gap-2.5 rounded-xl border-2 border-border/60 bg-card px-3 text-sm font-semibold transition-colors hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      data-testid="topic-picker"
    >
      <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white", current.gradient)}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1 truncate text-left">
        <span className="sr-only">Topic: </span>{current.name === allName ? allLabel : current.name}
      </span>
      <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden />
    </button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl px-4 pb-6 pt-3">
            <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-muted" aria-hidden />
            <SheetTitle className="mb-1 text-lg">Pick a topic</SheetTitle>
            <SheetDescription className="mb-4">Show only the guides you want.</SheetDescription>
            <TopicList options={options} value={value} onPick={pick} cols="grid-cols-2" />
          </SheetContent>
        </Sheet>
      </>
    );
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-[min(560px,calc(100vw-2rem))] rounded-2xl p-3">
        <TopicList options={options} value={value} onPick={pick} cols="grid-cols-2 lg:grid-cols-3" />
      </PopoverContent>
    </Popover>
  );
}

export function SortSelect<T extends string>({ value, onChange, options, className }: {
  value: T;
  onChange: (v: T) => void;
  options: readonly (readonly [T, string])[];
  className?: string;
}) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <select
        aria-label="Sort"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-11 w-full cursor-pointer appearance-none rounded-xl border-2 border-border/60 bg-card pl-3 pr-9 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        data-testid="sort-select"
      >
        {options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
  );
}
