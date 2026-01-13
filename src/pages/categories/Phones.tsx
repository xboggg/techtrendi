import CategoryPage from "./CategoryPage";
import { Smartphone } from "lucide-react";

export default function Phones() {
  return (
    <CategoryPage
      categoryName="Phones"
      categoryTitle="Smartphones & Mobile Tech"
      categoryDescription="Discover the latest smartphone reviews, buying guides, comparisons, and tips to get the most out of your mobile device."
      categoryTags={["phone", "smartphone", "mobile", "iphone", "android", "samsung", "pixel"]}
      heroIcon={<Smartphone className="w-8 h-8" />}
    />
  );
}
