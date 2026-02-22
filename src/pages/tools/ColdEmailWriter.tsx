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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail, Copy, Check, Briefcase, User, Target, Sparkles, RefreshCw,
  Zap, Clock, Lightbulb, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface EmailData {
  // Type
  purpose: string;

  // Sender
  senderName: string;
  senderRole: string;
  senderCompany: string;

  // Recipient
  recipientName: string;
  recipientRole: string;
  recipientCompany: string;

  // Content
  valueProposition: string;
  personalizedHook: string;
  specificAsk: string;
  socialProof: string;

  // Style
  tone: string;
  length: string;
}

const purposes = [
  { value: "sales", label: "Sales/Business Development", description: "Pitch a product or service" },
  { value: "partnership", label: "Partnership Proposal", description: "Explore collaboration opportunities" },
  { value: "networking", label: "Networking/Coffee Chat", description: "Build professional relationships" },
  { value: "job", label: "Job Inquiry", description: "Explore job opportunities" },
  { value: "podcast", label: "Podcast/Interview Request", description: "Invite to your show or content" },
  { value: "feedback", label: "Feedback Request", description: "Get input on your product/idea" },
];

const tones = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "friendly", label: "Friendly" },
  { value: "direct", label: "Direct" },
];

const defaultData: EmailData = {
  purpose: "sales",
  senderName: "",
  senderRole: "",
  senderCompany: "",
  recipientName: "",
  recipientRole: "",
  recipientCompany: "",
  valueProposition: "",
  personalizedHook: "",
  specificAsk: "",
  socialProof: "",
  tone: "professional",
  length: "short",
};

const templates = {
  sales: {
    subject: "Quick question about {recipientCompany}",
    body: `Hi {recipientName},

I noticed {personalizedHook}. Impressive work!

I'm {senderName} from {senderCompany}. We help companies like {recipientCompany} {valueProposition}.

{socialProof}

Would you be open to a quick 15-minute call this week to explore if we could help {recipientCompany} achieve similar results?

Best,
{senderName}
{senderRole} at {senderCompany}`,
  },
  partnership: {
    subject: "Partnership idea for {recipientCompany}",
    body: `Hi {recipientName},

{personalizedHook}

I'm reaching out because I think there's an interesting opportunity for {senderCompany} and {recipientCompany} to collaborate.

{valueProposition}

{socialProof}

Would you be interested in exploring this further? {specificAsk}

Looking forward to hearing your thoughts,
{senderName}
{senderRole} at {senderCompany}`,
  },
  networking: {
    subject: "Fellow {industry} professional - quick hello",
    body: `Hi {recipientName},

{personalizedHook}

I'm {senderName}, {senderRole} at {senderCompany}. {valueProposition}

I'd love to connect and learn more about your journey at {recipientCompany}. {specificAsk}

No pressure at all - I know you're busy. But if you have 15-20 minutes for a virtual coffee, I'd really appreciate it.

Cheers,
{senderName}`,
  },
  job: {
    subject: "Interested in opportunities at {recipientCompany}",
    body: `Hi {recipientName},

{personalizedHook}

I'm {senderName}, currently {senderRole} at {senderCompany}. I've been following {recipientCompany}'s growth and I'm impressed by {valueProposition}.

{socialProof}

I'd love the opportunity to contribute to {recipientCompany}'s mission. {specificAsk}

Thank you for your time,
{senderName}`,
  },
  podcast: {
    subject: "Guest invitation - {podcastName}",
    body: `Hi {recipientName},

{personalizedHook}

I host {senderCompany}, where we {valueProposition}. I think your insights on {topic} would be incredibly valuable to our audience.

{socialProof}

Would you be interested in being a guest? {specificAsk}

Looking forward to hopefully chatting soon,
{senderName}`,
  },
  feedback: {
    subject: "Quick feedback request (2 min)",
    body: `Hi {recipientName},

{personalizedHook}

I'm {senderName}, working on {senderCompany}. We're {valueProposition}.

Given your expertise as {recipientRole} at {recipientCompany}, I'd really value your quick feedback on our approach.

{specificAsk}

No worries if you're too busy - I completely understand. But if you have 5 minutes, it would mean a lot.

Thanks,
{senderName}`,
  },
};

const STORAGE_KEY = "techtrendi_coldemail_data";

