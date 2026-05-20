import { SummaryField } from "@/components/narrative/SummaryField";
import { ObservationsList } from "@/components/narrative/ObservationsList";
import { CorrectiveActionsForm } from "@/components/narrative/CorrectiveActionsForm";
import { Violation } from "@/components/ViolationRow";
import type { CustomCA } from "@/components/narrative/types";

export type { CustomCA };

type Observation = { id: string; text: string; linkedViolationKey: string };

export interface NarrativeSectionProps {
  summary: string;
  onSummaryChange: (v: string) => void;
  observations: Observation[];
  onAddObservation: () => void;
  onRemoveObservation: (id: string) => void;
  onObservationChange: (id: string, field: keyof Observation, value: string) => void;
  filledViolations: Violation[];
  violations: Violation[];
  inspectionDate: string;
  checkedStandardCAs: Record<string, boolean>;
  standardCADetails: Record<string, { date: string; notes: string }>;
  customCAs: CustomCA[];
  onToggleStandardCA: (key: string, checked: boolean) => void;
  onUpdateStandardCADetail: (key: string, field: "date" | "notes", value: string) => void;
  onAddCustomCA: () => void;
  onUpdateCustomCA: (id: string, field: "text" | "date" | "notes", value: string) => void;
  onRemoveCustomCA: (id: string) => void;
  isSubmitted: boolean;
  onAnyChange: () => void;
}

export default function NarrativeSection(p: NarrativeSectionProps) {
  return (
    <div className="space-y-4 sm:space-y-6 mb-4 sm:mb-6">
      <SummaryField
        value={p.summary}
        onChange={(v) => {
          p.onSummaryChange(v);
          p.onAnyChange();
        }}
        disabled={p.isSubmitted}
      />

      <ObservationsList
        observations={p.observations}
        filledViolations={p.filledViolations}
        onAdd={p.onAddObservation}
        onRemove={p.onRemoveObservation}
        onChange={p.onObservationChange}
        onChangeAny={p.onAnyChange}
        disabled={p.isSubmitted}
      />

      <CorrectiveActionsForm
        violations={p.violations}
        checkedStandardCAs={p.checkedStandardCAs}
        standardCADetails={p.standardCADetails}
        customCAs={p.customCAs}
        onToggleStandardCA={p.onToggleStandardCA}
        onUpdateStandardCADetail={p.onUpdateStandardCADetail}
        onAddCustomCA={p.onAddCustomCA}
        onUpdateCustomCA={p.onUpdateCustomCA}
        onRemoveCustomCA={p.onRemoveCustomCA}
        onChangeAny={p.onAnyChange}
        disabled={p.isSubmitted}
      />
    </div>
  );
}
