import { useState, useRef, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, Search, Upload, ImageIcon, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScamIndicator {
  label: string;
  risk: "high" | "medium" | "low";
  description: string;
}

const SCAM_PATTERNS = [
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
];

const NUMBER_PATTERNS = [
  { pattern: /^(\+?233|0)(20|24|54|55|59)\d{7}$/, label: "MTN Ghana number", risk: "low" as const, description: "Standard MTN Ghana mobile number format." },
  { pattern: /^(\+?233|0)(30|50)\d{7}$/, label: "Vodafone Ghana number", risk: "low" as const, description: "Standard Vodafone Ghana number format." },
  { pattern: /^(\+?233|0)(27|57|26|56)\d{7}$/, label: "AirtelTigo Ghana number", risk: "low" as const, description: "Standard AirtelTigo Ghana number format." },
  { pattern: /^\+?44\d{10}$/, label: "UK international number", risk: "medium" as const, description: "International number from UK. Use caution with unexpected contact from overseas numbers." },
  { pattern: /^\+?1\d{10}$/, label: "US/Canada number", risk: "medium" as const, description: "North American number. Scammers frequently spoof or use US numbers." },
  { pattern: /^\+?(234)\d{10}$/, label: "Nigerian number", risk: "medium" as const, description: "Nigerian number. Many legitimate Ghanaians have Nigerian contacts, but verify identity independently." },
];

export default function GhanaScamChecker() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"message" | "number">("message");
  const [checked, setChecked] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runOCR = useCallback(async (imageFile: File | Blob) => {
    setOcrLoading(true);
    setChecked(false);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const imageUrl = URL.createObjectURL(imageFile);
      setOcrImage(imageUrl);
      const { data: { text } } = await worker.recognize(imageFile);
      await worker.terminate();
      const cleaned = text.replace(/\n{3,}/g, "\n\n").trim();
      setInput(cleaned);
      setMode("message");
    } catch {
      setInput("Could not read text from image. Try pasting the message text directly.");
    }
    setOcrLoading(false);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) runOCR(file);
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) runOCR(blob);
        return;
      }
    }
  }, [runOCR]);

  const clearImage = () => {
    setOcrImage(null);
    setInput("");
    setChecked(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const indicators: ScamIndicator[] = [];
  if (checked && input.trim()) {
    if (mode === "message") {
      for (const p of SCAM_PATTERNS) {
        if (p.pattern.test(input)) {
          indicators.push({ label: p.label, risk: p.risk, description: p.description });
        }
      }
    } else {
      for (const p of NUMBER_PATTERNS) {
        if (p.pattern.test(input.replace(/\s/g, ""))) {
          indicators.push({ label: p.label, risk: p.risk, description: p.description });
        }
      }
    }
  }

  const highCount = indicators.filter(i => i.risk === "high").length;
  const medCount = indicators.filter(i => i.risk === "medium").length;

  const verdict = !checked || !input.trim() ? null
    : highCount >= 2 ? "high"
    : highCount === 1 || medCount >= 2 ? "medium"
    : indicators.length === 0 ? "clear"
    : "low";

  const RISK_CONFIG = {
    high: { icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/40", label: "High Scam Risk", msg: "Multiple serious red flags detected. Do not send money, click links, or share personal information. Report to Ghana Police cybercrime unit." },
    medium: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40", label: "Some Red Flags", msg: "Suspicious patterns detected. Verify the sender's identity through a separate, trusted channel before taking any action." },
    low: { icon: AlertTriangle, color: "text-blue-600", bg: "bg-blue-50 border-blue-200", label: "Minor Indicators", msg: "A few patterns worth noting. Use your judgment and verify independently if unsure." },
    clear: { icon: ShieldCheck, color: "text-green-600", bg: "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/40", label: "No Obvious Red Flags", msg: "No known scam patterns detected. This does not guarantee legitimacy — always verify before acting on any unsolicited contact." },
  };

  return (
    <Layout>
      <SEOHead
        title="Ghana Scam Pattern Checker — Spot MoMo Fraud, Fake Vendors & SMS Scams"
        description="Upload a screenshot or paste a suspicious message to check for Ghana scam patterns. Covers MoMo fraud, fake food vendors, advance payment scams, and more."
        canonical="/tools/ghana-scam-checker"
        keywords={["Ghana scam checker", "mobile money scam Ghana", "MoMo fraud detector", "fake Pizzaman scam", "SMS scam Ghana", "online shop scam Ghana"]}
      />

      <div className="container max-w-2xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mx-auto mb-5">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Ghana Scam Pattern Checker
          </h1>
          <p className="text-muted-foreground text-lg">
            Paste a message, upload a screenshot, or enter a number to check for known scam patterns.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-5">
          {(["message", "number"] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setChecked(false); setInput(""); setOcrImage(null); }}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all",
                mode === m ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary"
              )}
            >
              {m === "message" ? "Check a Message" : "Check a Number"}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-4">
          {mode === "message" ? (
            <>
              {/* Screenshot upload area */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={ocrLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-muted border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary hover:text-primary transition-all"
                >
                  {ocrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {ocrLoading ? "Reading screenshot..." : "Upload screenshot"}
                </button>
                <span className="text-xs text-muted-foreground self-center">or paste image (Ctrl+V)</span>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>

              {/* OCR preview */}
              {ocrImage && (
                <div className="relative mb-3 rounded-xl overflow-hidden border border-border">
                  <img src={ocrImage} alt="Uploaded screenshot" className="w-full max-h-48 object-contain bg-muted" />
                  <button onClick={clearImage} className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background">
                    <X className="w-4 h-4 text-foreground" />
                  </button>
                  {ocrLoading && (
                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm font-medium">Extracting text from image...</span>
                    </div>
                  )}
                </div>
              )}

              <textarea
                value={input}
                onChange={e => { setInput(e.target.value); setChecked(false); }}
                onPaste={handlePaste}
                placeholder="Paste the suspicious message here, or upload/paste a screenshot above..."
                rows={5}
                className="w-full bg-muted rounded-xl p-4 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />

              {!ocrImage && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  You can also paste a screenshot directly into the text area (Ctrl+V / Cmd+V)
                </p>
              )}
            </>
          ) : (
            <input
              type="tel"
              value={input}
              onChange={e => { setInput(e.target.value); setChecked(false); }}
              placeholder="e.g. 0244123456 or +233244123456"
              className="w-full bg-muted rounded-xl px-4 py-4 text-base border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}

          <button
            onClick={() => setChecked(true)}
            disabled={!input.trim() || ocrLoading}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Search className="w-4 h-4" />
            Check for Scam Patterns
          </button>
        </div>

        {/* Result */}
        {verdict && (() => {
          const cfg = RISK_CONFIG[verdict];
          const Icon = cfg.icon;
          return (
            <div className={cn("rounded-2xl border p-5 mb-4", cfg.bg)}>
              <div className="flex items-center gap-3 mb-3">
                <Icon className={cn("w-6 h-6", cfg.color)} />
                <h2 className={cn("text-lg font-bold", cfg.color)}>{cfg.label}</h2>
              </div>
              <p className="text-sm text-foreground mb-4">{cfg.msg}</p>

              {indicators.length > 0 && (
                <div className="space-y-3">
                  {indicators.map((ind, i) => (
                    <div key={i} className="bg-background/60 rounded-xl p-3 border border-border/50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
                          ind.risk === "high" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : ind.risk === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-blue-100 text-blue-700")}>
                          {ind.risk.toUpperCase()} RISK
                        </span>
                        <span className="text-sm font-semibold text-foreground">{ind.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{ind.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Scam types */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-3">Common Ghana Scam Types to Know</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            {[
              ["🍕 Fake Food Vendor", "Scammers use names like 'Pizzaman Ghana' or 'Chickenman Delivery' on WhatsApp and social media. They collect advance payment then disappear or deliver nothing."],
              ["📦 Advance Payment Trap", "Any seller asking you to pay before delivery or inspection — especially for electronics, phones, clothing, or house rentals — is high risk. Inspect before you pay."],
              ["📲 MoMo Reversal", "Someone sends you money 'by mistake' and asks you to return it. The original transfer later reverses."],
              ["💸 Fake Delivery Fee", "SMS claiming your package needs a small fee (GHS 3–10) to be released. Link steals your card details."],
              ["🎰 Lottery/Telecom Prize", "You've 'won' a prize from MTN/Vodafone. Requires a fee to claim. There is no prize."],
              ["🐷 Pig Butchering", "Friendly 'wrong number' contact that builds trust before introducing a guaranteed crypto investment."],
              ["💼 Fake Job Offer", "Work-from-home job requiring an upfront payment for 'registration' or 'training materials.'"],
              ["🔑 OTP Phishing", "Caller claims to be your bank and needs the code sent to your phone to 'verify' your account."],
            ].map(([title, desc]) => (
              <div key={String(title)} className="flex gap-2 py-2 border-b border-border/50 last:border-0">
                <div><strong className="text-foreground">{title}:</strong> {desc}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Report scams to Ghana Police Cybercrime Unit: 18555 · CRTF: 0800-900-111
        </p>
      </div>
    </Layout>
  );
}
