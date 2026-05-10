import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Zap, AlertCircle, TrendingDown } from "lucide-react";

// ECG Ghana 2026 Residential Tariff (approximate)
const TARIFF = {
  lifeline: { limit: 50, rate: 0.1362, label: "Lifeline (0–50 kWh)" },
  band1: { limit: 300, rate: 1.0234, label: "Band 1 (51–300 kWh)" },
  band2: { limit: 600, rate: 1.3121, label: "Band 2 (301–600 kWh)" },
  band3: { limit: Infinity, rate: 1.5845, label: "Band 3 (600+ kWh)" },
};

const FIXED_CHARGE = 5.20; // monthly fixed service charge
const DEBT_RECOVERY = 0.0392; // per kWh
const ENERGY_FUND = 0.0218; // per kWh

const APPLIANCES = [
  { name: "LED bulb (9W)", watts: 9, category: "Lighting" },
  { name: "Ceiling fan", watts: 60, category: "Cooling" },
  { name: "Air conditioner (1 ton)", watts: 900, category: "Cooling" },
  { name: "Air conditioner (1.5 ton)", watts: 1300, category: "Cooling" },
  { name: "Refrigerator", watts: 150, category: "Kitchen" },
  { name: "Electric iron", watts: 1000, category: "Home" },
  { name: "Washing machine", watts: 500, category: "Home" },
  { name: "Television (32-inch)", watts: 60, category: "Entertainment" },
  { name: "Television (55-inch)", watts: 120, category: "Entertainment" },
  { name: "Laptop", watts: 65, category: "Electronics" },
  { name: "Phone charger", watts: 18, category: "Electronics" },
  { name: "Desktop computer", watts: 200, category: "Electronics" },
  { name: "Electric kettle", watts: 1500, category: "Kitchen" },
  { name: "Microwave", watts: 900, category: "Kitchen" },
  { name: "Water heater (geyser)", watts: 2000, category: "Home" },
  { name: "Security light", watts: 20, category: "Lighting" },
];

function calcBill(kwh: number) {
  let energy = 0;
  if (kwh <= 50) {
    energy = kwh * TARIFF.lifeline.rate;
  } else if (kwh <= 300) {
    energy = 50 * TARIFF.lifeline.rate + (kwh - 50) * TARIFF.band1.rate;
  } else if (kwh <= 600) {
    energy = 50 * TARIFF.lifeline.rate + 250 * TARIFF.band1.rate + (kwh - 300) * TARIFF.band2.rate;
  } else {
    energy = 50 * TARIFF.lifeline.rate + 250 * TARIFF.band1.rate + 300 * TARIFF.band2.rate + (kwh - 600) * TARIFF.band3.rate;
  }
  const levies = kwh * (DEBT_RECOVERY + ENERGY_FUND);
  return {
    energy: Math.round(energy * 100) / 100,
    levies: Math.round(levies * 100) / 100,
    fixed: FIXED_CHARGE,
    total: Math.round((energy + levies + FIXED_CHARGE) * 100) / 100,
  };
}

export default function GhanaElectricityCalculator() {
  const [units, setUnits] = useState("");
  const [selected, setSelected] = useState<{id: number; hours: number}[]>([]);

  const kwh = parseFloat(units) || 0;
  const bill = kwh > 0 ? calcBill(kwh) : null;

  const applianceKwh = useMemo(() => {
    return selected.reduce((sum, s) => {
      const a = APPLIANCES[s.id];
      return sum + (a.watts / 1000) * s.hours * 30;
    }, 0);
  }, [selected]);

  const applianceBill = applianceKwh > 0 ? calcBill(applianceKwh) : null;

  const toggleAppliance = (id: number) => {
    if (selected.find(s => s.id === id)) {
      setSelected(prev => prev.filter(s => s.id !== id));
    } else {
      setSelected(prev => [...prev, { id, hours: 8 }]);
    }
  };

  const updateHours = (id: number, hours: number) => {
    setSelected(prev => prev.map(s => s.id === id ? { ...s, hours } : s));
  };

  return (
    <Layout>
      <SEOHead
        title="Ghana Electricity Bill Calculator — ECG Tariff 2026"
        description="Calculate your ECG electricity bill using Ghana's 2026 tariff rates. Enter your units or select appliances to estimate your monthly electricity cost."
        canonical="/tools/ghana-electricity-calculator"
        keywords={["Ghana electricity bill calculator", "ECG tariff 2026", "electricity cost Ghana", "units calculator Ghana"]}
      />

      <div className="container max-w-3xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center mx-auto mb-5">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Ghana Electricity Bill Calculator
          </h1>
          <p className="text-muted-foreground text-lg">
            Estimate your ECG monthly bill using the 2026 tariff structure.
          </p>
        </div>

        {/* Tab: Enter units directly */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Calculate from units (kWh)
          </h2>
          <p className="text-sm text-muted-foreground mb-3">Check your ECG meter or prepaid voucher for your monthly units consumed.</p>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="5000"
              value={units}
              onChange={e => setUnits(e.target.value)}
              placeholder="Enter monthly units (kWh)..."
              className="w-full px-4 py-4 text-xl font-bold bg-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">kWh</span>
          </div>

          {bill && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm py-2 border-b border-border">
                <span className="text-muted-foreground">Energy charge</span>
                <span className="font-medium">₵{bill.energy.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-border">
                <span className="text-muted-foreground">Levies & debt recovery</span>
                <span className="font-medium">₵{bill.levies.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-border">
                <span className="text-muted-foreground">Fixed service charge</span>
                <span className="font-medium">₵{bill.fixed.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 text-lg font-bold">
                <span>Estimated Monthly Bill</span>
                <span className="text-primary">₵{bill.total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Appliance estimator */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-green-500" />
            Estimate from appliances
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Select your appliances and set daily usage hours to estimate consumption.</p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {APPLIANCES.map((a, i) => {
              const sel = selected.find(s => s.id === i);
              return (
                <div key={a.name} className={`border rounded-xl p-3 transition-all ${sel ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!sel}
                      onChange={() => toggleAppliance(i)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground leading-tight">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.watts}W</div>
                    </div>
                  </label>
                  {sel && (
                    <div className="mt-2 flex items-center gap-1">
                      <input
                        type="number"
                        min="0.5"
                        max="24"
                        step="0.5"
                        value={sel.hours}
                        onChange={e => updateHours(i, parseFloat(e.target.value) || 1)}
                        className="w-16 px-2 py-1 text-xs bg-muted rounded border border-border text-center"
                      />
                      <span className="text-xs text-muted-foreground">hrs/day</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {applianceBill && (
            <div className="bg-muted rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated monthly usage</span>
                <span className="font-medium">{applianceKwh.toFixed(1)} kWh</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Estimated Monthly Bill</span>
                <span className="text-primary">₵{applianceBill.total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tariff table */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-4">
          <h3 className="font-semibold text-foreground mb-3">ECG 2026 Residential Tariff Bands</h3>
          <div className="space-y-2 text-sm">
            {[TARIFF.lifeline, TARIFF.band1, TARIFF.band2, TARIFF.band3].map(t => (
              <div key={t.label} className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
                <span className="text-muted-foreground">{t.label}</span>
                <span className="font-medium">₵{t.rate.toFixed(4)}/kWh</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>Tariff rates are approximate based on the 2026 ECG published schedule. Actual bills may differ due to PURC adjustments, VAT, and other levies. Check your ECG bill or visit ecg.com.gh for exact current rates.</p>
        </div>
      </div>
    </Layout>
  );
}
