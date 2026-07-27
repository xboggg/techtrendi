// Shared Ghana scam-detection logic — single source of truth used by both
// the full Ghana Scam Checker tool page and the inline checker widget on
// /security. Keeping this in one place means a fix (like the missing
// '.buzz' TLD found 2026-07-27) only has to happen once.

export interface ScamIndicator {
  label: string;
  risk: "high" | "medium" | "low";
  description: string;
}

export const SCAM_PATTERNS = [
  // Fake vendor / business impersonation
  { pattern: /pizzaman|chickenman|checken.*man|mr.*fresh|mama.*fresh|papa.*fresh/i, label: "Fake food vendor impersonation", risk: "high" as const, description: "Scammers impersonate popular Ghanaian food brands like Pizzaman and Chickenman to collect advance payments, then disappear without delivering." },
  { pattern: /pay.*before.*deliver|send.*money.*first.*deliver|transfer.*before.*we.*deliver|payment.*first.*then.*deliver/i, label: "Advance payment delivery scam", risk: "high" as const, description: "Legitimate vendors do not require payment before you see or receive your goods. Advance payment requests — especially for food, electronics, or clothing — are a common theft method." },
  { pattern: /online shop.*pay first|item.*reserved.*send.*money|transfer.*to.*reserve|pay.*to.*confirm.*order/i, label: "Fake online shop advance payment", risk: "high" as const, description: "Fake Facebook and Instagram shops ask for payment upfront to 'reserve' or 'confirm' your order, then block you after receiving the money." },
  { pattern: /house.*rent.*advance|apartment.*pay.*first.*inspect|send.*rent.*first|landlord.*abroad.*agent/i, label: "Fake rental listing", risk: "high" as const, description: "Fake rental listings — often claiming the 'landlord is abroad' — require advance rent payment before inspection. Always inspect before paying anything." },
  { pattern: /electronics.*pay.*first|phone.*pay.*before|laptop.*send.*money.*first|gadget.*advance.*pay/i, label: "Fake electronics / phone seller", risk: "high" as const, description: "Fake phone and electronics sellers on social media and Jiji collect payment and either disappear or send counterfeit items." },

  // Financial scams
  { pattern: /send.*money|transfer.*money|pay.*fee|redelivery fee|customs fee/i, label: "Payment demand language", risk: "high" as const, description: "Legitimate organisations rarely send unsolicited payment requests via SMS or WhatsApp." },
  { pattern: /your account.*suspended|account.*blocked|verify.*account|update.*payment/i, label: "Account suspension threat", risk: "high" as const, description: "Banks and platforms notify through official apps or formal letters, not urgent SMS links." },
  { pattern: /click.*link|tap.*link|visit.*link|follow.*link/i, label: "Link click request", risk: "high" as const, description: "Scam messages almost always ask you to click an external link urgently." },
  { pattern: /congratulations.*won|you have won|prize.*claim|lottery.*winner/i, label: "Prize/lottery claim", risk: "high" as const, description: "You cannot win a lottery you did not enter. These are universally fraudulent." },
  { pattern: /bitcoin|crypto.*invest|forex.*profit|investment.*guaranteed|daily.*returns/i, label: "Crypto/forex investment", risk: "high" as const, description: "Guaranteed investment returns are a hallmark of financial fraud." },
  { pattern: /your (mtn|vodafone|airteltigo|glo).*number.*selected|sim.*prize/i, label: "Telecom prize claim", risk: "high" as const, description: "Telecom companies do not award prizes via random SMS to selected numbers." },
  { pattern: /job offer|work from home.*earn|earn.*per day|earn.*cedis.*daily/i, label: "Too-good-to-be-true job", risk: "high" as const, description: "Legitimate employers advertise jobs through proper channels, not unsolicited messages." },
  { pattern: /urgent|immediately|expire.*today|last chance|act now|within.*hours/i, label: "Artificial urgency", risk: "medium" as const, description: "Creating panic to prevent you from thinking clearly is a core scam technique." },
  { pattern: /wrong.*number|hello dear|hello friend|dear customer/i, label: "Generic opener / wrong number approach", risk: "medium" as const, description: "'Wrong number' followed by friendship is a known pig-butchering scam entry point." },
  { pattern: /momo.*reverse|refund.*momo|mistaken.*transfer|sent.*wrong/i, label: "MoMo reversal request", risk: "high" as const, description: "If someone 'accidentally' sends you money and asks you to return it, the original transfer is likely fraudulent." },
  { pattern: /otp|one.time.*password|code.*sent|verify.*code/i, label: "OTP/code request", risk: "high" as const, description: "No legitimate service will ask you for an OTP sent to your phone. If they ask, hang up or ignore." },
  { pattern: /your package|parcel.*held|dhl|fedex|gha.*post.*delivery/i, label: "Fake delivery fee", risk: "high" as const, description: "Courier companies do not send payment links via SMS for delivery fees." },

  // Free-giveaway / "free data" / freebie bait (very common on WhatsApp & Telegram)
  { pattern: /free\s*\d+\s*(gb|mb|data|internet)|free (data|internet|mb|gb|airtime|recharge|voucher)/i, label: "Free data / airtime giveaway bait", risk: "high" as const, description: "“Free data/airtime/recharge for everyone” offers are a classic phishing trap. Networks and governments do NOT give away free data through forwarded WhatsApp/Telegram links. The link harvests your details or installs malware." },
  { pattern: /gift.*to.*everyone|to everyone|everyone.*get.*free|free.*gift.*everyone|recharge voucher/i, label: "“Free gift to EVERYONE” claim", risk: "high" as const, description: "Real promotions target specific customers with terms — not “free gifts to EVERYONE.” This wording is a hallmark of forwarded giveaway scams." },
  { pattern: /i (just )?got mine|got mine.*get yours|claim yours|get yours (below|now|here)|i already (got|claimed)|i (thought it was fake|actually got|actually received).*try it|but i (actually )?got (the|my|it)/i, label: "“I actually got mine, try it” bait", risk: "high" as const, description: "Fake social proof (“I thought it was fake but I actually got it — try it”) is engineered to make a scam link look tested and trustworthy. Legitimate offers don't rely on a forwarded stranger's testimonial." },
  { pattern: /tap here|click here|claim (now|here|your)|register (now|here)|sign ?up (now|here)|get it (now|here)/i, label: "Urgent “tap/click here” call-to-action", risk: "high" as const, description: "Scam messages push a single urgent button — “TAP HERE,” “CLAIM NOW” — pointing to an outside link. Don't tap unfamiliar links." },
  { pattern: /world ?cup|afcon|world\s*cup\s*2026|opening ceremony|victory celebration|qualif(y|ication)|to celebrate/i, label: "Event-celebration giveaway hook", risk: "medium" as const, description: "Scammers attach freebie offers to big events (World Cup, AFCON, elections) to feel timely and trustworthy. The event is real; the “free gift” is not." },
  { pattern: /presidency.*partner|government.*partner.*network|partners with all.*network|all network operators/i, label: "Fake “government/operator partnership”", risk: "high" as const, description: "Claims that “the Presidency” or “all network operators” are jointly giving away data/cash are fabricated authority used to lower your guard." },
  { pattern: /go viral|post it across|forward to|share to \d+|broadcast to|share with.*(friends|contacts|groups)/i, label: "Forward/share-to-spread instruction", risk: "medium" as const, description: "Being told to forward or post a message widely is how giveaway and chain scams spread. Genuine offers don't need you to broadcast them." },
];

