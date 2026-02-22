import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText, Download, Copy, Check, Briefcase, Users, Calendar, DollarSign,
  Clock, Shield, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface ContractData {
  type: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  providerName: string;
  providerEmail: string;
  providerAddress: string;
  projectName: string;
  projectDescription: string;
  startDate: string;
  endDate: string;
  paymentAmount: string;
  paymentSchedule: string;
  deliverables: string;
  revisions: string;
  terminationNotice: string;
  jurisdiction: string;
}

const contractTypes = [
  { value: "freelance", label: "Freelance Service Agreement", icon: Briefcase },
  { value: "nda", label: "Non-Disclosure Agreement (NDA)", icon: Shield },
  { value: "consulting", label: "Consulting Agreement", icon: Users },
  { value: "web-design", label: "Web Design Contract", icon: FileText },
  { value: "content", label: "Content Creation Agreement", icon: FileText },
];

const defaultData: ContractData = {
  type: "freelance",
  clientName: "",
  clientEmail: "",
  clientAddress: "",
  providerName: "",
  providerEmail: "",
  providerAddress: "",
  projectName: "",
  projectDescription: "",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  paymentAmount: "",
  paymentSchedule: "50% upfront, 50% on completion",
  deliverables: "",
  revisions: "3",
  terminationNotice: "14",
  jurisdiction: "",
};

const STORAGE_KEY = "techtrendi_contract_data";

