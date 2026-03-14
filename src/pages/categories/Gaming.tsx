import CategoryPage from "./CategoryPage";
import { Gamepad2 } from "lucide-react";

export default function Gaming() {
  return (
    <CategoryPage
      categoryName="Gaming"
      categoryTitle="Gaming & Esports"
      categoryDescription="Stay up to date with gaming news, console reviews, PC builds, mobile gaming tips, and esports coverage."
      categoryTags={["gaming", "game", "esports", "console", "playstation", "xbox", "nintendo", "pc gaming"]}
      heroIcon={<Gamepad2 className="w-8 h-8" />}
    />
  );
}
