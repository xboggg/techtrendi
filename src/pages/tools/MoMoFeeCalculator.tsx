import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { cn } from "@/lib/utils";
import { Calculator, AlertCircle } from "lucide-react";

const NETWORKS = [
  {
    name: "MTN MoMo",
    color: "bg-yellow-400 text-black",
    border: "border-yellow-400",
    tiers: [
      { min: 1, max: 100, fee: 0.88, label: "GHS 1 – 100" },
      { min: 101, max: 300, fee: 1.76, label: "GHS 101 – 300" },
      { min: 301, max: 600, fee: 2.64, label: "GHS 301 – 600" },
      { min: 601, max: 1000, fee: 3.52, label: "GHS 601 – 1,000" },
      { min: 1001, max: 2000, fee: 5.28, label: "GHS 1,001 – 2,000" },
      { min: 2001, max: 5000, fee: 8.80, label: "GHS 2,001 – 5,000" },
      { min: 5001, max: 10000, fee: 17.60, label: "GHS 5,001 – 10,000" },
    ],
  },
  {
    name: "Vodafone Cash",
    color: "bg-red-600 text-white",
    border: "border-red-600",
    tiers: [
      { min: 1, max: 100, fee: 0.88, label: "GHS 1 – 100" },
      { min: 101, max: 300, fee: 1.76, label: "GHS 101 – 300" },
      { min: 301, max: 600, fee: 2.64, label: "GHS 301 – 600" },
      { min: 601, max: 1000, fee: 3.52, label: "GHS 601 – 1,000" },
      { min: 1001, max: 2000, fee: 5.28, label: "GHS 1,001 – 2,000" },
      { min: 2001, max: 5000, fee: 8.80, label: "GHS 2,001 – 5,000" },
      { min: 5001, max: 10000, fee: 17.60, label: "GHS 5,001 – 10,000" },
    ],
  },
  {
    name: "AirtelTigo Money",
    color: "bg-blue-600 text-white",
    border: "border-blue-600",
    tiers: [
      { min: 1, max: 100, fee: 0.88, label: "GHS 1 – 100" },
      { min: 101, max: 300, fee: 1.76, label: "GHS 101 – 300" },
      { min: 301, max: 600, fee: 2.64, label: "GHS 301 – 600" },
      { min: 601, max: 1000, fee: 3.52, label: "GHS 601 – 1,000" },
      { min: 1001, max: 2000, fee: 5.28, label: "GHS 1,001 – 2,000" },
      { min: 2001, max: 5000, fee: 8.80, label: "GHS 2,001 – 5,000" },
      { min: 5001, max: 10000, fee: 17.60, label: "GHS 5,001 – 10,000" },
    ],
  },
];

function getFee(network: typeof NETWORKS[0], amount: number) {
  const tier = network.tiers.find(t => amount >= t.min && amount <= t.max);
  return tier ? tier.fee : null;
}

export default function MoMoFeeCalculator() {
  const [amount, setAmount] = useState("");
  const [selectedNet, setSelectedNet] = useState(0);

  const numAmount = parseFloat(amount) || 0;
  const network = NETWORKS[selectedNet];
  const fee = numAmount > 0 ? getFee(network, numAmount) : null;
  const recipient = fee !== null ? numAmount - fee : null;

  return (
    <Layout>
      <SEOHead
        title="Ghana MoMo Fee Calculator — MTN, Vodafone, AirtelTigo"
        description="Calculate exactly how much your recipient gets after mobile money transfer fees in Ghana. Covers MTN MoMo, Vodafone Cash, and AirtelTigo Money."
        canonical="/tools/momo-fee-calculator"
        keywords={["MoMo fee calculator Ghana", "MTN mobile money fee", "Vodafone cash transfer fee", "mobile money Ghana"]}
      />

      <div className="container max-w-2xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-5">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Ghana MoMo Fee Calculator
          </h1>
          <p className="text-muted-foreground text-lg">
            Know exactly what your recipient will receive before you send.
          </p>
        </div>

        {/* Network selector */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {NETWORKS.map((net, i) => (
            <button
              key={net.name}
              onClick={() => setSelectedNet(i)}
              className={cn(
                "py-3 px-2 rounded-xl text-sm font-semibold border-2 transition-all",
                selectedNet === i ? `${net.color} ${net.border}` : "bg-card border-border text-muted-foreground hover:border-primary"
              )}
            >
              {net.name}
            </button>
          ))}
        </div>

        {/* Amount input */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Amount to Send (GHS)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">₵</span>
            <input
              type="number"
              min="1"
              max="10000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount..."
              className="w-full pl-10 pr-4 py-4 text-2xl font-bold bg-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {numAmount > 10000 && (
            <p className="text-sm text-destructive mt-2">Maximum single transaction limit is GHS 10,000.</p>
          )}
        </div>

        {/* Result */}
        {fee !== null && numAmount > 0 && numAmount <= 10000 && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <span className="text-muted-foreground">Amount sent</span>
              <span className="font-bold text-xl">₵{numAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <span className="text-muted-foreground">{network.name} transfer fee</span>
              <span className="font-bold text-xl text-destructive">– ₵{fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Recipient receives</span>
              <span className="font-bold text-2xl text-green-600">₵{(recipient ?? 0).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Fee tiers table */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4">{network.name} — Full Fee Schedule</h3>
          <div className="space-y-2">
            {network.tiers.map(tier => (
              <div
                key={tier.label}
                className={cn(
                  "flex justify-between items-center px-3 py-2 rounded-lg text-sm",
                  numAmount >= tier.min && numAmount <= tier.max
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground"
                )}
              >
                <span>{tier.label}</span>
                <span>₵{tier.fee.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>Fees shown are approximate and based on published network tariffs. Verify with your network provider as rates may be updated. Sending to registered MoMo wallets on the same network may have different rates.</p>
        </div>
      </div>
    </Layout>
  );
}
