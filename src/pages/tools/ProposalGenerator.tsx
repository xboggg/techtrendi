import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileSignature, Plus, Trash2, Download, Eye, Crown, Copy, Check,
  Building, User, Calendar, DollarSign, FileText, Sparkles
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

interface ProposalData {
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  projectTitle: string;
  projectSummary: string;
  scope: string;
  deliverables: string;
  timeline: string;
  validUntil: string;
  lineItems: LineItem[];
  notes: string;
  yourName: string;
  yourCompany: string;
  yourEmail: string;
  yourPhone: string;
}

const defaultProposal: ProposalData = {
  clientName: "",
  clientCompany: "",
  clientEmail: "",
  projectTitle: "",
  projectSummary: "",
  scope: "",
  deliverables: "",
  timeline: "",
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  lineItems: [{ id: "1", description: "", quantity: 1, rate: 0 }],
  notes: "",
  yourName: "",
  yourCompany: "",
  yourEmail: "",
  yourPhone: "",
};

export default function ProposalGenerator() {
  const { user, subscription } = useAuth();
  const isPremium = subscription?.subscribed;

  const [proposal, setProposal] = useState<ProposalData>(defaultProposal);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const updateField = (field: keyof ProposalData, value: string) => {
    setProposal((prev) => ({ ...prev, [field]: value }));
  };

  const addLineItem = () => {
    setProposal((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { id: Date.now().toString(), description: "", quantity: 1, rate: 0 },
      ],
    }));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setProposal((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeLineItem = (id: string) => {
    if (proposal.lineItems.length === 1) {
      toast.error("You need at least one line item");
      return;
    }
    setProposal((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((item) => item.id !== id),
    }));
  };

  const calculateTotal = () => {
    return proposal.lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const generateProposalText = () => {
    const total = calculateTotal();
    return `
PROPOSAL

From:
${proposal.yourName}
${proposal.yourCompany}
${proposal.yourEmail}
${proposal.yourPhone}

To:
${proposal.clientName}
${proposal.clientCompany}
${proposal.clientEmail}

Project: ${proposal.projectTitle}
Valid Until: ${proposal.validUntil}

---

PROJECT SUMMARY
${proposal.projectSummary}

SCOPE OF WORK
${proposal.scope}

DELIVERABLES
${proposal.deliverables}

TIMELINE
${proposal.timeline}

---

PRICING

${proposal.lineItems.map((item) => `${item.description}: ${item.quantity} x ${formatCurrency(item.rate)} = ${formatCurrency(item.quantity * item.rate)}`).join("\n")}

TOTAL: ${formatCurrency(total)}

---

NOTES
${proposal.notes}

---

To accept this proposal, please reply to this email or sign below.

Signature: _______________________
Date: _______________________
    `.trim();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateProposalText());
    setCopied(true);
    toast.success("Proposal copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsTxt = () => {
    const blob = new Blob([generateProposalText()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proposal-${proposal.projectTitle || "untitled"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Proposal downloaded!");
  };

  if (!isPremium) {
    return (
      <Layout>
        <SEOHead
          title="Proposal Generator - Create Winning Proposals | TechTrendi"
          description="Create professional business proposals that win clients. Customizable templates, pricing tables, and easy export options."
          canonicalUrl="https://techtrendi.com/tools/proposal-generator"
        />
        <div className="container py-12 md:py-20 max-w-2xl">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <Crown className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Proposal Generator</h1>
              <p className="text-muted-foreground mb-6">
                Create professional proposals that win clients. This premium tool includes customizable templates, pricing tables, and easy export options.
              </p>
              <Button asChild size="lg">
                <a href="/premium">
                  <Crown className="w-4 h-4 mr-2" />
                  Get Premium - $4.99/month
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title="Proposal Generator - Create Winning Proposals | TechTrendi"
        description="Create professional business proposals that win clients. Customizable templates, pricing tables, and easy export options."
        canonicalUrl="https://techtrendi.com/tools/proposal-generator"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Crown className="w-3 h-3 mr-1" />
            Premium Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Proposal <span className="text-primary">Generator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Create professional proposals that win clients. Fill in the details below and export.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-6">
            {/* Your Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Your Name</Label>
                    <Input
                      value={proposal.yourName}
                      onChange={(e) => updateField("yourName", e.target.value)}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label>Your Company</Label>
                    <Input
                      value={proposal.yourCompany}
                      onChange={(e) => updateField("yourCompany", e.target.value)}
                      placeholder="Smith Consulting"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={proposal.yourEmail}
                      onChange={(e) => updateField("yourEmail", e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={proposal.yourPhone}
                      onChange={(e) => updateField("yourPhone", e.target.value)}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Client Name</Label>
                    <Input
                      value={proposal.clientName}
                      onChange={(e) => updateField("clientName", e.target.value)}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <Label>Company</Label>
                    <Input
                      value={proposal.clientCompany}
                      onChange={(e) => updateField("clientCompany", e.target.value)}
                      placeholder="Acme Inc."
                    />
                  </div>
                </div>
                <div>
                  <Label>Client Email</Label>
                  <Input
                    type="email"
                    value={proposal.clientEmail}
                    onChange={(e) => updateField("clientEmail", e.target.value)}
                    placeholder="jane@acme.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Project Title</Label>
                  <Input
                    value={proposal.projectTitle}
                    onChange={(e) => updateField("projectTitle", e.target.value)}
                    placeholder="Website Redesign Project"
                  />
                </div>
                <div>
                  <Label>Project Summary</Label>
                  <Textarea
                    value={proposal.projectSummary}
                    onChange={(e) => updateField("projectSummary", e.target.value)}
                    placeholder="Brief overview of what this project is about..."
                    className="min-h-[80px]"
                  />
                </div>
                <div>
                  <Label>Scope of Work</Label>
                  <Textarea
                    value={proposal.scope}
                    onChange={(e) => updateField("scope", e.target.value)}
                    placeholder="What's included in this project..."
                    className="min-h-[80px]"
                  />
                </div>
                <div>
                  <Label>Deliverables</Label>
                  <Textarea
                    value={proposal.deliverables}
                    onChange={(e) => updateField("deliverables", e.target.value)}
                    placeholder="List of deliverables..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Timeline</Label>
                    <Input
                      value={proposal.timeline}
                      onChange={(e) => updateField("timeline", e.target.value)}
                      placeholder="4-6 weeks"
                    />
                  </div>
                  <div>
                    <Label>Valid Until</Label>
                    <Input
                      type="date"
                      value={proposal.validUntil}
                      onChange={(e) => updateField("validUntil", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pricing
                </CardTitle>
                <CardDescription>Add line items for your pricing breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {proposal.lineItems.map((item, index) => (
                  <div key={item.id} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className={index > 0 ? "sr-only" : ""}>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                        placeholder="Design services"
                      />
                    </div>
                    <div className="w-20">
                      <Label className={index > 0 ? "sr-only" : ""}>Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="w-28">
                      <Label className={index > 0 ? "sr-only" : ""}>Rate ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateLineItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(item.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addLineItem} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Line Item
                </Button>
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(calculateTotal())}</span>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={proposal.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Payment terms, additional conditions, etc."
                  className="min-h-[100px]"
                />
              </CardContent>
            </Card>
          </div>

          {/* Preview & Actions */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Preview
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button size="sm" onClick={downloadAsTxt}>
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-6 border max-h-[600px] overflow-y-auto">
                  <div className="space-y-6 text-sm">
                    {/* Header */}
                    <div className="text-center border-b pb-4">
                      <h2 className="text-2xl font-bold text-primary mb-1">PROPOSAL</h2>
                      <p className="text-muted-foreground">
                        {proposal.projectTitle || "Project Title"}
                      </p>
                    </div>

                    {/* From/To */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-1">From:</h4>
                        <p>{proposal.yourName || "Your Name"}</p>
                        <p className="text-muted-foreground">{proposal.yourCompany}</p>
                        <p className="text-muted-foreground">{proposal.yourEmail}</p>
                        <p className="text-muted-foreground">{proposal.yourPhone}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">To:</h4>
                        <p>{proposal.clientName || "Client Name"}</p>
                        <p className="text-muted-foreground">{proposal.clientCompany}</p>
                        <p className="text-muted-foreground">{proposal.clientEmail}</p>
                      </div>
                    </div>

                    {/* Project Details */}
                    {proposal.projectSummary && (
                      <div>
                        <h4 className="font-semibold mb-1">Project Summary</h4>
                        <p className="text-muted-foreground whitespace-pre-line">{proposal.projectSummary}</p>
                      </div>
                    )}

                    {proposal.scope && (
                      <div>
                        <h4 className="font-semibold mb-1">Scope of Work</h4>
                        <p className="text-muted-foreground whitespace-pre-line">{proposal.scope}</p>
                      </div>
                    )}

                    {proposal.deliverables && (
                      <div>
                        <h4 className="font-semibold mb-1">Deliverables</h4>
                        <p className="text-muted-foreground whitespace-pre-line">{proposal.deliverables}</p>
                      </div>
                    )}

                    {/* Pricing Table */}
                    <div>
                      <h4 className="font-semibold mb-2">Pricing</h4>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left p-2">Description</th>
                              <th className="text-center p-2">Qty</th>
                              <th className="text-right p-2">Rate</th>
                              <th className="text-right p-2">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {proposal.lineItems.map((item) => (
                              <tr key={item.id} className="border-t">
                                <td className="p-2">{item.description || "-"}</td>
                                <td className="text-center p-2">{item.quantity}</td>
                                <td className="text-right p-2">{formatCurrency(item.rate)}</td>
                                <td className="text-right p-2">{formatCurrency(item.quantity * item.rate)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-muted font-semibold">
                            <tr>
                              <td colSpan={3} className="text-right p-2">Total:</td>
                              <td className="text-right p-2 text-primary">{formatCurrency(calculateTotal())}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Timeline & Valid Until */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Timeline:</span>
                        <p className="font-medium">{proposal.timeline || "TBD"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valid Until:</span>
                        <p className="font-medium">{proposal.validUntil}</p>
                      </div>
                    </div>

                    {/* Notes */}
                    {proposal.notes && (
                      <div>
                        <h4 className="font-semibold mb-1">Notes</h4>
                        <p className="text-muted-foreground whitespace-pre-line">{proposal.notes}</p>
                      </div>
                    )}

                    {/* Signature */}
                    <div className="border-t pt-4 mt-6">
                      <p className="text-muted-foreground mb-4">To accept this proposal, sign below:</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Signature</p>
                          <div className="border-b border-dashed h-8" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Date</p>
                          <div className="border-b border-dashed h-8" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
