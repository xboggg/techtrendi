import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { sampleReviews, type Review } from "@/data/sampleContent";
import { Star, ThumbsUp, ThumbsDown, ArrowRight, Filter, Search, X, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const categories = ["All", "Smartphones", "Laptops", "Audio", "Wearables"];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? "fill-primary text-primary"
              : star <= rating + 0.5
              ? "fill-primary/50 text-primary"
              : "text-muted-foreground"
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-semibold text-foreground">{Number(rating).toFixed(1)}</span>
    </div>
  );
}

function ComparisonTable({ reviews, onRemove }: { reviews: Review[]; onRemove: (id: string) => void }) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Select products to compare them side by side</p>
      </div>
    );
  }

  const allSpecs = new Set<string>();
  reviews.forEach((review) => {
    if (review.specs) {
      Object.keys(review.specs).forEach((key) => allSpecs.add(key));
    }
  });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Product</TableHead>
            {reviews.map((review) => (
              <TableHead key={review.id} className="min-w-48">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{review.title}</p>
                    <StarRating rating={review.rating} />
                  </div>
                  <button onClick={() => onRemove(review.id)} className="p-1 hover:bg-muted rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Image</TableCell>
            {reviews.map((review) => (
              <TableCell key={review.id}>
                {review.image && (
                  <img src={review.image} alt={review.title} className="w-32 h-24 object-cover rounded-lg" />
                )}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Price</TableCell>
            {reviews.map((review) => (
              <TableCell key={review.id} className="font-semibold text-primary">
                {review.price || "N/A"}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Category</TableCell>
            {reviews.map((review) => (
              <TableCell key={review.id}>
                <Badge variant="secondary">{review.category}</Badge>
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Verdict</TableCell>
            {reviews.map((review) => (
              <TableCell key={review.id} className="text-sm text-muted-foreground">
                {review.verdict}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium text-green-600">Top Pro</TableCell>
            {reviews.map((review) => (
              <TableCell key={review.id} className="text-sm">
                <div className="flex items-start gap-2">
                  <ThumbsUp className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  {review.pros[0] || "N/A"}
                </div>
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium text-red-600">Top Con</TableCell>
            {reviews.map((review) => (
              <TableCell key={review.id} className="text-sm">
                <div className="flex items-start gap-2">
                  <ThumbsDown className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  {review.cons[0] || "N/A"}
                </div>
              </TableCell>
            ))}
          </TableRow>
          {Array.from(allSpecs).map((spec) => (
            <TableRow key={spec}>
              <TableCell className="font-medium capitalize">{spec.replace(/_/g, " ")}</TableCell>
              {reviews.map((review) => (
                <TableCell key={review.id} className="text-sm">
                  {review.specs?.[spec] || "N/A"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function Reviews() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("rating");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // Use sample data directly - no loading states needed
  const reviews = sampleReviews;

  const filteredReviews = reviews
    .filter((review) => {
      const matchesSearch = review.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || review.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return Number(b.rating) - Number(a.rating);
      if (sortBy === "newest") {
        const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
        const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
        return dateB - dateA;
      }
      return a.title.localeCompare(b.title);
    });

  const compareReviews = reviews.filter((r) => compareIds.includes(r.id));

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">Expert Reviews</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              In-Depth Product <span className="text-gradient">Reviews</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Expert reviews with official specs and honest verdicts to help you make informed decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 border-b border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search reviews..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant={compareIds.length > 0 ? "default" : "outline"} className="gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Compare {compareIds.length > 0 && `(${compareIds.length})`}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh]">
                  <SheetHeader><SheetTitle>Product Comparison</SheetTitle></SheetHeader>
                  <div className="mt-6 overflow-auto">
                    <ComparisonTable reviews={compareReviews} onRemove={(id) => setCompareIds((prev) => prev.filter((i) => i !== id))} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReviews.map((review) => (
              <article key={review.id} className="group bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-elevated hover:border-primary/20 transition-all duration-300">
                <div className="relative aspect-video overflow-hidden">
                  {review.image && (
                    <img src={review.image} alt={review.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary">{review.category}</Badge>
                  </div>
                  <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1">
                    <StarRating rating={review.rating} />
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <label className="flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 cursor-pointer">
                      <Checkbox checked={compareIds.includes(review.id)} onCheckedChange={() => toggleCompare(review.id)} disabled={!compareIds.includes(review.id) && compareIds.length >= 4} />
                      <span className="text-xs font-medium text-foreground">Compare</span>
                    </label>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{review.release_date}</span>
                    <span className="text-sm font-semibold text-primary">{review.price}</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">{review.title}</h2>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{review.verdict}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <ThumbsUp className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground line-clamp-1">{review.pros[0]}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ThumbsDown className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground line-clamp-1">{review.cons[0]}</span>
                    </div>
                  </div>
                  <Link to={`/reviews/${review.slug}`} className="inline-flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                    Read Full Review
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {filteredReviews.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No reviews found matching your criteria.</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Comparison CTA */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Compare Products Side by Side</h2>
            <p className="text-muted-foreground mb-6">Use our phone comparison tool to see detailed spec comparisons between your favorite devices.</p>
            <Button asChild variant="hero">
              <Link to="/tools/phone-comparison">Try Phone Comparison<ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
