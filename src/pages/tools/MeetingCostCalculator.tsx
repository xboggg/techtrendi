import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calculator, Users, Clock, DollarSign, TrendingUp, Share2, Copy, Check,
  AlertTriangle, Lightbulb, RotateCcw, Plus, Minus, Twitter, Linkedin, Facebook
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Attendee {
  id: string;
  role: string;
  salary: number;
  count: number;
}

const rolePresets = [
  { role: "Junior Employee", salary: 40000 },
  { role: "Mid-Level Employee", salary: 65000 },
  { role: "Senior Employee", salary: 90000 },
  { role: "Team Lead", salary: 110000 },
  { role: "Manager", salary: 130000 },
  { role: "Senior Manager", salary: 160000 },
  { role: "Director", salary: 200000 },
  { role: "VP / Executive", salary: 300000 },
  { role: "C-Suite (CEO, CTO, etc.)", salary: 500000 },
  { role: "Custom", salary: 0 },
];

const funFacts = [
  { threshold: 100, fact: "That's enough for a nice team lunch!" },
  { threshold: 500, fact: "You could hire a freelancer for a day!" },
  { threshold: 1000, fact: "That's a month of premium software subscriptions!" },
  { threshold: 2500, fact: "You could send someone to a conference!" },
  { threshold: 5000, fact: "That's a decent used car!" },
  { threshold: 10000, fact: "You could rent a small office for a month!" },
  { threshold: 25000, fact: "That's a year of someone's student loans!" },
  { threshold: 50000, fact: "You could buy a luxury vacation package!" },
  { threshold: 100000, fact: "That's a down payment on a house!" },
];

