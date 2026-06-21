import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { ToolContentSection } from "@/components/tools/ToolContentSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Info } from "lucide-react";

// ---------------------------------------------------------------------------
// TARIFF — official PURC "2026 Second Quarter Tariff Review Decision",
// effective 1 April 2026 (residential). Values converted from pesewas (GHp) to
// cedis. Maintainer: PURC reviews quarterly — update TARIFF_AS_OF + the rates.
// ---------------------------------------------------------------------------
const TARIFF_AS_OF = "PURC Q2 2026 (effective 1 April 2026)";

const RATE_LIFELINE = 0.8690; // GHS/kWh, for total monthly use ≤ 30 kWh
const SERVICE_LIFELINE = 2.13; // GHS/month
const RATE_TIER1 = 1.968825; // GHS/kWh, first 300 kWh (non-lifeline)
const RATE_TIER2 = 2.601481; // GHS/kWh, above 300 kWh
const SERVICE_RESIDENTIAL = 10.730886; // GHS/month

function computeBill(kwh: number) {
  if (kwh <= 0) {
    return { type: "—", energy: 0, service: 0, total: 0 };
  }
  if (kwh <= 30) {
    const energy = kwh * RATE_LIFELINE;
    return { type: "Lifeline", energy, service: SERVICE_LIFELINE, total: energy + SERVICE_LIFELINE };
  }
  const tier1 = Math.min(kwh, 300) * RATE_TIER1;
  const tier2 = Math.max(0, kwh - 300) * RATE_TIER2;
  const energy = tier1 + tier2;
  return { type: "Residential", energy, service: SERVICE_RESIDENTIAL, total: energy + SERVICE_RESIDENTIAL };
}

