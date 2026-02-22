import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock, Copy, Check, Calendar, RefreshCw, Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const commonExpressions = [
  { name: "Every minute", cron: "* * * * *" },
  { name: "Every 5 minutes", cron: "*/5 * * * *" },
  { name: "Every 15 minutes", cron: "*/15 * * * *" },
  { name: "Every 30 minutes", cron: "*/30 * * * *" },
  { name: "Every hour", cron: "0 * * * *" },
  { name: "Every day at midnight", cron: "0 0 * * *" },
  { name: "Every day at noon", cron: "0 12 * * *" },
  { name: "Every day at 9 AM", cron: "0 9 * * *" },
  { name: "Every Monday at 9 AM", cron: "0 9 * * 1" },
  { name: "Every weekday at 9 AM", cron: "0 9 * * 1-5" },
  { name: "First of every month", cron: "0 0 1 * *" },
  { name: "Every Sunday at midnight", cron: "0 0 * * 0" },
  { name: "Every quarter (Jan, Apr, Jul, Oct)", cron: "0 0 1 1,4,7,10 *" },
  { name: "Every year on Jan 1", cron: "0 0 1 1 *" },
];

const daysOfWeek = [
  { value: "*", label: "Every day" },
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "1-5", label: "Weekdays (Mon-Fri)" },
  { value: "0,6", label: "Weekends (Sat-Sun)" },
];

