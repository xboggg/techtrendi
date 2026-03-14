import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "./AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Star, MessageSquare, TrendingUp, Award, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 20;

interface ToolFeedback {
  id: string;
  tool_id: string;
  tool_name: string;
  rating: number;
  comment: string;
  user_agent: string;
  created_at: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? "text-yellow-500 fill-yellow-500"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

export default function AdminToolFeedback() {
  const [filterTool, setFilterTool] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ["admin-tool-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tool_feedback" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as ToolFeedback[];
    },
    refetchInterval: 30000,
  });

  // Unique tool names for filter dropdown
  const toolNames = useMemo(() => {
    const names = [...new Set(feedback.map((f) => f.tool_name))].sort();
    return names;
  }, [feedback]);

  // Apply filters
  const filteredFeedback = useMemo(() => {
    let result = feedback;

    if (filterTool !== "all") {
      result = result.filter((f) => f.tool_name === filterTool);
    }

    if (filterRating !== "all") {
      result = result.filter((f) => f.rating === parseInt(filterRating, 10));
    }

    if (filterDateRange !== "all") {
      const now = new Date();
      const cutoff = new Date();
      if (filterDateRange === "7") cutoff.setDate(now.getDate() - 7);
      else if (filterDateRange === "30") cutoff.setDate(now.getDate() - 30);
      result = result.filter((f) => new Date(f.created_at) >= cutoff);
    }

    return result;
  }, [feedback, filterTool, filterRating, filterDateRange]);

  // Summary stats
  const stats = useMemo(() => {
    const total = feedback.length;
    const avgRating =
      total > 0
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / total
        : 0;

    // Per-tool aggregation
    const toolMap = new Map<string, { name: string; totalRating: number; count: number }>();
    feedback.forEach((f) => {
      const entry = toolMap.get(f.tool_name) || { name: f.tool_name, totalRating: 0, count: 0 };
      entry.totalRating += f.rating;
      entry.count += 1;
      toolMap.set(f.tool_name, entry);
    });

    let topRatedTool = { name: "N/A", avg: 0 };
    let mostReviewedTool = { name: "N/A", count: 0 };

    toolMap.forEach((entry) => {
      const avg = entry.totalRating / entry.count;
      if (avg > topRatedTool.avg || (avg === topRatedTool.avg && entry.count > 1)) {
        topRatedTool = { name: entry.name, avg };
      }
      if (entry.count > mostReviewedTool.count) {
        mostReviewedTool = { name: entry.name, count: entry.count };
      }
    });

    return { total, avgRating, topRatedTool, mostReviewedTool };
  }, [feedback]);

  // Pagination
  const totalPages = Math.ceil(filteredFeedback.length / ITEMS_PER_PAGE);
  const paginated = filteredFeedback.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tool Feedback</h1>
          <p className="text-muted-foreground">
            User feedback from interactive tools ({stats.total} total)
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "--"}
              </div>
              {stats.avgRating > 0 && (
                <StarRating rating={Math.round(stats.avgRating)} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Rated Tool</CardTitle>
              <Award className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">{stats.topRatedTool.name}</div>
              {stats.topRatedTool.avg > 0 && (
                <p className="text-sm text-muted-foreground">
                  {stats.topRatedTool.avg.toFixed(1)} avg
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Reviewed</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">{stats.mostReviewedTool.name}</div>
              {stats.mostReviewedTool.count > 0 && (
                <p className="text-sm text-muted-foreground">
                  {stats.mostReviewedTool.count} review{stats.mostReviewedTool.count !== 1 ? "s" : ""}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <Select
            value={filterTool}
            onValueChange={(v) => {
              setFilterTool(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-56">
              <SelectValue placeholder="All Tools" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tools</SelectItem>
              {toolNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterRating}
            onValueChange={(v) => {
              setFilterRating(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="All Ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              {[5, 4, 3, 2, 1].map((r) => (
                <SelectItem key={r} value={String(r)}>
                  {r} Star{r !== 1 ? "s" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterDateRange}
            onValueChange={(v) => {
              setFilterDateRange(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool Name</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="min-w-[200px]">Comment</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No feedback found
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="secondary">{item.tool_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <StarRating rating={item.rating} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {item.comment || (
                        <span className="italic text-muted-foreground/60">
                          No comment
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}--
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredFeedback.length)} of{" "}
              {filteredFeedback.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1
                )
                .reduce<(number | string)[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  typeof p === "string" ? (
                    <span key={`e${i}`} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={currentPage === p ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8"
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </Button>
                  )
                )}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
