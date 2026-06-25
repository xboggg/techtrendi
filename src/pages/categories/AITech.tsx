import CategoryPage from "./CategoryPage";
import { Sparkles } from "lucide-react";

export default function AITech() {
  return (
    <CategoryPage
      categoryName="AI Tech"
      categoryTitle="AI & Emerging Technology"
      categoryDescription="Explore the cutting edge of technology including artificial intelligence, machine learning, and what is coming next."
      categoryTags={["ai", "artificial intelligence", "chatgpt", "machine learning", "automation", "future", "emerging"]}
      heroIcon={<Sparkles className="w-8 h-8" />}
    />
  );
}
