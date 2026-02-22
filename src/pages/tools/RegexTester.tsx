import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code, Copy, Check, AlertCircle, CheckCircle, Lightbulb, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MatchResult {
  match: string;
  index: number;
  groups: string[];
}

const commonPatterns = [
  { name: "Email", pattern: "^[\\w.-]+@[\\w.-]+\\.\\w+$", description: "Validates email addresses" },
  { name: "URL", pattern: "https?:\\/\\/[\\w.-]+(?:\\.[\\w.-]+)+[\\w.,@?^=%&:/~+#-]*", description: "Matches HTTP/HTTPS URLs" },
  { name: "Phone (US)", pattern: "\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}", description: "US phone numbers" },
  { name: "Date (YYYY-MM-DD)", pattern: "\\d{4}-\\d{2}-\\d{2}", description: "ISO date format" },
  { name: "Time (HH:MM)", pattern: "([01]?\\d|2[0-3]):[0-5]\\d", description: "24-hour time format" },
  { name: "IPv4 Address", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", description: "IPv4 addresses" },
  { name: "Hex Color", pattern: "#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})", description: "Hex color codes" },
  { name: "Credit Card", pattern: "\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}", description: "Credit card numbers" },
  { name: "ZIP Code (US)", pattern: "\\d{5}(-\\d{4})?", description: "US ZIP codes" },
  { name: "Username", pattern: "^[a-zA-Z0-9_]{3,16}$", description: "Alphanumeric, 3-16 chars" },
  { name: "Password (Strong)", pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$", description: "Min 8 chars, upper, lower, number, special" },
  { name: "Slug", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", description: "URL-friendly slugs" },
];

const cheatSheet = [
  { category: "Character Classes", items: [
    { pattern: ".", description: "Any character except newline" },
    { pattern: "\\d", description: "Digit (0-9)" },
    { pattern: "\\D", description: "Non-digit" },
    { pattern: "\\w", description: "Word character (a-z, A-Z, 0-9, _)" },
    { pattern: "\\W", description: "Non-word character" },
    { pattern: "\\s", description: "Whitespace" },
    { pattern: "\\S", description: "Non-whitespace" },
  ]},
  { category: "Anchors", items: [
    { pattern: "^", description: "Start of string" },
    { pattern: "$", description: "End of string" },
    { pattern: "\\b", description: "Word boundary" },
    { pattern: "\\B", description: "Non-word boundary" },
  ]},
  { category: "Quantifiers", items: [
    { pattern: "*", description: "0 or more" },
    { pattern: "+", description: "1 or more" },
    { pattern: "?", description: "0 or 1" },
    { pattern: "{n}", description: "Exactly n" },
    { pattern: "{n,}", description: "n or more" },
    { pattern: "{n,m}", description: "Between n and m" },
  ]},
  { category: "Groups & Lookaround", items: [
    { pattern: "(abc)", description: "Capturing group" },
    { pattern: "(?:abc)", description: "Non-capturing group" },
    { pattern: "(?=abc)", description: "Positive lookahead" },
    { pattern: "(?!abc)", description: "Negative lookahead" },
    { pattern: "(?<=abc)", description: "Positive lookbehind" },
    { pattern: "(?<!abc)", description: "Negative lookbehind" },
  ]},
];

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [testString, setTestString] = useState("");
  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false });
  const [copied, setCopied] = useState(false);

  const flagString = Object.entries(flags)
    .filter(([, enabled]) => enabled)
    .map(([flag]) => flag)
    .join("");

  const { isValid, error, matches, highlightedText } = useMemo(() => {
    if (!pattern) {
      return { isValid: true, error: null, matches: [], highlightedText: testString };
    }

    try {
      const regex = new RegExp(pattern, flagString);
      const matchResults: MatchResult[] = [];
      let match;

      if (flags.g) {
        while ((match = regex.exec(testString)) !== null) {
          matchResults.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }
      } else {
        match = regex.exec(testString);
        if (match) {
          matchResults.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      }

      // Create highlighted text
      let highlighted = testString;
      if (matchResults.length > 0 && flags.g) {
        highlighted = testString.replace(
          new RegExp(pattern, flagString),
          '<mark class="bg-green-300 dark:bg-green-700 px-0.5 rounded">$&</mark>'
        );
      } else if (matchResults.length > 0) {
        const m = matchResults[0];
        highlighted =
          testString.slice(0, m.index) +
          '<mark class="bg-green-300 dark:bg-green-700 px-0.5 rounded">' +
          m.match +
          "</mark>" +
          testString.slice(m.index + m.match.length);
      }

      return { isValid: true, error: null, matches: matchResults, highlightedText: highlighted };
    } catch (e) {
      return {
        isValid: false,
        error: (e as Error).message,
        matches: [],
        highlightedText: testString,
      };
    }
  }, [pattern, testString, flagString, flags.g]);

  const copyPattern = () => {
    navigator.clipboard.writeText(`/${pattern}/${flagString}`);
    setCopied(true);
    toast.success("Pattern copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const loadPattern = (p: string) => {
    setPattern(p);
    toast.success("Pattern loaded!");
  };

  return (
    <Layout>
      <SEOHead
        title="Regex Tester - Test Regular Expressions Online | TechTrendi"
        description="Test and debug regular expressions in real-time. See matches highlighted, access common patterns, and learn regex with our cheat sheet."
        canonicalUrl="https://techtrendi.com/tools/regex-tester"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Regex <span className="text-primary">Tester</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Test and debug regular expressions in real-time with instant highlighting
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pattern Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Regular Expression
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl text-muted-foreground">/</span>
                  <Input
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder="Enter your regex pattern..."
                    className={cn(
                      "font-mono text-lg",
                      !isValid && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  <span className="text-2xl text-muted-foreground">/</span>
                  <span className="font-mono text-lg text-primary">{flagString}</span>
                  <Button variant="outline" size="sm" onClick={copyPattern}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Flags */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="flag-g"
                      checked={flags.g}
                      onCheckedChange={(checked) => setFlags({ ...flags, g: checked })}
                    />
                    <Label htmlFor="flag-g" className="font-mono">g</Label>
                    <span className="text-xs text-muted-foreground">Global</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="flag-i"
                      checked={flags.i}
                      onCheckedChange={(checked) => setFlags({ ...flags, i: checked })}
                    />
                    <Label htmlFor="flag-i" className="font-mono">i</Label>
                    <span className="text-xs text-muted-foreground">Case insensitive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="flag-m"
                      checked={flags.m}
                      onCheckedChange={(checked) => setFlags({ ...flags, m: checked })}
                    />
                    <Label htmlFor="flag-m" className="font-mono">m</Label>
                    <span className="text-xs text-muted-foreground">Multiline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="flag-s"
                      checked={flags.s}
                      onCheckedChange={(checked) => setFlags({ ...flags, s: checked })}
                    />
                    <Label htmlFor="flag-s" className="font-mono">s</Label>
                    <span className="text-xs text-muted-foreground">Dotall</span>
                  </div>
                </div>

                {/* Error Display */}
                {!isValid && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-mono">{error}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test String */}
            <Card>
              <CardHeader>
                <CardTitle>Test String</CardTitle>
                <CardDescription>Enter text to test your regex against</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={testString}
                  onChange={(e) => setTestString(e.target.value)}
                  placeholder="Enter your test string here..."
                  className="font-mono min-h-[150px]"
                />
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {matches.length > 0 ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                    Results
                  </CardTitle>
                  <Badge variant="outline">
                    {matches.length} match{matches.length !== 1 ? "es" : ""}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Highlighted Text */}
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Highlighted Matches</Label>
                  <div
                    className="p-4 bg-muted/50 rounded-lg font-mono text-sm whitespace-pre-wrap break-all"
                    dangerouslySetInnerHTML={{ __html: highlightedText || "No matches" }}
                  />
                </div>

                {/* Match Details */}
                {matches.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Match Details</Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {matches.map((m, i) => (
                        <div key={i} className="p-3 bg-muted/50 rounded-lg text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">Match {i + 1}</span>
                            <span className="text-xs text-muted-foreground">Index: {m.index}</span>
                          </div>
                          <code className="text-primary">"{m.match}"</code>
                          {m.groups.length > 0 && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              Groups: {m.groups.map((g, j) => (
                                <span key={j} className="mr-2">
                                  ${j + 1}: <code className="text-foreground">"{g}"</code>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Tabs defaultValue="patterns">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="patterns">
                  <Lightbulb className="w-4 h-4 mr-1" />
                  Patterns
                </TabsTrigger>
                <TabsTrigger value="cheatsheet">
                  <BookOpen className="w-4 h-4 mr-1" />
                  Cheat Sheet
                </TabsTrigger>
              </TabsList>

              <TabsContent value="patterns" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Common Patterns</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                    {commonPatterns.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => loadPattern(p.pattern)}
                        className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
                      >
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                        <code className="text-xs text-primary block mt-1 truncate">
                          {p.pattern}
                        </code>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cheatsheet" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Quick Reference</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
                    {cheatSheet.map((section) => (
                      <div key={section.category}>
                        <h4 className="font-semibold text-sm mb-2">{section.category}</h4>
                        <div className="space-y-1">
                          {section.items.map((item) => (
                            <div
                              key={item.pattern}
                              className="flex items-center justify-between text-sm py-1"
                            >
                              <code className="text-primary bg-muted px-1.5 py-0.5 rounded">
                                {item.pattern}
                              </code>
                              <span className="text-xs text-muted-foreground">
                                {item.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}
