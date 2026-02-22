import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  DollarSign, Plus, Trash2, Mail, Clock, AlertTriangle, CheckCircle2,
  Send, Calendar, Crown, Bell, Settings, TrendingUp, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type InvoiceStatus = "draft" | "sent" | "overdue" | "paid";

interface Invoice {
  id: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  reminderEnabled: boolean;
  remindersSent: number;
  createdAt: string;
}

const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "bg-gray-500", icon: <Clock className="w-4 h-4" /> },
  sent: { label: "Sent", color: "bg-blue-500", icon: <Send className="w-4 h-4" /> },
  overdue: { label: "Overdue", color: "bg-red-500", icon: <AlertTriangle className="w-4 h-4" /> },
  paid: { label: "Paid", color: "bg-green-500", icon: <CheckCircle2 className="w-4 h-4" /> },
};

export default function InvoiceChaser() {
  const { user, subscription } = useAuth();
  const isPremium = subscription?.subscribed;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    clientName: "",
    clientEmail: "",
    amount: "",
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("techtrendi_invoices_chaser");
    if (saved) {
      setInvoices(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("techtrendi_invoices_chaser", JSON.stringify(invoices));
  }, [invoices]);

  // Check for overdue invoices
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.status === "sent" && inv.dueDate < today) {
          return { ...inv, status: "overdue" as InvoiceStatus };
        }
        return inv;
      })
    );
  }, []);

  const addInvoice = () => {
    if (!newInvoice.clientName || !newInvoice.clientEmail || !newInvoice.amount) {
      toast.error("Please fill in all fields");
      return;
    }

    const invoice: Invoice = {
      id: Date.now().toString(),
      clientName: newInvoice.clientName,
      clientEmail: newInvoice.clientEmail,
      amount: parseFloat(newInvoice.amount),
      dueDate: newInvoice.dueDate,
      status: "draft",
      reminderEnabled: true,
      remindersSent: 0,
      createdAt: new Date().toISOString(),
    };

    setInvoices([invoice, ...invoices]);
    setNewInvoice({
      clientName: "",
      clientEmail: "",
      amount: "",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });
    setIsAddingNew(false);
    toast.success("Invoice added!");
  };

  const deleteInvoice = (id: string) => {
    setInvoices(invoices.filter((inv) => inv.id !== id));
    toast.success("Invoice deleted");
  };

  const updateStatus = (id: string, status: InvoiceStatus) => {
    setInvoices(invoices.map((inv) => (inv.id === id ? { ...inv, status } : inv)));
    toast.success(`Status updated to ${statusConfig[status].label}`);
  };

  const toggleReminder = (id: string) => {
    setInvoices(
      invoices.map((inv) =>
        inv.id === id ? { ...inv, reminderEnabled: !inv.reminderEnabled } : inv
      )
    );
  };

  const sendReminder = (id: string) => {
    if (!isPremium) {
      toast.error("Premium required to send reminders");
      return;
    }

    setInvoices(
      invoices.map((inv) =>
        inv.id === id ? { ...inv, remindersSent: inv.remindersSent + 1 } : inv
      )
    );
    toast.success("Reminder sent!");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const totalOutstanding = invoices
    .filter((inv) => inv.status === "sent" || inv.status === "overdue")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const overdueCount = invoices.filter((inv) => inv.status === "overdue").length;
  const paidCount = invoices.filter((inv) => inv.status === "paid").length;

  return (
    <Layout>
      <SEOHead
        title="Invoice Chaser - Automated Payment Reminders | TechTrendi"
        description="Stop chasing late payments manually. Automate your invoice reminders and get paid faster with polite, escalating follow-ups."
        canonicalUrl="https://techtrendi.com/tools/invoice-chaser"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Crown className="w-3 h-3 mr-1" />
            Premium Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Invoice <span className="text-primary">Chaser</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Stop chasing late payments manually. Automate your reminders and get paid faster.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <DollarSign className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</div>
              <div className="text-xs text-muted-foreground">Outstanding</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{overdueCount}</div>
              <div className="text-xs text-muted-foreground">Overdue</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{paidCount}</div>
              <div className="text-xs text-muted-foreground">Paid</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{invoices.length}</div>
              <div className="text-xs text-muted-foreground">Total Invoices</div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Invoice */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Invoices to Chase
              </CardTitle>
              <Button onClick={() => setIsAddingNew(!isAddingNew)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Invoice
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add Form */}
            {isAddingNew && (
              <div className="p-4 mb-6 rounded-lg border border-dashed border-primary/30 bg-primary/5">
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label>Client Name</Label>
                    <Input
                      value={newInvoice.clientName}
                      onChange={(e) => setNewInvoice({ ...newInvoice, clientName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label>Client Email</Label>
                    <Input
                      type="email"
                      value={newInvoice.clientEmail}
                      onChange={(e) => setNewInvoice({ ...newInvoice, clientEmail: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={newInvoice.amount}
                        onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                        placeholder="0.00"
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={newInvoice.dueDate}
                      onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addInvoice}>Add Invoice</Button>
                </div>
              </div>
            )}

            {/* Invoices List */}
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No invoices yet</p>
                <p className="text-sm text-muted-foreground">
                  Add your first invoice above to start tracking and chasing payments
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => {
                  const daysUntilDue = getDaysUntilDue(invoice.dueDate);

                  return (
                    <div
                      key={invoice.id}
                      className={cn(
                        "flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border transition-colors",
                        invoice.status === "overdue" && "border-red-500/30 bg-red-500/5",
                        invoice.status === "paid" && "border-green-500/30 bg-green-500/5"
                      )}
                    >
                      {/* Client Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-foreground">{invoice.clientName}</div>
                          <Badge className={cn("text-white text-xs", statusConfig[invoice.status].color)}>
                            {statusConfig[invoice.status].label}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{invoice.clientEmail}</div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Due: {invoice.dueDate}
                          </span>
                          {invoice.status !== "paid" && (
                            <span className={cn(
                              "font-medium",
                              daysUntilDue < 0 ? "text-red-500" : daysUntilDue <= 3 ? "text-amber-500" : "text-green-500"
                            )}>
                              {daysUntilDue < 0
                                ? `${Math.abs(daysUntilDue)} days overdue`
                                : daysUntilDue === 0
                                ? "Due today"
                                : `${daysUntilDue} days left`}
                            </span>
                          )}
                          {invoice.remindersSent > 0 && (
                            <span className="flex items-center gap-1">
                              <Bell className="w-3 h-3" />
                              {invoice.remindersSent} reminder{invoice.remindersSent > 1 ? "s" : ""} sent
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-2xl font-bold text-foreground">
                        {formatCurrency(invoice.amount)}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {/* Auto Reminder Toggle */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                          <Bell className={cn("w-4 h-4", invoice.reminderEnabled ? "text-primary" : "text-muted-foreground")} />
                          <Switch
                            checked={invoice.reminderEnabled}
                            onCheckedChange={() => toggleReminder(invoice.id)}
                            disabled={invoice.status === "paid"}
                          />
                        </div>

                        {/* Status Select */}
                        <Select
                          value={invoice.status}
                          onValueChange={(v: InvoiceStatus) => updateStatus(invoice.id, v)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2 h-2 rounded-full", config.color)} />
                                  {config.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Send Reminder */}
                        {invoice.status !== "paid" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendReminder(invoice.id)}
                            disabled={!isPremium}
                          >
                            <Mail className="w-4 h-4 mr-1" />
                            Remind
                          </Button>
                        )}

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteInvoice(invoice.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How Invoice Chaser Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-medium mb-2">1. Add Invoice</h3>
                <p className="text-sm text-muted-foreground">
                  Enter client details, amount, and due date
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="font-medium mb-2">2. Auto Reminders</h3>
                <p className="text-sm text-muted-foreground">
                  Polite reminders sent automatically as due date approaches
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-medium mb-2">3. Get Paid</h3>
                <p className="text-sm text-muted-foreground">
                  Mark as paid when payment received
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {!isPremium && (
          <Card className="mt-8 border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <Crown className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Upgrade to Premium</h3>
              <p className="text-muted-foreground mb-4">
                Send automated reminders, customize email templates, and never chase payments manually again.
              </p>
              <Button asChild>
                <a href="/premium">
                  <Crown className="w-4 h-4 mr-2" />
                  Get Premium - $4.99/month
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
