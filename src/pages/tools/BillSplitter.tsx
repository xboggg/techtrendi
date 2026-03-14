import { useState, useEffect, useCallback, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Receipt, Users, Plus, Trash2, Copy, DollarSign, Percent, Share2,
  Save, FolderOpen, X, ChevronDown, ChevronUp, Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────────────
interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  assignedTo: string[]; // person IDs; empty = split evenly among all
}

interface Person {
  id: string;
  name: string;
}

interface PersonBreakdown {
  personId: string;
  personName: string;
  items: { name: string; amount: number }[];
  subtotal: number;
  taxShare: number;
  tipShare: number;
  total: number;
}

interface SavedBill {
  id: string;
  name: string;
  savedAt: string;
  items: BillItem[];
  people: Person[];
  taxPercent: number;
  tipPercent: number;
  currency: string;
}

// ── Currency config ────────────────────────────────────────────────────
const CURRENCIES: Record<string, { symbol: string; name: string }> = {
  USD: { symbol: "$", name: "US Dollar" },
  EUR: { symbol: "\u20AC", name: "Euro" },
  GBP: { symbol: "\u00A3", name: "British Pound" },
  GHS: { symbol: "GH\u20B5", name: "Ghana Cedi" },
  NGN: { symbol: "\u20A6", name: "Nigerian Naira" },
  KES: { symbol: "KSh", name: "Kenyan Shilling" },
  ZAR: { symbol: "R", name: "South African Rand" },
  INR: { symbol: "\u20B9", name: "Indian Rupee" },
  JPY: { symbol: "\u00A5", name: "Japanese Yen" },
  CAD: { symbol: "C$", name: "Canadian Dollar" },
  AUD: { symbol: "A$", name: "Australian Dollar" },
};

const STORAGE_KEY = "billsplitter_saved_bills";

// ── Helpers ────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const fmt = (amount: number, currency: string) => {
  const c = CURRENCIES[currency] ?? CURRENCIES.USD;
  return `${c.symbol}${amount.toFixed(2)}`;
};