export default function ContractGenerator() {
  const { user } = useAuth();
  const [data, setData] = useState<ContractData>(defaultData);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (saved) {
        setData(JSON.parse(saved));
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(data));
    }
  }, [data, user]);

  const updateData = (updates: Partial<ContractData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const generateFreelanceContract = () => {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric"
    });

    return `
FREELANCE SERVICE AGREEMENT

This Freelance Service Agreement ("Agreement") is entered into as of ${today}

BETWEEN:

SERVICE PROVIDER:
${data.providerName}
${data.providerAddress}
Email: ${data.providerEmail}

AND

CLIENT:
${data.clientName}
${data.clientAddress}
Email: ${data.clientEmail}

1. PROJECT DESCRIPTION
${data.projectName}
${data.projectDescription}

2. DELIVERABLES
${data.deliverables}

3. TIMELINE
Start Date: ${data.startDate}
${data.endDate ? `End Date: ${data.endDate}` : "End Date: Upon completion of deliverables"}

4. COMPENSATION
Total Amount: ${data.paymentAmount}
Payment Schedule: ${data.paymentSchedule}

5. REVISIONS
The Service Provider agrees to provide up to ${data.revisions} rounds of revisions based on Client feedback. Additional revisions will be billed at an hourly rate to be agreed upon.

6. INTELLECTUAL PROPERTY
Upon receipt of full payment, all intellectual property rights for the deliverables shall transfer to the Client. Until full payment is received, the Service Provider retains all rights.

7. CONFIDENTIALITY
Both parties agree to keep confidential any proprietary information shared during the course of this project.

8. TERMINATION
Either party may terminate this Agreement with ${data.terminationNotice} days written notice. In case of termination:
- Client shall pay for all work completed up to the termination date
- Any advance payments for undelivered work shall be refunded

9. LIMITATION OF LIABILITY
The Service Provider's liability shall not exceed the total amount paid under this Agreement.

10. INDEPENDENT CONTRACTOR
The Service Provider is an independent contractor and not an employee of the Client.

11. DISPUTE RESOLUTION
Any disputes arising from this Agreement shall be resolved through mediation, followed by arbitration if necessary.

${data.jurisdiction ? `12. GOVERNING LAW\nThis Agreement shall be governed by the laws of ${data.jurisdiction}.` : ""}

SIGNATURES:

_______________________________     Date: _______________
${data.providerName} (Service Provider)

_______________________________     Date: _______________
${data.clientName} (Client)
    `.trim();
  };

  const generateNDA = () => {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric"
    });

    return `
NON-DISCLOSURE AGREEMENT (NDA)

This Non-Disclosure Agreement ("Agreement") is entered into as of ${today}

BETWEEN:

DISCLOSING PARTY:
${data.clientName}
${data.clientAddress}
Email: ${data.clientEmail}

AND

RECEIVING PARTY:
${data.providerName}
${data.providerAddress}
Email: ${data.providerEmail}

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means any and all information or data that has or could have commercial value or other utility in the business in which the Disclosing Party is engaged. This includes, but is not limited to:
- Business plans, strategies, and methods
- Technical data, trade secrets, and know-how
- Customer lists and contacts
- Financial information
- Software, designs, and prototypes
- Any information marked as "Confidential"

2. PURPOSE
${data.projectDescription || "The Receiving Party agrees to receive and protect Confidential Information for the purpose of evaluating a potential business relationship."}

3. OBLIGATIONS
The Receiving Party agrees to:
a) Hold the Confidential Information in strict confidence
b) Not disclose the Confidential Information to any third parties without prior written consent
c) Use the Confidential Information only for the stated purpose
d) Protect the Confidential Information using the same degree of care used to protect their own confidential information

4. EXCLUSIONS
This Agreement does not apply to information that:
a) Was already known to the Receiving Party before disclosure
b) Is or becomes publicly available through no fault of the Receiving Party
c) Is independently developed by the Receiving Party
d) Is required to be disclosed by law

5. TERM
This Agreement shall remain in effect for a period of ${data.terminationNotice || "24"} months from the date of signing.

6. RETURN OF INFORMATION
Upon request or termination of discussions, the Receiving Party shall return or destroy all Confidential Information and certify its destruction.

7. NO LICENSE
Nothing in this Agreement grants any rights in the Confidential Information.

8. REMEDIES
The Receiving Party acknowledges that monetary damages may be insufficient for breach of this Agreement, and the Disclosing Party shall be entitled to seek injunctive relief.

${data.jurisdiction ? `9. GOVERNING LAW\nThis Agreement shall be governed by the laws of ${data.jurisdiction}.` : ""}

SIGNATURES:

_______________________________     Date: _______________
${data.clientName} (Disclosing Party)

_______________________________     Date: _______________
${data.providerName} (Receiving Party)
    `.trim();
  };

  const generateConsultingContract = () => {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric"
    });

    return `
CONSULTING AGREEMENT

This Consulting Agreement ("Agreement") is entered into as of ${today}

BETWEEN:

CONSULTANT:
${data.providerName}
${data.providerAddress}
Email: ${data.providerEmail}

AND

CLIENT:
${data.clientName}
${data.clientAddress}
Email: ${data.clientEmail}

1. ENGAGEMENT
The Client hereby engages the Consultant to provide consulting services as described below, and the Consultant agrees to perform such services.

2. SCOPE OF SERVICES
Project: ${data.projectName}
${data.projectDescription}

Deliverables:
${data.deliverables}

3. TERM
Start Date: ${data.startDate}
${data.endDate ? `End Date: ${data.endDate}` : "This Agreement shall continue until terminated as provided herein."}

4. COMPENSATION
Fee: ${data.paymentAmount}
Payment Terms: ${data.paymentSchedule}

Expenses: The Client shall reimburse the Consultant for all reasonable expenses incurred in performing the services, with prior approval.

5. INDEPENDENT CONTRACTOR STATUS
The Consultant is an independent contractor. Nothing in this Agreement shall be construed as creating an employer-employee relationship.

The Consultant shall be responsible for:
- Their own taxes and insurance
- Their own tools and equipment
- Setting their own work hours

6. CONFIDENTIALITY
The Consultant agrees to maintain the confidentiality of all proprietary information disclosed by the Client.

7. OWNERSHIP OF WORK PRODUCT
All work product created under this Agreement shall be the property of the Client upon full payment.

8. NON-COMPETE
During the term of this Agreement and for 12 months thereafter, the Consultant agrees not to engage in any business that directly competes with the Client's business in matters related to the services provided.

9. TERMINATION
Either party may terminate this Agreement with ${data.terminationNotice} days written notice. Upon termination:
- All fees for services rendered through the termination date shall be paid
- All Client materials shall be returned

10. LIMITATION OF LIABILITY
The Consultant's liability shall be limited to the fees paid under this Agreement.

${data.jurisdiction ? `11. GOVERNING LAW\nThis Agreement shall be governed by the laws of ${data.jurisdiction}.` : ""}

SIGNATURES:

_______________________________     Date: _______________
${data.providerName} (Consultant)

_______________________________     Date: _______________
${data.clientName} (Client)
    `.trim();
  };

  const generateContract = () => {
    switch (data.type) {
      case "nda":
        return generateNDA();
      case "consulting":
        return generateConsultingContract();
      default:
        return generateFreelanceContract();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateContract());
    setCopied(true);
    toast.success("Contract copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadContract = () => {
    const content = generateContract();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.type}-contract-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Contract downloaded!");
  };

  if (!user) {
    return (
      <Layout>
        <SEOHead
          title="Contract Generator - Create Legal Contracts | TechTrendi"
          description="Generate professional contracts for freelancers. Create NDAs, service agreements, and more."
          canonicalUrl="https://techtrendi.com/tools/contract-generator"
        />
        <div className="container py-12 md:py-20 max-w-2xl">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <FileText className="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Contract Generator</h1>
              <p className="text-muted-foreground mb-6">
                Generate professional contracts for your freelance work. Sign in to get started.
              </p>
              <Button asChild size="lg">
                <a href="/auth">Sign In to Continue</a>
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
        title="Contract Generator - Create Legal Contracts | TechTrendi"
        description="Generate professional contracts for freelancers. Create NDAs, service agreements, consulting contracts, and more."
        canonicalUrl="https://techtrendi.com/tools/contract-generator"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Free + Account
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Contract <span className="text-primary">Generator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Generate professional contracts for freelancers, consultants, and businesses
          </p>
        </div>

        {/* Disclaimer */}
        <Card className="mb-8 border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="pt-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong>Disclaimer:</strong> These templates are provided for informational purposes only and do not constitute legal advice. Please consult with a legal professional before using any contract for business purposes.
            </p>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Contract Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contract Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {contractTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => updateData({ type: type.value })}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                        data.type === type.value
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <type.icon className={cn(
                        "w-5 h-5",
                        data.type === type.value ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Parties */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Parties Involved
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">
                    {data.type === "nda" ? "Disclosing Party (Client)" : "Client"}
                  </h4>
                  <div className="space-y-3">
                    <Input
                      value={data.clientName}
                      onChange={(e) => updateData({ clientName: e.target.value })}
                      placeholder="Full Name / Company Name"
                    />
                    <Input
                      value={data.clientEmail}
                      onChange={(e) => updateData({ clientEmail: e.target.value })}
                      placeholder="Email Address"
                    />
                    <Input
                      value={data.clientAddress}
                      onChange={(e) => updateData({ clientAddress: e.target.value })}
                      placeholder="Address"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">
                    {data.type === "nda" ? "Receiving Party (You)" : data.type === "consulting" ? "Consultant (You)" : "Service Provider (You)"}
                  </h4>
                  <div className="space-y-3">
                    <Input
                      value={data.providerName}
                      onChange={(e) => updateData({ providerName: e.target.value })}
                      placeholder="Your Name / Business Name"
                    />
                    <Input
                      value={data.providerEmail}
                      onChange={(e) => updateData({ providerEmail: e.target.value })}
                      placeholder="Your Email"
                    />
                    <Input
                      value={data.providerAddress}
                      onChange={(e) => updateData({ providerAddress: e.target.value })}
                      placeholder="Your Address"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            {data.type !== "nda" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Project Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Project Name</Label>
                    <Input
                      value={data.projectName}
                      onChange={(e) => updateData({ projectName: e.target.value })}
                      placeholder="Website Redesign Project"
                    />
                  </div>
                  <div>
                    <Label>Project Description</Label>
                    <Textarea
                      value={data.projectDescription}
                      onChange={(e) => updateData({ projectDescription: e.target.value })}
                      placeholder="Describe the scope of work..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Deliverables</Label>
                    <Textarea
                      value={data.deliverables}
                      onChange={(e) => updateData({ deliverables: e.target.value })}
                      placeholder="List the deliverables..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {data.type === "nda" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Purpose</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={data.projectDescription}
                    onChange={(e) => updateData({ projectDescription: e.target.value })}
                    placeholder="Describe the purpose of sharing confidential information..."
                    rows={4}
                  />
                </CardContent>
              </Card>
            )}

            {/* Timeline & Payment */}
            {data.type !== "nda" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Timeline & Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={data.startDate}
                        onChange={(e) => updateData({ startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>End Date (optional)</Label>
                      <Input
                        type="date"
                        value={data.endDate}
                        onChange={(e) => updateData({ endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Payment Amount</Label>
                    <Input
                      value={data.paymentAmount}
                      onChange={(e) => updateData({ paymentAmount: e.target.value })}
                      placeholder="$5,000"
                    />
                  </div>
                  <div>
                    <Label>Payment Schedule</Label>
                    <Input
                      value={data.paymentSchedule}
                      onChange={(e) => updateData({ paymentSchedule: e.target.value })}
                      placeholder="50% upfront, 50% on completion"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Revisions Included</Label>
                      <Input
                        value={data.revisions}
                        onChange={(e) => updateData({ revisions: e.target.value })}
                        placeholder="3"
                      />
                    </div>
                    <div>
                      <Label>Termination Notice (days)</Label>
                      <Input
                        value={data.terminationNotice}
                        onChange={(e) => updateData({ terminationNotice: e.target.value })}
                        placeholder="14"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Governing Jurisdiction (optional)</Label>
                  <Input
                    value={data.jurisdiction}
                    onChange={(e) => updateData({ jurisdiction: e.target.value })}
                    placeholder="State of California, USA"
                  />
                </div>
                {data.type === "nda" && (
                  <div>
                    <Label>NDA Duration (months)</Label>
                    <Input
                      value={data.terminationNotice}
                      onChange={(e) => updateData({ terminationNotice: e.target.value })}
                      placeholder="24"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Preview */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Contract Preview</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      {copied ? (
                        <Check className="w-4 h-4 mr-1 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      Copy
                    </Button>
                    <Button size="sm" onClick={downloadContract}>
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-xs whitespace-pre-wrap overflow-y-auto max-h-[600px] font-mono">
                  {generateContract()}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
