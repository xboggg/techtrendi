import CategoryPage from "./CategoryPage";
import { Zap } from "lucide-react";

export default function Productivity() {
  return (
    <CategoryPage
      categoryName="Productivity"
      categoryTitle="Productivity & Tools"
      categoryDescription="Work smarter with the best apps, tools, and techniques to boost your productivity and organize your digital life."
      categoryTags={["productivity", "tools", "apps", "work", "organize", "efficiency", "automation"]}
      heroIcon={<Zap className="w-8 h-8" />}
    />
  );
}
