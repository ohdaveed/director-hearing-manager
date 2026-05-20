import { BarChart3 } from "lucide-react";
import { MetricProgress } from "@/components/ui/metric-progress";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

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
    <Card>
      <CardHeader className="p-5 pb-0">
        <SectionHeader icon={<BarChart3 className="w-4 h-4" />} title="Top Categories" />
      </CardHeader>
      <CardContent className="p-5 pt-2">
        <div className="space-y-4">
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
      </CardContent>
    </Card>
  );
}