export default function MeetingCostCalculator() {
  const [attendees, setAttendees] = useState<Attendee[]>([
    { id: "1", role: "Mid-Level Employee", salary: 65000, count: 3 },
    { id: "2", role: "Manager", salary: 130000, count: 1 },
  ]);
  const [duration, setDuration] = useState(60); // minutes
  const [frequency, setFrequency] = useState<"once" | "weekly" | "daily">("once");
  const [copied, setCopied] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Calculate costs
  const workingHoursPerYear = 2080; // 52 weeks * 40 hours

  const calculateHourlyRate = (annualSalary: number) => {
    // Add 30% for benefits/overhead
    return (annualSalary * 1.3) / workingHoursPerYear;
  };

  const totalAttendees = attendees.reduce((sum, a) => sum + a.count, 0);

  const costPerMinute = attendees.reduce((sum, a) => {
    const hourlyRate = calculateHourlyRate(a.salary);
    return sum + (hourlyRate / 60) * a.count;
  }, 0);

  const meetingCost = costPerMinute * duration;

  const annualCost = (() => {
    switch (frequency) {
      case "daily":
        return meetingCost * 260; // 5 days * 52 weeks
      case "weekly":
        return meetingCost * 52;
      default:
        return meetingCost;
    }
  })();

  const getFunFact = () => {
    const sorted = [...funFacts].sort((a, b) => b.threshold - a.threshold);
    const fact = sorted.find((f) => meetingCost >= f.threshold);
    return fact?.fact || "Every minute counts!";
  };

  const addAttendee = () => {
    setAttendees([
      ...attendees,
      { id: Date.now().toString(), role: "Mid-Level Employee", salary: 65000, count: 1 },
    ]);
  };

  const removeAttendee = (id: string) => {
    if (attendees.length > 1) {
      setAttendees(attendees.filter((a) => a.id !== id));
    }
  };

  const updateAttendee = (id: string, field: keyof Attendee, value: string | number) => {
    setAttendees(
      attendees.map((a) => {
        if (a.id !== id) return a;

        if (field === "role") {
          const preset = rolePresets.find((p) => p.role === value);
          return {
            ...a,
            role: value as string,
            salary: preset?.role !== "Custom" ? preset?.salary || a.salary : a.salary,
          };
        }

        return { ...a, [field]: value };
      })
    );
  };

  const resetCalculator = () => {
    setAttendees([
      { id: "1", role: "Mid-Level Employee", salary: 65000, count: 3 },
      { id: "2", role: "Manager", salary: 130000, count: 1 },
    ]);
    setDuration(60);
    setFrequency("once");
    setShowResults(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyDetailed = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const shareText = `I just calculated my meeting cost: ${formatCurrency(meetingCost)} for a ${duration}-minute meeting with ${totalAttendees} people! 😱\n\nCalculate yours at techtrendi.com/tools/meeting-cost-calculator`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      "_blank"
    );
  };

  const shareToLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://techtrendi.com/tools/meeting-cost-calculator")}`,
      "_blank"
    );
  };

  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://techtrendi.com/tools/meeting-cost-calculator")}`,
      "_blank"
    );
  };

  return (
    <Layout>
      <SEOHead
        title="Meeting Cost Calculator - See the Real Cost of Meetings | TechTrendi"
        description="Calculate the true cost of your meetings based on attendee salaries. Eye-opening results that will make you rethink your meeting culture."
        canonicalUrl="https://techtrendi.com/tools/meeting-cost-calculator"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 bg-green-500/10 text-green-600 border-green-500/20">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Meeting Cost <span className="text-primary">Calculator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See the real cost of your meetings based on attendee salaries. The results might shock you!
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-3 space-y-6">
            {/* Attendees */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Meeting Attendees
                </CardTitle>
                <CardDescription>Add the roles and salaries of people attending</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {attendees.map((attendee, index) => (
                  <div
                    key={attendee.id}
                    className="flex flex-wrap gap-3 items-end p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex-1 min-w-[180px]">
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Role</Label>
                      <Select
                        value={attendee.role}
                        onValueChange={(value) => updateAttendee(attendee.id, "role", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {rolePresets.map((preset) => (
                            <SelectItem key={preset.role} value={preset.role}>
                              {preset.role}
                              {preset.role !== "Custom" && (
                                <span className="text-muted-foreground ml-2">
                                  ({formatCurrency(preset.salary)}/yr)
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-32">
                      <Label className="text-xs text-muted-foreground mb-1.5 block">
                        Annual Salary
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={attendee.salary}
                          onChange={(e) =>
                            updateAttendee(attendee.id, "salary", parseInt(e.target.value) || 0)
                          }
                          className="pl-8"
                        />
                      </div>
                    </div>

                    <div className="w-24">
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Count</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() =>
                            updateAttendee(
                              attendee.id,
                              "count",
                              Math.max(1, attendee.count - 1)
                            )
                          }
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={attendee.count}
                          onChange={(e) =>
                            updateAttendee(
                              attendee.id,
                              "count",
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                          className="w-12 text-center px-1"
                          min={1}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() =>
                            updateAttendee(attendee.id, "count", attendee.count + 1)
                          }
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {attendees.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeAttendee(attendee.id)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button variant="outline" className="w-full" onClick={addAttendee}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Role
                </Button>
              </CardContent>
            </Card>

            {/* Duration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Meeting Duration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-3">
                    <Label>Duration</Label>
                    <span className="text-2xl font-bold text-primary">
                      {duration < 60
                        ? `${duration} min`
                        : `${Math.floor(duration / 60)}h ${duration % 60 > 0 ? `${duration % 60}m` : ""}`}
                    </span>
                  </div>
                  <Slider
                    value={[duration]}
                    onValueChange={(value) => setDuration(value[0])}
                    min={15}
                    max={480}
                    step={15}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>15 min</span>
                    <span>8 hours</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {[15, 30, 45, 60, 90, 120].map((mins) => (
                    <Button
                      key={mins}
                      variant={duration === mins ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDuration(mins)}
                    >
                      {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Frequency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Meeting Frequency
                </CardTitle>
                <CardDescription>How often does this meeting happen?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={frequency === "once" ? "default" : "outline"}
                    onClick={() => setFrequency("once")}
                  >
                    One-time
                  </Button>
                  <Button
                    variant={frequency === "weekly" ? "default" : "outline"}
                    onClick={() => setFrequency("weekly")}
                  >
                    Weekly
                  </Button>
                  <Button
                    variant={frequency === "daily" ? "default" : "outline"}
                    onClick={() => setFrequency("daily")}
                  >
                    Daily
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Calculate Button */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 h-14 text-lg"
                onClick={() => setShowResults(true)}
              >
                <Calculator className="w-5 h-5 mr-2" />
                Calculate Meeting Cost
              </Button>
              <Button variant="outline" size="lg" className="h-14" onClick={resetCalculator}>
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card
              className={cn(
                "border-2 transition-all duration-500 overflow-hidden",
                showResults ? "border-primary shadow-elevated" : "border-border"
              )}
            >
              <CardHeader className="bg-gradient-to-br from-primary/10 to-secondary/10">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Meeting Cost
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Main Cost Display */}
                <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary to-secondary">
                  <p className="text-white/80 text-sm mb-1">This meeting costs</p>
                  <p className="text-4xl md:text-5xl font-bold text-white">
                    {formatCurrency(meetingCost)}
                  </p>
                  <p className="text-white/70 text-sm mt-2">
                    {formatCurrencyDetailed(costPerMinute)} per minute
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold text-foreground">{totalAttendees}</p>
                    <p className="text-xs text-muted-foreground">Attendees</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {duration < 60 ? `${duration}m` : `${Math.floor(duration / 60)}h${duration % 60 > 0 ? ` ${duration % 60}m` : ""}`}
                    </p>
                    <p className="text-xs text-muted-foreground">Duration</p>
                  </div>
                </div>

                {/* Annual Cost */}
                {frequency !== "once" && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <span className="font-medium text-destructive">Annual Impact</span>
                    </div>
                    <p className="text-3xl font-bold text-destructive">
                      {formatCurrency(annualCost)}
                    </p>
                    <p className="text-sm text-destructive/80">
                      {frequency === "weekly" ? "52 meetings per year" : "260 meetings per year"}
                    </p>
                  </div>
                )}

                {/* Fun Fact */}
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-700 dark:text-amber-400">Fun Fact</p>
                      <p className="text-sm text-amber-600 dark:text-amber-300">{getFunFact()}</p>
                    </div>
                  </div>
                </div>

                {/* Share */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-center">Share your results</p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="icon" onClick={shareToTwitter}>
                      <Twitter className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={shareToLinkedIn}>
                      <Linkedin className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={shareToFacebook}>
                      <Facebook className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={copyToClipboard}>
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Meeting Efficiency Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Only invite people who truly need to be there
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Set a clear agenda before the meeting
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Start and end on time
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Consider async alternatives (Slack, email, Loom)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Use 25 or 50 minute meetings instead of 30/60
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section for SEO */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">How is the meeting cost calculated?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                We calculate the hourly rate for each attendee based on their annual salary, add 30%
                for benefits and overhead, then multiply by the meeting duration. This gives you
                the true cost to your organization.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Why add 30% for overhead?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Employee costs include more than just salary. Benefits, taxes, equipment, office
                space, and other overhead typically add 25-40% to the base salary cost.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">How many hours are used for calculations?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                We use 2,080 working hours per year (40 hours × 52 weeks). This is the standard
                for calculating hourly rates from annual salaries.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Are meetings always a waste of money?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                No! Effective meetings create value. This tool helps you be intentional about
                meeting time and ensure the outcomes justify the cost.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