function formatGHS(value: number): string {
  return `GHS ${value.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Typical wattages for common Ghanaian household appliances.
interface Appliance {
  id: string;
  name: string;
  watts: number;
  defHours: number; // typical hours/day
}
const APPLIANCES: Appliance[] = [
  { id: "led", name: "LED bulb", watts: 10, defHours: 5 },
  { id: "fan", name: "Fan (ceiling/standing)", watts: 75, defHours: 8 },
  { id: "fridge", name: "Fridge (effective runtime)", watts: 150, defHours: 8 },
  { id: "freezer", name: "Deep freezer (effective)", watts: 200, defHours: 8 },
  { id: "tv", name: "LED TV", watts: 100, defHours: 5 },
  { id: "decoder", name: "Decoder (DStv/GOtv)", watts: 25, defHours: 5 },
  { id: "ac", name: "Air conditioner (1.5 HP)", watts: 1200, defHours: 6 },
  { id: "iron", name: "Pressing iron", watts: 1000, defHours: 0.5 },
  { id: "kettle", name: "Electric kettle", watts: 1500, defHours: 0.3 },
  { id: "hotplate", name: "Hot plate / electric stove", watts: 2000, defHours: 1 },
  { id: "heater", name: "Water heater / geyser", watts: 3000, defHours: 0.5 },
  { id: "pump", name: "Water pump", watts: 750, defHours: 1 },
  { id: "washer", name: "Washing machine", watts: 500, defHours: 0.5 },
  { id: "laptop", name: "Laptop", watts: 65, defHours: 4 },
  { id: "charger", name: "Phone charger", watts: 10, defHours: 3 },
];

type Mode = "kwh" | "appliances";

export default function ECGBillEstimator() {
  const [mode, setMode] = useState<Mode>("kwh");
  const [directKwh, setDirectKwh] = useState<string>("250");
  // per-appliance: { qty, hours }
  const [rows, setRows] = useState<Record<string, { qty: string; hours: string }>>({});

  const applianceKwh = useMemo(() => {
    let total = 0;
    for (const a of APPLIANCES) {
      const r = rows[a.id];
      const qty = parseFloat(r?.qty ?? "0") || 0;
      const hours = parseFloat(r?.hours ?? String(a.defHours)) || 0;
      total += (a.watts * qty * hours * 30) / 1000; // monthly kWh
    }
    return total;
  }, [rows]);

  const kwh = mode === "kwh" ? Math.max(0, parseFloat(directKwh) || 0) : applianceKwh;
  const bill = useMemo(() => computeBill(kwh), [kwh]);

  const setRow = (id: string, field: "qty" | "hours", value: string) =>
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  return (
    <Layout>
      <SEOHead
        title="ECG Bill Estimator Ghana 2026 - Electricity Cost Calculator"
        description="Estimate your ECG electricity bill in Ghana using the official PURC 2026 residential tariff. Enter your units or estimate from your appliances. Free, no sign-up."
        canonical="/tools/ecg-bill-estimator"
        keywords={["ecg bill calculator", "electricity bill ghana", "purc tariff 2026", "ecg prepaid calculator", "kwh cost ghana", "electricity cost estimator"]}
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              🇬🇭 ECG Bill Estimator
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Estimate your monthly electricity cost using Ghana's official PURC
              residential tariff — by entering your units, or from your appliances.
            </p>
          </div>

          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-muted rounded-xl">
            <button
              onClick={() => setMode("kwh")}
              className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                mode === "kwh" ? "bg-card shadow text-foreground" : "text-muted-foreground"
              }`}
            >
              I know my units (kWh)
            </button>
            <button
              onClick={() => setMode("appliances")}
              className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                mode === "appliances" ? "bg-card shadow text-foreground" : "text-muted-foreground"
              }`}
            >
              Estimate from appliances
            </button>
          </div>

          {/* Inputs */}
          {mode === "kwh" ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl">Monthly units used</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="kwh">Units this month (kWh)</Label>
                <Input
                  id="kwh"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={directKwh}
                  onChange={(e) => setDirectKwh(e.target.value)}
                  className="text-lg mt-2"
                  placeholder="e.g. 250"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Your prepaid meter or ECG bill shows units in kWh.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl">Your appliances</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-muted-foreground px-1">
                  <span className="col-span-6">Appliance</span>
                  <span className="col-span-3 text-center">Quantity</span>
                  <span className="col-span-3 text-center">Hours/day</span>
                </div>
                {APPLIANCES.map((a) => (
                  <div key={a.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6 sm:col-span-6">
                      <span className="text-sm text-foreground">{a.name}</span>
                      <span className="block text-xs text-muted-foreground">{a.watts} W</span>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={rows[a.id]?.qty ?? ""}
                      onChange={(e) => setRow(a.id, "qty", e.target.value)}
                      className="col-span-3 text-center"
                      aria-label={`${a.name} quantity`}
                    />
                    <Input
                      type="number"
                      min="0"
                      placeholder={String(a.defHours)}
                      value={rows[a.id]?.hours ?? ""}
                      onChange={(e) => setRow(a.id, "hours", e.target.value)}
                      className="col-span-3 text-center"
                      aria-label={`${a.name} hours per day`}
                    />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2">
                  Enter how many you have and roughly how many hours a day each
                  runs. Leave hours blank to use a typical value.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Result */}
          <Card className="border-primary/30 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm">
                    Estimated monthly bill — {kwh.toFixed(0)} kWh ({bill.type})
                  </span>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-primary">
                  {formatGHS(bill.total)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  ≈ {formatGHS(kwh > 0 ? bill.total / kwh : 0)} per unit, all-in
                </p>
              </div>

              <div className="space-y-2 border-t border-border pt-4 text-sm">
                <Row label="Units used" value={`${kwh.toFixed(0)} kWh`} />
                <Row label="Energy charge" value={formatGHS(bill.energy)} />
                <Row label="Monthly service charge" value={formatGHS(bill.service)} />
                <Row label="Estimated total" value={formatGHS(bill.total)} bold />
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-foreground">
              Based on the <strong>{TARIFF_AS_OF}</strong> residential tariff
              (energy + service charge). Your actual bill also includes small
              statutory levies (street-lighting, national-electrification and
              applicable VAT/NHIL), so the real figure is a little higher. PURC
              reviews tariffs each quarter — confirm current rates with ECG.
            </p>
          </div>
        </div>

        <ToolContentSection toolId="ecg-bill-estimator" />
      </div>
    </Layout>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground">{label}</span>
      <span className={bold ? "font-bold text-foreground" : "font-medium text-foreground"}>
        {value}
      </span>
    </div>
  );
}
