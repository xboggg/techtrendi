import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare, Copy, Check, Plus, Trash2, Clock, CheckCircle2,
  AlertTriangle, Calendar, Share2, RefreshCw, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface StandupEntry {
  id: string;
  date: string;
  yesterday: string[];
  today: string[];
  blockers: string[];
}

const STORAGE_KEY = "techtrendi_standup_data";

export default function DailyStandup() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<StandupEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<StandupEntry>({
    id: "",
    date: new Date().toISOString().split("T")[0],
    yesterday: [""],
    today: [""],
    blockers: [],
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setEntries(parsed.entries || []);

        // Check if there's an entry for today
        const today = new Date().toISOString().split("T")[0];
        const todayEntry = parsed.entries?.find((e: StandupEntry) => e.date === today);
        if (todayEntry) {
          setCurrentEntry(todayEntry);
        } else {
          // Pre-fill with yesterday's "today" items
          const yesterdayEntry = parsed.entries?.[0];
          if (yesterdayEntry && yesterdayEntry.date !== today) {
            setCurrentEntry({
              id: Date.now().toString(),
              date: today,
              yesterday: yesterdayEntry.today.length > 0 ? yesterdayEntry.today : [""],
              today: [""],
              blockers: [],
            });
          }
        }
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && entries.length > 0) {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify({ entries }));
    }
  }, [entries, user]);

  const addItem = (field: "yesterday" | "today" | "blockers") => {
    setCurrentEntry((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeItem = (field: "yesterday" | "today" | "blockers", index: number) => {
    setCurrentEntry((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const updateItem = (field: "yesterday" | "today" | "blockers", index: number, value: string) => {
    setCurrentEntry((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const saveEntry = () => {
    const filteredEntry = {
      ...currentEntry,
      id: currentEntry.id || Date.now().toString(),
      yesterday: currentEntry.yesterday.filter((item) => item.trim()),
      today: currentEntry.today.filter((item) => item.trim()),
      blockers: currentEntry.blockers.filter((item) => item.trim()),
    };

    if (filteredEntry.yesterday.length === 0 && filteredEntry.today.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    const existingIndex = entries.findIndex((e) => e.date === currentEntry.date);
    if (existingIndex >= 0) {
      setEntries((prev) => prev.map((e, i) => (i === existingIndex ? filteredEntry : e)));
    } else {
      setEntries((prev) => [filteredEntry, ...prev]);
    }

    toast.success("Standup saved!");
  };

  const generateText = () => {
    const yesterday = currentEntry.yesterday.filter((item) => item.trim());
    const today = currentEntry.today.filter((item) => item.trim());
    const blockers = currentEntry.blockers.filter((item) => item.trim());

    let text = `📅 Daily Standup - ${new Date(currentEntry.date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })}\n\n`;

    if (yesterday.length > 0) {
      text += `✅ Yesterday:\n${yesterday.map((item) => `• ${item}`).join("\n")}\n\n`;
    }

    if (today.length > 0) {
      text += `🎯 Today:\n${today.map((item) => `• ${item}`).join("\n")}\n\n`;
    }

    if (blockers.length > 0) {
      text += `🚧 Blockers:\n${blockers.map((item) => `• ${item}`).join("\n")}\n\n`;
    } else {
      text += "🚧 Blockers: None\n";
    }

    return text.trim();
  };

  const copyStandup = () => {
    navigator.clipboard.writeText(generateText());
    setCopied(true);
    toast.success("Standup copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setCurrentEntry({
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      yesterday: [""],
      today: [""],
      blockers: [],
    });
  };

  if (!user) {
    return (
      <Layout>
        <SEOHead
          title="Daily Standup Generator - Team Standup Notes | TechTrendi"
          description="Generate formatted daily standup notes for your team. Track what you did, what you're doing, and any blockers."
          canonicalUrl="https://techtrendi.com/tools/daily-standup"
        />
        <div className="container py-12 md:py-20 max-w-2xl">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <MessageSquare className="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Daily Standup Generator</h1>
              <p className="text-muted-foreground mb-6">
                Generate formatted standup notes for your team. Sign in to save your standups.
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
        title="Daily Standup Generator - Team Standup Notes | TechTrendi"
        description="Generate formatted daily standup notes for your team. Track what you did, what you're doing, and any blockers."
        canonicalUrl="https://techtrendi.com/tools/daily-standup"
      />

      <div className="container py-12 md:py-20 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Free + Account
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Daily <span className="text-primary">Standup</span> Generator
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Generate formatted standup notes in seconds. Perfect for Slack, Teams, or email.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Date */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <Input
                    type="date"
                    value={currentEntry.date}
                    onChange={(e) => setCurrentEntry((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Yesterday */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  What I did yesterday
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentEntry.yesterday.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateItem("yesterday", index, e.target.value)}
                      placeholder="Completed task..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addItem("yesterday");
                        }
                      }}
                    />
                    {currentEntry.yesterday.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem("yesterday", index)}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addItem("yesterday")}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </CardContent>
            </Card>

            {/* Today */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  What I'm doing today
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentEntry.today.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateItem("today", index, e.target.value)}
                      placeholder="Working on..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addItem("today");
                        }
                      }}
                    />
                    {currentEntry.today.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem("today", index)}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addItem("today")}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </CardContent>
            </Card>

            {/* Blockers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  Blockers (optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentEntry.blockers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No blockers? Great!</p>
                ) : (
                  currentEntry.blockers.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => updateItem("blockers", index, e.target.value)}
                        placeholder="Blocked by..."
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem("blockers", index)}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
                <Button variant="outline" size="sm" onClick={() => addItem("blockers")}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Blocker
                </Button>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={saveEntry} className="flex-1">
                Save Standup
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Preview</CardTitle>
                  <Button size="sm" onClick={copyStandup}>
                    {copied ? (
                      <Check className="w-4 h-4 mr-1 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap font-sans text-sm bg-muted p-4 rounded-lg">
                  {generateText()}
                </pre>
              </CardContent>
            </Card>

            {/* History */}
            {entries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Standups</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {entries.slice(0, 5).map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => setCurrentEntry(entry)}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left hover:bg-muted/50 transition-colors",
                          entry.date === currentEntry.date && "border-primary bg-primary/5"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {new Date(entry.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {entry.today.length} tasks
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tips */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Standup Tips
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Keep items brief and actionable</li>
                  <li>• Focus on outcomes, not activities</li>
                  <li>• Flag blockers early for quick resolution</li>
                  <li>• Yesterday's "Today" auto-fills tomorrow</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
