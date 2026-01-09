import { useState } from 'react';
import { ArrowRightLeft, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Category = 'length' | 'weight' | 'temperature' | 'data' | 'time';

const conversions: Record<Category, { units: string[]; convert: (value: number, from: string, to: string) => number }> = {
  length: {
    units: ['meters', 'kilometers', 'miles', 'feet', 'inches', 'yards', 'centimeters'],
    convert: (value, from, to) => {
      const toMeters: Record<string, number> = {
        meters: 1, kilometers: 1000, miles: 1609.344, feet: 0.3048,
        inches: 0.0254, yards: 0.9144, centimeters: 0.01
      };
      return (value * toMeters[from]) / toMeters[to];
    }
  },
  weight: {
    units: ['kilograms', 'grams', 'pounds', 'ounces', 'stones', 'milligrams'],
    convert: (value, from, to) => {
      const toKg: Record<string, number> = {
        kilograms: 1, grams: 0.001, pounds: 0.453592, ounces: 0.0283495,
        stones: 6.35029, milligrams: 0.000001
      };
      return (value * toKg[from]) / toKg[to];
    }
  },
  temperature: {
    units: ['celsius', 'fahrenheit', 'kelvin'],
    convert: (value, from, to) => {
      let celsius = value;
      if (from === 'fahrenheit') celsius = (value - 32) * 5 / 9;
      else if (from === 'kelvin') celsius = value - 273.15;

      if (to === 'celsius') return celsius;
      if (to === 'fahrenheit') return celsius * 9 / 5 + 32;
      return celsius + 273.15;
    }
  },
  data: {
    units: ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'],
    convert: (value, from, to) => {
      const toBytes: Record<string, number> = {
        bytes: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4, PB: 1024 ** 5
      };
      return (value * toBytes[from]) / toBytes[to];
    }
  },
  time: {
    units: ['seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'],
    convert: (value, from, to) => {
      const toSeconds: Record<string, number> = {
        seconds: 1, minutes: 60, hours: 3600, days: 86400,
        weeks: 604800, months: 2629746, years: 31556952
      };
      return (value * toSeconds[from]) / toSeconds[to];
    }
  }
};

export function UnitConverter({ className }: { className?: string }) {
  const [category, setCategory] = useState<Category>('length');
  const [fromValue, setFromValue] = useState('1');
  const [fromUnit, setFromUnit] = useState(conversions.length.units[0]);
  const [toUnit, setToUnit] = useState(conversions.length.units[1]);

  const handleCategoryChange = (newCategory: Category) => {
    setCategory(newCategory);
    setFromUnit(conversions[newCategory].units[0]);
    setToUnit(conversions[newCategory].units[1]);
  };

  const swap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const result = parseFloat(fromValue)
    ? conversions[category].convert(parseFloat(fromValue), fromUnit, toUnit)
    : 0;

  const formatResult = (num: number) => {
    if (Math.abs(num) >= 1000000) return num.toExponential(4);
    if (Math.abs(num) < 0.0001 && num !== 0) return num.toExponential(4);
    return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Unit Converter</h2>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(conversions) as Category[]).map((cat) => (
          <Button
            key={cat}
            variant={category === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleCategoryChange(cat)}
            className="capitalize"
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <label className="text-sm text-muted-foreground mb-1 block">From</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
                className="flex-1 px-4 py-2 bg-muted rounded-lg text-lg"
                placeholder="Enter value"
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="px-3 py-2 bg-muted rounded-lg capitalize"
              >
                {conversions[category].units.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          <Button variant="outline" size="icon" onClick={swap} className="mt-5">
            <ArrowRightLeft className="w-4 h-4" />
          </Button>

          <div className="flex-1 w-full">
            <label className="text-sm text-muted-foreground mb-1 block">To</label>
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-2 bg-primary/10 rounded-lg text-lg font-semibold">
                {formatResult(result)}
              </div>
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="px-3 py-2 bg-muted rounded-lg capitalize"
              >
                {conversions[category].units.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-center">
            <span className="font-semibold">{fromValue} {fromUnit}</span>
            <span className="text-muted-foreground"> = </span>
            <span className="font-semibold text-primary">{formatResult(result)} {toUnit}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default UnitConverter;
