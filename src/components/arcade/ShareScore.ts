// ─── ShareScore — Utility to share scores via WhatsApp and Twitter ───────────

interface ShareScoreOptions {
  gameName: string;
  score: number;
  won: boolean;
  streak?: number;
  rankLabel?: string;
  url?: string;
}

function buildShareText(options: ShareScoreOptions): string {
  const { gameName, score, won, streak, rankLabel } = options;

  const lines: string[] = [];

  if (won) {
    lines.push(`I just scored ${score.toLocaleString()} in ${gameName}! 🏆`);
  } else {
    lines.push(`I scored ${score.toLocaleString()} in ${gameName}!`);
  }

  if (streak && streak >= 3) {
    lines.push(`🔥 ${streak}-win streak!`);
  }

  if (rankLabel) {
    lines.push(`Rank: ${rankLabel}`);
  }

  lines.push('');
  lines.push('Can you beat my score?');
  lines.push('Play at TechTrendi Arcade ➜ techtrendi.com/arcade');

  return lines.join('\n');
}

export function shareViaWhatsApp(options: ShareScoreOptions) {
  const text = buildShareText(options);
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function shareViaTwitter(options: ShareScoreOptions) {
  const text = buildShareText(options);
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function shareScore(options: ShareScoreOptions) {
  const text = buildShareText(options);

  if (navigator.share) {
    navigator
      .share({
        title: `${options.gameName} - TechTrendi Arcade`,
        text,
        url: options.url || 'https://techtrendi.com/arcade',
      })
      .catch(() => {
        // Fallback to clipboard
        copyToClipboard(text);
      });
  } else {
    copyToClipboard(text);
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    // Silent fail
  });
}