// Known legitimate domains — links to anything else (especially lookalikes) get flagged.
export const TRUSTED_DOMAINS = [
  "mtn.com.gh", "mtn.com", "mymtn", "vodafone.com.gh", "telecel.com.gh", "airteltigo.com.gh",
  "gov.gh", "bog.gov.gh", "gra.gov.gh", "ecg.com.gh", "ghana.gov.gh",
  "facebook.com", "instagram.com", "wa.me", "whatsapp.com", "youtube.com", "twitter.com", "x.com", "tiktok.com",
  "google.com", "apple.com", "microsoft.com", "paypal.com",
  "techtrendi.com", "trendimovies.com",
];

// Pull URLs out of arbitrary (OCR'd) text.
export function extractUrls(text: string): string[] {
  const re = /\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?)/gi;
  const found = (text.match(re) || [])
    .map((u) => u.replace(/[.,)]+$/, ""))
    // ignore bare words that aren't really domains (need a known-ish TLD)
    .filter((u) => /\.(com|org|net|gh|info|xyz|online|site|club|top|live|app|me|co|io|buzz|click|fun|rest|win|bid|work|link|pages\.dev|vercel\.app|netlify\.app|icu|cyou|shop|store|website|space|host|cc|tk|ml|ga|cf|gq|html?)\b/i.test(u));
  return Array.from(new Set(found));
}

