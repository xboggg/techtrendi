import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { AnimatedCard } from "@/components/ui/animated-card";

const reactions = [
  { type: "helpful", emoji: "👍", label: "Helpful" },
  { type: "love", emoji: "❤️", label: "Love" },
  { type: "fire", emoji: "🔥", label: "Fire" },
  { type: "insightful", emoji: "💡", label: "Insightful" },
  { type: "mindblown", emoji: "😮", label: "Mind Blown" },
];

interface ReactionCounts {
  [key: string]: number;
}

interface ArticleReactionsProps {
  articleId: string;
  className?: string;
}

export function ArticleReactions({ articleId, className }: ArticleReactionsProps) {
  const { user } = useAuth();
  const [reactionCounts, setReactionCounts] = useState<ReactionCounts>({});
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReactions();
  }, [articleId, user]);

  const fetchReactions = async () => {
    try {
      const { data: allReactions, error } = await supabase
        .from("article_reactions")
        .select("reaction_type")
        .eq("article_id", articleId);

      if (error) throw error;

      const counts: ReactionCounts = {};
      allReactions?.forEach((r) => {
        counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
      });
      setReactionCounts(counts);

      if (user) {
        const { data: userReactionsData } = await supabase
          .from("article_reactions")
          .select("reaction_type")
          .eq("article_id", articleId)
          .eq("user_id", user.id);

        setUserReactions(new Set(userReactionsData?.map((r) => r.reaction_type) || []));
      }
    } catch (error) {
      console.error("Error fetching reactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (reactionType: string) => {
    if (!user) {
      toast.error("Please log in to react");
      return;
    }

    const hasReacted = userReactions.has(reactionType);

    try {
      if (hasReacted) {
        const { error } = await supabase
          .from("article_reactions")
          .delete()
          .eq("article_id", articleId)
          .eq("user_id", user.id)
          .eq("reaction_type", reactionType);

        if (error) throw error;

        setUserReactions((prev) => {
          const next = new Set(prev);
          next.delete(reactionType);
          return next;
        });
        setReactionCounts((prev) => ({
          ...prev,
          [reactionType]: Math.max(0, (prev[reactionType] || 0) - 1),
        }));
      } else {
        const { error } = await supabase
          .from("article_reactions")
          .insert({
            article_id: articleId,
            user_id: user.id,
            reaction_type: reactionType,
          });

        if (error) throw error;

        await supabase.rpc("award_xp", { user_uuid: user.id, xp_amount: 10 });

        await supabase.from("user_activity").insert({
          user_id: user.id,
          activity_type: "reaction",
          article_id: articleId,
          xp_earned: 10,
          metadata: { reaction_type: reactionType },
        });

        setUserReactions((prev) => new Set(prev).add(reactionType));
        setReactionCounts((prev) => ({
          ...prev,
          [reactionType]: (prev[reactionType] || 0) + 1,
        }));

        toast.success("Reaction added! +10 XP", { icon: reactions.find(r => r.type === reactionType)?.emoji });
      }
    } catch (error) {
      console.error("Error handling reaction:", error);
      toast.error("Failed to update reaction");
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {reactions.map((r) => (
          <div key={r.type} className="w-16 h-12 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <AnimatedCard animation="scale-in" className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-2">React:</span>
        {reactions.map((reaction) => {
          const count = reactionCounts[reaction.type] || 0;
          const isActive = userReactions.has(reaction.type);

          return (
            <button
              key={reaction.type}
              onClick={() => handleReaction(reaction.type)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200",
                "hover:scale-110 active:scale-95",
                isActive
                  ? "bg-primary/10 border-primary text-primary shadow-lg"
                  : "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
              )}
              title={reaction.label}
            >
              <span className="text-xl">{reaction.emoji}</span>
              {count > 0 && (
                <span className={cn("text-sm font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </AnimatedCard>
  );
}
