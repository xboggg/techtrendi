// Picks one "today's angle" on the visitor's existing stats, rotating by
// day-of-year so the same person sees a different framing if they return
// tomorrow — the content changes even though the underlying math barely
// moves day to day. Deterministic per day (not re-randomized on refresh).
export interface DailyMomentInput {
  ageYears: number;
  ageDays: number;
  remainingDays: number;
  remainingWeeks: number;
  lifeProgress: number;
  daysUntilBirthday: number;
  nextBirthdayAge: number;
}

export interface DailyMoment {
  label: string;
  detail: string;
}

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function fmt(n: number): string {
  return new Intl.NumberFormat().format(Math.floor(n));
}

export function getDailyMoment(input: DailyMomentInput, now: Date = new Date()): DailyMoment {
  const moments: DailyMoment[] = [
    {
      label: `Today is your ${ordinal(Math.floor(input.ageDays))} day alive`,
      detail: "Every single day is a number that only goes up once.",
    },
    {
      label: `You've now lived through ${fmt(input.ageYears * 52)} weeks`,
      detail: "That's a lot of Mondays behind you.",
    },
    {
      label: `${input.remainingWeeks < 1 ? "Less than 1" : fmt(input.remainingWeeks)} weeks may be left`,
      detail: "Based on your current life expectancy setting.",
    },
    {
      label: `You're ${input.lifeProgress.toFixed(1)}% through the estimate`,
      detail: input.lifeProgress < 50 ? "Still more ahead than behind." : "More behind than ahead now.",
    },
    {
      label: input.daysUntilBirthday <= 30
        ? `${input.daysUntilBirthday} days until you turn ${input.nextBirthdayAge}`
        : `${fmt(input.daysUntilBirthday)} days until your next birthday`,
      detail: `You'll be ${input.nextBirthdayAge}.`,
    },
    {
      label: `${fmt(input.ageDays)} sunrises, so far`,
      detail: "Each one arrived exactly once.",
    },
    {
      label: `Roughly ${fmt(input.remainingDays / 7)} weekends left`,
      detail: "At your current life expectancy setting.",
    },
  ];

  const index = dayOfYear(now) % moments.length;
  return moments[index];
}
