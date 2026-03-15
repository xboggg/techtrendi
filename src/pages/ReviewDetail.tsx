import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Star, ThumbsUp, ThumbsDown, ArrowLeft, Calendar, DollarSign, Eye } from "lucide-react";
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
import { Helmet } from "react-helmet-async";
import DOMPurify from "dompurify";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";
import { ShareButtons } from "@/components/ui/share-buttons";

function renderReviewContent(content: string): string {
  const hasHtmlTags = /<(h[1-6]|p|div|ul|ol|li|blockquote|strong|em|a|img|pre|code|table|br)\b/i.test(content);

  if (hasHtmlTags) {
    return DOMPurify.sanitize(content, { ADD_ATTR: ['target', 'rel', 'class'], ADD_TAGS: ['iframe'] });
  }

  let html = content
    .replace(/^### (.+)$/gm, (_m, text) => `<h3 class="text-xl font-semibold mt-8 mb-4 text-foreground">${text}</h3>`)
    .replace(/^## (.+)$/gm, (_m, text) => `<h2 class="text-2xl font-bold mt-10 mb-4 text-foreground">${text}</h2>`)
    .replace(/^# (.+)$/gm, (_m, text) => `<h1 class="text-3xl font-bold mt-12 mb-6 text-foreground">${text}</h1>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (_m, linkText, url) => {
      const cleanUrl = url.trim();
      if (cleanUrl.match(/^https?:\/\//i) || cleanUrl.startsWith('/')) {
        return `<a href="${cleanUrl}" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      }
      return linkText;
    })
    .replace(/`(.+?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-muted-foreground mb-1">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-muted-foreground mb-1">$2</li>')
    .replace(/^---$/gm, '<hr class="my-8 border-border" />')
    .replace(/\n\n/g, '</p><p class="text-muted-foreground leading-relaxed mb-4">')
    .replace(/\n/g, '<br />');

  html = `<p class="text-muted-foreground leading-relaxed mb-4">${html}</p>`;
  return DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'rel', 'class'], ADD_TAGS: ['iframe'] });
}

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
  specs: Record<string, string> | null;
  views: number | null;
  is_published: boolean;
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

function RelatedReviews({ category, currentSlug }: { category: string; currentSlug: string }) {
  const [relatedReviews, setRelatedReviews] = useState<Review[]>([]);

  useEffect(() => {
    const fetchRelated = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_published", true)
        .eq("category", category)
        .neq("slug", currentSlug)
        .limit(3);

      if (data) setRelatedReviews(data as Review[]);
    };
    fetchRelated();
  }, [category, currentSlug]);

  if (relatedReviews.length === 0) return null;

  return (
    <section className="py-8 md:py-12 border-t border-border">
      <div className="container">
        <h2 className="text-2xl font-bold text-foreground mb-6">Related Reviews</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {relatedReviews.map((review) => (
            <Link
              key={review.id}
              to={`/reviews/${review.slug}`}
              className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-elevated hover:border-primary/20 transition-all"
            >
              {review.image && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={review.image}
                    alt={review.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-4">
                <Badge variant="secondary" className="mb-2">{review.category}</Badge>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {review.title}
                </h3>
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span className="text-sm font-medium">{Number(review.rating).toFixed(1)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ReviewDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error || !data) {
        setReview(null);
      } else {
        setReview(data as Review);
        // Increment views
        supabase
          .from("reviews")
          .update({ views: (data.views || 0) + 1 })
          .eq("id", data.id)
          .then(() => {});
      }
      setLoading(false);
    };

    fetchReview();
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!review) {
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
                <img src={review.image} alt={review.title} className="w-full h-full object-cover" />
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
                        <span className="text-green-500 mt-1">+</span>
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
                        <span className="text-red-500 mt-1">-</span>
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
                      <TableCell className="font-medium capitalize">{key.replace(/_/g, " ")}</TableCell>
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
              <div
                className="prose prose-lg max-w-none
                  prose-headings:text-foreground prose-headings:font-bold
                  prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                  prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                  prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
                  prose-li:text-muted-foreground prose-li:mb-2
                  prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
                  prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                  prose-hr:my-8 prose-hr:border-border"
                dangerouslySetInnerHTML={{ __html: renderReviewContent(review.full_review) }}
              />

              {/* Share & Newsletter */}
              <div className="mt-10 flex items-center gap-4">
                <ShareButtons
                  url={window.location.href}
                  title={review.title}
                  description={review.verdict}
                  variant="compact"
                />
              </div>
              <div className="mt-8">
                <NewsletterForm variant="default" />
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

      {/* Related Reviews */}
      <RelatedReviews category={review.category} currentSlug={review.slug} />
    </Layout>
  );
}
