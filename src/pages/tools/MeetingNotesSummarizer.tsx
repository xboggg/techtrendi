import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText, Sparkles, Copy, Check, RefreshCw, Wand2, Users,
  Target, Clock, CheckCircle2, AlertTriangle, MessageSquare, Share2
} from "lucide-react";
import { toast } from "sonner";

const meetingTypes = [
  { id: "standup", label: "Daily Standup" },
  { id: "brainstorm", label: "Brainstorming Session" },
  { id: "planning", label: "Sprint/Project Planning" },
  { id: "review", label: "Review/Retrospective" },
  { id: "oneonone", label: "1:1 Meeting" },
  { id: "client", label: "Client Meeting" },
  { id: "general", label: "General Meeting" },
];

interface Summary {
  title: string;
  date: string;
  attendees: string[];
  keyPoints: string[];
  decisions: string[];
  actionItems: { task: string; owner: string; dueDate: string }[];
  nextSteps: string[];
}

export default function MeetingNotesSummarizer() {
  const [rawNotes, setRawNotes] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingType, setMeetingType] = useState("general");
  const [attendees, setAttendees] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const extractKeyInfo = (notes: string): Summary => {
    const lines = notes.split("\n").filter((line) => line.trim());
    const attendeeList = attendees.split(",").map((a) => a.trim()).filter((a) => a);

    // Extract potential action items (lines with task-like language)
    const actionPatterns = /(?:action|todo|task|follow.?up|assigned|will|should|need to|must)[:.]?\s*(.+)/i;
    const decisionPatterns = /(?:decided|agreed|confirmed|approved|will go with|chose)[:.]?\s*(.+)/i;

    const keyPoints: string[] = [];
    const decisions: string[] = [];
    const actionItems: { task: string; owner: string; dueDate: string }[] = [];

    lines.forEach((line) => {
      const cleanLine = line.replace(/^[-*•]\s*/, "").trim();

      if (actionPatterns.test(cleanLine)) {
        // Try to extract owner (name in parentheses or after @)
        const ownerMatch = cleanLine.match(/\(([^)]+)\)|@(\w+)/);
        const owner = ownerMatch ? (ownerMatch[1] || ownerMatch[2]) : "TBD";

        // Try to extract date
        const dateMatch = cleanLine.match(/(?:by|due|before)\s*(\d{1,2}\/\d{1,2}|\w+ \d{1,2})/i);
        const dueDate = dateMatch ? dateMatch[1] : "TBD";

        const task = cleanLine
          .replace(actionPatterns, "$1")
          .replace(/\([^)]+\)|@\w+/g, "")
          .replace(/(?:by|due|before)\s*\d{1,2}\/\d{1,2}|\w+ \d{1,2}/gi, "")
          .trim();

        if (task.length > 5) {
          actionItems.push({ task, owner, dueDate });
        }
      } else if (decisionPatterns.test(cleanLine)) {
        decisions.push(cleanLine.replace(decisionPatterns, "$1").trim());
      } else if (cleanLine.length > 10 && !cleanLine.toLowerCase().startsWith("meeting")) {
        keyPoints.push(cleanLine);
      }
    });

    // If no structured extraction, split notes into key points
    if (keyPoints.length === 0 && actionItems.length === 0) {
      const sentences = notes.match(/[^.!?]+[.!?]+/g) || [];
      sentences.slice(0, 5).forEach((sentence) => {
        const clean = sentence.trim();
        if (clean.length > 15) {
          keyPoints.push(clean);
        }
      });
    }

    // Generate next steps based on meeting type
    const nextSteps: string[] = [];
    if (meetingType === "standup") {
      nextSteps.push("Continue with assigned tasks");
      nextSteps.push("Address any blockers mentioned");
    } else if (meetingType === "planning") {
      nextSteps.push("Finalize task assignments");
      nextSteps.push("Update project board");
      nextSteps.push("Schedule follow-up check-in");
    } else if (meetingType === "review") {
      nextSteps.push("Implement improvement suggestions");
      nextSteps.push("Document lessons learned");
    } else if (meetingType === "client") {
      nextSteps.push("Send meeting summary to client");
      nextSteps.push("Schedule next touchpoint");
    } else {
      nextSteps.push("Share notes with stakeholders");
      nextSteps.push("Follow up on action items");
    }

    return {
      title: meetingTitle || `${meetingTypes.find((t) => t.id === meetingType)?.label || "Meeting"} Notes`,
      date: new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      attendees: attendeeList,
      keyPoints: keyPoints.slice(0, 6),
      decisions: decisions.slice(0, 4),
      actionItems: actionItems.slice(0, 5),
      nextSteps,
    };
  };

  const generateSummary = () => {
    if (!rawNotes.trim()) {
      toast.error("Please enter your meeting notes");
      return;
    }

    setGenerating(true);

    setTimeout(() => {
      const extracted = extractKeyInfo(rawNotes);
      setSummary(extracted);
      setGenerating(false);
      toast.success("Summary generated!");
    }, 1000);
  };

  const formatSummaryText = (): string => {
    if (!summary) return "";

    let text = `📋 ${summary.title}\n`;
    text += `📅 ${summary.date}\n`;
    if (summary.attendees.length > 0) {
      text += `👥 Attendees: ${summary.attendees.join(", ")}\n`;
    }
    text += "\n";

    if (summary.keyPoints.length > 0) {
      text += "📌 KEY POINTS\n";
      summary.keyPoints.forEach((point) => {
        text += `• ${point}\n`;
      });
      text += "\n";
    }

    if (summary.decisions.length > 0) {
      text += "✅ DECISIONS\n";
      summary.decisions.forEach((decision) => {
        text += `• ${decision}\n`;
      });
      text += "\n";
    }

    if (summary.actionItems.length > 0) {
      text += "🎯 ACTION ITEMS\n";
      summary.actionItems.forEach((item) => {
        text += `• ${item.task} — ${item.owner} (Due: ${item.dueDate})\n`;
      });
      text += "\n";
    }

    if (summary.nextSteps.length > 0) {
      text += "➡️ NEXT STEPS\n";
      summary.nextSteps.forEach((step) => {
        text += `• ${step}\n`;
      });
    }

    return text;
  };

  const copySummary = () => {
    navigator.clipboard.writeText(formatSummaryText());
    setCopied(true);
    toast.success("Summary copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setRawNotes("");
    setMeetingTitle("");
    setAttendees("");
    setSummary(null);
  };

  return (
    <Layout>
      <SEOHead
        title="Meeting Notes Summarizer - Quick Summaries | TechTrendi"
        description="Turn messy meeting notes into structured summaries with action items, decisions, and next steps."
        canonicalUrl="https://techtrendi.com/tools/meeting-notes-summarizer"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Meeting Notes <span className="text-primary">Summarizer</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Transform messy notes into clear, actionable summaries
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Input */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Meeting Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Meeting Title</Label>
                  <Input
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder="e.g., Q1 Planning Session"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Meeting Type</Label>
                  <Select value={meetingType} onValueChange={setMeetingType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {meetingTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Attendees
                  </Label>
                  <Input
                    value={attendees}
                    onChange={(e) => setAttendees(e.target.value)}
                    placeholder="John, Sarah, Mike"
                  />
                  <p className="text-xs text-muted-foreground">Separate with commas</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Raw Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={rawNotes}
                  onChange={(e) => setRawNotes(e.target.value)}
                  placeholder="Paste your meeting notes here...

Example:
- Discussed Q1 goals
- Decided to launch new feature in March
- Action: John to create wireframes by Friday
- Need to follow up with marketing team
- Sarah will handle client communication"
                  rows={12}
                />
              </CardContent>
            </Card>

            <Button onClick={generateSummary} size="lg" className="w-full" disabled={generating}>
              {generating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Summarizing...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate Summary
                </>
              )}
            </Button>
          </div>

          {/* Right: Output */}
          <div className="space-y-6">
            <Card className="min-h-[500px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Structured Summary
                  </CardTitle>
                  {summary && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={reset}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={copySummary}>
                        {copied ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {summary ? (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="pb-4 border-b">
                      <h3 className="text-lg font-bold">{summary.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4" />
                        {summary.date}
                      </p>
                      {summary.attendees.length > 0 && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Users className="w-4 h-4" />
                          {summary.attendees.join(", ")}
                        </p>
                      )}
                    </div>

                    {/* Key Points */}
                    {summary.keyPoints.length > 0 && (
                      <div>
                        <h4 className="font-semibold flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-blue-500" />
                          Key Points
                        </h4>
                        <ul className="space-y-1">
                          {summary.keyPoints.map((point, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="text-primary">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Decisions */}
                    {summary.decisions.length > 0 && (
                      <div>
                        <h4 className="font-semibold flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Decisions Made
                        </h4>
                        <ul className="space-y-1">
                          {summary.decisions.map((decision, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="text-green-500">✓</span>
                              {decision}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Items */}
                    {summary.actionItems.length > 0 && (
                      <div>
                        <h4 className="font-semibold flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          Action Items
                        </h4>
                        <div className="space-y-2">
                          {summary.actionItems.map((item, i) => (
                            <div
                              key={i}
                              className="p-3 bg-muted/50 rounded-lg text-sm"
                            >
                              <p className="font-medium">{item.task}</p>
                              <p className="text-muted-foreground text-xs mt-1">
                                Owner: {item.owner} • Due: {item.dueDate}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next Steps */}
                    {summary.nextSteps.length > 0 && (
                      <div>
                        <h4 className="font-semibold flex items-center gap-2 mb-2">
                          <Share2 className="w-4 h-4 text-purple-500" />
                          Next Steps
                        </h4>
                        <ul className="space-y-1">
                          {summary.nextSteps.map((step, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="text-purple-500">→</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                    <FileText className="w-12 h-12 mb-4 opacity-50" />
                    <p>Your summary will appear here</p>
                    <p className="text-sm">Paste your notes and generate</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Tips for Better Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Use "Action:", "Decided:", or "@name" to highlight items
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Include dates like "by Friday" or "due 1/15"
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Use bullet points or line breaks between topics
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
