import CategoryPage from "./CategoryPage";
import { DollarSign } from "lucide-react";

export default function SmartIncome() {
  return (
    <CategoryPage
      categoryName="Smart Income"
      categoryTitle="Digital Entrepreneurship"
      categoryDescription="Build skills, launch projects, and grow your digital career with practical guides and proven strategies."
      categoryTags={["money", "income", "earn", "side hustle", "passive", "freelance", "remote work"]}
      heroIcon={<DollarSign className="w-8 h-8" />}
    />
  );
}
