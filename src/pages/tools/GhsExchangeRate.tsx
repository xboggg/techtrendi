import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { RefreshCw, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
  { code: "XOF", name: "West African CFA", symbol: "CFA", flag: "🌍" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪" },
];

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000];

export default function GhsExchangeRate() {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [amount, setAmount] = useState("1000");
  const [base, setBase] = useState<"GHS" | string>("GHS");
  const [target, setTarget] = useState("USD");

  const fetchRates = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/GHS");
      const data = await res.json();
      if (data.result === "success") {
        setRates(data.rates);
        const d = new Date(data.time_last_update_utc);
        setLastUpdated(d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }));
      } else throw new Error();
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRates(); }, []);

  const numAmount = parseFloat(amount) || 0;

  const convert = (from: string, to: string, amt: number) => {
    if (!rates[from] || !rates[to]) return null;
    const inGHS = from === "GHS" ? amt : amt / rates[from];
    return to === "GHS" ? inGHS : inGHS * rates[to];
  };

  const result = convert(base, target === base ? "USD" : target, numAmount);
  const ghsRate = rates["USD"] ? (1 / rates["USD"]) : null; // GHS per 1 USD

  return (
    <Layout>
      <SEOHead
        title="Ghana Cedi (GHS) Exchange Rate — Live Currency Converter"
        description="Live Ghana Cedi exchange rates against USD, GBP, EUR, NGN and more. Convert GHS to any major currency instantly with real-time rates."
        canonical="/tools/ghs-exchange-rate"
        keywords={["Ghana cedi exchange rate", "GHS to USD", "Ghana currency converter", "cedi rate today", "GHS exchange rate live"]}
      />

      <div className="container max-w-2xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center mx-auto mb-5">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Ghana Cedi Exchange Rates
          </h1>
          <p className="text-muted-foreground text-lg">
            Live GHS rates against major currencies.
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-2">Last updated: {lastUpdated}</p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 text-center mb-6">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-foreground font-medium">Could not fetch live rates</p>
            <p className="text-sm text-muted-foreground mb-4">Check your connection and try again.</p>
            <button onClick={fetchRates} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Retry</button>
          </div>
        ) : (
          <>
            {/* Headline rate */}
            {ghsRate && (
              <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-2xl p-6 mb-6 text-center">
                <p className="text-green-200 text-sm mb-1">1 US Dollar (USD) equals</p>
                <p className="text-4xl font-bold">₵{ghsRate.toFixed(2)}</p>
                <p className="text-green-200 text-sm mt-1">Ghana Cedi</p>
              </div>
            )}

            {/* Converter */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <h2 className="font-semibold text-foreground mb-4">Currency Converter</h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">From</label>
                  <select
                    value={base}
                    onChange={e => setBase(e.target.value)}
                    className="w-full px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="GHS">🇬🇭 GHS — Ghana Cedi</option>
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">To</label>
                  <select
                    value={target}
                    onChange={e => setTarget(e.target.value)}
                    className="w-full px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {CURRENCIES.filter(c => c.code !== base).map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
                    ))}
                    {base !== "GHS" && <option value="GHS">🇬🇭 GHS — Ghana Cedi</option>}
                  </select>
                </div>
              </div>

              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-4 py-4 text-2xl font-bold bg-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary mb-3"
              />

              {result !== null && (
                <div className="bg-muted rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">{numAmount.toLocaleString()} {base} =</p>
                  <p className="text-3xl font-bold text-primary">
                    {result.toLocaleString("en-GH", { maximumFractionDigits: 2 })} {target === base ? "USD" : target}
                  </p>
                </div>
              )}

              {/* Quick amounts */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {QUICK_AMOUNTS.map(q => (
                  <button key={q} onClick={() => setAmount(String(q))}
                    className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      amount === String(q) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary"
                    )}>
                    {q.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* All rates table */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">GHS Rates Today</h2>
                <button onClick={fetchRates} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
              <div className="space-y-2">
                {CURRENCIES.map(c => {
                  const rate = rates[c.code];
                  const ghsPerUnit = rate ? (1 / rate) : null;
                  return (
                    <div key={c.code} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{c.flag}</span>
                        <div>
                          <div className="font-medium text-sm text-foreground">{c.code}</div>
                          <div className="text-xs text-muted-foreground">{c.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-foreground">₵{ghsPerUnit ? ghsPerUnit.toFixed(2) : "—"}</div>
                        <div className="text-xs text-muted-foreground">per 1 {c.code}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              Rates from open.er-api.com · For reference only · Bank and forex bureau rates will differ
            </p>
          </>
        )}
      </div>
    </Layout>
  );
}
