import { Zap, Trash2 } from "lucide-react";
import ViolationTypeSelector from "./ViolationTypeSelector";

export function ViolationHeader({
  index,
  violation,
  onRemove,
  onViolationSelect,
  readOnly,
}: {
  index: number;
  violation: any;
  onRemove: () => void;
  onViolationSelect: (key: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 pt-4 pb-3">
      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <ViolationTypeSelector
          value={violation.violationKey}
          onChange={onViolationSelect}
          readOnly={readOnly}
        />
      </div>
      {violation.isAuto && (
        <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
          <Zap className="w-2.5 h-2.5" /> Auto
        </span>
      )}
      {!readOnly && (
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
