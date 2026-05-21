import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const sectionHeaderVariants = cva("flex items-center gap-2 pb-3 border-b border-border/50", {
  variants: {
    size: {
      sm: "mb-3",
      default: "mb-4",
      lg: "mb-5",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const sectionHeaderTitleVariants = cva(
  "font-semibold uppercase tracking-widest text-muted-foreground",
  {
    variants: {
      size: {
        sm: "text-[10px]",
        default: "text-[11px]",
        lg: "text-xs",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export type SectionHeaderSize = VariantProps<typeof sectionHeaderVariants>["size"];

export interface SectionHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  count?: number;
  right?: React.ReactNode;
  size?: SectionHeaderSize;
  className?: string;
}

export function SectionHeader({
  icon,
  title,
  subtitle,
  count,
  right,
  size = "default",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn(sectionHeaderVariants({ size }), className)}>
      <div className="flex items-center gap-2 min-w-0">
        {icon && <span className="text-primary/60 shrink-0">{icon}</span>}
        <h2 className={cn("truncate", sectionHeaderTitleVariants({ size }))}>{title}</h2>
        {count !== undefined && (
          <Badge
            variant="secondary"
            className="text-[10px] h-4 px-1.5 font-bold bg-muted/80 text-muted-foreground border-none"
          >
            {count}
          </Badge>
        )}
      </div>
      {subtitle && <span className="text-xs text-muted-foreground ml-2 truncate">{subtitle}</span>}
      {right && <div className="ml-auto shrink-0 flex items-center gap-2">{right}</div>}
    </div>
  );
}
