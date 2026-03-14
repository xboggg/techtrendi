import CategoryPage from "./CategoryPage";
import { Headphones } from "lucide-react";

export default function Accessories() {
  return (
    <CategoryPage
      categoryName="Accessories"
      categoryTitle="Tech Accessories & Gadgets"
      categoryDescription="Reviews and buying guides for headphones, chargers, cases, wearables, and all the tech accessories you need."
      categoryTags={["accessories", "headphones", "earbuds", "charger", "case", "wearable", "gadget", "smartwatch"]}
      heroIcon={<Headphones className="w-8 h-8" />}
    />
  );
}
