import { memo } from "react";
import { Link } from "react-router-dom";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statCardVariants = cva(
  "relative rounded-xl border overflow-hidden shadow-sm transition-all",
  {
    variants: {
      accent: {
        red: "bg-destructive/8 border-destructive/25",
        yellow: "bg-warning/8 border-warning/25",
        green: "bg-success/8 border-success/25",
        blue: "bg-primary/8 border-primary/25",
        purple: "bg-accent/40 border-accent/30",
      },
      interactive: {
        true: "hover:shadow-md hover:-translate-y-px cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
      },
    },
    defaultVariants: {
      accent: undefined,
      interactive: false,
    },
  },
);

const statBarVariants = cva("h-[3px] w-full", {
  variants: {
    accent: {
      red: "bg-destructive",
      yellow: "bg-warning",
      green: "bg-success",
      blue: "bg-primary",
      purple: "bg-accent-foreground",
    },
  },
  defaultVariants: {
    accent: undefined,
  },
});

const statValueVariants = cva(
  "text-[28px] font-black tabular-nums leading-none tracking-tight mb-0.5",
  {
    variants: {
      accent: {
        red: "text-destructive",
        yellow: "text-warning",
        green: "text-success",
        blue: "text-primary",
        purple: "text-accent-foreground",
      },
    },
    defaultVariants: {
      accent: undefined,
    },
  },
);

const statIconVariants = cva("flex-shrink-0 opacity-70", {
  variants: {
    accent: {
      red: "text-destructive/60",
      yellow: "text-warning/60",
      green: "text-success/60",
      blue: "text-primary/60",
      purple: "text-accent-foreground/60",
    },
  },
  defaultVariants: {
    accent: undefined,
  },
});

export type StatCardAccent = VariantProps<typeof statCardVariants>["accent"];

export interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  accent?: StatCardAccent;
  icon?: React.ReactNode;
  to?: string;
  onClick?: () => void;
  className?: string;
}

const StatCard = memo(function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
  to,
  onClick,
  className,
}: StatCardProps) {
  const interactive = !!(to || onClick);

  const content = (
    <>
      <div className={statBarVariants({ accent })} />
      <div className="px-4 pt-3.5 pb-4">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
            {label}
          </p>
          {icon && <span className={statIconVariants({ accent })}>{icon}</span>}
        </div>
        <p className={statValueVariants({ accent })}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {sub && <p className="text-[11px] mt-2 text-muted-foreground leading-snug">{sub}</p>}
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cn(statCardVariants({ accent, interactive: true }), className)}>
        {content}
      </Link>
    );
  }

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={cn(statCardVariants({ accent, interactive }), className)}
    >
      {content}
    </div>
  );
});

export { StatCard };
