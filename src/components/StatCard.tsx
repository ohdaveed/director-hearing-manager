/**
 * StatCard.tsx — Reusable metric card for dashboards.
 */

type Accent = 'red' | 'yellow' | 'green' | 'blue' | 'purple';

type Props = {
  label: string;
  value: number | string;
  sub?: string;
  accent?: Accent;
  icon?: React.ReactNode;
};

const ACCENT_CLASSES: Record<Accent, { card: string; bar: string; value: string; icon: string }> = {
  red:    { card: 'bg-destructive/8 border-destructive/25',  bar: 'bg-destructive',      value: 'text-destructive',       icon: 'text-destructive/60' },
  yellow: { card: 'bg-warning/8 border-warning/25',          bar: 'bg-warning',           value: 'text-warning',           icon: 'text-warning/60' },
  green:  { card: 'bg-success/8 border-success/25',          bar: 'bg-success',           value: 'text-success',           icon: 'text-success/60' },
  blue:   { card: 'bg-primary/8 border-primary/25',          bar: 'bg-primary',           value: 'text-primary',           icon: 'text-primary/60' },
  purple: { card: 'bg-accent/40 border-accent/30',           bar: 'bg-accent-foreground', value: 'text-accent-foreground', icon: 'text-accent-foreground/60' },
};

export default function StatCard({ label, value, sub, accent, icon }: Props) {
  const ac = accent ? ACCENT_CLASSES[accent] : null;

  return (
    <div className={`relative rounded-xl border overflow-hidden shadow-sm transition-all hover:shadow-md hover:-translate-y-px ${ac ? ac.card : 'bg-card border-border'}`}>
      {/* Colored top accent bar */}
      <div className={`h-[3px] w-full ${ac ? ac.bar : 'bg-border/60'}`} />

      <div className="px-4 pt-3.5 pb-4">
        {/* Label + icon row */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
            {label}
          </p>
          {icon && (
            <span className={`flex-shrink-0 opacity-70 ${ac ? ac.icon : 'text-muted-foreground/40'}`}>
              {icon}
            </span>
          )}
        </div>

        {/* Value */}
        <p className={`text-[28px] font-black tabular-nums leading-none tracking-tight mb-0.5 ${ac ? ac.value : 'text-foreground'}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>

        {/* Subtitle */}
        {sub && (
          <p className="text-[11px] mt-2 text-muted-foreground leading-snug">{sub}</p>
        )}
      </div>
    </div>
  );
}
