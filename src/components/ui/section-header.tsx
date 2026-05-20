import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

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
  size?: SectionHeaderSize;
  className?: string;
}

export function SectionHeader({
  icon,
  title,
  subtitle,
  size = "default",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn(sectionHeaderVariants({ size }), className)}>
      {icon && <span className="text-primary/60 flex-shrink-0">{icon}</span>}
      <h2 className={sectionHeaderTitleVariants({ size })}>{title}</h2>
      {subtitle && <span className="text-xs text-muted-foreground ml-auto">{subtitle}</span>}
    </div>
  );
}
