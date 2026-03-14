import CategoryPage from "./CategoryPage";
import { Wifi } from "lucide-react";

export default function RemoteWork() {
  return (
    <CategoryPage
      categoryName="Remote Work"
      categoryTitle="Remote Work & Digital Nomad"
      categoryDescription="Master remote work with guides on tools, productivity hacks, home office setups, and the digital nomad lifestyle."
      categoryTags={["remote work", "work from home", "digital nomad", "home office", "remote", "hybrid work", "telecommute"]}
      heroIcon={<Wifi className="w-8 h-8" />}
    />
  );
}
