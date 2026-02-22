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
  FileText, Download, Copy, Check, Briefcase, User, Building2, Target,
  Sparkles, RefreshCw, Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface CoverLetterData {
  // Personal Info
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;

  // Job Info
  companyName: string;
  hiringManagerName: string;
  jobTitle: string;
  jobSource: string;

  // Experience
  currentRole: string;
  yearsExperience: string;
  keySkills: string;
  relevantExperience: string;
  achievements: string;

  // Style
  tone: string;
  enthusiasm: string;
}

const defaultData: CoverLetterData = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedIn: "",
  companyName: "",
  hiringManagerName: "",
  jobTitle: "",
  jobSource: "",
  currentRole: "",
  yearsExperience: "",
  keySkills: "",
  relevantExperience: "",
  achievements: "",
  tone: "professional",
  enthusiasm: "high",
};

const tones = [
  { value: "professional", label: "Professional", description: "Formal and business-appropriate" },
  { value: "conversational", label: "Conversational", description: "Friendly yet professional" },
  { value: "confident", label: "Confident", description: "Bold and self-assured" },
  { value: "enthusiastic", label: "Enthusiastic", description: "Energetic and passionate" },
];

const STORAGE_KEY = "techtrendi_coverletter_data";

export default function CoverLetterGenerator() {
  const { user } = useAuth();
  const [data, setData] = useState<CoverLetterData>(defaultData);
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

  const updateData = (updates: Partial<CoverLetterData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const getGreeting = () => {
    if (data.hiringManagerName) {
      return `Dear ${data.hiringManagerName},`;
    }
    return "Dear Hiring Manager,";
  };

  const getOpeningParagraph = () => {
    const enthusiasm = data.enthusiasm === "high"
      ? "I am thrilled"
      : data.enthusiasm === "medium"
      ? "I am excited"
      : "I am writing";

    let source = "";
    if (data.jobSource) {
      source = ` after seeing the listing on ${data.jobSource}`;
    }

    return `${enthusiasm} to apply for the ${data.jobTitle || "[Position]"} position at ${data.companyName || "[Company Name]"}${source}. With ${data.yearsExperience || "[X]"} years of experience as a ${data.currentRole || "[Your Current Role]"}, I am confident that my background and skills make me an excellent candidate for this role.`;
  };

  const getSkillsParagraph = () => {
    const skills = data.keySkills
      ? data.keySkills.split(",").map((s) => s.trim()).filter(Boolean)
      : ["[Skill 1]", "[Skill 2]", "[Skill 3]"];

    const skillsList = skills.length > 2
      ? `${skills.slice(0, -1).join(", ")}, and ${skills[skills.length - 1]}`
      : skills.join(" and ");

    return `Throughout my career, I have developed strong expertise in ${skillsList}. ${data.relevantExperience || "I have consistently demonstrated my ability to deliver results and contribute to team success."}`;
  };

  const getAchievementsParagraph = () => {
    if (data.achievements) {
      return `Some of my key achievements include: ${data.achievements}`;
    }
    return "In my previous roles, I have consistently exceeded expectations and delivered measurable results that contributed to organizational success.";
  };

  const getClosingParagraph = () => {
    const enthusiasm = data.enthusiasm === "high"
      ? "I am genuinely excited about"
      : data.enthusiasm === "medium"
      ? "I am very interested in"
      : "I would welcome";

    return `${enthusiasm} the opportunity to bring my skills and experience to ${data.companyName || "[Company Name]"}. I would love the chance to discuss how I can contribute to your team's continued success. Thank you for considering my application.`;
  };

  const generateCoverLetter = () => {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let letter = `${data.fullName || "[Your Name]"}
${data.location || "[Your Location]"}
${data.email || "[Your Email]"}
${data.phone || "[Your Phone]"}
${data.linkedIn ? `LinkedIn: ${data.linkedIn}` : ""}

${today}

${data.hiringManagerName ? `${data.hiringManagerName}\n` : ""}${data.companyName || "[Company Name]"}

${getGreeting()}

${getOpeningParagraph()}

${getSkillsParagraph()}

${getAchievementsParagraph()}

${getClosingParagraph()}

Sincerely,
${data.fullName || "[Your Name]"}`;

    return letter.replace(/\n\n\n+/g, "\n\n").trim();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateCoverLetter());
    setCopied(true);
    toast.success("Cover letter copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadLetter = () => {
    const content = generateCoverLetter();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${data.companyName?.replace(/\s+/g, "-").toLowerCase() || "generic"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Cover letter downloaded!");
  };

  const reset = () => {
    setData(defaultData);
    toast.success("Form reset");
  };

  if (!user) {
    return (
      <Layout>
        <SEOHead
          title="Cover Letter Generator - Create Professional Cover Letters | TechTrendi"
          description="Generate professional cover letters instantly. Customize tone, highlight skills, and stand out from other applicants."
          canonicalUrl="https://techtrendi.com/tools/cover-letter-generator"
        />
        <div className="container py-12 md:py-20 max-w-2xl">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <FileText className="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Cover Letter Generator</h1>
              <p className="text-muted-foreground mb-6">
                Create professional cover letters that help you stand out. Sign in to get started.
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
        title="Cover Letter Generator - Create Professional Cover Letters | TechTrendi"
        description="Generate professional cover letters instantly. Customize tone, highlight skills, and stand out from other applicants."
        canonicalUrl="https://techtrendi.com/tools/cover-letter-generator"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Free + Account
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Cover Letter <span className="text-primary">Generator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Create professional, tailored cover letters that help you land interviews
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={data.fullName}
                      onChange={(e) => updateData({ fullName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={data.location}
                      onChange={(e) => updateData({ location: e.target.value })}
                      placeholder="New York, NY"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={data.email}
                      onChange={(e) => updateData({ email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={data.phone}
                      onChange={(e) => updateData({ phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div>
                  <Label>LinkedIn URL (optional)</Label>
                  <Input
                    value={data.linkedIn}
                    onChange={(e) => updateData({ linkedIn: e.target.value })}
                    placeholder="linkedin.com/in/johndoe"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Job Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Job Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Company Name</Label>
                    <Input
                      value={data.companyName}
                      onChange={(e) => updateData({ companyName: e.target.value })}
                      placeholder="Acme Inc."
                    />
                  </div>
                  <div>
                    <Label>Job Title</Label>
                    <Input
                      value={data.jobTitle}
                      onChange={(e) => updateData({ jobTitle: e.target.value })}
                      placeholder="Software Engineer"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Hiring Manager Name (optional)</Label>
                    <Input
                      value={data.hiringManagerName}
                      onChange={(e) => updateData({ hiringManagerName: e.target.value })}
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <Label>Where You Found the Job</Label>
                    <Input
                      value={data.jobSource}
                      onChange={(e) => updateData({ jobSource: e.target.value })}
                      placeholder="LinkedIn, Indeed, etc."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Your Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Current/Most Recent Role</Label>
                    <Input
                      value={data.currentRole}
                      onChange={(e) => updateData({ currentRole: e.target.value })}
                      placeholder="Senior Developer"
                    />
                  </div>
                  <div>
                    <Label>Years of Experience</Label>
                    <Input
                      value={data.yearsExperience}
                      onChange={(e) => updateData({ yearsExperience: e.target.value })}
                      placeholder="5"
                    />
                  </div>
                </div>
                <div>
                  <Label>Key Skills (comma separated)</Label>
                  <Input
                    value={data.keySkills}
                    onChange={(e) => updateData({ keySkills: e.target.value })}
                    placeholder="React, TypeScript, Node.js, AWS"
                  />
                </div>
                <div>
                  <Label>Relevant Experience</Label>
                  <Textarea
                    value={data.relevantExperience}
                    onChange={(e) => updateData({ relevantExperience: e.target.value })}
                    placeholder="Describe your most relevant experience for this role..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Key Achievements</Label>
                  <Textarea
                    value={data.achievements}
                    onChange={(e) => updateData({ achievements: e.target.value })}
                    placeholder="Increased team productivity by 30%, Led a team of 5 developers..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tone & Style */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Tone & Style
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Writing Tone</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {tones.map((tone) => (
                      <button
                        key={tone.value}
                        onClick={() => updateData({ tone: tone.value })}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-colors",
                          data.tone === tone.value
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <p className="font-medium text-sm">{tone.label}</p>
                        <p className="text-xs text-muted-foreground">{tone.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Enthusiasm Level</Label>
                  <Select value={data.enthusiasm} onValueChange={(v) => updateData({ enthusiasm: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High - Very excited and passionate</SelectItem>
                      <SelectItem value="medium">Medium - Professional interest</SelectItem>
                      <SelectItem value="low">Low - Reserved and measured</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <CardTitle className="text-base">Cover Letter Preview</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      {copied ? (
                        <Check className="w-4 h-4 mr-1 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      Copy
                    </Button>
                    <Button size="sm" onClick={downloadLetter}>
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border shadow-sm">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {generateCoverLetter()}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Tips for a Great Cover Letter</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Customize for each job - mention specific company details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Quantify achievements with numbers when possible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Keep it concise - one page maximum</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Address the hiring manager by name if possible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Proofread carefully before sending</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
