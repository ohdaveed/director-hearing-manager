import { Users } from "lucide-react";
import { MetricProgress } from "@/components/ui/metric-progress";
import { SectionHeader } from "@/components/ui/section-header";

type InspectorData = {
  name: string;
  count: number;
  overdue: number;
};

type Props = {
  inspectors: InspectorData[];
  maxCount: number;
};

export default function InspectorWorkloadWidget({
  inspectors,
  maxCount,
}: Props) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-5">
      <SectionHeader
        icon={<Users className="w-4 h-4" />}
        title="Inspector Workload"
      />
      {inspectors.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active assignments.</p>
      ) : (
        <div>
          {inspectors.map((i) => (
            <div key={i.name}>
              <MetricProgress
                label={i.name.replace(" (DPH)", "")}
                value={i.count}
                max={maxCount}
                accent={i.overdue > 0 ? "red" : "blue"}
              />
              {i.overdue > 0 && (
                <p className="text-[10px] text-destructive text-right -mt-0.5 mb-1 pr-0.5">
                  {i.overdue} overdue
                </p>
              )}
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground mt-3">
            Red bars indicate inspector has overdue cases.
          </p>
        </div>
      )}
    </div>
  );
}
