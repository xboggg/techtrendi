import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpDown, Globe, TrendingUp, Users, BarChart3 } from "lucide-react";

interface Country {
  name: string;
  gdp: number;
  pop: number;
  gdppc: number;
  hdi: number;
  region: string;
}

const countries: Country[] = [
  { name: "United States", gdp: 26950, pop: 334, gdppc: 80412, hdi: 0.927, region: "Americas" },
  { name: "China", gdp: 17700, pop: 1412, gdppc: 12541, hdi: 0.788, region: "Asia" },
  { name: "Japan", gdp: 4231, pop: 125, gdppc: 33815, hdi: 0.920, region: "Asia" },
  { name: "Germany", gdp: 4430, pop: 84, gdppc: 52824, hdi: 0.942, region: "Europe" },
  { name: "India", gdp: 3730, pop: 1429, gdppc: 2612, hdi: 0.644, region: "Asia" },
  { name: "United Kingdom", gdp: 3070, pop: 68, gdppc: 46510, hdi: 0.940, region: "Europe" },
  { name: "France", gdp: 2923, pop: 68, gdppc: 43518, hdi: 0.910, region: "Europe" },
  { name: "Italy", gdp: 2170, pop: 59, gdppc: 36812, hdi: 0.906, region: "Europe" },
  { name: "Canada", gdp: 2140, pop: 38, gdppc: 53247, hdi: 0.935, region: "Americas" },
  { name: "South Korea", gdp: 1709, pop: 52, gdppc: 33147, hdi: 0.929, region: "Asia" },
  { name: "Russia", gdp: 1863, pop: 144, gdppc: 14404, hdi: 0.822, region: "Europe" },
  { name: "Brazil", gdp: 2126, pop: 215, gdppc: 10294, hdi: 0.760, region: "Americas" },
  { name: "Australia", gdp: 1693, pop: 26, gdppc: 64712, hdi: 0.946, region: "Oceania" },
  { name: "Mexico", gdp: 1323, pop: 128, gdppc: 11497, hdi: 0.781, region: "Americas" },
  { name: "Spain", gdp: 1492, pop: 47, gdppc: 32090, hdi: 0.911, region: "Europe" },
  { name: "Indonesia", gdp: 1319, pop: 277, gdppc: 4788, hdi: 0.718, region: "Asia" },
  { name: "Saudi Arabia", gdp: 1062, pop: 36, gdppc: 30436, hdi: 0.875, region: "Asia" },
  { name: "Netherlands", gdp: 1080, pop: 17, gdppc: 63753, hdi: 0.946, region: "Europe" },
  { name: "Turkey", gdp: 1154, pop: 85, gdppc: 13482, hdi: 0.838, region: "Asia" },
  { name: "Switzerland", gdp: 869, pop: 9, gdppc: 93720, hdi: 0.962, region: "Europe" },
  { name: "Sweden", gdp: 597, pop: 10, gdppc: 61029, hdi: 0.952, region: "Europe" },
  { name: "Poland", gdp: 748, pop: 38, gdppc: 20078, hdi: 0.881, region: "Europe" },
  { name: "Singapore", gdp: 497, pop: 6, gdppc: 84734, hdi: 0.939, region: "Asia" },
  { name: "South Africa", gdp: 399, pop: 60, gdppc: 6772, hdi: 0.713, region: "Africa" },
  { name: "Egypt", gdp: 476, pop: 106, gdppc: 3907, hdi: 0.728, region: "Africa" },
  { name: "Nigeria", gdp: 477, pop: 220, gdppc: 2184, hdi: 0.535, region: "Africa" },
  { name: "Thailand", gdp: 574, pop: 71, gdppc: 7072, hdi: 0.803, region: "Asia" },
  { name: "Malaysia", gdp: 430, pop: 33, gdppc: 12838, hdi: 0.803, region: "Asia" },
  { name: "UAE", gdp: 498, pop: 10, gdppc: 49451, hdi: 0.911, region: "Asia" },
  { name: "Argentina", gdp: 641, pop: 46, gdppc: 13697, hdi: 0.849, region: "Americas" },
  { name: "Chile", gdp: 344, pop: 19, gdppc: 17093, hdi: 0.860, region: "Americas" },
  { name: "Colombia", gdp: 363, pop: 51, gdppc: 7025, hdi: 0.758, region: "Americas" },
  { name: "Kenya", gdp: 118, pop: 55, gdppc: 2082, hdi: 0.601, region: "Africa" },
  { name: "Ghana", gdp: 74, pop: 33, gdppc: 2363, hdi: 0.632, region: "Africa" },
  { name: "Guatemala", gdp: 95, pop: 17, gdppc: 5185, hdi: 0.640, region: "Americas" },
  { name: "Bangladesh", gdp: 460, pop: 170, gdppc: 2765, hdi: 0.670, region: "Asia" },
  { name: "Pakistan", gdp: 341, pop: 231, gdppc: 1658, hdi: 0.544, region: "Asia" },
  { name: "Uganda", gdp: 49, pop: 48, gdppc: 948, hdi: 0.550, region: "Africa" },
  { name: "Ethiopia", gdp: 156, pop: 126, gdppc: 1030, hdi: 0.492, region: "Africa" },
  { name: "DR Congo", gdp: 65, pop: 100, gdppc: 583, hdi: 0.479, region: "Africa" },
  { name: "Morocco", gdp: 142, pop: 37, gdppc: 3840, hdi: 0.698, region: "Africa" },
  { name: "Algeria", gdp: 239, pop: 45, gdppc: 5380, hdi: 0.745, region: "Africa" },
  { name: "Cambodia", gdp: 32, pop: 17, gdppc: 1914, hdi: 0.593, region: "Asia" },
  { name: "Myanmar", gdp: 65, pop: 54, gdppc: 1210, hdi: 0.585, region: "Asia" },
  { name: "Slovakia", gdp: 132, pop: 5, gdppc: 24138, hdi: 0.855, region: "Europe" },
  { name: "Czech Republic", gdp: 330, pop: 11, gdppc: 30805, hdi: 0.900, region: "Europe" },
  { name: "Austria", gdp: 516, pop: 9, gdppc: 57900, hdi: 0.926, region: "Europe" },
  { name: "Belgium", gdp: 622, pop: 11, gdppc: 53530, hdi: 0.937, region: "Europe" },
  { name: "Portugal", gdp: 287, pop: 10, gdppc: 28048, hdi: 0.866, region: "Europe" },
  { name: "Greece", gdp: 239, pop: 11, gdppc: 22538, hdi: 0.893, region: "Europe" },
  { name: "Hungary", gdp: 213, pop: 10, gdppc: 21390, hdi: 0.851, region: "Europe" },
  { name: "Romania", gdp: 348, pop: 19, gdppc: 17784, hdi: 0.821, region: "Europe" },
  { name: "Finland", gdp: 305, pop: 5, gdppc: 55474, hdi: 0.942, region: "Europe" },
  { name: "Denmark", gdp: 406, pop: 6, gdppc: 68827, hdi: 0.952, region: "Europe" },
  { name: "Norway", gdp: 546, pop: 5, gdppc: 101103, hdi: 0.966, region: "Europe" },
  { name: "Peru", gdp: 268, pop: 33, gdppc: 7126, hdi: 0.762, region: "Americas" },
  { name: "Venezuela", gdp: 97, pop: 28, gdppc: 3483, hdi: 0.699, region: "Americas" },
  { name: "Ecuador", gdp: 118, pop: 18, gdppc: 6404, hdi: 0.765, region: "Americas" },
  { name: "New Zealand", gdp: 250, pop: 5, gdppc: 49483, hdi: 0.939, region: "Oceania" },
  { name: "Philippines", gdp: 435, pop: 114, gdppc: 3621, hdi: 0.710, region: "Asia" },
  { name: "Vietnam", gdp: 430, pop: 98, gdppc: 4316, hdi: 0.726, region: "Asia" },
  { name: "Israel", gdp: 521, pop: 9, gdppc: 55536, hdi: 0.919, region: "Asia" },
  { name: "Iraq", gdp: 269, pop: 42, gdppc: 6477, hdi: 0.686, region: "Asia" },
  { name: "Iran", gdp: 367, pop: 87, gdppc: 4161, hdi: 0.774, region: "Asia" },
  { name: "Sri Lanka", gdp: 84, pop: 22, gdppc: 3823, hdi: 0.780, region: "Asia" },
  { name: "Mali", gdp: 22, pop: 22, gdppc: 905, hdi: 0.428, region: "Africa" },
  { name: "Burkina Faso", gdp: 20, pop: 22, gdppc: 909, hdi: 0.449, region: "Africa" },
  { name: "Sierra Leone", gdp: 5, pop: 8, gdppc: 544, hdi: 0.477, region: "Africa" },
  { name: "Cameroon", gdp: 47, pop: 27, gdppc: 1683, hdi: 0.587, region: "Africa" },
  { name: "Somalia", gdp: 11, pop: 17, gdppc: 625, hdi: 0.385, region: "Africa" },
  { name: "Sudan", gdp: 46, pop: 46, gdppc: 978, hdi: 0.510, region: "Africa" },
  { name: "Namibia", gdp: 13, pop: 3, gdppc: 5025, hdi: 0.615, region: "Africa" },
  { name: "Lesotho", gdp: 3, pop: 2, gdppc: 1221, hdi: 0.527, region: "Africa" },
  { name: "Bhutan", gdp: 3, pop: 1, gdppc: 3452, hdi: 0.666, region: "Asia" },
  { name: "North Korea", gdp: 28, pop: 26, gdppc: 1700, hdi: 0.733, region: "Asia" },
  { name: "Mongolia", gdp: 17, pop: 3, gdppc: 5183, hdi: 0.737, region: "Asia" },
];

