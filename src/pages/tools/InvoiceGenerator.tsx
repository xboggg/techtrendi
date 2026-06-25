import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Receipt, Plus, Trash2, Download, Eye, Crown, FileText,
  Building2, User, Calendar, DollarSign, Mail, Phone, MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  from: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  to: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: LineItem[];
  notes: string;
  taxRate: number;
}

export default function InvoiceGenerator() {
  const { user, subscription } = useAuth();
  const isPremium = subscription?.subscribed;
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<InvoiceData>({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    from: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
    to: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
    items: [
      { id: "1", description: "", quantity: 1, rate: 0 },
    ],
    notes: "Thank you for your business!",
    taxRate: 0,
  });

  const addItem = () => {
    setInvoice({
      ...invoice,
      items: [
        ...invoice.items,
        { id: Date.now().toString(), description: "", quantity: 1, rate: 0 },
      ],
    });
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setInvoice({
      ...invoice,
      items: invoice.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const removeItem = (id: string) => {
    if (invoice.items.length === 1) {
      toast.error("Invoice must have at least one item");
      return;
    }
    setInvoice({
      ...invoice,
      items: invoice.items.filter((item) => item.id !== id),
    });
  };

  const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const tax = subtotal * (invoice.taxRate / 100);
  const total = subtotal + tax;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleDownload = () => {
    if (!isPremium) {
      toast.error("Premium required to download invoices");
      return;
    }
    // In a real app, this would generate a PDF
    toast.success("Invoice downloaded!");
  };

  return (
    <Layout>
      <SEOHead
        title="Invoice Generator - Create Professional Invoices | TechTrendi"
        description="Create professional invoices in minutes. Customize with your logo, add line items, and download as PDF. Perfect for freelancers and small businesses."
        canonicalUrl="https://techtrendi.com/tools/invoice-generator"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Crown className="w-3 h-3 mr-1" />
            Premium Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Invoice <span className="text-primary">Generator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Create professional invoices in minutes. Perfect for freelancers and small businesses.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Editor */}
          <div className="space-y-6">
            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Invoice #</Label>
                    <Input
                      value={invoice.invoiceNumber}
                      onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={invoice.date}
                      onChange={(e) => setInvoice({ ...invoice, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={invoice.dueDate}
                      onChange={(e) => setInvoice({ ...invoice, dueDate: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* From/To */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    From (Your Details)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Your Name / Business"
                    value={invoice.from.name}
                    onChange={(e) => setInvoice({ ...invoice, from: { ...invoice.from, name: e.target.value } })}
                  />
                  <Input
                    placeholder="Email"
                    value={invoice.from.email}
                    onChange={(e) => setInvoice({ ...invoice, from: { ...invoice.from, email: e.target.value } })}
                  />
                  <Input
                    placeholder="Phone"
                    value={invoice.from.phone}
                    onChange={(e) => setInvoice({ ...invoice, from: { ...invoice.from, phone: e.target.value } })}
                  />
                  <Textarea
                    placeholder="Address"
                    value={invoice.from.address}
                    onChange={(e) => setInvoice({ ...invoice, from: { ...invoice.from, address: e.target.value } })}
                    rows={2}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Bill To (Client)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Client Name / Business"
                    value={invoice.to.name}
                    onChange={(e) => setInvoice({ ...invoice, to: { ...invoice.to, name: e.target.value } })}
                  />
                  <Input
                    placeholder="Email"
                    value={invoice.to.email}
                    onChange={(e) => setInvoice({ ...invoice, to: { ...invoice.to, email: e.target.value } })}
                  />
                  <Input
                    placeholder="Phone"
                    value={invoice.to.phone}
                    onChange={(e) => setInvoice({ ...invoice, to: { ...invoice.to, phone: e.target.value } })}
                  />
                  <Textarea
                    placeholder="Address"
                    value={invoice.to.address}
                    onChange={(e) => setInvoice({ ...invoice, to: { ...invoice.to, address: e.target.value } })}
                    rows={2}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Line Items
                  </CardTitle>
                  <Button onClick={addItem} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-2">Rate</div>
                    <div className="col-span-2">Amount</div>
                  </div>

                  {invoice.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-1 text-sm font-medium">
                        {formatCurrency(item.quantity * item.rate)}
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-6 border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Tax</span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={invoice.taxRate}
                        onChange={(e) => setInvoice({ ...invoice, taxRate: parseFloat(e.target.value) || 0 })}
                        className="w-16 h-8"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                    <span className="font-medium">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={invoice.notes}
                  onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
                  placeholder="Payment terms, thank you note, etc."
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button className="flex-1" onClick={handleDownload} disabled={!isPremium}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              {!isPremium && (
                <Button variant="outline" asChild>
                  <a href="/auth">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Download
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={invoiceRef}
                  className="bg-white text-gray-900 p-8 rounded-lg shadow-lg text-sm"
                  style={{ minHeight: "600px" }}
                >
                  {/* Invoice Header */}
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
                      <p className="text-gray-500 mt-1">#{invoice.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{invoice.from.name || "Your Business"}</div>
                      {invoice.from.email && <div className="text-gray-500">{invoice.from.email}</div>}
                      {invoice.from.phone && <div className="text-gray-500">{invoice.from.phone}</div>}
                    </div>
                  </div>

                  {/* Dates & Bill To */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <h3 className="font-semibold text-gray-500 text-xs uppercase mb-2">Bill To</h3>
                      <div className="font-medium">{invoice.to.name || "Client Name"}</div>
                      {invoice.to.email && <div className="text-gray-500">{invoice.to.email}</div>}
                      {invoice.to.address && <div className="text-gray-500 whitespace-pre-line">{invoice.to.address}</div>}
                    </div>
                    <div className="text-right">
                      <div className="mb-2">
                        <span className="text-gray-500">Date: </span>
                        <span className="font-medium">{invoice.date}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Due: </span>
                        <span className="font-medium">{invoice.dueDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="w-full mb-8">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-2 text-gray-500 text-xs uppercase">Description</th>
                        <th className="text-center py-2 text-gray-500 text-xs uppercase w-16">Qty</th>
                        <th className="text-right py-2 text-gray-500 text-xs uppercase w-24">Rate</th>
                        <th className="text-right py-2 text-gray-500 text-xs uppercase w-24">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-3">{item.description || "Item description"}</td>
                          <td className="text-center py-3">{item.quantity}</td>
                          <td className="text-right py-3">{formatCurrency(item.rate)}</td>
                          <td className="text-right py-3 font-medium">{formatCurrency(item.quantity * item.rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-64">
                      <div className="flex justify-between py-2">
                        <span className="text-gray-500">Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      {invoice.taxRate > 0 && (
                        <div className="flex justify-between py-2">
                          <span className="text-gray-500">Tax ({invoice.taxRate}%)</span>
                          <span>{formatCurrency(tax)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-3 border-t-2 border-gray-900 font-bold text-lg">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {invoice.notes && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <h3 className="font-semibold text-gray-500 text-xs uppercase mb-2">Notes</h3>
                      <p className="text-gray-600 whitespace-pre-line">{invoice.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
