// Draws the shareable "Life Card" onto a canvas and returns a PNG blob.
// Client-side only (no server round-trip) — the standard approach for
// "Spotify Wrapped"-style share cards.

export type LifeCardTheme = "signature" | "midnight" | "paper" | "sunset" | "forest" | "ocean";

export interface LifeCardStats {
  daysLived: number;
  daysRemaining: number;
  saturdaysRemaining: number;
  lifeProgress: number; // 0-100
  zodiacSign: string;
  generation: string;
}

const THEMES: Record<LifeCardTheme, {
  label: string;
  bgGradient: [string, string, string];
  ink: string;
  inkSoft: string;
  accent: string;
  cardBg: string;
}> = {
  signature: {
    label: "Signature",
    bgGradient: ["#7C3AED", "#EC4899", "#EF4444"],
    ink: "#FFFFFF",
    inkSoft: "rgba(255,255,255,0.75)",
    accent: "#FDE68A",
    cardBg: "rgba(255,255,255,0.08)",
  },
  midnight: {
    label: "Midnight",
    bgGradient: ["#0B0F1A", "#151B2C", "#0B0F1A"],
    ink: "#F5F1E6",
    inkSoft: "rgba(245,241,230,0.65)",
    accent: "#E8BE6E",
    cardBg: "rgba(232,190,110,0.08)",
  },
  paper: {
    label: "Paper",
    bgGradient: ["#F7F1E6", "#EFE6D3", "#F7F1E6"],
    ink: "#221A0F",
    inkSoft: "rgba(34,26,15,0.65)",
    accent: "#B5482A",
    cardBg: "rgba(34,26,15,0.05)",
  },
  sunset: {
    label: "Sunset",
    bgGradient: ["#F97316", "#EF4444", "#7C2D12"],
    ink: "#FFFFFF",
    inkSoft: "rgba(255,255,255,0.75)",
    accent: "#FEF08A",
    cardBg: "rgba(255,255,255,0.1)",
  },
  forest: {
    label: "Forest",
    bgGradient: ["#064E3B", "#065F46", "#14532D"],
    ink: "#F0FDF4",
    inkSoft: "rgba(240,253,244,0.7)",
    accent: "#FCD34D",
    cardBg: "rgba(252,211,77,0.08)",
  },
  ocean: {
    label: "Ocean",
    bgGradient: ["#0C4A6E", "#0369A1", "#155E75"],
    ink: "#F0F9FF",
    inkSoft: "rgba(240,249,255,0.72)",
    accent: "#67E8F9",
    cardBg: "rgba(103,232,249,0.1)",
  },
};

export const LIFE_CARD_THEMES = THEMES;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fmt(n: number): string {
  return new Intl.NumberFormat().format(Math.floor(n));
}

export async function renderLifeCard(stats: LifeCardStats, theme: LifeCardTheme): Promise<Blob> {
  const W = 1080;
  const H = 1350; // 4:5 — the safest aspect ratio across IG/FB/WhatsApp/X
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const t = THEMES[theme];

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, t.bgGradient[0]);
  grad.addColorStop(0.55, t.bgGradient[1]);
  grad.addColorStop(1, t.bgGradient[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Soft decorative circles for texture
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = t.ink;
  ctx.beginPath(); ctx.arc(W - 60, 120, 260, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(60, H - 140, 220, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  const pad = 72;
  let y = 120;

  // Eyebrow — given real breathing room below it so it reads as a distinct
  // label, not crowded against the giant number underneath.
  ctx.fillStyle = t.accent;
  ctx.font = "700 30px -apple-system, Segoe UI, Arial, sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("MY LIFE, IN NUMBERS", pad, y);
  y += 130;

  // Big headline number: days lived
  ctx.fillStyle = t.ink;
  ctx.font = "800 132px -apple-system, Segoe UI, Arial, sans-serif";
  ctx.fillText(fmt(stats.daysLived), pad, y);
  y += 56;
  ctx.font = "500 38px -apple-system, Segoe UI, Arial, sans-serif";
  ctx.fillStyle = t.inkSoft;
  ctx.fillText("days I've lived so far", pad, y);
  y += 90;

  // Life progress bar
  const barW = W - pad * 2;
  const barH = 28;
  ctx.fillStyle = t.cardBg;
  roundRect(ctx, pad, y, barW, barH, barH / 2); ctx.fill();
  ctx.fillStyle = t.accent;
  const filled = Math.max(6, (stats.lifeProgress / 100) * barW);
  roundRect(ctx, pad, y, filled, barH, barH / 2); ctx.fill();
  y += barH + 34;
  ctx.font = "600 32px -apple-system, Segoe UI, Arial, sans-serif";
  ctx.fillStyle = t.ink;
  ctx.fillText(`${stats.lifeProgress.toFixed(1)}% of an average life, lived`, pad, y);
  y += 100;

  // Two stat tiles: days remaining, Saturdays remaining
  const tileW = (barW - 28) / 2;
  const tileH = 210;
  const tiles = [
    { value: fmt(stats.daysRemaining), label: "days you may have left" },
    { value: fmt(stats.saturdaysRemaining), label: "Saturdays left — make them count" },
  ];
  tiles.forEach((tile, i) => {
    const tx = pad + i * (tileW + 28);
    ctx.fillStyle = t.cardBg;
    roundRect(ctx, tx, y, tileW, tileH, 28); ctx.fill();
    ctx.fillStyle = t.ink;
    ctx.font = "800 64px -apple-system, Segoe UI, Arial, sans-serif";
    ctx.fillText(tile.value, tx + 30, y + 84);
    ctx.font = "500 28px -apple-system, Segoe UI, Arial, sans-serif";
    ctx.fillStyle = t.inkSoft;
    wrapText(ctx, tile.label, tx + 30, y + 130, tileW - 60, 34);
  });
  y += tileH + 60;

  // Zodiac / generation row
  ctx.font = "600 30px -apple-system, Segoe UI, Arial, sans-serif";
  ctx.fillStyle = t.inkSoft;
  ctx.fillText(`${stats.zodiacSign}  ·  ${stats.generation}`, pad, y);

  // Footer branding
  ctx.font = "800 34px -apple-system, Segoe UI, Arial, sans-serif";
  ctx.fillStyle = t.ink;
  ctx.fillText("TechTrendi.com", pad, H - 70);
  ctx.font = "500 26px -apple-system, Segoe UI, Arial, sans-serif";
  ctx.fillStyle = t.inkSoft;
  ctx.fillText("/tools/life-progress-bar", pad, H - 36);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))), "image/png", 0.95);
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let lineY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, lineY);
}
