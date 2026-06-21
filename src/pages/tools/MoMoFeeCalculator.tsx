import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { ToolContentSection } from "@/components/tools/ToolContentSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Smartphone, ArrowDownToLine, Info } from "lucide-react";

// ---------------------------------------------------------------------------
// FEE RULES — verified June 2026. E-Levy ABOLISHED (2 April 2025) → no levy.
// Sources: MTN Ghana (official "zero charge to send ≤GHS100"), Asetena Pa, MomoCalc.
// Telecel deferred (same-network fee unconfirmed). Maintainer: update RATES_AS_OF
// + the bands below if a provider changes its schedule.
// ---------------------------------------------------------------------------
const RATES_AS_OF = "June 2026";

type Band = { upTo: number; flat?: number; pct?: number };

interface Provider {
  id: string;
  name: string;
  emoji: string;
  send: Band[]; // send money to a user on the SAME network
  cashout: Band[]; // cash-out / withdrawal at an agent
}

// fee = first band whose upTo >= amount; flat OR pct of amount.
function feeFromBands(bands: Band[], amount: number): number {
  for (const b of bands) {
    if (amount <= b.upTo) {
      if (b.flat !== undefined) return b.flat;
      if (b.pct !== undefined) return amount * b.pct;
      return 0;
    }
  }
  const last = bands[bands.length - 1];
  return last.flat ?? (last.pct ? amount * last.pct : 0);
}

const PROVIDERS: Provider[] = [
  {
    id: "mtn",
    name: "MTN MoMo",
    emoji: "💛",
    send: [
      { upTo: 100, flat: 0 }, // free up to GHS 100 (MTN official)
      { upTo: 999.99, pct: 0.0075 }, // 0.75%
      { upTo: Infinity, flat: 7.5 }, // capped at GHS 7.50
    ],
    cashout: [
      { upTo: 50, flat: 0.5 },
      { upTo: 1999.99, pct: 0.01 }, // 1%
      { upTo: Infinity, flat: 20 },
    ],
  },
  {
    id: "at",
    name: "AT Money (AirtelTigo)",
    emoji: "💙",
    send: [
      { upTo: 100, flat: 0 },
      { upTo: 999.99, pct: 0.0075 },
      { upTo: Infinity, flat: 7.5 },
    ],
    cashout: [
      { upTo: 50, flat: 0.5 },
      { upTo: 1999.99, pct: 0.01 },
      { upTo: Infinity, flat: 20 },
    ],
  },
];

type Action = "send" | "cashout";

function formatGHS(value: number): string {
  return `GHS ${value.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function MoMoFeeCalculator() {
  const [providerId, setProviderId] = useState("mtn");
  const [action, setAction] = useState<Action>("send");
  const [amount, setAmount] = useState<string>("500");

  const result = useMemo(() => {
    const provider = PROVIDERS.find((p) => p.id === providerId)!;
    const amt = Math.max(0, parseFloat(amount) || 0);
    const bands = action === "send" ? provider.send : provider.cashout;
    const fee = feeFromBands(bands, amt);
    const total = amt + fee; // sender always pays the fee on top of the amount
    const effectivePct = amt > 0 ? (fee / amt) * 100 : 0;
    return { provider, amt, fee, total, effectivePct };
  }, [providerId, action, amount]);

  return (
    <Layout>
      <SEOHead
        title="MoMo Fee Calculator Ghana 2026 - MTN & AT Money Charges"
        description="Calculate the exact MTN MoMo and AT Money transfer and cash-out fees in Ghana for 2026. Correctly updated for the abolished E-Levy — no government levy. Free, accurate, no sign-up."
        canonical="/tools/momo-fee-calculator"
        keywords={["momo fee calculator", "mtn momo charges ghana", "mobile money fees ghana", "at money charges", "cash out fee ghana", "e-levy abolished"]}
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              🇬🇭 MoMo Fee Calculator
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              See exactly what MTN MoMo and AT Money charge to send money or cash
              out in Ghana — with the abolished E-Levy correctly set to zero.
            </p>
          </div>

          {/* E-Levy banner */}
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4">
            <Info className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              <strong>No E-Levy.</strong> The 1% Electronic Transfer Levy was
              abolished on 2 April 2025, so it no longer applies to your MoMo
              transactions. Any calculator still adding it is out of date.
            </p>
          </div>

          {/* Inputs */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">Your transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Network</Label>
                  <Select value={providerId} onValueChange={setProviderId}>
                    <SelectTrigger id="provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.emoji} {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action">Transaction</Label>
                  <Select value={action} onValueChange={(v) => setAction(v as Action)}>
                    <SelectTrigger id="action">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send">Send money (same network)</SelectItem>
                      <SelectItem value="cashout">Cash out (withdraw at agent)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (GHS)</Label>
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="text-lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          <Card className="border-primary/30 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  {action === "send" ? (
                    <Smartphone className="w-4 h-4" />
                  ) : (
                    <ArrowDownToLine className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    Fee to {action === "send" ? "send" : "cash out"}{" "}
                    {formatGHS(result.amt)} on {result.provider.name}
                  </span>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-primary">
                  {formatGHS(result.fee)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.fee === 0
                    ? "Free at this amount 🎉"
                    : `${result.effectivePct.toFixed(2)}% of the amount`}
                </p>
              </div>

              <div className="space-y-2 border-t border-border pt-4 text-sm">
                <Row label="Amount" value={formatGHS(result.amt)} />
                <Row label="Provider fee" value={formatGHS(result.fee)} />
                <Row label="E-Levy (abolished)" value={formatGHS(0)} muted />
                {action === "send" ? (
                  <>
                    <Row label="Recipient receives" value={formatGHS(result.amt)} />
                    <Row label="Total you pay" value={formatGHS(result.total)} bold />
                  </>
                ) : (
                  <>
                    <Row label="Cash you receive" value={formatGHS(result.amt)} />
                    <Row label="Total deducted from wallet" value={formatGHS(result.total)} bold />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Rates as of {RATES_AS_OF}. Covers same-network sends and agent
            cash-outs for MTN MoMo and AT Money. Cross-network and MoMo-to-bank
            fees can differ; the bank-transfer fee MTN announced for 1 June 2026
            was suspended by the Bank of Ghana. Always confirm on <code>*170#</code>{" "}
            before a large transaction. Telecel Cash coming soon.
          </p>
        </div>

        <ToolContentSection toolId="momo-fee-calculator" />
      </div>
    </Layout>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted-foreground" : "text-foreground"}>{label}</span>
      <span
        className={
          bold
            ? "font-bold text-foreground"
            : muted
            ? "text-muted-foreground"
            : "font-medium text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}
