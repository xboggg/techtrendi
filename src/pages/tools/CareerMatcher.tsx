import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Briefcase, Code, Palette, Users, DollarSign, Heart, Brain,
  TrendingUp, Share2, Target, Sparkles, Lightbulb, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Career {
  id: string;
  title: string;
  category: string;
  skills: string[];
  interests: string[];
  workStyle: string[];
  avgSalary: string;
  growth: "high" | "medium" | "low";
  description: string;
}

const careers: Career[] = [
  { id: "swe", title: "Software Engineer", category: "Tech", skills: ["logical", "analytical", "problem-solving"], interests: ["technology", "building"], workStyle: ["remote-friendly", "independent"], avgSalary: "$120,000", growth: "high", description: "Build software applications and systems" },
  { id: "data-scientist", title: "Data Scientist", category: "Tech", skills: ["analytical", "mathematical", "problem-solving"], interests: ["data", "research"], workStyle: ["remote-friendly", "collaborative"], avgSalary: "$130,000", growth: "high", description: "Analyze data to extract insights and build ML models" },
  { id: "product-manager", title: "Product Manager", category: "Business", skills: ["leadership", "communication", "analytical"], interests: ["technology", "strategy"], workStyle: ["collaborative", "fast-paced"], avgSalary: "$140,000", growth: "high", description: "Lead product development and strategy" },
  { id: "ux-designer", title: "UX Designer", category: "Design", skills: ["creative", "empathy", "communication"], interests: ["design", "psychology"], workStyle: ["collaborative", "creative"], avgSalary: "$95,000", growth: "high", description: "Design user-centered digital experiences" },
  { id: "marketing-manager", title: "Marketing Manager", category: "Marketing", skills: ["creative", "communication", "analytical"], interests: ["marketing", "strategy"], workStyle: ["fast-paced", "collaborative"], avgSalary: "$100,000", growth: "medium", description: "Plan and execute marketing campaigns" },
  { id: "content-creator", title: "Content Creator", category: "Creative", skills: ["creative", "communication", "self-motivated"], interests: ["content", "social-media"], workStyle: ["independent", "flexible"], avgSalary: "$60,000", growth: "high", description: "Create engaging content for various platforms" },
  { id: "financial-analyst", title: "Financial Analyst", category: "Finance", skills: ["analytical", "mathematical", "detail-oriented"], interests: ["finance", "business"], workStyle: ["structured", "independent"], avgSalary: "$85,000", growth: "medium", description: "Analyze financial data and provide recommendations" },
  { id: "hr-manager", title: "HR Manager", category: "HR", skills: ["communication", "empathy", "leadership"], interests: ["people", "culture"], workStyle: ["collaborative", "people-focused"], avgSalary: "$90,000", growth: "medium", description: "Manage human resources and company culture" },
  { id: "consultant", title: "Management Consultant", category: "Consulting", skills: ["analytical", "communication", "problem-solving"], interests: ["strategy", "business"], workStyle: ["fast-paced", "travel"], avgSalary: "$150,000", growth: "medium", description: "Advise organizations on business strategy" },
  { id: "entrepreneur", title: "Entrepreneur", category: "Business", skills: ["leadership", "creative", "self-motivated"], interests: ["building", "business"], workStyle: ["flexible", "independent"], avgSalary: "Variable", growth: "high", description: "Start and run your own business" },
  { id: "teacher", title: "Teacher/Educator", category: "Education", skills: ["communication", "empathy", "patience"], interests: ["teaching", "helping"], workStyle: ["structured", "people-focused"], avgSalary: "$60,000", growth: "low", description: "Educate and inspire students" },
  { id: "healthcare", title: "Healthcare Professional", category: "Healthcare", skills: ["empathy", "detail-oriented", "problem-solving"], interests: ["helping", "science"], workStyle: ["structured", "people-focused"], avgSalary: "$80,000", growth: "high", description: "Provide healthcare services and support" },
];

const skillOptions = [
  { id: "creative", label: "Creative thinking" },
  { id: "analytical", label: "Analytical skills" },
  { id: "communication", label: "Communication" },
  { id: "leadership", label: "Leadership" },
  { id: "problem-solving", label: "Problem solving" },
  { id: "empathy", label: "Empathy" },
  { id: "mathematical", label: "Mathematical" },
  { id: "self-motivated", label: "Self-motivated" },
  { id: "detail-oriented", label: "Detail oriented" },
  { id: "logical", label: "Logical thinking" },
];

const interestOptions = [
  { id: "technology", label: "Technology" },
  { id: "design", label: "Design & Art" },
  { id: "business", label: "Business" },
  { id: "helping", label: "Helping others" },
  { id: "data", label: "Data & Analytics" },
  { id: "marketing", label: "Marketing" },
  { id: "finance", label: "Finance" },
  { id: "building", label: "Building things" },
  { id: "content", label: "Creating content" },
  { id: "teaching", label: "Teaching" },
];

const workStyleOptions = [
  { id: "remote-friendly", label: "Remote work" },
  { id: "collaborative", label: "Team collaboration" },
  { id: "independent", label: "Independent work" },
  { id: "fast-paced", label: "Fast-paced environment" },
  { id: "flexible", label: "Flexible schedule" },
  { id: "structured", label: "Structured routine" },
];

