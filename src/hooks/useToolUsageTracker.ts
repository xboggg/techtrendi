import { useState, useEffect } from "react";

export function useToolUsageTracker(toolId: string) {
  const usageKey = `tool_usage_${toolId}`;
  const feedbackKey = `tool_feedback_given_${toolId}`;

  const [usageCount, setUsageCount] = useState(0);
  const [hasFeedback, setHasFeedback] = useState(false);

  useEffect(() => {
    // Increment usage count on mount
    const currentCount = parseInt(localStorage.getItem(usageKey) || "0", 10);
    const newCount = currentCount + 1;
    localStorage.setItem(usageKey, String(newCount));
    setUsageCount(newCount);

    // Check if feedback was already given
    setHasFeedback(localStorage.getItem(feedbackKey) === "true");
  }, [usageKey, feedbackKey]);

  const markFeedbackGiven = () => {
    localStorage.setItem(feedbackKey, "true");
    setHasFeedback(true);
  };

  const showPrompt = usageCount >= 3 && !hasFeedback;

  return { usageCount, hasFeedback, showPrompt, markFeedbackGiven };
}
