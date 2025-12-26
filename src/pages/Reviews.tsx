import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Star, ThumbsUp, ThumbsDown, ArrowRight, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Review {
  id: string;
  slug: string;
  title: string;
  category: string;
  image: string;
  rating: number;
  verdict: string;
  pros: string[];
  cons: string[];
  price: string;
  releaseDate: string;
}

const reviews: Review[] = [
  {
    id: "1",
    slug: "iphone-15-pro-max",
    title: "iPhone 15 Pro Max",
    category: "Smartphones",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop",
    rating: 4.8,
    verdict: "The best iPhone yet with groundbreaking camera features and titanium design.",
    pros: ["Excellent camera system", "Premium titanium build", "A17 Pro chip performance", "USB-C finally"],
    cons: ["Expensive", "Heavy", "No major design changes"],
    price: "$1,199",
    releaseDate: "Sep 2023",
  },
  {
    id: "2",
    slug: "samsung-galaxy-s24-ultra",
    title: "Samsung Galaxy S24 Ultra",
    category: "Smartphones",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=300&fit=crop",
    rating: 4.7,
    verdict: "Samsung's AI-powered flagship sets new standards for smartphone intelligence.",
    pros: ["Galaxy AI features", "S Pen included", "7-year updates", "Stunning display"],
    cons: ["Pricey", "Large size", "Similar design to S23"],
    price: "$1,299",
    releaseDate: "Jan 2024",
  },
  {
    id: "3",
    slug: "macbook-pro-m3",
    title: "MacBook Pro 14\" M3 Pro",
    category: "Laptops",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop",
    rating: 4.9,
    verdict: "The M3 Pro chip delivers exceptional performance for creative professionals.",
    pros: ["Incredible performance", "All-day battery", "Beautiful display", "Excellent speakers"],
    cons: ["Expensive", "Limited ports", "No touchscreen"],
    price: "$1,999",
    releaseDate: "Nov 2023",
  },
  {
    id: "4",
    slug: "sony-wh-1000xm5",
    title: "Sony WH-1000XM5",
    category: "Audio",
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=300&fit=crop",
    rating: 4.6,
    verdict: "Industry-leading noise cancellation with exceptional sound quality.",
    pros: ["Best-in-class ANC", "30-hour battery", "Comfortable fit", "Multi-device pairing"],
    cons: ["No folding design", "Expensive", "Touch controls can be finicky"],
    price: "$399",
    releaseDate: "May 2022",
  },
  {
    id: "5",
    slug: "google-pixel-8-pro",
    title: "Google Pixel 8 Pro",
    category: "Smartphones",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=300&fit=crop",
    rating: 4.5,
    verdict: "Google's AI magic shines in the best Pixel camera experience yet.",
    pros: ["Exceptional camera AI", "7 years of updates", "Clean Android", "Tensor G3 chip"],
    cons: ["Average battery", "Slow charging", "Limited availability"],
    price: "$999",
    releaseDate: "Oct 2023",
  },
  {
    id: "6",
    slug: "apple-watch-series-9",
    title: "Apple Watch Series 9",
    category: "Wearables",
    image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=300&fit=crop",
    rating: 4.4,
    verdict: "The most capable Apple Watch with new gesture controls and brighter display.",
    pros: ["Double tap gesture", "Brighter display", "Precise Find iPhone", "S9 chip"],
    cons: ["Incremental upgrade", "Expensive", "Requires iPhone"],
    price: "$399",
    releaseDate: "Sep 2023",
  },
];

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
      <span className="ml-1 text-sm font-semibold text-foreground">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function Reviews() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("rating");

  const filteredReviews = reviews
    .filter((review) => {
      const matchesSearch = review.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || review.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "newest") return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      return a.title.localeCompare(b.title);
    });

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              Expert Reviews
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              In-Depth Product <span className="text-gradient">Reviews</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              AI-generated reviews using official specs and aggregated user sentiment. 
              Get honest pros, cons, and verdicts to make informed decisions.
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
              <Input
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReviews.map((review) => (
              <article
                key={review.id}
                className="group bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-elevated hover:border-primary/20 transition-all duration-300"
              >
                {/* Product Image */}
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={review.image}
                    alt={review.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary">{review.category}</Badge>
                  </div>
                  <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1">
                    <StarRating rating={review.rating} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{review.releaseDate}</span>
                    <span className="text-sm font-semibold text-primary">{review.price}</span>
                  </div>

                  <h2 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {review.title}
                  </h2>

                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {review.verdict}
                  </p>

                  {/* Pros & Cons Preview */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <ThumbsUp className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground line-clamp-1">
                        {review.pros[0]}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ThumbsDown className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground line-clamp-1">
                        {review.cons[0]}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/reviews/${review.slug}`}
                    className="inline-flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all"
                  >
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
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
              >
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
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Compare Products Side by Side
            </h2>
            <p className="text-muted-foreground mb-6">
              Use our phone comparison tool to see detailed spec comparisons between your favorite devices.
            </p>
            <Button asChild variant="hero">
              <Link to="/tools/phone-comparison">
                Try Phone Comparison
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
