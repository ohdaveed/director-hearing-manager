import { CheckCircle2, Circle, Zap } from "lucide-react";

interface Observation {
  text: string;
  autoOwnerActions?: string[];
  autoTenantActions?: string[];
}

interface Props {
  observations: Observation[];
  selectedObs: string[];
  onToggle: (text: string) => void;
  readOnly?: boolean;
}

export default function ObservationChips({
  observations,
  selectedObs,
  onToggle,
  readOnly,
}: Props) {
  const autoCount = (obs: Observation) =>
    (obs.autoOwnerActions?.length ?? 0) + (obs.autoTenantActions?.length ?? 0);

  if (readOnly) {
    if (selectedObs.length === 0) return null;
    return (
      <ul className="space-y-1">
        {selectedObs.map((o) => (
          <li
            key={o}
            className="flex items-start gap-1.5 text-xs text-foreground"
          >
            <span className="text-primary mt-0.5 shrink-0">•</span> {o}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {observations.map((obs) => {
        const active = selectedObs.includes(obs.text);
        const count = autoCount(obs);
        return (
          <button
            key={obs.text}
            type="button"
            onClick={() => onToggle(obs.text)}
            className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              active
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-foreground border-border hover:bg-muted hover:border-primary/40"
            }`}
          >
            {active ? (
              <CheckCircle2 className="w-3 h-3 shrink-0" />
            ) : (
              <Circle className="w-3 h-3 shrink-0 opacity-40" />
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
    </div>
  );
}
