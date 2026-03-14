import { useState } from "react";
import { useToolUsageTracker } from "@/hooks/useToolUsageTracker";
import { supabase } from "@/integrations/supabase/client";
import { Star, X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ToolFeedbackPromptProps {
  toolId: string;
  toolName: string;
}

export function ToolFeedbackPrompt({ toolId, toolName }: ToolFeedbackPromptProps) {
  const { showPrompt, markFeedbackGiven } = useToolUsageTracker(toolId);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!showPrompt || dismissed) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("tool_feedback" as any).insert([
        {
          tool_id: toolId,
          tool_name: toolName,
          rating,
          comment: comment.trim(),
          user_agent: navigator.userAgent,
        },
      ]);

      if (error) throw error;

      markFeedbackGiven();
      toast.success("Thanks for your feedback!");
    } catch (err: any) {
      toast.error("Failed to submit feedback. Please try again.");
      console.error("Feedback submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 animate-in slide-in-from-bottom duration-500">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-lg p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">
            How's {toolName} working for you?
          </h3>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Star Rating */}
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="p-0.5 hover:scale-110 transition-transform"
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "w-6 h-6 transition-colors",
                  (hoveredStar || rating) >= star
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-muted-foreground"
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Great"}
              {rating === 5 && "Excellent"}
            </span>
          )}
        </div>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Any suggestions or comments? (optional)"
          rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none mb-3"
        />

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || rating === 0}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            rating > 0
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </div>
    </div>
  );
}

export default ToolFeedbackPrompt;
