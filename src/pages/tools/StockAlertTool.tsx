import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Package,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Boxes,
  Lightbulb,
  ArrowDown,
} from "lucide-react";

// --- Types ---

interface StockItem {
  id: string;
  name: string;
  stock: number;
  unit: string;
  dailyRate: number;
  reorderCost: number;
}

const STORAGE_KEY = "techtrendi_stock_alert_items";

function loadItems(): StockItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: StockItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

// --- Component ---

export default function StockAlertTool() {
  const [items, setItems] = useState<StockItem[]>(loadItems);
  const [name, setName] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [dailyRate, setDailyRate] = useState("");
  const [reorderCost, setReorderCost] = useState("");

  useEffect(() => {
    saveItems(items);
  }, [items]);

  const addItem = () => {
    if (!name.trim()) {
      toast.error("Enter a product name");
      return;
    }
    const stockNum = parseFloat(stock);
    const rateNum = parseFloat(dailyRate);
    if (isNaN(stockNum) || stockNum < 0) {
      toast.error("Enter a valid stock quantity");
      return;
    }
    if (isNaN(rateNum) || rateNum <= 0) {
      toast.error("Enter a valid daily sales rate (must be > 0)");
      return;
    }
    const costNum = parseFloat(reorderCost) || 0;

    const newItem: StockItem = {
      id: Date.now().toString(),
      name: name.trim(),
      stock: stockNum,
      unit: unit.trim() || "pcs",
      dailyRate: rateNum,
      reorderCost: costNum,
    };

    setItems((prev) => [...prev, newItem]);
    setName("");
    setStock("");
    setDailyRate("");
    setReorderCost("");
    toast.success(`Added "${newItem.name}"`);
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Item removed");
  };

  // Sorted by days remaining (most urgent first)
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const daysA = a.dailyRate > 0 ? a.stock / a.dailyRate : Infinity;
      const daysB = b.dailyRate > 0 ? b.stock / b.dailyRate : Infinity;
      return daysA - daysB;
    });
  }, [items]);

  const critical = items.filter((i) => i.dailyRate > 0 && i.stock / i.dailyRate <= 3).length;
  const warning = items.filter((i) => {
    const days = i.dailyRate > 0 ? i.stock / i.dailyRate : Infinity;
    return days > 3 && days <= 7;
  }).length;
  const healthy = items.length - critical - warning;

  function getDaysLeft(item: StockItem): number {
    return item.dailyRate > 0 ? item.stock / item.dailyRate : Infinity;
  }

  function getStatusBadge(days: number) {
    if (days <= 3) {
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-300">
          REORDER NOW
        </Badge>
      );
    }
    if (days <= 7) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300">
          LOW STOCK
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-300">
        In Stock
      </Badge>
    );
  }

  function getDaysBadge(days: number) {
    const label = days === Infinity ? "N/A" : `${days.toFixed(1)}d`;
    const color =
      days <= 3
        ? "bg-red-500 text-white"
        : days <= 7
        ? "bg-yellow-500 text-white"
        : "bg-green-500 text-white";
    return <Badge className={cn("text-xs", color)}>{label}</Badge>;
  }

  return (
    <Layout>
      <SEOHead
        title="Stock/Inventory Alert Tool | TechTrendi Tools"
        description="Track your inventory levels, get reorder alerts, and manage stock with daily sales rate analysis."
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white">
              <Boxes className="h-8 w-8" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-indigo-900 dark:text-indigo-100">
              Stock / Inventory Alert Tool
            </h1>
            <p className="text-indigo-700 dark:text-indigo-300">
              Track stock levels, predict run-out dates, and never miss a reorder
            </p>
          </div>

          {/* Summary Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Package className="h-8 w-8 text-indigo-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{items.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-200 dark:border-red-800">
              <CardContent className="flex items-center gap-3 p-4">
                <ShieldAlert className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Critical (&le;3 days)</p>
                  <p className="text-2xl font-bold text-red-600">{critical}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Warning (&le;7 days)</p>
                  <p className="text-2xl font-bold text-yellow-600">{warning}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Healthy</p>
                  <p className="text-2xl font-bold text-green-600">{healthy}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Add Item Form */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" /> Add Item
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Product Name</Label>
                  <Input
                    placeholder="e.g. Hand Sanitizer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Current Stock</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="100"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Input
                      placeholder="pcs, kg, L..."
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Daily Sales Rate</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    placeholder="e.g. 12"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Reorder Cost (optional)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0.00"
                    value={reorderCost}
                    onChange={(e) => setReorderCost(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" /> Add to Inventory
                </Button>
              </CardContent>
            </Card>

            {/* Items Table */}
            <div className="lg:col-span-2">
              {sorted.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                    <Package className="mb-4 h-12 w-12 text-indigo-400" />
                    <p className="text-lg font-medium">No items yet</p>
                    <p className="text-sm">Add your first product to start tracking inventory</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowDown className="h-5 w-5" /> Inventory (sorted by urgency)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-2 pr-3">Product</th>
                          <th className="pb-2 pr-3">Stock</th>
                          <th className="pb-2 pr-3">Daily Rate</th>
                          <th className="pb-2 pr-3">Days Left</th>
                          <th className="pb-2 pr-3">Reorder Cost</th>
                          <th className="pb-2 pr-3">Status</th>
                          <th className="pb-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((item) => {
                          const days = getDaysLeft(item);
                          return (
                            <tr
                              key={item.id}
                              className={cn(
                                "border-b last:border-0",
                                days <= 3 && "bg-red-50 dark:bg-red-950/20"
                              )}
                            >
                              <td className="py-3 pr-3 font-medium">{item.name}</td>
                              <td className="py-3 pr-3">
                                {item.stock} {item.unit}
                              </td>
                              <td className="py-3 pr-3">
                                {item.dailyRate}/{item.unit.charAt(0) === "p" ? "day" : "day"}
                              </td>
                              <td className="py-3 pr-3">{getDaysBadge(days)}</td>
                              <td className="py-3 pr-3">
                                {item.reorderCost > 0
                                  ? `$${item.reorderCost.toFixed(2)}`
                                  : "—"}
                              </td>
                              <td className="py-3 pr-3">{getStatusBadge(days)}</td>
                              <td className="py-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteItem(item.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}

              {/* Tips */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" /> How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-indigo-500">&#8226;</span>
                      <span><strong>Days Remaining</strong> is calculated as Current Stock divided by Daily Sales Rate. If you sell 10 items per day and have 30 in stock, you have roughly 3 days before running out.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-indigo-500">&#8226;</span>
                      <span><strong>Reorder Point</strong> is the stock level at which you should place a new order. Factor in lead time (how long your supplier takes to deliver). For example, if delivery takes 5 days and you sell 10/day, reorder when you have at least 50 units.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-indigo-500">&#8226;</span>
                      <span><strong>Safety Stock</strong> is extra inventory kept as a buffer against unexpected demand spikes or supplier delays. A common formula: Safety Stock = (Max daily sales - Avg daily sales) x Max lead time.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-indigo-500">&#8226;</span>
                      <span><strong>Tracking daily sales rate</strong> is critical because it reveals trends. If your rate is increasing, you need to reorder sooner. Review and update rates weekly for accuracy.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-indigo-500">&#8226;</span>
                      <span><strong>All data is saved locally</strong> in your browser. Nothing is sent to any server. Clear your browser data to reset.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
