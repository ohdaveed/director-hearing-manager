import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Progress } from "./progress";

const metricBarVariants = cva(
  "h-full rounded-full transition-all duration-500 opacity-75",
  {
    variants: {
      accent: {
        red: "bg-destructive",
        green: "bg-success",
        blue: "bg-primary",
        yellow: "bg-warning",
        purple: "bg-accent-foreground",
      },
    },
    defaultVariants: {
      accent: undefined,
    },
  },
);

export type MetricProgressAccent = VariantProps<
  typeof metricBarVariants
>["accent"];

export interface MetricProgressProps {
  label: string;
  value: number;
  max: number;
  accent?: MetricProgressAccent;
  color?: string;
  className?: string;
}

export function MetricProgress({
  label,
  value,
  max,
  accent,
  color,
  className,
}: MetricProgressProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const barCls = accent
    ? metricBarVariants({ accent })
    : (color ?? "bg-primary");

  return (
    <div className={cn("group py-1.5", className)}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span
          className="text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors"
          title={label}
        >
          {label}
        </span>
        <span className="text-xs font-bold tabular-nums shrink-0 text-foreground">
          {value}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <Progress value={pct} indicatorClassName={barCls} />
      </div>
    </div>
  );
}