type Metric = "gdp" | "gdppc" | "pop" | "hdi";
type SortDir = "asc" | "desc";

const metricConfig: Record<Metric, { label: string; icon: typeof Globe; format: (v: number) => string; unit: string }> = {
  gdp: { label: "GDP (USD)", icon: TrendingUp, format: (v) => v >= 1000 ? `$${(v / 1000).toFixed(1)}T` : `$${v}B`, unit: "Billion USD" },
  gdppc: { label: "GDP per Capita", icon: BarChart3, format: (v) => `$${v.toLocaleString()}`, unit: "USD" },
  pop: { label: "Population", icon: Users, format: (v) => v >= 1000 ? `${(v / 1000).toFixed(2)}B` : `${v}M`, unit: "Million" },
  hdi: { label: "HDI", icon: Globe, format: (v) => v.toFixed(3), unit: "Index" },
};

const regions = ["All", "Americas", "Europe", "Asia", "Africa", "Oceania"];

const regionColors: Record<string, string> = {
  Americas: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Europe: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  Asia: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Africa: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  Oceania: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
};

export default function WorldEconomicMap() {
  const [metric, setMetric] = useState<Metric>("gdp");
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Country | null>(null);

  const filtered = useMemo(() => {
    let list = [...countries];
    if (region !== "All") list = list.filter((c) => c.region === region);
    if (search) list = list.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    list.sort((a, b) => sortDir === "desc" ? b[metric] - a[metric] : a[metric] - b[metric]);
    return list;
  }, [metric, search, region, sortDir]);

  const maxVal = useMemo(() => Math.max(...countries.map((c) => c[metric])), [metric]);

  const top10 = useMemo(() => {
    return [...countries].sort((a, b) => b[metric] - a[metric]).slice(0, 10);
  }, [metric]);

  return (
    <Layout>
      <SEOHead title="World Economic Explorer | TechTrendi" description="Explore GDP, population, HDI data for 75+ countries" canonical="/tools/world-economic-map" />
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-3">Free Educational Tool</Badge>
          <h1 className="text-3xl font-bold mb-2">World Economic <span className="text-primary">Explorer</span></h1>
          <p className="text-muted-foreground">Compare GDP, population, and development data for 75+ countries</p>
        </div>

        {/* Metric selector */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {(Object.keys(metricConfig) as Metric[]).map((m) => {
            const cfg = metricConfig[m];
            const Icon = cfg.icon;
            return (
              <button key={m} onClick={() => setMetric(m)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${metric === m ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50 text-muted-foreground"}`}>
                <Icon className="w-3.5 h-3.5" />{cfg.label}
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Main list */}
          <div>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search countries..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {regions.map((r) => (
                  <button key={r} onClick={() => setRegion(r)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${region === r ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/50"}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">#</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Country</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Region</th>
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")}>
                        <span className="inline-flex items-center gap-1">{metricConfig[metric].label} <ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                      <th className="px-4 py-3 w-[140px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, i) => {
                      const pct = (c[metric] / maxVal) * 100;
                      return (
                        <tr key={c.name} className={`border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors ${selected?.name === c.name ? "bg-primary/5" : ""}`}
                          onClick={() => setSelected(c)}>
                          <td className="px-4 py-2.5 text-muted-foreground text-xs">{i + 1}</td>
                          <td className="px-4 py-2.5 font-medium">{c.name}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${regionColors[c.region] || ""}`}>{c.region}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-sm">{metricConfig[metric].format(c[metric])}</td>
                          <td className="px-4 py-2.5">
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${Math.max(2, pct)}%` }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No countries found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
                Showing {filtered.length} of {countries.length} countries · 2023 data · Click any row for details
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Country detail */}
            {selected ? (
              <Card className="p-5">
                <h3 className="text-lg font-bold mb-1">{selected.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${regionColors[selected.region] || ""}`}>{selected.region}</span>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {(Object.keys(metricConfig) as Metric[]).map((m) => (
                    <div key={m} className="bg-muted/50 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-1">{metricConfig[m].label}</div>
                      <div className={`text-lg font-bold font-mono ${m === metric ? "text-primary" : ""}`}>
                        {metricConfig[m].format(selected[m])}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-5 text-center text-muted-foreground text-sm">
                Click a country to see details
              </Card>
            )}

            {/* Top 10 */}
            <Card className="p-5">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Top 10 by {metricConfig[metric].label}
              </h3>
              <div className="space-y-2">
                {top10.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 rounded px-2 py-1 -mx-2 transition-colors"
                    onClick={() => setSelected(c)}>
                    <span className={`text-xs font-bold w-5 ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>{i + 1}</span>
                    <span className="text-sm flex-1 truncate">{c.name}</span>
                    <span className="text-xs font-mono text-muted-foreground">{metricConfig[metric].format(c[metric])}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
