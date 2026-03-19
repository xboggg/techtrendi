import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, Cake, History, Users, Skull, PartyPopper, Share2,
  Heart, Shuffle, Loader2, Star, BookOpen, Filter, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WikiEvent {
  text: string;
  year: number;
  pages?: Array<{
    title: string;
    extract?: string;
    thumbnail?: {
      source: string;
    };
  }>;
}

interface WikiResponse {
  selected?: WikiEvent[];
  events?: WikiEvent[];
  births?: WikiEvent[];
  deaths?: WikiEvent[];
  holidays?: Array<{
    text: string;
    pages?: Array<{
      title: string;
      extract?: string;
      thumbnail?: {
        source: string;
      };
    }>;
  }>;
}

type CategoryType = "all" | "events" | "births" | "deaths" | "holidays";

const categoryConfig: Record<CategoryType, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  all: { label: "All", icon: <History className="w-4 h-4" />, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  events: { label: "Events", icon: <BookOpen className="w-4 h-4" />, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  births: { label: "Births", icon: <Cake className="w-4 h-4" />, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  deaths: { label: "Deaths", icon: <Skull className="w-4 h-4" />, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  holidays: { label: "Holidays", icon: <PartyPopper className="w-4 h-4" />, color: "text-pink-600", bgColor: "bg-pink-100 dark:bg-pink-900/30" },
};

export default function ThisDayInHistory() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [data, setData] = useState<WikiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryType>("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("history-favorites");
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch {
        // Invalid JSON
      }
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem("history-favorites", JSON.stringify(favorites));
  }, [favorites]);

  const fetchHistoryData = useCallback(async (date: Date) => {
    setLoading(true);
    setError(null);

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    try {
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/${month}/${day}`,
        {
          headers: {
            "Accept": "application/json",
            "Api-User-Agent": "TechTrendi/1.0 (https://techtrendi.com)",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const result: WikiResponse = await response.json();
      setData(result);
    } catch (err) {
      setError("Failed to load historical events. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistoryData(selectedDate);
  }, [selectedDate, fetchHistoryData]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
    }
  };

  const useMyBirthday = () => {
    // Prompt user for birthday - for simplicity, we'll use a date input
    const birthday = prompt("Enter your birthday (MM/DD format):", "01/01");
    if (birthday) {
      const [month, day] = birthday.split("/").map(Number);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const newDate = new Date(today.getFullYear(), month - 1, day);
        setSelectedDate(newDate);
        toast.success("Birthday set! Discovering what happened on your special day...");
      } else {
        toast.error("Invalid date format. Please use MM/DD.");
      }
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  };

  const getAllEvents = (): Array<{ type: CategoryType; event: WikiEvent | { text: string; year?: number; pages?: Array<{ title: string; extract?: string; thumbnail?: { source: string } }> } }> => {
    if (!data) return [];

    const allEvents: Array<{ type: CategoryType; event: WikiEvent | { text: string; year?: number; pages?: Array<{ title: string; extract?: string; thumbnail?: { source: string } }> } }> = [];

    if (data.selected) {
      data.selected.forEach(event => allEvents.push({ type: "events", event }));
    }
    if (data.events) {
      data.events.forEach(event => allEvents.push({ type: "events", event }));
    }
    if (data.births) {
      data.births.forEach(event => allEvents.push({ type: "births", event }));
    }
    if (data.deaths) {
      data.deaths.forEach(event => allEvents.push({ type: "deaths", event }));
    }
    if (data.holidays) {
      data.holidays.forEach(event => allEvents.push({ type: "holidays", event: { ...event, year: 0 } }));
    }

    return allEvents;
  };

  const getFilteredEvents = () => {
    const allEvents = getAllEvents();

    let filtered = allEvents;
    if (activeCategory !== "all") {
      filtered = allEvents.filter(e => e.type === activeCategory);
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(e => favorites.includes(e.event.text));
    }

    return filtered;
  };

  const toggleFavorite = (text: string) => {
    if (favorites.includes(text)) {
      setFavorites(favorites.filter(f => f !== text));
      toast.success("Removed from favorites");
    } else {
      setFavorites([...favorites, text]);
      toast.success("Added to favorites!");
    }
  };

  const getRandomFact = () => {
    const allEvents = getAllEvents();
    if (allEvents.length === 0) return;

    const randomEvent = allEvents[Math.floor(Math.random() * allEvents.length)];
    toast.info(`Random fact: ${randomEvent.event.text}`, { duration: 8000 });
  };

  const shareBirthdayFacts = () => {
    const allEvents = getAllEvents();
    const eventsCount = (data?.events?.length || 0) + (data?.selected?.length || 0);
    const birthsCount = data?.births?.length || 0;

    const text = `On ${formatDisplayDate(selectedDate)}, ${eventsCount} historical events occurred and ${birthsCount} famous people were born! Discover what happened on your birthday: https://techtrendi.com/tools/this-day-in-history`;

    if (navigator.share) {
      navigator.share({
        title: "This Day in History",
        text: text,
      }).catch(() => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
      });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  const getTotalCounts = () => {
    if (!data) return { events: 0, births: 0, deaths: 0, holidays: 0, total: 0 };

    const events = (data.events?.length || 0) + (data.selected?.length || 0);
    const births = data.births?.length || 0;
    const deaths = data.deaths?.length || 0;
    const holidays = data.holidays?.length || 0;

    return {
      events,
      births,
      deaths,
      holidays,
      total: events + births + deaths + holidays,
    };
  };

  const counts = getTotalCounts();
  const filteredEvents = getFilteredEvents();

  return (
    <Layout>
      <SEOHead
        title="This Day in History - On Your Birthday Tool | TechTrendi"
        description="Discover what historical events happened on any date. Find out which famous people share your birthday, historical events, and holidays. Educational and fun!"
        canonicalUrl="https://techtrendi.com/tools/this-day-in-history"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header with warm gradient */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-6 shadow-lg">
            <History className="w-10 h-10 text-white" />
          </div>
          <Badge className="mb-4 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            Free Educational Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            This Day in <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">History</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover fascinating historical events, famous birthdays, and notable moments that happened on any date.
          </p>
        </div>

        {/* Date Selection Card */}
        <Card className="mb-8 border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              Select a Date
            </CardTitle>
            <CardDescription>
              Choose any date to explore its historical significance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 w-full sm:w-auto">
                <Label htmlFor="date" className="mb-2 block">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formatDateForInput(selectedDate)}
                  onChange={handleDateChange}
                  className="w-full"
                />
              </div>
              <Button
                variant="outline"
                onClick={useMyBirthday}
                className="w-full sm:w-auto border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/30"
              >
                <Cake className="w-4 h-4 mr-2" />
                Use My Birthday
              </Button>
              <Button
                variant="outline"
                onClick={() => fetchHistoryData(selectedDate)}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {data && !loading && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="text-center bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-amber-600">{counts.total}</div>
                <div className="text-sm text-muted-foreground">Total Facts</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-600">{counts.events}</div>
                <div className="text-sm text-muted-foreground">Events</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-600">{counts.births}</div>
                <div className="text-sm text-muted-foreground">Births</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-purple-600">{counts.deaths}</div>
                <div className="text-sm text-muted-foreground">Deaths</div>
              </CardContent>
            </Card>
            <Card className="text-center col-span-2 md:col-span-1">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-pink-600">{counts.holidays}</div>
                <div className="text-sm text-muted-foreground">Holidays</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <Button
            onClick={getRandomFact}
            disabled={loading || !data}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            <Shuffle className="w-4 h-4 mr-2" />
            Random Fact
          </Button>
          <Button
            variant="outline"
            onClick={shareBirthdayFacts}
            disabled={loading || !data}
            className="border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/30"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Birthday Facts
          </Button>
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={showFavoritesOnly ? "bg-pink-500 hover:bg-pink-600" : ""}
          >
            <Heart className={cn("w-4 h-4 mr-2", showFavoritesOnly && "fill-current")} />
            Favorites ({favorites.length})
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
            <p className="text-muted-foreground">Discovering historical events...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <CardContent className="pt-6 text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button
                variant="outline"
                onClick={() => fetchHistoryData(selectedDate)}
                className="mt-4"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {data && !loading && (
          <>
            {/* Category Tabs */}
            <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as CategoryType)} className="mb-8">
              <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto">
                {(Object.keys(categoryConfig) as CategoryType[]).map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="flex items-center gap-1 text-xs sm:text-sm"
                  >
                    {categoryConfig[category].icon}
                    <span className="hidden sm:inline">{categoryConfig[category].label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Tab Content */}
              <TabsContent value={activeCategory} className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Filter className="w-5 h-5 text-amber-500" />
                    {categoryConfig[activeCategory].label} on {formatDisplayDate(selectedDate)}
                  </h2>
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    {filteredEvents.length} results
                  </Badge>
                </div>

                {filteredEvents.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {showFavoritesOnly
                          ? "No favorites in this category yet."
                          : "No events found for this category."}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {filteredEvents.slice(0, 50).map((item, index) => {
                      const { type, event } = item;
                      const config = categoryConfig[type];
                      const isFavorite = favorites.includes(event.text);
                      const thumbnail = event.pages?.[0]?.thumbnail?.source;
                      const pageTitle = event.pages?.[0]?.title;

                      return (
                        <Card
                          key={index}
                          className={cn(
                            "overflow-hidden transition-all hover:shadow-lg",
                            isFavorite && "ring-2 ring-pink-400"
                          )}
                        >
                          <div className="flex">
                            {thumbnail && (
                              <div className="w-24 h-24 flex-shrink-0">
                                <img
                                  src={thumbnail}
                                  alt={pageTitle || "Event thumbnail"}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            )}
                            <div className="flex-1 p-4">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <Badge className={cn(config.bgColor, config.color, "text-xs")}>
                                  {config.icon}
                                  <span className="ml-1">
                                    {"year" in event && event.year ? event.year : config.label}
                                  </span>
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleFavorite(event.text)}
                                  className="p-1 h-auto"
                                >
                                  <Heart
                                    className={cn(
                                      "w-4 h-4",
                                      isFavorite ? "fill-pink-500 text-pink-500" : "text-muted-foreground"
                                    )}
                                  />
                                </Button>
                              </div>
                              <p className="text-sm text-foreground line-clamp-3">
                                {event.text}
                              </p>
                              {pageTitle && (
                                <p className="text-xs text-muted-foreground mt-2 truncate">
                                  Related: {pageTitle}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {filteredEvents.length > 50 && (
                  <p className="text-center text-muted-foreground mt-6">
                    Showing 50 of {filteredEvents.length} results
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Info Card */}
        <Card className="mt-12 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-amber-600" />
              Why Use This Tool?
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Birthday Discovery</h4>
              <p>Find out which famous people share your birthday and what historical events occurred on your special day.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Educational Value</h4>
              <p>Learn about significant historical events, births, deaths, and holidays in an engaging, easy-to-browse format.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Share & Remember</h4>
              <p>Save your favorite facts and share interesting birthday trivia with friends and family on social media.</p>
            </div>
          </CardContent>
        </Card>

        {/* Fun Tip */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Tip: Click the heart icon on any fact to save it to your favorites!
          </p>
        </div>
      </div>
    </Layout>
  );
}