export function domainOf(url: string): string {
  try {
    const host = new URL(url.startsWith("http") ? url : `http://${url}`).hostname.toLowerCase();
    return host.replace(/^www\./, "");
  } catch {
    return url.toLowerCase();
  }
}

export function isTrusted(domain: string): boolean {
  return TRUSTED_DOMAINS.some((t) => domain === t || domain.endsWith(`.${t}`));
}

export const NUMBER_PATTERNS = [
  { pattern: /^(\+?233|0)(20|24|54|55|59)\d{7}$/, label: "MTN Ghana number", risk: "low" as const, description: "Standard MTN Ghana mobile number format." },
  { pattern: /^(\+?233|0)(30|50)\d{7}$/, label: "Vodafone Ghana number", risk: "low" as const, description: "Standard Vodafone Ghana number format." },
  { pattern: /^(\+?233|0)(27|57|26|56)\d{7}$/, label: "AirtelTigo Ghana number", risk: "low" as const, description: "Standard AirtelTigo Ghana number format." },
  { pattern: /^\+?44\d{10}$/, label: "UK international number", risk: "medium" as const, description: "International number from UK. Use caution with unexpected contact from overseas numbers." },
  { pattern: /^\+?1\d{10}$/, label: "US/Canada number", risk: "medium" as const, description: "North American number. Scammers frequently spoof or use US numbers." },
  { pattern: /^\+?(234)\d{10}$/, label: "Nigerian number", risk: "medium" as const, description: "Nigerian number. Many legitimate Ghanaians have Nigerian contacts, but verify identity independently." },
];

export type ScamVerdict = "high" | "medium" | "low" | "clear";

export function checkMessage(input: string): { indicators: ScamIndicator[]; verdict: ScamVerdict } {
  const indicators: ScamIndicator[] = [];
  for (const p of SCAM_PATTERNS) {
    if (p.pattern.test(input)) {
      indicators.push({ label: p.label, risk: p.risk, description: p.description });
    }
  }
  const urls = extractUrls(input);
  const untrusted = Array.from(new Set(urls.map(domainOf).filter((d) => d && !isTrusted(d))));
  if (untrusted.length > 0) {
    const shown = untrusted.slice(0, 3).join(", ");
    indicators.push({
      label: `Suspicious link${untrusted.length > 1 ? "s" : ""}: ${shown}`,
      risk: "high",
      description: `This message links to an unrecognised website (${shown}). Scam giveaways use throwaway lookalike domains like these to steal your details or money. Never enter your number, PIN, OTP, or card details on such sites. When in doubt, type the official website address yourself instead of tapping the link.`,
    });
  }

  const highCount = indicators.filter(i => i.risk === "high").length;
  const medCount = indicators.filter(i => i.risk === "medium").length;
  const verdict: ScamVerdict = highCount >= 2 ? "high"
    : highCount === 1 || medCount >= 2 ? "medium"
    : indicators.length === 0 ? "clear"
    : "low";

  return { indicators, verdict };
}
