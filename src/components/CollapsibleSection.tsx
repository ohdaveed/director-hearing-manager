import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

interface Props {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  badge?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  printHidden?: boolean;
  borderHighlight?: boolean;
  noPadding?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  icon,
  subtitle,
  badge,
  open,
  onToggle,
  printHidden,
  borderHighlight,
  noPadding,
  children,
}: Props) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onToggle}
      className={`bg-card rounded-xl shadow-sm mb-4 sm:mb-6 overflow-hidden transition-shadow duration-200 hover:shadow-md ${printHidden ? "print:hidden" : ""} ${borderHighlight ? "border-2 border-primary/30" : "border border-border"}`}
    >
      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-muted/20 transition-colors text-left">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon}
          <h2 className="font-semibold text-foreground text-base">{title}</h2>
          {subtitle && (
            <span className="text-xs text-muted-foreground hidden sm:inline ml-1">
              — {subtitle}
            </span>
          )}
          {badge && <span className="ml-2">{badge}</span>}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ml-2 ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden">
        {noPadding ? (
          <div className="border-t border-border">{children}</div>
        ) : (
          <div className="px-4 sm:px-6 pb-5 pt-4 border-t border-border">{children}</div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
