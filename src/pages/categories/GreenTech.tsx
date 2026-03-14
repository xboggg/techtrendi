import CategoryPage from "./CategoryPage";
import { Leaf } from "lucide-react";

export default function GreenTech() {
  return (
    <CategoryPage
      categoryName="Green Tech"
      categoryTitle="Green Tech & Sustainability"
      categoryDescription="Discover how technology is driving sustainability — from solar energy and EVs to eco-friendly gadgets and smart homes."
      categoryTags={["green tech", "sustainability", "solar", "ev", "electric vehicle", "eco", "renewable", "environment"]}
      heroIcon={<Leaf className="w-8 h-8" />}
    />
  );
}