// ── Component ──────────────────────────────────────────────────────────
export default function BillSplitter() {
  // Core state
  const [items, setItems] = useState<BillItem[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [taxPercent, setTaxPercent] = useState(0);
  const [tipPercent, setTipPercent] = useState(0);
  const [currency, setCurrency] = useState("USD");

  // Form fields
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newPersonName, setNewPersonName] = useState("");
  const [customTip, setCustomTip] = useState("");

  // UI
  const [showSavedBills, setShowSavedBills] = useState(false);
  const [savedBills, setSavedBills] = useState<SavedBill[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [billName, setBillName] = useState("");

  // Load saved bills on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSavedBills(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // ── Item CRUD ──────────────────────────────────────────────────────
  const addItem = () => {
    const name = newItemName.trim();
    const price = parseFloat(newItemPrice);
    const qty = parseInt(newItemQty, 10);
    if (!name) { toast.error("Enter an item name"); return; }
    if (isNaN(price) || price <= 0) { toast.error("Enter a valid price"); return; }
    if (isNaN(qty) || qty < 1) { toast.error("Quantity must be at least 1"); return; }

    setItems((prev) => [...prev, { id: uid(), name, price, quantity: qty, assignedTo: [] }]);
    setNewItemName("");
    setNewItemPrice("");
    setNewItemQty("1");
    toast.success(`Added "${name}"`);
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const toggleAssignment = (itemId: string, personId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const assigned = item.assignedTo.includes(personId)
          ? item.assignedTo.filter((p) => p !== personId)
          : [...item.assignedTo, personId];
        return { ...item, assignedTo: assigned };
      })
    );
  };

  // ── Person CRUD ────────────────────────────────────────────────────
  const addPerson = () => {
    const name = newPersonName.trim();
    if (!name) { toast.error("Enter a name"); return; }
    if (people.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Name already exists");
      return;
    }
    setPeople((prev) => [...prev, { id: uid(), name }]);
    setNewPersonName("");
    toast.success(`Added ${name}`);
  };

  const removePerson = (id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setItems((prev) => prev.map((item) => ({ ...item, assignedTo: item.assignedTo.filter((p) => p !== id) })));
  };

  // ── Tip helpers ────────────────────────────────────────────────────
  const selectTip = (pct: number) => {
    setTipPercent(pct);
    setCustomTip("");
  };

  const handleCustomTip = (val: string) => {
    setCustomTip(val);
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0) setTipPercent(n);
  };

  // ── Calculations ───────────────────────────────────────────────────
  const { breakdowns, subtotal, taxAmount, tipAmount, grandTotal } = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const taxAmount = subtotal * (taxPercent / 100);
    const tipAmount = subtotal * (tipPercent / 100);
    const grandTotal = subtotal + taxAmount + tipAmount;

    if (people.length === 0) {
      return { breakdowns: [] as PersonBreakdown[], subtotal, taxAmount, tipAmount, grandTotal };
    }

    const breakdowns: PersonBreakdown[] = people.map((person) => {
      let personSubtotal = 0;
      const personItems: { name: string; amount: number }[] = [];

      items.forEach((item) => {
        const lineTotal = item.price * item.quantity;
        if (item.assignedTo.length === 0) {
          // Split evenly among all
          const share = lineTotal / people.length;
          personSubtotal += share;
          personItems.push({ name: item.name, amount: share });
        } else if (item.assignedTo.includes(person.id)) {
          const share = lineTotal / item.assignedTo.length;
          personSubtotal += share;
          personItems.push({ name: item.name, amount: share });
        }
      });

      const ratio = subtotal > 0 ? personSubtotal / subtotal : 1 / people.length;
      const taxShare = taxAmount * ratio;
      const tipShare = tipAmount * ratio;

      return {
        personId: person.id,
        personName: person.name,
        items: personItems,
        subtotal: personSubtotal,
        taxShare,
        tipShare,
        total: personSubtotal + taxShare + tipShare,
      };
    });

    return { breakdowns, subtotal, taxAmount, tipAmount, grandTotal };
  }, [items, people, taxPercent, tipPercent]);

  // ── Share ──────────────────────────────────────────────────────────
  const generateShareText = useCallback(() => {
    const c = CURRENCIES[currency] ?? CURRENCIES.USD;
    let text = `Bill Split Summary (${c.name})\n`;
    text += "=".repeat(35) + "\n\n";

    items.forEach((item) => {
      text += `${item.name} x${item.quantity} - ${fmt(item.price * item.quantity, currency)}\n`;
    });

    text += "\n" + "-".repeat(35) + "\n";
    text += `Subtotal: ${fmt(subtotal, currency)}\n`;
    if (taxPercent > 0) text += `Tax (${taxPercent}%): ${fmt(taxAmount, currency)}\n`;
    if (tipPercent > 0) text += `Tip (${tipPercent}%): ${fmt(tipAmount, currency)}\n`;
    text += `Grand Total: ${fmt(grandTotal, currency)}\n`;
    text += "-".repeat(35) + "\n\n";

    if (breakdowns.length > 0) {
      text += "Per Person:\n";
      breakdowns.forEach((b) => {
        text += `  ${b.personName}: ${fmt(b.total, currency)}\n`;
      });
    }

    text += "\nGenerated by TechTrendi Bill Splitter";
    return text;
  }, [items, breakdowns, subtotal, taxAmount, tipAmount, grandTotal, taxPercent, tipPercent, currency]);

  const handleShare = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Bill summary copied to clipboard!");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  // ── Save / Load ───────────────────────────────────────────────────
  const saveBill = () => {
    const name = billName.trim() || `Bill ${new Date().toLocaleDateString()}`;
    const bill: SavedBill = {
      id: uid(),
      name,
      savedAt: new Date().toISOString(),
      items,
      people,
      taxPercent,
      tipPercent,
      currency,
    };
    const updated = [bill, ...savedBills].slice(0, 20); // keep last 20
    setSavedBills(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setBillName("");
    toast.success(`Saved "${name}"`);
  };

  const loadBill = (bill: SavedBill) => {
    setItems(bill.items);
    setPeople(bill.people);
    setTaxPercent(bill.taxPercent);
    setTipPercent(bill.tipPercent);
    setCurrency(bill.currency);
    setShowSavedBills(false);
    toast.success(`Loaded "${bill.name}"`);
  };

  const deleteSavedBill = (id: string) => {
    const updated = savedBills.filter((b) => b.id !== id);
    setSavedBills(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // ── Render ─────────────────────────────────────────────────────────
  const cs = CURRENCIES[currency] ?? CURRENCIES.USD;

  return (
    <Layout>
      <SEOHead
        title="Bill & Receipt Splitter - Split Bills Fairly | TechTrendi"
        description="Free bill splitter tool. Add items, assign to friends, apply tax & tip, and see exactly what each person owes. Share the breakdown instantly."
        canonicalUrl="https://techtrendi.com/tools/bill-splitter"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Bill & Receipt <span className="text-primary">Splitter</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Split bills fairly among friends. Add items, assign people, include tax &amp; tip, and share the breakdown.
          </p>
        </motion.div>

        {/* Top Bar: Currency + Save/Load */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 mb-6"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CURRENCIES).map(([code, { symbol, name }]) => (
                  <SelectItem key={code} value={code}>
                    {symbol} {code} - {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Input
              placeholder="Bill name..."
              value={billName}
              onChange={(e) => setBillName(e.target.value)}
              className="w-40"
            />
            <Button variant="outline" size="sm" onClick={saveBill} disabled={items.length === 0}>
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSavedBills(!showSavedBills)}>
              <FolderOpen className="w-4 h-4 mr-1" /> Load
            </Button>
          </div>
        </motion.div>

        {/* Saved Bills Drawer */}
        <AnimatePresence>
          {showSavedBills && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    Saved Bills
                    <Button variant="ghost" size="icon" onClick={() => setShowSavedBills(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {savedBills.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No saved bills yet.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {savedBills.map((bill) => (
                        <div
                          key={bill.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <button onClick={() => loadBill(bill)} className="flex-1 text-left">
                            <div className="font-medium text-sm">{bill.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {bill.items.length} items, {bill.people.length} people
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(bill.savedAt).toLocaleDateString()}
                            </div>
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteSavedBill(bill.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left Column: Items + People ───────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Item */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-primary" />
                    Bill Items
                  </CardTitle>
                  <CardDescription>Add items from the receipt</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">Item Name</Label>
                      <Input
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="e.g. Pizza Margherita"
                        onKeyDown={(e) => e.key === "Enter" && addItem()}
                      />
                    </div>
                    <div className="w-28">
                      <Label className="text-xs text-muted-foreground mb-1 block">Price ({cs.symbol})</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        placeholder="0.00"
                        onKeyDown={(e) => e.key === "Enter" && addItem()}
                      />
                    </div>
                    <div className="w-20">
                      <Label className="text-xs text-muted-foreground mb-1 block">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newItemQty}
                        onChange={(e) => setNewItemQty(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addItem()}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={addItem} className="w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    <AnimatePresence>
                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No items yet. Add items from the bill above.
                        </p>
                      ) : (
                        items.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20, height: 0 }}
                            className="rounded-lg border bg-card"
                          >
                            {/* Item Header Row */}
                            <div className="flex items-center gap-3 p-3">
                              <button
                                onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                                className="flex-1 flex items-center gap-3 text-left"
                              >
                                <div className="flex-1">
                                  <span className="font-medium text-sm">{item.name}</span>
                                  <span className="text-xs text-muted-foreground ml-2">x{item.quantity}</span>
                                </div>
                                <span className="font-semibold text-sm">{fmt(item.price * item.quantity, currency)}</span>
                                {people.length > 0 && (
                                  expandedItem === item.id
                                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Assignment Checkboxes */}
                            <AnimatePresence>
                              {expandedItem === item.id && people.length > 0 && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-3 pb-3 pt-1 border-t">
                                    <p className="text-xs text-muted-foreground mb-2">
                                      Assign to specific people (leave unchecked to split evenly):
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                      {people.map((person) => (
                                        <label
                                          key={person.id}
                                          className="flex items-center gap-2 cursor-pointer"
                                        >
                                          <Checkbox
                                            checked={item.assignedTo.includes(person.id)}
                                            onCheckedChange={() => toggleAssignment(item.id, person.id)}
                                          />
                                          <span className="text-sm">{person.name}</span>
                                        </label>
                                      ))}
                                    </div>
                                    {item.assignedTo.length > 0 && (
                                      <p className="text-xs text-primary mt-2">
                                        Split among {item.assignedTo.length} {item.assignedTo.length === 1 ? "person" : "people"}: {fmt(item.price * item.quantity / item.assignedTo.length, currency)} each
                                      </p>
                                    )}
                                    {item.assignedTo.length === 0 && (
                                      <p className="text-xs text-muted-foreground mt-2">
                                        Splitting evenly among all {people.length} people: {fmt(item.price * item.quantity / people.length, currency)} each
                                      </p>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* People */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    People
                  </CardTitle>
                  <CardDescription>Add the people splitting this bill</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      placeholder="Friend's name..."
                      onKeyDown={(e) => e.key === "Enter" && addPerson()}
                    />
                    <Button onClick={addPerson}>
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {people.map((person) => (
                        <motion.div
                          key={person.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <Badge
                            variant="secondary"
                            className="text-sm py-1.5 px-3 gap-2 cursor-default"
                          >
                            {person.name}
                            <button
                              onClick={() => removePerson(person.id)}
                              className="hover:text-destructive transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </Badge>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {people.length === 0 && (
                      <p className="text-sm text-muted-foreground py-4 w-full text-center">
                        Add people to start splitting the bill.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tax & Tip */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-primary" />
                    Tax &amp; Tip
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Tax */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Tax Percentage</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={taxPercent || ""}
                          onChange={(e) => setTaxPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                          placeholder="0"
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                      </div>
                      {subtotal > 0 && taxPercent > 0 && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Tax amount: {fmt(taxAmount, currency)}
                        </p>
                      )}
                    </div>

                    {/* Tip */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Tip Percentage</Label>
                      <div className="flex gap-2 mb-2">
                        {[10, 15, 20].map((pct) => (
                          <Button
                            key={pct}
                            variant={tipPercent === pct && !customTip ? "default" : "outline"}
                            size="sm"
                            onClick={() => selectTip(pct)}
                            className="flex-1"
                          >
                            {pct}%
                          </Button>
                        ))}
                        <Button
                          variant={customTip ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setCustomTip(tipPercent.toString());
                          }}
                          className="flex-1"
                        >
                          Custom
                        </Button>
                      </div>
                      {customTip !== "" && (
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={customTip}
                            onChange={(e) => handleCustomTip(e.target.value)}
                            placeholder="Custom %"
                            className="pr-8"
                            autoFocus
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                        </div>
                      )}
                      {subtotal > 0 && tipPercent > 0 && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Tip amount: {fmt(tipAmount, currency)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* ── Right Column: Summary + Per-Person Breakdown ──────── */}
          <div className="space-y-6">
            {/* Bill Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calculator className="w-5 h-5 text-primary" />
                    Bill Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{fmt(subtotal, currency)}</span>
                    </div>
                    {taxPercent > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax ({taxPercent}%)</span>
                        <span className="font-medium">{fmt(taxAmount, currency)}</span>
                      </div>
                    )}
                    {tipPercent > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tip ({tipPercent}%)</span>
                        <span className="font-medium">{fmt(tipAmount, currency)}</span>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold">Grand Total</span>
                        <span className="font-bold text-lg text-primary">{fmt(grandTotal, currency)}</span>
                      </div>
                    </div>
                    {people.length > 0 && (
                      <div className="flex justify-between text-sm pt-1">
                        <span className="text-muted-foreground">Per person (even)</span>
                        <span className="font-medium">{fmt(grandTotal / people.length, currency)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleShare}
                      disabled={items.length === 0}
                    >
                      <Copy className="w-4 h-4 mr-1" /> Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={async () => {
                        if (navigator.share) {
                          try {
                            await navigator.share({ text: generateShareText() });
                          } catch { /* user cancelled */ }
                        } else {
                          handleShare();
                        }
                      }}
                      disabled={items.length === 0}
                    >
                      <Share2 className="w-4 h-4 mr-1" /> Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Per-Person Breakdown */}
            <AnimatePresence>
              {breakdowns.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="w-5 h-5 text-primary" />
                        Per Person Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {breakdowns.map((b, idx) => (
                        <motion.div
                          key={b.personId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-3 rounded-lg border bg-muted/30"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-sm">{b.personName}</span>
                            <Badge variant="default" className="text-sm font-bold">
                              {fmt(b.total, currency)}
                            </Badge>
                          </div>

                          {/* Item breakdown */}
                          {b.items.length > 0 && (
                            <div className="space-y-1 mb-2">
                              {b.items.map((item, i) => (
                                <div key={i} className="flex justify-between text-xs text-muted-foreground">
                                  <span>{item.name}</span>
                                  <span>{fmt(item.amount, currency)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="border-t pt-2 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span>{fmt(b.subtotal, currency)}</span>
                            </div>
                            {taxPercent > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Tax share</span>
                                <span>{fmt(b.taxShare, currency)}</span>
                              </div>
                            )}
                            {tipPercent > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Tip share</span>
                                <span>{fmt(b.tipShare, currency)}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tips Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">How It Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>1. Add all items from the bill with prices</li>
                    <li>2. Add the people splitting the bill</li>
                    <li>3. Click an item to assign it to specific people</li>
                    <li>4. Unassigned items are split evenly among everyone</li>
                    <li>5. Set tax and tip percentages</li>
                    <li>6. Share or copy the summary</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