export default function CareerMatcher() {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedWorkStyle, setSelectedWorkStyle] = useState<string[]>([]);
  const [salaryImportance, setSalaryImportance] = useState(5);
  const [matched, setMatched] = useState(false);

  const toggleItem = (id: string, list: string[], setter: (v: string[]) => void) => {
    if (list.includes(id)) {
      setter(list.filter((i) => i !== id));
    } else {
      setter([...list, id]);
    }
  };

  const matches = useMemo(() => {
    if (!matched) return [];

    return careers
      .map((career) => {
        let score = 0;

        // Skills match (40%)
        const skillMatches = career.skills.filter((s) => selectedSkills.includes(s)).length;
        score += (skillMatches / Math.max(selectedSkills.length, 1)) * 40;

        // Interests match (35%)
        const interestMatches = career.interests.filter((i) => selectedInterests.includes(i)).length;
        score += (interestMatches / Math.max(selectedInterests.length, 1)) * 35;

        // Work style match (25%)
        const styleMatches = career.workStyle.filter((w) => selectedWorkStyle.includes(w)).length;
        score += (styleMatches / Math.max(selectedWorkStyle.length, 1)) * 25;

        // Salary bonus
        if (salaryImportance >= 7 && career.avgSalary.includes("$1")) score += 5;

        return { career, score: Math.round(score) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [matched, selectedSkills, selectedInterests, selectedWorkStyle, salaryImportance]);

  const findMatches = () => {
    if (selectedSkills.length === 0) {
      toast.error("Please select at least one skill");
      return;
    }
    if (selectedInterests.length === 0) {
      toast.error("Please select at least one interest");
      return;
    }
    setMatched(true);
    toast.success("Careers matched!");
  };

  const reset = () => {
    setMatched(false);
    setSelectedSkills([]);
    setSelectedInterests([]);
    setSelectedWorkStyle([]);
    setSalaryImportance(5);
  };

  const shareResults = async () => {
    const top3 = matches.slice(0, 3);
    const text = `My Top Career Matches:
${top3.map((m, i) => `${i + 1}. ${m.career.title} (${m.score}% match)`).join("\n")}

Find your career match: techtrendi.com/tools/career-matcher`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  const growthBadge = (growth: string) => {
    if (growth === "high") return <Badge className="bg-green-100 text-green-700">High Growth</Badge>;
    if (growth === "medium") return <Badge className="bg-yellow-100 text-yellow-700">Moderate Growth</Badge>;
    return <Badge className="bg-gray-100 text-gray-700">Stable</Badge>;
  };

  return (
    <Layout>
      <SEOHead
        title="Career Matcher - Find Your Perfect Career | TechTrendi"
        description="Discover careers that match your skills, interests, and work style. Get personalized career recommendations."
        canonicalUrl="https://techtrendi.com/tools/career-matcher"
      />

      <div className="container py-12 md:py-20 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Career <span className="text-primary">Matcher</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find careers that align with your skills, interests, and preferred work style
          </p>
        </div>

        {!matched ? (
          <div className="space-y-6">
            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Your Top Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {skillOptions.map((skill) => (
                    <div key={skill.id} className="flex items-center gap-2">
                      <Checkbox
                        id={skill.id}
                        checked={selectedSkills.includes(skill.id)}
                        onCheckedChange={() => toggleItem(skill.id, selectedSkills, setSelectedSkills)}
                      />
                      <label htmlFor={skill.id} className="text-sm cursor-pointer">
                        {skill.label}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Interests */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Your Interests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {interestOptions.map((interest) => (
                    <div key={interest.id} className="flex items-center gap-2">
                      <Checkbox
                        id={interest.id}
                        checked={selectedInterests.includes(interest.id)}
                        onCheckedChange={() => toggleItem(interest.id, selectedInterests, setSelectedInterests)}
                      />
                      <label htmlFor={interest.id} className="text-sm cursor-pointer">
                        {interest.label}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Work Style */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Preferred Work Style
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {workStyleOptions.map((style) => (
                    <div key={style.id} className="flex items-center gap-2">
                      <Checkbox
                        id={style.id}
                        checked={selectedWorkStyle.includes(style.id)}
                        onCheckedChange={() => toggleItem(style.id, selectedWorkStyle, setSelectedWorkStyle)}
                      />
                      <label htmlFor={style.id} className="text-sm cursor-pointer">
                        {style.label}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Salary Importance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Salary Importance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Not important</span>
                    <span className="text-sm text-muted-foreground">Very important</span>
                  </div>
                  <Slider
                    value={[salaryImportance]}
                    onValueChange={([v]) => setSalaryImportance(v)}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={findMatches} size="lg" className="w-full">
              <Sparkles className="w-5 h-5 mr-2" />
              Find My Matches
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="text-center">
              <Target className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Your Top Career Matches</h2>
              <p className="text-muted-foreground">Based on your skills, interests, and preferences</p>
            </div>

            {/* Career Cards */}
            <div className="space-y-4">
              {matches.map((match, index) => (
                <Card
                  key={match.career.id}
                  className={cn(
                    "transition-all",
                    index === 0 && "border-primary/50 bg-primary/5"
                  )}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold",
                        index === 0 ? "bg-primary" : "bg-muted-foreground/50"
                      )}>
                        {match.score}%
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold">{match.career.title}</h3>
                            <p className="text-sm text-muted-foreground">{match.career.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-500">{match.career.avgSalary}</p>
                            <p className="text-xs text-muted-foreground">avg salary</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{match.career.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {growthBadge(match.career.growth)}
                          {match.career.workStyle.slice(0, 2).map((style) => (
                            <Badge key={style} variant="outline" className="text-xs">
                              {style.replace("-", " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tips */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    Research your top matches on LinkedIn and job boards
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    Connect with professionals in these roles for insights
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    Identify skill gaps and start learning
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    Build projects or get certifications to strengthen your profile
                  </li>
                </ul>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button onClick={reset} variant="outline" className="flex-1">
                Start Over
              </Button>
              <Button onClick={shareResults} className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Share Results
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
