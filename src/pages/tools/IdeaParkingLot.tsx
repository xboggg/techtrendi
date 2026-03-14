import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb, Sparkles, Trash2, Plus, Search, Filter, Download,
  CheckCircle2, Eye, Shuffle, Flame, ThermometerSun, Snowflake,
  Briefcase, Package, FileText, User, MoreHorizontal, X, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Idea {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

type Category = "Business" | "Product" | "Content" | "Personal" | "Other";
type Priority = "Hot" | "Warm" | "Cool";
type Status = "Parked" | "Revisited" | "Implemented";

const categories: { value: Category; label: string; icon: React.ElementType; color: string }[] = [
  { value: "Business", label: "Business", icon: Briefcase, color: "bg-blue-500" },
  { value: "Product", label: "Product", icon: Package, color: "bg-purple-500" },
  { value: "Content", label: "Content", icon: FileText, color: "bg-green-500" },
  { value: "Personal", label: "Personal", icon: User, color: "bg-pink-500" },
  { value: "Other", label: "Other", icon: MoreHorizontal, color: "bg-gray-500" },
];

const priorities: { value: Priority; label: string; icon: React.ElementType; color: string; bgColor: string }[] = [
  { value: "Hot", label: "Hot", icon: Flame, color: "text-red-500", bgColor: "bg-red-500/10 border-red-500/30" },
  { value: "Warm", label: "Warm", icon: ThermometerSun, color: "text-orange-500", bgColor: "bg-orange-500/10 border-orange-500/30" },
  { value: "Cool", label: "Cool", icon: Snowflake, color: "text-blue-500", bgColor: "bg-blue-500/10 border-blue-500/30" },
];

const statuses: { value: Status; label: string; color: string }[] = [
  { value: "Parked", label: "Parked", color: "bg-yellow-500" },
  { value: "Revisited", label: "Revisited", color: "bg-blue-500" },
  { value: "Implemented", label: "Implemented", color: "bg-green-500" },
];

const STORAGE_KEY = "techtrendi_idea_parking_lot";

export default function IdeaParkingLot() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("Business");
  const [priority, setPriority] = useState<Priority>("Warm");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<Category | "All">("All");
  const [filterPriority, setFilterPriority] = useState<Priority | "All">("All");
  const [filterStatus, setFilterStatus] = useState<Status | "All">("All");
  const [showFilters, setShowFilters] = useState(false);
  const [randomIdea, setRandomIdea] = useState<Idea | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setIdeas(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load ideas:", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
  }, [ideas]);

  const addIdea = () => {
    if (!title.trim()) {
      toast.error("Please enter an idea title");
      return;
    }

    const newIdea: Idea = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status: "Parked",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIdeas([newIdea, ...ideas]);
    setTitle("");
    setDescription("");
    toast.success("Idea parked! Come back to it anytime.");
  };

  const deleteIdea = (id: string) => {
    setIdeas(ideas.filter((idea) => idea.id !== id));
    if (randomIdea?.id === id) {
      setRandomIdea(null);
    }
    toast.success("Idea removed");
  };

  const updateStatus = (id: string, status: Status) => {
    setIdeas(
      ideas.map((idea) =>
        idea.id === id
          ? { ...idea, status, updatedAt: new Date().toISOString() }
          : idea
      )
    );
    toast.success(`Idea marked as ${status}`);
  };

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const matchesSearch =
        idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === "All" || idea.category === filterCategory;
      const matchesPriority = filterPriority === "All" || idea.priority === filterPriority;
      const matchesStatus = filterStatus === "All" || idea.status === filterStatus;
      return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
    });
  }, [ideas, searchQuery, filterCategory, filterPriority, filterStatus]);

  const parkedIdeasCount = ideas.filter((idea) => idea.status === "Parked").length;
  const revisitedCount = ideas.filter((idea) => idea.status === "Revisited").length;
  const implementedCount = ideas.filter((idea) => idea.status === "Implemented").length;
  const hotIdeasCount = ideas.filter((idea) => idea.priority === "Hot" && idea.status === "Parked").length;

  const pickRandomIdea = () => {
    const parkedIdeas = ideas.filter((idea) => idea.status === "Parked");
    if (parkedIdeas.length === 0) {
      toast.error("No parked ideas to pick from!");
      return;
    }
    const randomIndex = Math.floor(Math.random() * parkedIdeas.length);
    setRandomIdea(parkedIdeas[randomIndex]);
  };

  const exportIdeas = () => {
    const exportData = ideas.map((idea) => ({
      Title: idea.title,
      Description: idea.description,
      Category: idea.category,
      Priority: idea.priority,
      Status: idea.status,
      Created: new Date(idea.createdAt).toLocaleDateString(),
      Updated: new Date(idea.updatedAt).toLocaleDateString(),
    }));

    const csv = [
      Object.keys(exportData[0] || {}).join(","),
      ...exportData.map((row) =>
        Object.values(row)
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `idea-parking-lot-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Ideas exported!");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterCategory("All");
    setFilterPriority("All");
    setFilterStatus("All");
  };

  const hasActiveFilters = filterCategory !== "All" || filterPriority !== "All" || filterStatus !== "All" || searchQuery !== "";

  const getCategoryIcon = (cat: Category) => {
    const found = categories.find((c) => c.value === cat);
    return found ? found.icon : MoreHorizontal;
  };

  const getPriorityInfo = (pri: Priority) => {
    return priorities.find((p) => p.value === pri) || priorities[1];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <Layout>
      <SEOHead
        title="Idea Parking Lot - Quick Idea Capture Tool | TechTrendi"
        description="Capture and organize your ideas instantly. Park ideas, categorize them, set priorities, and revisit them when you're ready. Free idea management tool."
        canonicalUrl="https://techtrendi.com/tools/idea-parking-lot"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0">
            Quick Capture
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Idea <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Parking Lot</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Park your ideas here. Revisit them later. Never lose a great thought again.
          </p>
        </div>

        {/* Reminder Banner */}
        {parkedIdeasCount > 0 && (
          <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border border-yellow-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <span className="text-sm md:text-base">
                You have <strong className="text-yellow-500">{parkedIdeasCount} idea{parkedIdeasCount !== 1 ? "s" : ""}</strong> waiting to be revisited
                {hotIdeasCount > 0 && (
                  <span className="text-red-500 ml-1">
                    ({hotIdeasCount} hot!)
                  </span>
                )}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={pickRandomIdea}
              className="gap-2 border-yellow-500/30 hover:bg-yellow-500/10"
            >
              <Shuffle className="w-4 h-4" />
              <span className="hidden sm:inline">Inspire Me</span>
            </Button>
          </div>
        )}

        {/* Random Idea Modal */}
        {randomIdea && (
          <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-yellow-400/20 to-amber-500/20 border border-yellow-500/30 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setRandomIdea(null)}
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Sparkles className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">Random Inspiration</p>
                <h3 className="text-xl font-bold mb-2">{randomIdea.title}</h3>
                {randomIdea.description && (
                  <p className="text-muted-foreground mb-3">{randomIdea.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{randomIdea.category}</Badge>
                  <Badge variant="outline" className={getPriorityInfo(randomIdea.priority).color}>
                    {randomIdea.priority}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  updateStatus(randomIdea.id, "Revisited");
                  setRandomIdea(null);
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Mark Revisited
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={pickRandomIdea}
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Another One
              </Button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-yellow-400/10 to-amber-500/10 border-yellow-500/20">
            <CardContent className="pt-6 text-center">
              <Lightbulb className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{ideas.length}</div>
              <div className="text-xs text-muted-foreground">Total Ideas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-8 h-8 rounded-full bg-yellow-500 mx-auto mb-2 flex items-center justify-center">
                <span className="text-white text-sm font-bold">P</span>
              </div>
              <div className="text-2xl font-bold">{parkedIdeasCount}</div>
              <div className="text-xs text-muted-foreground">Parked</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Eye className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{revisitedCount}</div>
              <div className="text-xs text-muted-foreground">Revisited</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{implementedCount}</div>
              <div className="text-xs text-muted-foreground">Implemented</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Add Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-yellow-500/20 bg-gradient-to-br from-yellow-400/5 to-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-yellow-500" />
                  Park an Idea
                </CardTitle>
                <CardDescription>Capture it fast, organize later</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Idea Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What's the idea?"
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && addIdea()}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add more details..."
                    className="mt-1 min-h-[80px]"
                  />
                </div>

                <div>
                  <Label>Category</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.value}
                          onClick={() => setCategory(cat.value)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all",
                            category === cat.value
                              ? `${cat.color} text-white`
                              : "bg-secondary hover:bg-secondary/80"
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label>Priority</Label>
                  <div className="flex gap-2 mt-2">
                    {priorities.map((pri) => {
                      const Icon = pri.icon;
                      return (
                        <button
                          key={pri.value}
                          onClick={() => setPriority(pri.value)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-all",
                            priority === pri.value
                              ? pri.bgColor
                              : "bg-secondary border-transparent hover:border-primary/20"
                          )}
                        >
                          <Icon className={cn("w-4 h-4", pri.color)} />
                          {pri.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  onClick={addIdea}
                  className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Park This Idea
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Ideas List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search & Filter Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search ideas..."
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={showFilters ? "default" : "outline"}
                      onClick={() => setShowFilters(!showFilters)}
                      className="gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      Filters
                      {hasActiveFilters && (
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      )}
                    </Button>
                    {ideas.length > 0 && (
                      <Button variant="outline" onClick={exportIdeas}>
                        <Download className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Export</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Filter Options */}
                {showFilters && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Category</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <button
                            onClick={() => setFilterCategory("All")}
                            className={cn(
                              "px-2 py-1 rounded text-xs transition-colors",
                              filterCategory === "All" ? "bg-primary text-primary-foreground" : "bg-secondary"
                            )}
                          >
                            All
                          </button>
                          {categories.map((cat) => (
                            <button
                              key={cat.value}
                              onClick={() => setFilterCategory(cat.value)}
                              className={cn(
                                "px-2 py-1 rounded text-xs transition-colors",
                                filterCategory === cat.value ? "bg-primary text-primary-foreground" : "bg-secondary"
                              )}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Priority</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <button
                            onClick={() => setFilterPriority("All")}
                            className={cn(
                              "px-2 py-1 rounded text-xs transition-colors",
                              filterPriority === "All" ? "bg-primary text-primary-foreground" : "bg-secondary"
                            )}
                          >
                            All
                          </button>
                          {priorities.map((pri) => (
                            <button
                              key={pri.value}
                              onClick={() => setFilterPriority(pri.value)}
                              className={cn(
                                "px-2 py-1 rounded text-xs transition-colors",
                                filterPriority === pri.value ? "bg-primary text-primary-foreground" : "bg-secondary"
                              )}
                            >
                              {pri.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <button
                            onClick={() => setFilterStatus("All")}
                            className={cn(
                              "px-2 py-1 rounded text-xs transition-colors",
                              filterStatus === "All" ? "bg-primary text-primary-foreground" : "bg-secondary"
                            )}
                          >
                            All
                          </button>
                          {statuses.map((status) => (
                            <button
                              key={status.value}
                              onClick={() => setFilterStatus(status.value)}
                              className={cn(
                                "px-2 py-1 rounded text-xs transition-colors",
                                filterStatus === status.value ? "bg-primary text-primary-foreground" : "bg-secondary"
                              )}
                            >
                              {status.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                        <X className="w-3 h-3 mr-1" />
                        Clear filters
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ideas */}
            {filteredIdeas.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Lightbulb className="w-16 h-16 text-yellow-500/30 mx-auto mb-4" />
                  {ideas.length === 0 ? (
                    <>
                      <h3 className="text-xl font-semibold mb-2">No ideas yet</h3>
                      <p className="text-muted-foreground">
                        Park your first idea using the form on the left!
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-semibold mb-2">No matching ideas</h3>
                      <p className="text-muted-foreground mb-4">
                        Try adjusting your search or filters.
                      </p>
                      <Button variant="outline" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredIdeas.map((idea) => {
                  const CategoryIcon = getCategoryIcon(idea.category);
                  const priorityInfo = getPriorityInfo(idea.priority);
                  const PriorityIcon = priorityInfo.icon;
                  const statusInfo = statuses.find((s) => s.value === idea.status);

                  return (
                    <Card
                      key={idea.id}
                      className={cn(
                        "transition-all hover:shadow-md",
                        idea.status === "Implemented" && "opacity-60"
                      )}
                    >
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                              categories.find((c) => c.value === idea.category)?.color
                            )}
                          >
                            <CategoryIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className={cn(
                                "font-semibold",
                                idea.status === "Implemented" && "line-through"
                              )}>
                                {idea.title}
                              </h3>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <PriorityIcon className={cn("w-4 h-4", priorityInfo.color)} />
                              </div>
                            </div>
                            {idea.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {idea.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <Badge variant="outline" className="text-xs">
                                {idea.category}
                              </Badge>
                              <Badge variant="outline" className={cn("text-xs", priorityInfo.color)}>
                                {idea.priority}
                              </Badge>
                              <Badge className={cn("text-xs text-white", statusInfo?.color)}>
                                {idea.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {formatDate(idea.createdAt)}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-4">
                              {idea.status === "Parked" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatus(idea.id, "Revisited")}
                                >
                                  <Eye className="w-3.5 h-3.5 mr-1" />
                                  Revisit
                                </Button>
                              )}
                              {idea.status !== "Implemented" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => updateStatus(idea.id, "Implemented")}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                  Implemented
                                </Button>
                              )}
                              {idea.status === "Revisited" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatus(idea.id, "Parked")}
                                >
                                  Back to Parked
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive ml-auto"
                                onClick={() => deleteIdea(idea.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Summary */}
            {ideas.length > 0 && (
              <p className="text-center text-sm text-muted-foreground pt-4">
                Showing {filteredIdeas.length} of {ideas.length} ideas
              </p>
            )}
          </div>
        </div>

        {/* Tips */}
        <Card className="mt-12 border-yellow-500/20 bg-gradient-to-br from-yellow-400/5 to-amber-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Tips for Using Your Idea Parking Lot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2" />
                <span>Capture ideas immediately - don't wait for the "perfect" description</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2" />
                <span>Use "Hot" priority for time-sensitive or high-potential ideas</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2" />
                <span>Revisit your parked ideas weekly to keep them fresh</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2" />
                <span>Use "Inspire Me" when you need creative spark</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2" />
                <span>Export your ideas regularly for backup</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2" />
                <span>Mark ideas as "Implemented" to track your execution rate</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
