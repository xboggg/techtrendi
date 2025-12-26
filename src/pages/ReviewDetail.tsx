import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Star, ThumbsUp, ThumbsDown, ArrowLeft, Calendar, DollarSign, Eye, Send, MessageSquare, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { format } from "date-fns";

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

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_approved: boolean;
  profile?: { full_name: string | null; email: string | null };
  isAdmin?: boolean;
}

interface Rating {
  id: string;
  user_id: string;
  rating: number;
}

function StarRating({ rating, size = "default", interactive = false, onRate }: { 
  rating: number; 
  size?: "default" | "large"; 
  interactive?: boolean;
  onRate?: (rating: number) => void;
}) {
  const starSize = size === "large" ? "w-6 h-6" : "w-4 h-4";
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate?.(star)}
          className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
        >
          <Star
            className={`${starSize} ${
              star <= rating
                ? "fill-primary text-primary"
                : star <= rating + 0.5
                ? "fill-primary/50 text-primary"
                : "text-muted-foreground"
            }`}
          />
        </button>
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
  const { data: relatedReviews = [] } = useQuery({
    queryKey: ["related-reviews", category, currentSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, slug, title, image, rating, category")
        .eq("category", category)
        .eq("is_published", true)
        .neq("slug", currentSlug)
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

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

function CommentsSection({ reviewId }: { reviewId: string }) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["review-comments", reviewId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_comments")
        .select("*")
        .eq("review_id", reviewId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles and admin roles
      const userIds = [...new Set(data.map(c => c.user_id))];
      const [profilesResult, rolesResult] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds),
        supabase.from("user_roles").select("user_id, role").in("user_id", userIds).eq("role", "admin")
      ]);

      const profileMap = new Map(profilesResult.data?.map(p => [p.user_id, p]) || []);
      const adminSet = new Set(rolesResult.data?.map(r => r.user_id) || []);

      return data.map(comment => ({
        ...comment,
        profile: profileMap.get(comment.user_id),
        isAdmin: adminSet.has(comment.user_id),
      })) as Comment[];
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("review_comments").insert({
        review_id: reviewId,
        user_id: user!.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-comments", reviewId] });
      setNewComment("");
      toast.success("Comment submitted for moderation");
    },
    onError: (error) => {
      toast.error(`Failed to post comment: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (newComment.length > 1000) {
      toast.error("Comment is too long (max 1000 characters)");
      return;
    }
    addCommentMutation.mutate(newComment.trim());
  };

  const approvedComments = comments.filter(c => c.is_approved);
  const userPendingComments = comments.filter(c => !c.is_approved && c.user_id === user?.id);

  return (
    <section className="py-8 md:py-12 border-t border-border">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Comments ({approvedComments.length})
          </h2>

          {/* Add Comment Form */}
          {user ? (
            <form onSubmit={handleSubmit} className="mb-8">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts on this product..."
                rows={3}
                maxLength={1000}
                className="mb-3"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {newComment.length}/1000 characters
                </span>
                <Button type="submit" disabled={!newComment.trim() || addCommentMutation.isPending}>
                  <Send className="w-4 h-4 mr-2" />
                  Post Comment
                </Button>
              </div>
            </form>
          ) : (
            <div className="bg-muted/50 rounded-xl p-6 text-center mb-8">
              <p className="text-muted-foreground mb-3">Sign in to leave a comment</p>
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          )}

          {/* Pending Comments */}
          {userPendingComments.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-3">Your pending comments:</p>
              {userPendingComments.map((comment) => (
                <div key={comment.id} className="bg-muted/30 rounded-lg p-4 mb-3 border border-dashed border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">Pending Approval</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <p className="text-foreground">{comment.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Comments List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-lg p-4 border border-border">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : approvedComments.length > 0 ? (
            <div className="space-y-4">
              {approvedComments.map((comment) => (
                <div key={comment.id} className="bg-card rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {comment.profile?.full_name || "Anonymous"}
                      </span>
                      {comment.isAdmin && (
                        <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
                          <Shield className="w-3 h-3" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No comments yet. Be the first to share your thoughts!
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function UserRatingSection({ reviewId }: { reviewId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: ratings = [] } = useQuery({
    queryKey: ["review-ratings", reviewId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_ratings")
        .select("*")
        .eq("review_id", reviewId);

      if (error) throw error;
      return data as Rating[];
    },
  });

  const userRating = ratings.find((r) => r.user_id === user?.id);
  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0;

  const rateMutation = useMutation({
    mutationFn: async (rating: number) => {
      if (userRating) {
        const { error } = await supabase
          .from("review_ratings")
          .update({ rating })
          .eq("id", userRating.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("review_ratings").insert({
          review_id: reviewId,
          user_id: user!.id,
          rating,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-ratings", reviewId] });
      toast.success("Rating submitted!");
    },
    onError: (error) => {
      toast.error(`Failed to rate: ${error.message}`);
    },
  });

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="font-semibold text-foreground mb-4">User Ratings</h3>
      
      {ratings.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <StarRating rating={averageRating} />
            <span className="text-sm text-muted-foreground">
              ({ratings.length} {ratings.length === 1 ? "rating" : "ratings"})
            </span>
          </div>
        </div>
      )}

      {user ? (
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            {userRating ? "Update your rating:" : "Rate this product:"}
          </p>
          <StarRating
            rating={userRating?.rating || 0}
            interactive
            onRate={(rating) => rateMutation.mutate(rating)}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to rate this product
        </p>
      )}
    </div>
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

              {/* User Rating Section */}
              <UserRatingSection reviewId={review.id} />
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

      {/* Comments Section */}
      <CommentsSection reviewId={review.id} />

      {/* Related Reviews */}
      <RelatedReviews category={review.category} currentSlug={review.slug} />
    </Layout>
  );
}
