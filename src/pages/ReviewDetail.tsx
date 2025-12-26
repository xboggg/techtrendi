import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Star, ThumbsUp, ThumbsDown, ArrowLeft, Calendar, DollarSign, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Helmet } from "react-helmet-async";

interface Review {
  id: string;
  slug: string;
  title: string;
  category: string;
  image: string | null;
  rating: number;
  verdict: string;
  pros: string[];
  cons: string[];
  price: string | null;
  release_date: string | null;
  full_review: string | null;
  specs: Record<string, string>;
  views: number | null;
  created_at: string;
}

function StarRating({ rating, size = "default" }: { rating: number; size?: "default" | "large" }) {
  const starSize = size === "large" ? "w-6 h-6" : "w-4 h-4";
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSize} ${
            star <= rating
              ? "fill-primary text-primary"
              : star <= rating + 0.5
              ? "fill-primary/50 text-primary"
              : "text-muted-foreground"
          }`}
        />
      ))}
      <span className={`ml-2 font-bold text-foreground ${size === "large" ? "text-2xl" : "text-sm"}`}>
        {Number(rating).toFixed(1)}
      </span>
    </div>
  );
}

function ProductSchema({ review }: { review: Review }) {
  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: review.title,
    image: review.image,
    description: review.verdict,
    review: {
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: "5",
      },
      author: {
        "@type": "Organization",
        name: "TechTrendi",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: review.rating,
      reviewCount: review.views || 1,
    },
    offers: review.price
      ? {
          "@type": "Offer",
          price: review.price.replace(/[^0-9.]/g, ""),
          priceCurrency: "USD",
        }
      : undefined,
  };

  return (
    <Helmet>
      <title>{review.title} Review | TechTrendi</title>
      <meta name="description" content={review.verdict} />
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export default function ReviewDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: review, isLoading, error } = useQuery({
    queryKey: ["review", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Review not found");
      
      return data as Review;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-12">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-64 w-full mb-8 rounded-2xl" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      </Layout>
    );
  }

  if (error || !review) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Review Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The review you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/reviews">Back to Reviews</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const specs = review.specs || {};

  return (
    <Layout>
      <ProductSchema review={review} />

      {/* Back Button */}
      <div className="container pt-8">
        <Link
          to="/reviews"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Reviews
        </Link>
      </div>

      {/* Hero Section */}
      <section className="py-8 md:py-12">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Product Image */}
            <div className="relative aspect-video lg:aspect-square rounded-2xl overflow-hidden bg-muted">
              {review.image && (
                <img
                  src={review.image}
                  alt={review.title}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute top-4 left-4">
                <Badge variant="secondary">{review.category}</Badge>
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {review.title}
                </h1>
                <StarRating rating={review.rating} size="large" />
              </div>

              <p className="text-lg text-muted-foreground">{review.verdict}</p>

              <div className="flex flex-wrap gap-4">
                {review.price && (
                  <div className="flex items-center gap-2 text-foreground">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <span className="font-semibold">{review.price}</span>
                  </div>
                )}
                {review.release_date && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-5 h-5" />
                    <span>{review.release_date}</span>
                  </div>
                )}
                {review.views && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="w-5 h-5" />
                    <span>{review.views.toLocaleString()} views</span>
                  </div>
                )}
              </div>

              {/* Pros & Cons */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-green-500/10 rounded-xl p-5">
                  <h3 className="flex items-center gap-2 font-semibold text-green-600 dark:text-green-400 mb-4">
                    <ThumbsUp className="w-5 h-5" />
                    Pros
                  </h3>
                  <ul className="space-y-2">
                    {review.pros.map((pro, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-green-500 mt-1">✓</span>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-red-500/10 rounded-xl p-5">
                  <h3 className="flex items-center gap-2 font-semibold text-red-600 dark:text-red-400 mb-4">
                    <ThumbsDown className="w-5 h-5" />
                    Cons
                  </h3>
                  <ul className="space-y-2">
                    {review.cons.map((con, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-red-500 mt-1">✗</span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specifications Table */}
      {Object.keys(specs).length > 0 && (
        <section className="py-8 md:py-12 bg-muted/30">
          <div className="container">
            <h2 className="text-2xl font-bold text-foreground mb-6">Specifications</h2>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Specification</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(specs).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium capitalize">
                        {key.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell>{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      )}

      {/* Full Review */}
      {review.full_review && (
        <section className="py-8 md:py-12">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-6">Full Review</h2>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {review.full_review.split("\n\n").map((paragraph, index) => (
                  <p key={index} className="text-muted-foreground mb-4 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Verdict */}
      <section className="py-8 md:py-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Our Verdict</h2>
            <div className="mb-6">
              <StarRating rating={review.rating} size="large" />
            </div>
            <p className="text-lg text-muted-foreground mb-6">{review.verdict}</p>
            <Button asChild variant="hero">
              <Link to="/reviews">Explore More Reviews</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
