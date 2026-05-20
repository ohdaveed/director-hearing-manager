import { CheckCircle2, Circle, X, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ObservationChips } from "./ObservationChips";

export function ViolationObservationsSection({
  selectedType,
  selectedObs,
  customObsList,
  readOnly,
  onToggleObservation,
  onRemoveCustomObs,
  onAddCustomObs,
  customObsInput,
  setCustomObsInput,
}: {
  selectedType: any;
  selectedObs: string[];
  customObsList: string[];
  readOnly?: boolean;
  onToggleObservation: (text: string) => void;
  onRemoveCustomObs: (text: string) => void;
  onAddCustomObs: () => void;
  customObsInput: string;
  setCustomObsInput: (val: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Observations
        </p>
        {!readOnly && selectedType.observations && selectedType.observations.length > 0 && (
          <span className="text-[10px] text-muted-foreground italic">
            — tap to auto-select corrective actions
          </span>
        )}
      </div>

      {readOnly ? (
        <ObservationChips
          observations={selectedType.observations ?? []}
          selectedObs={selectedObs}
          onToggle={() => {}}
          readOnly
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {(selectedType.observations ?? []).map((obs: any) => {
              const active = selectedObs.includes(obs.text);
              const count =
                (obs.autoOwnerActions?.length ?? 0) + (obs.autoTenantActions?.length ?? 0);
              return (
                <button
                  key={obs.text}
                  type="button"
                  onClick={() => onToggleObservation(obs.text)}
                  className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-foreground border-border hover:bg-muted hover:border-primary/40"
                  }`}
                >
                  {active ? (
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                  ) : (
                    <Circle className="w-3 h-3 shrink-0 text-muted-foreground" />
                  )}
                  {obs.text}
                  {!active && count > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-primary bg-primary/10 px-1 py-0.5 rounded-full ml-0.5">
                      <Zap className="w-2 h-2" />
                      {count}
                    </span>
                  )}
                </button>
              );
            })}

            {customObsList.map((obsText) => (
              <span
                key={obsText}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-foreground border border-dashed border-border"
              >
                {obsText}
                <button
                  type="button"
                  onClick={() => onRemoveCustomObs(obsText)}
                  className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors flex items-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <Input
              placeholder="Add a custom observation…"
              value={customObsInput}
              onChange={(e) => setCustomObsInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAddCustomObs();
                }
              }}
              className="h-8 text-xs"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onAddCustomObs}
              disabled={!customObsInput.trim()}
              className="shrink-0 h-8 text-xs px-3 gap-1"
            >
              <Plus className="w-3 h-3" /> Add
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
