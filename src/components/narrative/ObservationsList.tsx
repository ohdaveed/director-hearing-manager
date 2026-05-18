import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import { Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Violation } from "@/components/ViolationRow";
import { VIOLATION_TYPES } from "@/components/violationTypes";

type Observation = { id: string; text: string; linkedViolationKey: string };

export interface ObservationsListProps {
  observations: Observation[];
  filledViolations: Violation[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof Observation, value: string) => void;
  onChangeAny: () => void;
  disabled?: boolean;
}

export function ObservationsList({
  observations,
  filledViolations,
  onAdd,
  onRemove,
  onChange,
  onChangeAny,
  disabled,
}: ObservationsListProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground text-lg">
            Observations
          </h2>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            — list specific observations by number.
          </span>
        </div>
        <span className="bg-primary/10 text-primary text-sm font-semibold px-3 py-1 rounded-full">
          {observations.length} note{observations.length !== 1 ? "s" : ""}
        </span>
      </div>
      {observations.length === 0 ? (
        <div className="px-6 py-8 text-center text-muted-foreground text-sm">
          No observations added yet.
        </div>
      ) : (
        <div className="divide-y divide-border">
          <AnimatePresence mode="popLayout">
            {observations.map((obs, i) => (
              <motion.div
                key={obs.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.18 }}
                className="px-3 sm:px-6 py-4 flex flex-col sm:grid sm:grid-cols-12 gap-3 items-start"
              >
                <div className="hidden sm:flex col-span-1 justify-center pt-7">
                  <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <div className="col-span-7 space-y-1 w-full">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Observation
                  </label>
                  <Textarea
                    placeholder="e.g. Observed rodent droppings near south wall..."
                    value={obs.text}
                    onChange={(e) => {
                      onChange(obs.id, "text", e.target.value);
                      onChangeAny();
                    }}
                    className="min-h-[72px] resize-none text-sm"
                    disabled={disabled}
                  />
                </div>
                <div className="col-span-3 space-y-1 w-full">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Linked Violation
                  </label>
                  <Select
                    value={obs.linkedViolationKey || "none"}
                    onValueChange={(val) => {
                      onChange(
                        obs.id,
                        "linkedViolationKey",
                        val === "none" ? "" : val,
                      );
                      onChangeAny();
                    }}
                    disabled={disabled}
                  >
                    <SelectTrigger className="text-sm h-9">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {filledViolations.map((v) => {
                        const vType = VIOLATION_TYPES.find(
                          (t) => `${t.category}||${t.label}` === v.violationKey,
                        );
                        return vType ? (
                          <SelectItem key={v.id} value={v.violationKey}>
                            {vType.label}
                          </SelectItem>
                        ) : null;
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 flex items-center justify-end sm:justify-center sm:pt-7">
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => onRemove(obs.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors text-lg leading-none p-1 rounded"
                    >
                      ×
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {!disabled && (
        <div className="px-6 py-4 border-t border-border">
          <Button variant="outline" size="sm" className="gap-2" onClick={onAdd}>
            <Plus className="w-4 h-4" /> Add Observation
          </Button>
        </div>
      )}
    </div>
  );
}
