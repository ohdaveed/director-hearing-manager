import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import { Plus, ClipboardList, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Violation } from "@/components/ViolationRow";
import { VIOLATION_TYPES } from "@/components/violationTypes";
import { CustomCA } from "./types";

const CA_SUGGESTIONS: Record<string, string[]> = {
  "Pests, Vermin & Animals": [
    "Hire licensed pest control operator (within 30 days)",
    "Seal all entry points, gaps, and cracks",
    "Remove harborage conditions (debris, clutter, food sources)",
    "Dispose of infested materials properly",
  ],
  Sanitation: [
    "Remove all accumulated garbage, refuse, and debris",
    "Provide adequate lidded garbage containers",
    "Schedule regular refuse pickup",
    "Clean and sanitize affected area",
  ],
  "Garbage Area": [
    "Provide adequate lidded garbage containers",
    "Schedule regular refuse pickup",
    "Clean garbage area regularly",
    "Remove all uncontainerized waste immediately",
  ],
  "Unsanitary Conditions": [
    "Repair leaks and address all moisture sources",
    "Remediate mold and treat affected surfaces",
    "Remove all debris and accumulated materials",
    "Clean, paint, and restore all affected surfaces",
  ],
  "Other Health Code Violations": [
    "Remove all excessive accumulated materials",
    "Repair all identified structural deficiencies",
    "Pay all outstanding inspection program fees",
  ],
};

export interface CorrectiveActionsFormProps {
  violations: Violation[];
  checkedStandardCAs: Record<string, boolean>;
  standardCADetails: Record<string, { date: string; notes: string }>;
  customCAs: CustomCA[];
  onToggleStandardCA: (key: string, checked: boolean) => void;
  onUpdateStandardCADetail: (key: string, field: "date" | "notes", value: string) => void;
  onAddCustomCA: () => void;
  onUpdateCustomCA: (id: string, field: "text" | "date" | "notes", value: string) => void;
  onRemoveCustomCA: (id: string) => void;
  onChangeAny: () => void;
  disabled?: boolean;
}

export function CorrectiveActionsForm({
  violations,
  checkedStandardCAs,
  standardCADetails,
  customCAs,
  onToggleStandardCA,
  onUpdateStandardCADetail,
  onAddCustomCA,
  onUpdateCustomCA,
  onRemoveCustomCA,
  onChangeAny,
  disabled,
}: CorrectiveActionsFormProps) {
  const activeCategories = Array.from(
    new Set(
      violations
        .filter((v) => v.violationKey)
        .map(
          (v) =>
            VIOLATION_TYPES.find((t) => `${t.category}||${t.label}` === v.violationKey)?.category ??
            "",
        )
        .filter(Boolean),
    ),
  );

  const checkedCount = Object.values(checkedStandardCAs).filter(Boolean).length + customCAs.length;

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground text-lg">Corrective Actions</h2>
        </div>
        {checkedCount > 0 && (
          <span className="bg-primary/10 text-primary text-sm font-semibold px-3 py-1 rounded-full">
            {checkedCount} action{checkedCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="p-4 sm:p-6 space-y-6">
        {activeCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Add violations above to see suggested corrective actions, or add a custom one below.
          </p>
        ) : (
          activeCategories.map((cat) => {
            const suggestions = CA_SUGGESTIONS[cat] ?? [];
            if (!suggestions.length) return null;
            return (
              <div key={cat}>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  {cat}
                </h3>
                <div className="space-y-2">
                  {suggestions.map((text) => {
                    const key = `${cat}|||${text}`;
                    const isChecked = !!checkedStandardCAs[key];
                    const details = standardCADetails[key] ?? {
                      date: "",
                      notes: "",
                    };
                    return (
                      <div
                        key={key}
                        className={`rounded-lg border transition-colors ${isChecked ? "border-primary/40 bg-primary/5" : "border-border"}`}
                      >
                        <div className="flex items-start gap-3 p-3">
                          <Checkbox
                            id={`ca-${key}`}
                            checked={isChecked}
                            disabled={disabled}
                            onCheckedChange={(checked) => {
                              onToggleStandardCA(key, !!checked);
                              onChangeAny();
                            }}
                            className="mt-0.5"
                          />
                          <label
                            htmlFor={`ca-${key}`}
                            className="text-sm cursor-pointer flex-1 font-medium"
                          >
                            {text}
                          </label>
                        </div>
                        <AnimatePresence>
                          {isChecked && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-t border-border px-3 pb-3 pt-2 grid grid-cols-2 gap-3"
                            >
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Correction Date
                                </label>
                                <Input
                                  type="date"
                                  value={details.date}
                                  onChange={(e) => {
                                    onUpdateStandardCADetail(key, "date", e.target.value);
                                    onChangeAny();
                                  }}
                                  disabled={disabled}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Notes (optional)
                                </label>
                                <Input
                                  placeholder="Additional notes..."
                                  value={details.notes}
                                  onChange={(e) => {
                                    onUpdateStandardCADetail(key, "notes", e.target.value);
                                    onChangeAny();
                                  }}
                                  disabled={disabled}
                                  className="h-8 text-sm"
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {customCAs.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Custom Corrective Actions
            </h3>
            <div className="space-y-3">
              {customCAs.map((ca, i) => (
                <div
                  key={ca.id}
                  className="rounded-lg border border-border bg-muted/20 p-3 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-2">
                      {i + 1}
                    </span>
                    <Textarea
                      placeholder="Describe the corrective action required..."
                      value={ca.text}
                      onChange={(e) => {
                        onUpdateCustomCA(ca.id, "text", e.target.value);
                        onChangeAny();
                      }}
                      disabled={disabled}
                      className="min-h-[60px] resize-none text-sm flex-1"
                    />
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => onRemoveCustomCA(ca.id)}
                        className="text-muted-foreground hover:text-destructive p-1 mt-1 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pl-7">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Correction Date
                      </label>
                      <Input
                        type="date"
                        value={ca.date}
                        onChange={(e) => {
                          onUpdateCustomCA(ca.id, "date", e.target.value);
                          onChangeAny();
                        }}
                        disabled={disabled}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Notes (optional)
                      </label>
                      <Input
                        placeholder="Additional notes..."
                        value={ca.notes}
                        onChange={(e) => {
                          onUpdateCustomCA(ca.id, "notes", e.target.value);
                          onChangeAny();
                        }}
                        disabled={disabled}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!disabled && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              onAddCustomCA();
              onChangeAny();
            }}
          >
            <Plus className="w-4 h-4" /> Add Custom Corrective Action
          </Button>
        )}
      </div>
    </div>
  );
}
