import CategoryPage from "./CategoryPage";
import { HelpCircle } from "lucide-react";

export default function HowTo() {
  return (
    <CategoryPage
      categoryName="How-To"
      categoryTitle="How-To Guides"
      categoryDescription="Step-by-step tutorials to solve common tech problems, fix issues, and master your devices."
      categoryTags={["how to", "guide", "tutorial", "fix", "solve", "troubleshoot", "step"]}
      heroIcon={<HelpCircle className="w-8 h-8" />}
    />
  );
}
