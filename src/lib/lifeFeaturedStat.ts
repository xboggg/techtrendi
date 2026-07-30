// Picks the "hero" stat + reframing line for the reveal moment and Life
// Card, based on life stage — always the remaining/lived count that lands
// as motivating rather than the raw "% of life gone" figure. Two options
// per bracket, rotating by day-of-year (deterministic, not re-randomized on
// refresh or mid-visit) so a returning visitor sees a fresh angle without
// the line flickering while they're actively looking at the page.
export interface FeaturedStatInput {
  age: number;
  saturdaysLeft: number;
  weeksAhead: number;
  morningsAhead: number;
  summersLeft: number;
  yearsLeft: number;
  daysLived: number;
  monthsLived: number;
}

export interface FeaturedStat {
  big: string;
  label: string;
  sub: string;
}

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

function fmt(n: number): string {
  return new Intl.NumberFormat().format(Math.floor(n));
}

export function getFeaturedStat(input: FeaturedStatInput, now: Date = new Date()): FeaturedStat {
  type Pool = { big: number; label: string; sub: string }[];

  let pool: Pool;
  if (input.age <= 25) {
    pool = [
      { big: input.weeksAhead, label: "weeks ahead", sub: "A lot of room to become someone." },
      { big: input.morningsAhead, label: "mornings to come", sub: "What should most of them look like?" },
    ];
  } else if (input.age <= 45) {
    pool = [
      { big: input.saturdaysLeft, label: "Saturdays left", sub: "Still time to build the life you want." },
      { big: input.summersLeft, label: "summers ahead", sub: "Spend a few of them bravely." },
    ];
  } else if (input.age <= 64) {
    pool = [
      { big: input.saturdaysLeft, label: "Saturdays ahead", sub: "The best ones can still be coming." },
      { big: input.yearsLeft, label: "years ahead", sub: "That's an entire second act." },
    ];
  } else {
    pool = [
      { big: input.daysLived, label: "days lived", sub: "Today is one more to spend on what matters." },
      { big: input.monthsLived, label: "months of stories", sub: "The people around you would love to hear them." },
    ];
  }

  const pick = pool[dayOfYear(now) % pool.length];
  return { ...pick, big: fmt(pick.big) };
}