const months = [
  { value: "*", label: "Every month" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function CronBuilder() {
  const [minute, setMinute] = useState("*");
  const [hour, setHour] = useState("*");
  const [dayOfMonth, setDayOfMonth] = useState("*");
  const [month, setMonth] = useState("*");
  const [dayOfWeek, setDayOfWeek] = useState("*");
  const [copied, setCopied] = useState(false);

  const cronExpression = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;

  const description = useMemo(() => {
    const parts: string[] = [];

    // Minute
    if (minute === "*") {
      parts.push("every minute");
    } else if (minute.startsWith("*/")) {
      parts.push(`every ${minute.slice(2)} minutes`);
    } else {
      parts.push(`at minute ${minute}`);
    }

    // Hour
    if (hour === "*") {
      parts.push("of every hour");
    } else if (hour.startsWith("*/")) {
      parts.push(`every ${hour.slice(2)} hours`);
    } else {
      const h = parseInt(hour);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      parts.push(`at ${h12}:${minute === "*" ? "00" : minute.padStart(2, "0")} ${ampm}`);
    }

    // Day of month
    if (dayOfMonth !== "*") {
      if (dayOfMonth.startsWith("*/")) {
        parts.push(`every ${dayOfMonth.slice(2)} days`);
      } else {
        const suffix = ["th", "st", "nd", "rd"][parseInt(dayOfMonth) % 10] || "th";
        parts.push(`on the ${dayOfMonth}${suffix}`);
      }
    }

    // Month
    if (month !== "*") {
      const monthNames = ["", "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
      if (month.includes(",")) {
        const monthList = month.split(",").map(m => monthNames[parseInt(m)]).join(", ");
        parts.push(`in ${monthList}`);
      } else {
        parts.push(`in ${monthNames[parseInt(month)]}`);
      }
    }

    // Day of week
    if (dayOfWeek !== "*") {
      const dayNames: Record<string, string> = {
        "0": "Sunday", "1": "Monday", "2": "Tuesday", "3": "Wednesday",
        "4": "Thursday", "5": "Friday", "6": "Saturday",
        "1-5": "weekdays", "0,6": "weekends"
      };
      parts.push(`on ${dayNames[dayOfWeek] || dayOfWeek}`);
    }

    return parts.join(" ");
  }, [minute, hour, dayOfMonth, month, dayOfWeek]);

  const nextRuns = useMemo(() => {
    const runs: Date[] = [];
    const now = new Date();

    for (let i = 0; i < 5 && runs.length < 5; i++) {
      const next = new Date(now.getTime() + i * 60000);
      // Simple simulation - not accurate for all cron patterns
      runs.push(next);
    }

    return runs;
  }, [cronExpression]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cronExpression);
    setCopied(true);
    toast.success("Cron expression copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const loadExpression = (cron: string) => {
    const parts = cron.split(" ");
    if (parts.length === 5) {
      setMinute(parts[0]);
      setHour(parts[1]);
      setDayOfMonth(parts[2]);
      setMonth(parts[3]);
      setDayOfWeek(parts[4]);
      toast.success("Expression loaded!");
    }
  };

  const resetAll = () => {
    setMinute("*");
    setHour("*");
    setDayOfMonth("*");
    setMonth("*");
    setDayOfWeek("*");
  };

  return (
    <Layout>
      <SEOHead
        title="Cron Expression Builder - Visual Cron Generator | TechTrendi"
        description="Build cron expressions visually with our easy-to-use cron builder. Generate cron syntax for scheduling tasks with explanations."
        canonicalUrl="https://techtrendi.com/tools/cron-builder"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Cron Expression <span className="text-primary">Builder</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Build cron expressions visually for scheduling tasks
          </p>
        </div>

        {/* Result Display */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Cron Expression</Label>
                <div className="flex items-center gap-3 mt-1">
                  <code className="text-3xl font-mono font-bold text-primary">
                    {cronExpression}
                  </code>
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <Label className="text-sm text-muted-foreground">Runs</Label>
                <p className="text-lg font-medium capitalize">{description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Builder */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Schedule Builder
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={resetAll}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Cron Fields Visual */}
                <div className="grid grid-cols-5 gap-2 text-center text-sm">
                  <div className="p-2 bg-muted rounded">
                    <p className="font-mono text-lg">{minute}</p>
                    <p className="text-xs text-muted-foreground">Minute</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="font-mono text-lg">{hour}</p>
                    <p className="text-xs text-muted-foreground">Hour</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="font-mono text-lg">{dayOfMonth}</p>
                    <p className="text-xs text-muted-foreground">Day</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="font-mono text-lg">{month}</p>
                    <p className="text-xs text-muted-foreground">Month</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="font-mono text-lg">{dayOfWeek}</p>
                    <p className="text-xs text-muted-foreground">Weekday</p>
                  </div>
                </div>

                {/* Minute */}
                <div>
                  <Label>Minute (0-59)</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <Button
                      variant={minute === "*" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMinute("*")}
                    >
                      Every minute
                    </Button>
                    <Button
                      variant={minute === "*/5" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMinute("*/5")}
                    >
                      Every 5 min
                    </Button>
                    <Button
                      variant={minute === "*/15" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMinute("*/15")}
                    >
                      Every 15 min
                    </Button>
                    <Button
                      variant={minute === "0" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMinute("0")}
                    >
                      At :00
                    </Button>
                  </div>
                  <Input
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                    placeholder="* or 0-59"
                    className="mt-2 font-mono"
                  />
                </div>

                {/* Hour */}
                <div>
                  <Label>Hour (0-23)</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <Button
                      variant={hour === "*" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHour("*")}
                    >
                      Every hour
                    </Button>
                    <Button
                      variant={hour === "9" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHour("9")}
                    >
                      9 AM
                    </Button>
                    <Button
                      variant={hour === "12" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHour("12")}
                    >
                      12 PM
                    </Button>
                    <Button
                      variant={hour === "0" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHour("0")}
                    >
                      Midnight
                    </Button>
                  </div>
                  <Input
                    value={hour}
                    onChange={(e) => setHour(e.target.value)}
                    placeholder="* or 0-23"
                    className="mt-2 font-mono"
                  />
                </div>

                {/* Day of Month */}
                <div>
                  <Label>Day of Month (1-31)</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <Button
                      variant={dayOfMonth === "*" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDayOfMonth("*")}
                    >
                      Every day
                    </Button>
                    <Button
                      variant={dayOfMonth === "1" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDayOfMonth("1")}
                    >
                      1st
                    </Button>
                    <Button
                      variant={dayOfMonth === "15" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDayOfMonth("15")}
                    >
                      15th
                    </Button>
                    <Button
                      variant={dayOfMonth === "L" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDayOfMonth("L")}
                    >
                      Last day
                    </Button>
                  </div>
                  <Input
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                    placeholder="* or 1-31"
                    className="mt-2 font-mono"
                  />
                </div>

                {/* Month */}
                <div>
                  <Label>Month</Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Day of Week */}
                <div>
                  <Label>Day of Week</Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Common Expressions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Common Schedules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 max-h-[400px] overflow-y-auto">
                {commonExpressions.map((expr) => (
                  <button
                    key={expr.cron}
                    onClick={() => loadExpression(expr.cron)}
                    className={cn(
                      "w-full text-left p-2 rounded hover:bg-muted transition-colors",
                      cronExpression === expr.cron && "bg-primary/10"
                    )}
                  >
                    <p className="font-medium text-sm">{expr.name}</p>
                    <code className="text-xs text-muted-foreground">{expr.cron}</code>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Syntax Reference */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Cron Syntax</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="font-mono text-xs bg-muted p-2 rounded">
                  ┌───────── minute (0-59)<br />
                  │ ┌─────── hour (0-23)<br />
                  │ │ ┌───── day of month (1-31)<br />
                  │ │ │ ┌─── month (1-12)<br />
                  │ │ │ │ ┌─ day of week (0-6)<br />
                  * * * * *
                </div>
                <div className="space-y-1 text-xs">
                  <p><code className="bg-muted px-1">*</code> = any value</p>
                  <p><code className="bg-muted px-1">,</code> = value list (1,3,5)</p>
                  <p><code className="bg-muted px-1">-</code> = range (1-5)</p>
                  <p><code className="bg-muted px-1">/</code> = step (*/5 = every 5)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
