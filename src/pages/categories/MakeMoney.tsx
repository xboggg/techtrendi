import CategoryPage from "./CategoryPage";
import { DollarSign } from "lucide-react";

export default function MakeMoney() {
  return (
    <CategoryPage
      categoryName="Make Money"
      categoryTitle="Make Money Online"
      categoryDescription="Discover legitimate ways to earn income using technology, from side hustles to passive income streams."
      categoryTags={["money", "income", "earn", "side hustle", "passive", "freelance", "remote work"]}
      heroIcon={<DollarSign className="w-8 h-8" />}
    />
  );
}