export default function ColdEmailWriter() {
  const { user } = useAuth();
  const [data, setData] = useState<EmailData>(defaultData);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [savedEmails, setSavedEmails] = useState<Array<{ subject: string; body: string; date: string }>>([]);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setData(parsed.data || defaultData);
        setSavedEmails(parsed.saved || []);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify({ data, saved: savedEmails }));
    }
  }, [data, savedEmails, user]);

  const updateData = (updates: Partial<EmailData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const fillPlaceholders = (template: string) => {
    return template
      .replace(/{senderName}/g, data.senderName || "[Your Name]")
      .replace(/{senderRole}/g, data.senderRole || "[Your Role]")
      .replace(/{senderCompany}/g, data.senderCompany || "[Your Company]")
      .replace(/{recipientName}/g, data.recipientName || "[Their Name]")
      .replace(/{recipientRole}/g, data.recipientRole || "[Their Role]")
      .replace(/{recipientCompany}/g, data.recipientCompany || "[Their Company]")
      .replace(/{valueProposition}/g, data.valueProposition || "[value proposition]")
      .replace(/{personalizedHook}/g, data.personalizedHook || "[personalized observation]")
      .replace(/{specificAsk}/g, data.specificAsk || "[specific ask/CTA]")
      .replace(/{socialProof}/g, data.socialProof ? `${data.socialProof}` : "")
      .replace(/{industry}/g, "tech")
      .replace(/{topic}/g, "[topic]")
      .replace(/{podcastName}/g, data.senderCompany || "[Podcast Name]")
      .replace(/\n\n\n+/g, "\n\n");
  };

  const getSubject = () => {
    const template = templates[data.purpose as keyof typeof templates];
    return fillPlaceholders(template.subject);
  };

  const getBody = () => {
    const template = templates[data.purpose as keyof typeof templates];
    let body = fillPlaceholders(template.body);

    // Adjust for length
    if (data.length === "very-short") {
      // Remove social proof and shorten
      body = body.replace(/\n\n.*?similar results\.?/g, "");
    }

    return body.trim();
  };

  const copySubject = () => {
    navigator.clipboard.writeText(getSubject());
    setCopiedSubject(true);
    toast.success("Subject line copied!");
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const copyBody = () => {
    navigator.clipboard.writeText(getBody());
    setCopiedBody(true);
    toast.success("Email body copied!");
    setTimeout(() => setCopiedBody(false), 2000);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(`Subject: ${getSubject()}\n\n${getBody()}`);
    toast.success("Full email copied!");
  };

  const saveEmail = () => {
    const newSaved = [
      { subject: getSubject(), body: getBody(), date: new Date().toISOString() },
      ...savedEmails.slice(0, 9),
    ];
    setSavedEmails(newSaved);
    toast.success("Email saved!");
  };

  const reset = () => {
    setData(defaultData);
    toast.success("Form reset");
  };

  if (!user) {
    return (
      <Layout>
        <SEOHead
          title="Cold Email Writer - Generate Outreach Emails | TechTrendi"
          description="Write effective cold emails that get responses. Templates for sales, networking, job inquiries, and more."
          canonicalUrl="https://techtrendi.com/tools/cold-email-writer"
        />
        <div className="container py-12 md:py-20 max-w-2xl">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <Mail className="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Cold Email Writer</h1>
              <p className="text-muted-foreground mb-6">
                Write effective cold emails that get responses. Sign in to get started.
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
        title="Cold Email Writer - Generate Outreach Emails | TechTrendi"
        description="Write effective cold emails that get responses. Templates for sales, networking, job inquiries, and more."
        canonicalUrl="https://techtrendi.com/tools/cold-email-writer"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Free + Account
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Cold Email <span className="text-primary">Writer</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Write compelling cold emails that actually get responses
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Email Purpose */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  What's the purpose?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {purposes.map((purpose) => (
                    <button
                      key={purpose.value}
                      onClick={() => updateData({ purpose: purpose.value })}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-colors",
                        data.purpose === purpose.value
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <p className="font-medium text-sm">{purpose.label}</p>
                      <p className="text-xs text-muted-foreground">{purpose.description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* About You */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4" />
                  About You
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Your Name</Label>
                  <Input
                    value={data.senderName}
                    onChange={(e) => updateData({ senderName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Your Role</Label>
                    <Input
                      value={data.senderRole}
                      onChange={(e) => updateData({ senderRole: e.target.value })}
                      placeholder="Founder, Sales Rep, etc."
                    />
                  </div>
                  <div>
                    <Label>Your Company</Label>
                    <Input
                      value={data.senderCompany}
                      onChange={(e) => updateData({ senderCompany: e.target.value })}
                      placeholder="Acme Inc."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About Recipient */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  About the Recipient
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Their Name</Label>
                  <Input
                    value={data.recipientName}
                    onChange={(e) => updateData({ recipientName: e.target.value })}
                    placeholder="Jane Smith"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Their Role</Label>
                    <Input
                      value={data.recipientRole}
                      onChange={(e) => updateData({ recipientRole: e.target.value })}
                      placeholder="VP of Marketing"
                    />
                  </div>
                  <div>
                    <Label>Their Company</Label>
                    <Input
                      value={data.recipientCompany}
                      onChange={(e) => updateData({ recipientCompany: e.target.value })}
                      placeholder="BigCorp"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Content */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Email Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>
                    Personalized Hook
                    <span className="text-xs text-muted-foreground ml-2">
                      (Something specific about them)
                    </span>
                  </Label>
                  <Textarea
                    value={data.personalizedHook}
                    onChange={(e) => updateData({ personalizedHook: e.target.value })}
                    placeholder="I saw your recent LinkedIn post about AI in marketing..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>
                    Value Proposition
                    <span className="text-xs text-muted-foreground ml-2">
                      (What's in it for them?)
                    </span>
                  </Label>
                  <Textarea
                    value={data.valueProposition}
                    onChange={(e) => updateData({ valueProposition: e.target.value })}
                    placeholder="increase conversion rates by 30% using AI-powered personalization"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>
                    Social Proof (optional)
                    <span className="text-xs text-muted-foreground ml-2">
                      (Results, clients, credentials)
                    </span>
                  </Label>
                  <Textarea
                    value={data.socialProof}
                    onChange={(e) => updateData({ socialProof: e.target.value })}
                    placeholder="We recently helped TechStartup increase their demo bookings by 45%..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>
                    Specific Ask/CTA
                    <span className="text-xs text-muted-foreground ml-2">
                      (What do you want them to do?)
                    </span>
                  </Label>
                  <Input
                    value={data.specificAsk}
                    onChange={(e) => updateData({ specificAsk: e.target.value })}
                    placeholder="Would you have 15 minutes this week for a quick call?"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Style */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Style
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tone</Label>
                    <Select value={data.tone} onValueChange={(v) => updateData({ tone: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tones.map((tone) => (
                          <SelectItem key={tone.value} value={tone.value}>
                            {tone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Length</Label>
                    <Select value={data.length} onValueChange={(v) => updateData({ length: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="very-short">Very Short (3-4 sentences)</SelectItem>
                        <SelectItem value="short">Short (5-7 sentences)</SelectItem>
                        <SelectItem value="medium">Medium (8-10 sentences)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={reset} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Form
            </Button>
          </div>

          {/* Right: Preview */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Email Preview</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={saveEmail}>
                      <Sparkles className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" onClick={copyAll}>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subject Line */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-muted-foreground">Subject Line</Label>
                    <Button variant="ghost" size="sm" onClick={copySubject} className="h-6 px-2">
                      {copiedSubject ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <div className="p-3 bg-muted rounded-lg font-medium">
                    {getSubject()}
                  </div>
                </div>

                {/* Email Body */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-muted-foreground">Email Body</Label>
                    <Button variant="ghost" size="sm" onClick={copyBody} className="h-6 px-2">
                      {copiedBody ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {getBody()}
                    </pre>
                  </div>
                </div>

                {/* Word Count */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{getBody().split(/\s+/).length} words</span>
                  <span>~{Math.ceil(getBody().length / 250)} min read</span>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Cold Email Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Keep subject lines under 50 characters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Personalize the first line - show you did your research</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Focus on their problems, not your features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Have one clear call-to-action</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Follow up 2-3 times (most responses come from follow-ups)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Saved Emails */}
            {savedEmails.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recently Saved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {savedEmails.slice(0, 3).map((email, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
                          toast.success("Email copied!");
                        }}
                        className="w-full p-3 rounded-lg border text-left hover:bg-muted/50 transition-colors"
                      >
                        <p className="font-medium text-sm truncate">{email.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(email.date).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
