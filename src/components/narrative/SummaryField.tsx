import { BookOpen } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export interface SummaryFieldProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  description?: string;
}

export function SummaryField({
  value,
  onChange,
  disabled,
  placeholder = "Describe the overall condition of the property and key findings from this inspection...",
  label = "Summary",
  description = "Provide an overview of the inspection and key findings.",
}: SummaryFieldProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-foreground text-lg">{label}</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{description}</p>
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="min-h-[100px] resize-none text-sm"
      />
    </div>
  );
}
