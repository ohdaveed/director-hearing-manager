import { BarChart3 } from "lucide-react";
import { MetricProgress } from "@/components/ui/metric-progress";
import { SectionHeader } from "@/components/ui/section-header";

type CategoryItem = {
  cat: string;
  count: number;
};

type Props = {
  categories: CategoryItem[];
  maxCount: number;
};

export default function TopCategoriesWidget({ categories, maxCount }: Props) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-5">
      <SectionHeader
        icon={<BarChart3 className="w-4 h-4" />}
        title="Top Categories"
      />
      <div>
        {categories.map((c) => (
          <MetricProgress
            key={c.cat}
            label={c.cat}
            value={c.count}
            max={maxCount}
            accent="purple"
          />
        ))}
      </div>
    </div>
  );
}
