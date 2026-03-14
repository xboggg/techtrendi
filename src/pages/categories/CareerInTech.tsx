import CategoryPage from "./CategoryPage";
import { Briefcase } from "lucide-react";

export default function CareerInTech() {
  return (
    <CategoryPage
      categoryName="Career in Tech"
      categoryTitle="Career in Tech"
      categoryDescription="Navigate your tech career with guides on landing jobs, building skills, acing interviews, and growing professionally."
      categoryTags={["career", "tech career", "job", "interview", "resume", "skill", "professional", "developer career"]}
      heroIcon={<Briefcase className="w-8 h-8" />}
    />
  );
}
