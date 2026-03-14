import CategoryPage from "./CategoryPage";
import { HeartPulse } from "lucide-react";

export default function HealthTech() {
  return (
    <CategoryPage
      categoryName="Health Tech"
      categoryTitle="Health Tech & Wellness"
      categoryDescription="Explore how technology is transforming health and wellness — from fitness trackers to telemedicine and mental health apps."
      categoryTags={["health", "health tech", "fitness", "wellness", "mental health", "telemedicine", "wearable health"]}
      heroIcon={<HeartPulse className="w-8 h-8" />}
    />
  );
}
