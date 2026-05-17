type Accent = "red" | "green" | "blue" | "yellow" | "purple";

type Props = {
  label: string;
  value: number;
  max: number;
  accent?: Accent;
  color?: string;
};

const ACCENT_BARS: Record<Accent, string> = {
  red: "bg-destructive",
  green: "bg-success",
  blue: "bg-primary",
  yellow: "bg-warning",
  purple: "bg-accent-foreground",
};

export default function MetricBar({ label, value, max, accent, color }: Props) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const barCls = accent ? ACCENT_BARS[accent] : (color ?? "bg-primary");

  return (
    <div className="group py-1.5">
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
        <div
          className={`h-full rounded-full transition-all duration-500 ${barCls} opacity-75`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
