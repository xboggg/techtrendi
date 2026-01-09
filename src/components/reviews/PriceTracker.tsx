import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Bell, BellOff, ExternalLink, DollarSign, Calendar, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PricePoint {
  date: string;
  price: number;
  retailer: string;
}

interface Retailer {
  id: string;
  name: string;
  logo: string;
  url: string;
  currentPrice: number;
  originalPrice?: number;
  inStock: boolean;
  shipping?: string;
}

interface PriceTrackerProps {
  productId: string;
  productName: string;
  priceHistory: PricePoint[];
  retailers: Retailer[];
  className?: string;
}

export function PriceTracker({
  productId,
  productName,
  priceHistory,
  retailers,
  className,
}: PriceTrackerProps) {
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | '1y'>('3m');

  const stats = useMemo(() => {
    if (priceHistory.length === 0) return null;
    const prices = priceHistory.map((p) => p.price);
    const currentPrice = prices[prices.length - 1];
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const priceChange = prices.length > 1 ? currentPrice - prices[prices.length - 2] : 0;
    const percentChange = prices.length > 1 ? (priceChange / prices[prices.length - 2]) * 100 : 0;

    return {
      current: currentPrice,
      lowest: lowestPrice,
      highest: highestPrice,
      average: avgPrice,
      change: priceChange,
      percentChange,
    };
  }, [priceHistory]);

  const filteredHistory = useMemo(() => {
    const now = new Date();
    const ranges = { '1m': 30, '3m': 90, '6m': 180, '1y': 365 };
    const cutoff = new Date(now.getTime() - ranges[timeRange] * 24 * 60 * 60 * 1000);
    return priceHistory.filter((p) => new Date(p.date) >= cutoff);
  }, [priceHistory, timeRange]);

  const handleSetAlert = () => {
    if (targetPrice) {
      setAlertEnabled(true);
      localStorage.setItem(`price_alert_${productId}`, targetPrice);
    }
  };

  const lowestRetailer = retailers.reduce((min, r) =>
    r.inStock && r.currentPrice < (min?.currentPrice ?? Infinity) ? r : min
  , retailers.find(r => r.inStock) || retailers[0]);

  return (
    <div className={cn('bg-card border border-border rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Price Tracker</h3>
          <div className="flex gap-2">
            {(['1m', '3m', '6m', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-3 py-1 text-sm rounded-full transition-colors',
                  timeRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                )}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <span className="text-xs text-muted-foreground">Current</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">${stats.current.toFixed(2)}</span>
                {stats.change !== 0 && (
                  <span
                    className={cn(
                      'flex items-center text-xs',
                      stats.change < 0 ? 'text-green-500' : 'text-red-500'
                    )}
                  >
                    {stats.change < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {Math.abs(stats.percentChange).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div className="bg-green-500/10 rounded-lg p-3">
              <span className="text-xs text-green-600 dark:text-green-400">Lowest</span>
              <span className="block text-xl font-bold text-green-600 dark:text-green-400">
                ${stats.lowest.toFixed(2)}
              </span>
            </div>
            <div className="bg-red-500/10 rounded-lg p-3">
              <span className="text-xs text-red-600 dark:text-red-400">Highest</span>
              <span className="block text-xl font-bold text-red-600 dark:text-red-400">
                ${stats.highest.toFixed(2)}
              </span>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <span className="text-xs text-muted-foreground">Average</span>
              <span className="block text-xl font-bold">${stats.average.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Price Chart (simplified representation) */}
      <div className="p-6 border-b border-border">
        <div className="h-40 flex items-end gap-1">
          {filteredHistory.map((point, i) => {
            const height = stats
              ? ((point.price - stats.lowest) / (stats.highest - stats.lowest)) * 100 || 10
              : 50;
            return (
              <div
                key={i}
                className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors group relative"
                style={{ height: `${Math.max(height, 5)}%` }}
              >
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                  <div className="bg-popover text-popover-foreground text-xs rounded-lg p-2 shadow-lg whitespace-nowrap">
                    <div className="font-medium">${point.price.toFixed(2)}</div>
                    <div className="text-muted-foreground">{new Date(point.date).toLocaleDateString()}</div>
                    <div className="text-muted-foreground">{point.retailer}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{filteredHistory[0]?.date ? new Date(filteredHistory[0].date).toLocaleDateString() : ''}</span>
          <span>{filteredHistory[filteredHistory.length - 1]?.date ? new Date(filteredHistory[filteredHistory.length - 1].date).toLocaleDateString() : ''}</span>
        </div>
      </div>

      {/* Price Alert */}
      <div className="p-6 border-b border-border bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground mb-1 block">
              Set Price Alert
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="Target price"
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm"
                />
              </div>
              <Button onClick={handleSetAlert} disabled={!targetPrice}>
                {alertEnabled ? (
                  <>
                    <BellOff className="w-4 h-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Alert Me
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        {alertEnabled && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            We'll notify you when the price drops to ${targetPrice} or below.
          </p>
        )}
      </div>

      {/* Retailers */}
      <div className="p-6">
        <h4 className="font-medium text-foreground mb-4">Where to Buy</h4>
        <div className="space-y-3">
          {retailers.map((retailer) => (
            <div
              key={retailer.id}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg border transition-colors',
                retailer.id === lowestRetailer?.id
                  ? 'border-green-500 bg-green-500/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="flex items-center gap-4">
                <img
                  src={retailer.logo}
                  alt={retailer.name}
                  className="w-12 h-8 object-contain"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{retailer.name}</span>
                    {retailer.id === lowestRetailer?.id && (
                      <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-600">
                        <ArrowDown className="w-3 h-3 mr-1" />
                        Lowest
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {retailer.inStock ? (
                      <span className="text-green-500">In Stock</span>
                    ) : (
                      <span className="text-red-500">Out of Stock</span>
                    )}
                    {retailer.shipping && <span>· {retailer.shipping}</span>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  {retailer.originalPrice && retailer.originalPrice > retailer.currentPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      ${retailer.originalPrice.toFixed(2)}
                    </span>
                  )}
                  <span className="text-xl font-bold text-foreground">
                    ${retailer.currentPrice.toFixed(2)}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="mt-2"
                  disabled={!retailer.inStock}
                  asChild
                >
                  <a href={retailer.url} target="_blank" rel="noopener noreferrer">
                    Buy Now
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Compact Price Widget
export function PriceWidget({
  currentPrice,
  lowestPrice,
  percentOff,
  retailer,
  url,
  className,
}: {
  currentPrice: number;
  lowestPrice?: number;
  percentOff?: number;
  retailer: string;
  url: string;
  className?: string;
}) {
  const isAtLowest = lowestPrice && currentPrice <= lowestPrice;

  return (
    <div className={cn('bg-card border border-border rounded-xl p-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-2xl font-bold text-foreground">${currentPrice.toFixed(2)}</span>
          {percentOff && (
            <Badge variant="destructive" className="ml-2">
              {percentOff}% OFF
            </Badge>
          )}
          {isAtLowest && (
            <Badge className="ml-2 bg-green-500">
              <TrendingDown className="w-3 h-3 mr-1" />
              Lowest Price
            </Badge>
          )}
        </div>
        <Button asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            Buy at {retailer}
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </div>
      {lowestPrice && (
        <p className="text-sm text-muted-foreground mt-2">
          <Calendar className="w-4 h-4 inline mr-1" />
          All-time low: ${lowestPrice.toFixed(2)}
        </p>
      )}
    </div>
  );
}

export default PriceTracker;
