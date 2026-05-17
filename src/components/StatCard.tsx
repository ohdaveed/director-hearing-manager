/**
 * StatCard.tsx — Reusable metric card for dashboards.
 * Supports optional navigation via `to` (React Router `<Link>`) or `onClick`.
 */

import { memo } from "react";
import { Link } from "react-router-dom";

type Accent = "red" | "yellow" | "green" | "blue" | "purple";

type Props = {
  label: string;
  value: number | string;
  sub?: string;
  accent?: Accent;
  icon?: React.ReactNode;
  to?: string;
  onClick?: () => void;
};

const ACCENT_CLASSES: Record<
  Accent,
  { card: string; bar: string; value: string; icon: string }
> = {
  red: {
    card: "bg-destructive/8 border-destructive/25",
    bar: "bg-destructive",
    value: "text-destructive",
    icon: "text-destructive/60",
  },
  yellow: {
    card: "bg-warning/8 border-warning/25",
    bar: "bg-warning",
    value: "text-warning",
    icon: "text-warning/60",
  },
  green: {
    card: "bg-success/8 border-success/25",
    bar: "bg-success",
    value: "text-success",
    icon: "text-success/60",
  },
  blue: {
    card: "bg-primary/8 border-primary/25",
    bar: "bg-primary",
    value: "text-primary",
    icon: "text-primary/60",
  },
  purple: {
    card: "bg-accent/40 border-accent/30",
    bar: "bg-accent-foreground",
    value: "text-accent-foreground",
    icon: "text-accent-foreground/60",
  },
};

const StatCard = memo(function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
  to,
  onClick,
}: Props) {
  const ac = accent ? ACCENT_CLASSES[accent] : null;
  const interactive = !!(to || onClick);
  const hoverCls = interactive
    ? "hover:shadow-md hover:-translate-y-px cursor-pointer"
    : "";
  const focusCls = interactive
    ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    : "";

  const content = (
    <>
      <div className={`h-[3px] w-full ${ac ? ac.bar : "bg-border/60"}`} />
      <div className="px-4 pt-3.5 pb-4">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
            {label}
          </p>
          {icon && (
            <span
              className={`flex-shrink-0 opacity-70 ${ac ? ac.icon : "text-muted-foreground/40"}`}
            >
              {icon}
            </span>
          )}
        </div>
        <p
          className={`text-[28px] font-black tabular-nums leading-none tracking-tight mb-0.5 ${ac ? ac.value : "text-foreground"}`}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {sub && (
          <p className="text-[11px] mt-2 text-muted-foreground leading-snug">
            {sub}
          </p>
        )}
      </div>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={`block relative rounded-xl border overflow-hidden shadow-sm transition-all ${hoverCls} ${focusCls} ${ac ? ac.card : "bg-card border-border"}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter") onClick();
            }
          : undefined
      }
      className={`relative rounded-xl border overflow-hidden shadow-sm transition-all ${hoverCls} ${focusCls} ${ac ? ac.card : "bg-card border-border"}`}
    >
      {content}
    </div>
  );
});

export default StatCard;
