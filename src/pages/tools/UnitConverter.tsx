import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Scale, ArrowLeftRight, Copy, Check } from "lucide-react";

type UnitCategory = "length" | "weight" | "temperature" | "data" | "time" | "area";

interface UnitDef {
  name: string;
  symbol: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

const units: Record<UnitCategory, UnitDef[]> = {
  length: [
    { name: "Meters", symbol: "m", toBase: (v) => v, fromBase: (v) => v },
    { name: "Kilometers", symbol: "km", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { name: "Centimeters", symbol: "cm", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
    { name: "Millimeters", symbol: "mm", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { name: "Miles", symbol: "mi", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    { name: "Yards", symbol: "yd", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
    { name: "Feet", symbol: "ft", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    { name: "Inches", symbol: "in", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
  ],
  weight: [
    { name: "Kilograms", symbol: "kg", toBase: (v) => v, fromBase: (v) => v },
    { name: "Grams", symbol: "g", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { name: "Milligrams", symbol: "mg", toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
    { name: "Pounds", symbol: "lb", toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
    { name: "Ounces", symbol: "oz", toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
    { name: "Tonnes", symbol: "t", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { name: "Stones", symbol: "st", toBase: (v) => v * 6.35029, fromBase: (v) => v / 6.35029 },
  ],
  temperature: [
    { name: "Celsius", symbol: "°C", toBase: (v) => v, fromBase: (v) => v },
    { name: "Fahrenheit", symbol: "°F", toBase: (v) => (v - 32) * 5/9, fromBase: (v) => v * 9/5 + 32 },
    { name: "Kelvin", symbol: "K", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
  ],
  data: [
    { name: "Bytes", symbol: "B", toBase: (v) => v, fromBase: (v) => v },
    { name: "Kilobytes", symbol: "KB", toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
    { name: "Megabytes", symbol: "MB", toBase: (v) => v * 1048576, fromBase: (v) => v / 1048576 },
    { name: "Gigabytes", symbol: "GB", toBase: (v) => v * 1073741824, fromBase: (v) => v / 1073741824 },
    { name: "Terabytes", symbol: "TB", toBase: (v) => v * 1099511627776, fromBase: (v) => v / 1099511627776 },
    { name: "Bits", symbol: "b", toBase: (v) => v / 8, fromBase: (v) => v * 8 },
    { name: "Kilobits", symbol: "Kb", toBase: (v) => v * 128, fromBase: (v) => v / 128 },
    { name: "Megabits", symbol: "Mb", toBase: (v) => v * 131072, fromBase: (v) => v / 131072 },
  ],
  time: [
    { name: "Seconds", symbol: "s", toBase: (v) => v, fromBase: (v) => v },
    { name: "Milliseconds", symbol: "ms", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { name: "Minutes", symbol: "min", toBase: (v) => v * 60, fromBase: (v) => v / 60 },
    { name: "Hours", symbol: "h", toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
    { name: "Days", symbol: "d", toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
    { name: "Weeks", symbol: "wk", toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
    { name: "Months", symbol: "mo", toBase: (v) => v * 2628000, fromBase: (v) => v / 2628000 },
    { name: "Years", symbol: "yr", toBase: (v) => v * 31536000, fromBase: (v) => v / 31536000 },
  ],
  area: [
    { name: "Square Meters", symbol: "m²", toBase: (v) => v, fromBase: (v) => v },
    { name: "Square Kilometers", symbol: "km²", toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
    { name: "Square Feet", symbol: "ft²", toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
    { name: "Square Yards", symbol: "yd²", toBase: (v) => v * 0.836127, fromBase: (v) => v / 0.836127 },
    { name: "Acres", symbol: "ac", toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
    { name: "Hectares", symbol: "ha", toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
    { name: "Square Miles", symbol: "mi²", toBase: (v) => v * 2589988, fromBase: (v) => v / 2589988 },
  ],
};

const categoryLabels: Record<UnitCategory, string> = {
  length: "Length",
  weight: "Weight/Mass",
  temperature: "Temperature",
  data: "Digital Storage",
  time: "Time",
  area: "Area",
};

export default function UnitConverter() {
  const [category, setCategory] = useState<UnitCategory>("length");
  const [fromUnit, setFromUnit] = useState(0);
  const [toUnit, setToUnit] = useState(1);
  const [inputValue, setInputValue] = useState("1");
  const [outputValue, setOutputValue] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    convert();
  }, [inputValue, fromUnit, toUnit, category]);

  useEffect(() => {
    setFromUnit(0);
    setToUnit(1);
    setInputValue("1");
  }, [category]);

  const convert = () => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      setOutputValue("");
      return;
    }

    const categoryUnits = units[category];
    const fromDef = categoryUnits[fromUnit];
    const toDef = categoryUnits[toUnit];

    const baseValue = fromDef.toBase(value);
    const result = toDef.fromBase(baseValue);

    // Format result
    if (Math.abs(result) < 0.0001 || Math.abs(result) > 999999999) {
      setOutputValue(result.toExponential(6));
    } else {
      setOutputValue(result.toLocaleString(undefined, { maximumFractionDigits: 8 }));
    }
  };

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setInputValue(outputValue);
  };

  const copyResult = async () => {
    await navigator.clipboard.writeText(outputValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categoryUnits = units[category];

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-4">
              <Scale className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Unit Converter</h1>
            <p className="text-muted-foreground">
              Convert between different units of measurement
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {(Object.keys(units) as UnitCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  category === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>

          {/* Converter */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="grid md:grid-cols-[1fr,auto,1fr] gap-4 items-end">
              {/* From */}
              <div>
                <label className="block text-sm font-medium mb-2">From</label>
                <select
                  value={fromUnit}
                  onChange={(e) => setFromUnit(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background mb-2"
                >
                  {categoryUnits.map((unit, index) => (
                    <option key={index} value={index}>
                      {unit.name} ({unit.symbol})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter value"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-lg font-mono"
                />
              </div>

              {/* Swap Button */}
              <div className="flex justify-center pb-2">
                <button
                  onClick={swapUnits}
                  className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  aria-label="Swap units"
                >
                  <ArrowLeftRight className="w-5 h-5" />
                </button>
              </div>

              {/* To */}
              <div>
                <label className="block text-sm font-medium mb-2">To</label>
                <select
                  value={toUnit}
                  onChange={(e) => setToUnit(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background mb-2"
                >
                  {categoryUnits.map((unit, index) => (
                    <option key={index} value={index}>
                      {unit.name} ({unit.symbol})
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <div className="w-full px-4 py-3 rounded-lg border border-border bg-muted/50 text-lg font-mono min-h-[52px]">
                    {outputValue || "—"}
                  </div>
                  {outputValue && (
                    <button
                      onClick={copyResult}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-lg"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Formula Display */}
            {inputValue && outputValue && (
              <div className="mt-6 p-4 bg-muted/30 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  <span className="font-mono text-foreground">{inputValue}</span>{" "}
                  {categoryUnits[fromUnit].symbol} ={" "}
                  <span className="font-mono text-foreground">{outputValue}</span>{" "}
                  {categoryUnits[toUnit].symbol}
                </p>
              </div>
            )}
          </div>

          {/* Quick Reference */}
          <div className="mt-8 p-6 bg-muted/30 rounded-xl">
            <h2 className="font-semibold mb-4">Quick Reference: {categoryLabels[category]}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categoryUnits.slice(0, 8).map((unit, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setFromUnit(index);
                    setInputValue("1");
                  }}
                  className="p-3 text-left rounded-lg border border-border bg-background hover:border-primary transition-colors"
                >
                  <div className="font-medium">{unit.name}</div>
                  <div className="text-sm text-muted-foreground">{unit.symbol}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Common Conversions */}
          <div className="mt-8 p-6 bg-muted/30 rounded-xl">
            <h2 className="font-semibold mb-4">Popular Conversions</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p><span className="font-medium">1 mile</span> = 1.609 kilometers</p>
                <p><span className="font-medium">1 inch</span> = 2.54 centimeters</p>
                <p><span className="font-medium">1 pound</span> = 0.454 kilograms</p>
                <p><span className="font-medium">1 gallon</span> = 3.785 liters</p>
              </div>
              <div className="space-y-2">
                <p><span className="font-medium">1 GB</span> = 1,024 MB</p>
                <p><span className="font-medium">°F to °C</span> = (°F - 32) × 5/9</p>
                <p><span className="font-medium">1 acre</span> = 4,047 m²</p>
                <p><span className="font-medium">1 foot</span> = 30.48 cm</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
