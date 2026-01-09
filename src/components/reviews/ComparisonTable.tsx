import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Minus, ChevronDown, ChevronUp, Star, Award, Zap, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  rating: number;
  badge?: 'Best Overall' | 'Best Value' | 'Editor\'s Choice' | 'Most Popular';
  specs: Record<string, string | number | boolean>;
}

interface ComparisonTableProps {
  products: Product[];
  specCategories: {
    name: string;
    specs: { key: string; label: string; unit?: string; higherIsBetter?: boolean }[];
  }[];
  className?: string;
}

export function ComparisonTable({ products, specCategories, className }: ComparisonTableProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    specCategories.map((c) => c.name)
  );
  const [sortBy, setSortBy] = useState<{ key: string; asc: boolean } | null>(null);
  const [highlightBest, setHighlightBest] = useState(true);

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const sortedProducts = useMemo(() => {
    if (!sortBy) return products;
    return [...products].sort((a, b) => {
      const aVal = a.specs[sortBy.key];
      const bVal = b.specs[sortBy.key];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortBy.asc ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [products, sortBy]);

  const getBestValue = (key: string, higherIsBetter = true) => {
    const values = products.map((p) => p.specs[key]).filter((v) => typeof v === 'number') as number[];
    if (values.length === 0) return null;
    return higherIsBetter ? Math.max(...values) : Math.min(...values);
  };

  const renderValue = (value: string | number | boolean | undefined, unit?: string) => {
    if (value === undefined) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-500" />
      ) : (
        <X className="w-5 h-5 text-red-500" />
      );
    }
    return (
      <span>
        {value}
        {unit && <span className="text-muted-foreground text-sm ml-1">{unit}</span>}
      </span>
    );
  };

  const badgeColors = {
    'Best Overall': 'bg-yellow-500',
    'Best Value': 'bg-green-500',
    "Editor's Choice": 'bg-primary',
    'Most Popular': 'bg-blue-500',
  };

  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Product Comparison</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={highlightBest}
            onChange={(e) => setHighlightBest(e.target.checked)}
            className="rounded"
          />
          Highlight best values
        </label>
      </div>

      <table className="w-full border-collapse min-w-[800px]">
        {/* Product Headers */}
        <thead>
          <tr>
            <th className="sticky left-0 bg-background z-10 p-4 text-left w-48"></th>
            {sortedProducts.map((product) => (
              <th key={product.id} className="p-4 text-center min-w-[200px]">
                <div className="flex flex-col items-center gap-3">
                  {product.badge && (
                    <Badge className={cn('text-white', badgeColors[product.badge])}>
                      <Award className="w-3 h-3 mr-1" />
                      {product.badge}
                    </Badge>
                  )}
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-24 h-24 object-contain rounded-lg bg-muted"
                  />
                  <Link
                    to={`/reviews/${product.slug}`}
                    className="font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {product.name}
                  </Link>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{product.rating}</span>
                  </div>
                  <span className="text-lg font-bold text-primary">${product.price}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {specCategories.map((category) => (
            <>
              {/* Category Header */}
              <tr key={category.name} className="bg-muted/50">
                <td
                  colSpan={sortedProducts.length + 1}
                  className="p-0"
                >
                  <button
                    onClick={() => toggleCategory(category.name)}
                    className="w-full flex items-center justify-between p-4 font-semibold text-foreground hover:bg-muted/80 transition-colors"
                  >
                    <span>{category.name}</span>
                    {expandedCategories.includes(category.name) ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </td>
              </tr>

              {/* Spec Rows */}
              {expandedCategories.includes(category.name) &&
                category.specs.map((spec) => {
                  const bestValue = getBestValue(spec.key, spec.higherIsBetter);
                  return (
                    <tr key={spec.key} className="border-b border-border hover:bg-muted/30">
                      <td className="sticky left-0 bg-background z-10 p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground">{spec.label}</span>
                          <button
                            onClick={() =>
                              setSortBy((prev) =>
                                prev?.key === spec.key
                                  ? { key: spec.key, asc: !prev.asc }
                                  : { key: spec.key, asc: false }
                              )
                            }
                            className="p-1 rounded hover:bg-muted"
                          >
                            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                      {sortedProducts.map((product) => {
                        const value = product.specs[spec.key];
                        const isBest =
                          highlightBest &&
                          typeof value === 'number' &&
                          value === bestValue;
                        return (
                          <td
                            key={product.id}
                            className={cn(
                              'p-4 text-center',
                              isBest && 'bg-green-500/10 font-semibold text-green-600 dark:text-green-400'
                            )}
                          >
                            {isBest && <Zap className="w-4 h-4 inline mr-1" />}
                            {renderValue(value, spec.unit)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Quick Compare Widget
interface QuickCompareProps {
  products: { id: string; name: string; image: string; price: number; rating: number }[];
  onRemove: (id: string) => void;
  onCompare: () => void;
  className?: string;
}

export function QuickCompareBar({ products, onRemove, onCompare, className }: QuickCompareProps) {
  if (products.length === 0) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-lg z-40',
        className
      )}
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 overflow-x-auto">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Compare ({products.length}/4):
          </span>
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-2 bg-muted rounded-lg p-2 pr-3"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-10 h-10 object-contain rounded"
              />
              <span className="text-sm font-medium whitespace-nowrap">{product.name}</span>
              <button
                onClick={() => onRemove(product.id)}
                className="p-1 hover:bg-background rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <Button onClick={onCompare} disabled={products.length < 2}>
          Compare Now
        </Button>
      </div>
    </div>
  );
}

// Comparison Preview Card
export function ComparisonPreviewCard({
  products,
  className,
}: {
  products: Product[];
  className?: string;
}) {
  if (products.length < 2) return null;

  const [a, b] = products;

  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <h3 className="font-semibold text-foreground mb-4">Quick Comparison</h3>
      <div className="grid grid-cols-3 gap-4">
        {/* Product A */}
        <div className="text-center">
          <img src={a.image} alt={a.name} className="w-16 h-16 object-contain mx-auto mb-2" />
          <h4 className="font-medium text-sm">{a.name}</h4>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">{a.rating}</span>
          </div>
          <span className="text-primary font-bold">${a.price}</span>
        </div>

        {/* VS */}
        <div className="flex items-center justify-center">
          <span className="text-2xl font-bold text-muted-foreground">VS</span>
        </div>

        {/* Product B */}
        <div className="text-center">
          <img src={b.image} alt={b.name} className="w-16 h-16 object-contain mx-auto mb-2" />
          <h4 className="font-medium text-sm">{b.name}</h4>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">{b.rating}</span>
          </div>
          <span className="text-primary font-bold">${b.price}</span>
        </div>
      </div>
      <Button variant="outline" className="w-full mt-4" asChild>
        <Link to={`/compare/${a.slug}-vs-${b.slug}`}>Full Comparison</Link>
      </Button>
    </div>
  );
}

export default ComparisonTable;
