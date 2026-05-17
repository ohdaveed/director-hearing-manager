import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Trash2,
  Clock,
  Zap,
  CheckCircle2,
  Circle,
  X,
  Plus,
} from "lucide-react";
import { VIOLATION_TYPES, calcDueDate } from "./violationTypes";
import ViolationTypeSelector from "./violation/ViolationTypeSelector";
import ObservationChips from "./violation/ObservationChips";
import ActionAssignmentPanel from "./violation/ActionAssignmentPanel";
import { VIOLATION_DUE_BADGE_THEME } from "@/utils/badgeThemes";

export type Violation = {
  id: string;
  violationKey: string;
  location: string;
  correctiveAction: string;
  dueDate: string;
  responsibleParty: "Owner" | "Tenant";
  status: "Violation" | "Abated" | "Corrected on Site";
  ownerActions?: string[];
  tenantActions?: string[];
  selectedObservations?: string[];
  isAuto?: boolean;
};

type Props = {
  violation: Violation;
  index: number;
  inspectionDate: string;
  readOnly?: boolean;
  onChange: (
    id: string,
    field: keyof Violation,
    value: string | string[],
  ) => void;
  onRemove: (id: string) => void;
  expandOwnerTrigger?: number;
  expandTenantTrigger?: number;
};

const STATUSES = ["Violation", "Abated", "Corrected on Site"] as const;

function getDueBadge(vType: (typeof VIOLATION_TYPES)[0]) {
  if (vType.dueHours === 48)
    return { label: "48 hrs", cls: VIOLATION_DUE_BADGE_THEME["48hrs"] };
  if (vType.dueDays === 90)
    return { label: "90 days", cls: VIOLATION_DUE_BADGE_THEME["90days"] };
  return { label: "30 days", cls: VIOLATION_DUE_BADGE_THEME["30days"] };
}

type CustomObsActions = Record<
  string,
  { owner: Set<string>; tenant: Set<string> }
>;

export default function ViolationRow({
  violation,
  index,
  inspectionDate,
  readOnly,
  onChange,
  onRemove,
  expandOwnerTrigger,
  expandTenantTrigger,
}: Props) {
  const [selectedOwnerActions, setSelectedOwnerActions] = useState<Set<string>>(
    new Set(),
  );
  const [selectedTenantActions, setSelectedTenantActions] = useState<
    Set<string>
  >(new Set());
  const [ownerCustom, setOwnerCustom] = useState("");
  const [tenantCustom, setTenantCustom] = useState("");
  const [selectedObs, setSelectedObs] = useState<string[]>(
    violation.selectedObservations ?? [],
  );
  const [autoOwner, setAutoOwner] = useState<Set<string>>(new Set());
  const [autoTenant, setAutoTenant] = useState<Set<string>>(new Set());

  // Custom observations state
  const [customObsList, setCustomObsList] = useState<string[]>([]);
  const [customObsInput, setCustomObsInput] = useState("");
  const [customObsActions, setCustomObsActions] = useState<CustomObsActions>(
    {},
  );

  const initDoneRef = useRef(false);

  const selectedType = VIOLATION_TYPES.find(
    (v) => `${v.category}||${v.label}` === violation.violationKey,
  );
  const badge = selectedType ? getDueBadge(selectedType) : null;
  const currentStatus = violation.status ?? "Violation";

  const ownerPredefined =
    selectedType?.correctiveActions?.filter((a) => a.party === "Owner") ?? [];
  const tenantPredefined =
    selectedType?.correctiveActions?.filter((a) => a.party === "Tenant") ?? [];

  // ── State hydration on mount / reset on violationKey change ──────────────
  useEffect(() => {
    if (!initDoneRef.current) {
      initDoneRef.current = true;
      const ownerA = violation.ownerActions ?? [];
      const tenantA = violation.tenantActions ?? [];
      if (ownerA.length || tenantA.length) {
        const predefined = selectedType?.correctiveActions ?? [];
        const predOwner = new Set(
          predefined.filter((a) => a.party === "Owner").map((a) => a.text),
        );
        const predTenant = new Set(
          predefined.filter((a) => a.party === "Tenant").map((a) => a.text),
        );
        const ownerSel = new Set<string>();
        const ownerCustomItems: string[] = [];
        ownerA.forEach((t) =>
          predOwner.has(t) ? ownerSel.add(t) : ownerCustomItems.push(t),
        );
        const tenantSel = new Set<string>();
        const tenantCustomItems: string[] = [];
        tenantA.forEach((t) =>
          predTenant.has(t) ? tenantSel.add(t) : tenantCustomItems.push(t),
        );
        setSelectedOwnerActions(ownerSel);
        setOwnerCustom(ownerCustomItems.join("\n"));
        setSelectedTenantActions(tenantSel);
        setTenantCustom(tenantCustomItems.join("\n"));
      }
      setSelectedObs(violation.selectedObservations ?? []);

      // Restore custom observations (texts not in the predefined list)
      const predefinedObsTexts = new Set(
        selectedType?.observations?.map((o) => o.text) ?? [],
      );
      const restoredCustom = (violation.selectedObservations ?? []).filter(
        (o) => !predefinedObsTexts.has(o),
      );
      if (restoredCustom.length > 0) {
        setCustomObsList(restoredCustom);
        const initMap: CustomObsActions = {};
        restoredCustom.forEach((o) => {
          initMap[o] = { owner: new Set(), tenant: new Set() };
        });
        setCustomObsActions(initMap);
      }
    } else {
      setSelectedOwnerActions(new Set());
      setSelectedTenantActions(new Set());
      setOwnerCustom("");
      setTenantCustom("");
      setSelectedObs([]);
      setAutoOwner(new Set());
      setAutoTenant(new Set());
      setCustomObsList([]);
      setCustomObsInput("");
      setCustomObsActions({});
    }
  }, [violation.violationKey]); // eslint-disable-line

  // ── Action list builders ──────────────────────────────────────────────────
  const buildOwnerActions = (
    sel: Set<string>,
    custom: string,
    obsActions: CustomObsActions = customObsActions,
  ) => {
    const ordered = ownerPredefined
      .filter((a) => sel.has(a.text))
      .map((a) => a.text);
    Object.values(obsActions).forEach(({ owner }) => {
      owner.forEach((a) => {
        if (!ordered.includes(a)) ordered.push(a);
      });
    });
    if (custom.trim()) ordered.push(custom.trim());
    return ordered;
  };

  const buildTenantActions = (
    sel: Set<string>,
    custom: string,
    obsActions: CustomObsActions = customObsActions,
  ) => {
    const ordered = tenantPredefined
      .filter((a) => sel.has(a.text))
      .map((a) => a.text);
    Object.values(obsActions).forEach(({ tenant }) => {
      tenant.forEach((a) => {
        if (!ordered.includes(a)) ordered.push(a);
      });
    });
    if (custom.trim()) ordered.push(custom.trim());
    return ordered;
  };

  // ── Predefined action event handlers ─────────────────────────────────────
  const handleToggleOwner = (text: string) => {
    const next = new Set(selectedOwnerActions);
    if (next.has(text)) next.delete(text);
    else next.add(text);
    setSelectedOwnerActions(next);
    onChange(
      violation.id,
      "ownerActions",
      buildOwnerActions(next, ownerCustom),
    );
  };
  const handleToggleTenant = (text: string) => {
    const next = new Set(selectedTenantActions);
    if (next.has(text)) next.delete(text);
    else next.add(text);
    setSelectedTenantActions(next);
    onChange(
      violation.id,
      "tenantActions",
      buildTenantActions(next, tenantCustom),
    );
  };
  const handleOwnerCustomChange = (text: string) => {
    setOwnerCustom(text);
    onChange(
      violation.id,
      "ownerActions",
      buildOwnerActions(selectedOwnerActions, text),
    );
  };
  const handleTenantCustomChange = (text: string) => {
    setTenantCustom(text);
    onChange(
      violation.id,
      "tenantActions",
      buildTenantActions(selectedTenantActions, text),
    );
  };

  // ── Violation type selection ──────────────────────────────────────────────
  const handleViolationSelect = (key: string) => {
    const vType = VIOLATION_TYPES.find(
      (v) => `${v.category}||${v.label}` === key,
    );
    onChange(violation.id, "violationKey", key);
    onChange(violation.id, "ownerActions", []);
    onChange(violation.id, "tenantActions", []);
    onChange(violation.id, "selectedObservations", []);
    if (vType) {
      onChange(violation.id, "correctiveAction", "");
      onChange(violation.id, "dueDate", calcDueDate(inspectionDate, vType));
    }
  };

  // ── Predefined observation toggle ─────────────────────────────────────────
  const handleToggleObservation = (obsText: string) => {
    const obs = selectedType?.observations?.find((o) => o.text === obsText);
    const isAdding = !selectedObs.includes(obsText);
    const next = isAdding
      ? [...selectedObs, obsText]
      : selectedObs.filter((o) => o !== obsText);
    setSelectedObs(next);
    onChange(violation.id, "selectedObservations", next);
    if (obs && isAdding) {
      if (obs.autoOwnerActions?.length) {
        const nextOwner = new Set(selectedOwnerActions);
        obs.autoOwnerActions.forEach((a) => nextOwner.add(a));
        setSelectedOwnerActions(nextOwner);
        setAutoOwner((prev) => {
          const n = new Set(prev);
          obs.autoOwnerActions!.forEach((a) => n.add(a));
          return n;
        });
        onChange(
          violation.id,
          "ownerActions",
          buildOwnerActions(nextOwner, ownerCustom),
        );
      }
      if (obs.autoTenantActions?.length) {
        const nextTenant = new Set(selectedTenantActions);
        obs.autoTenantActions.forEach((a) => nextTenant.add(a));
        setSelectedTenantActions(nextTenant);
        setAutoTenant((prev) => {
          const n = new Set(prev);
          obs.autoTenantActions!.forEach((a) => n.add(a));
          return n;
        });
        onChange(
          violation.id,
          "tenantActions",
          buildTenantActions(nextTenant, tenantCustom),
        );
      }
    }
  };

  // ── Custom observation handlers ───────────────────────────────────────────
  const handleAddCustomObs = () => {
    const text = customObsInput.trim();
    if (!text || customObsList.includes(text)) return;
    const newList = [...customObsList, text];
    const newActions: CustomObsActions = {
      ...customObsActions,
      [text]: { owner: new Set(), tenant: new Set() },
    };
    setCustomObsList(newList);
    setCustomObsActions(newActions);
    setCustomObsInput("");
    const nextObs = [...selectedObs, text];
    setSelectedObs(nextObs);
    onChange(violation.id, "selectedObservations", nextObs);
  };

  const handleRemoveCustomObs = (text: string) => {
    const newList = customObsList.filter((o) => o !== text);
    const newActions = { ...customObsActions };
    delete newActions[text];
    setCustomObsList(newList);
    setCustomObsActions(newActions);
    const nextObs = selectedObs.filter((o) => o !== text);
    setSelectedObs(nextObs);
    onChange(violation.id, "selectedObservations", nextObs);
    onChange(
      violation.id,
      "ownerActions",
      buildOwnerActions(selectedOwnerActions, ownerCustom, newActions),
    );
    onChange(
      violation.id,
      "tenantActions",
      buildTenantActions(selectedTenantActions, tenantCustom, newActions),
    );
  };

  const handleToggleCustomObsAction = (
    obsText: string,
    actionText: string,
    party: "Owner" | "Tenant",
  ) => {
    const entry = customObsActions[obsText] ?? {
      owner: new Set<string>(),
      tenant: new Set<string>(),
    };
    const newEntry = {
      owner: new Set(entry.owner),
      tenant: new Set(entry.tenant),
    };
    if (party === "Owner") {
      if (newEntry.owner.has(actionText)) newEntry.owner.delete(actionText);
      else newEntry.owner.add(actionText);
    } else {
      if (newEntry.tenant.has(actionText)) newEntry.tenant.delete(actionText);
      else newEntry.tenant.add(actionText);
    }
    const newActions: CustomObsActions = {
      ...customObsActions,
      [obsText]: newEntry,
    };
    setCustomObsActions(newActions);
    onChange(
      violation.id,
      "ownerActions",
      buildOwnerActions(selectedOwnerActions, ownerCustom, newActions),
    );
    onChange(
      violation.id,
      "tenantActions",
      buildTenantActions(selectedTenantActions, tenantCustom, newActions),
    );
  };

  // ── Visibility helpers ────────────────────────────────────────────────────
  const showOwner = !readOnly
    ? ownerPredefined.length > 0 ||
      selectedOwnerActions.size > 0 ||
      !!ownerCustom.trim()
    : selectedOwnerActions.size > 0 || !!ownerCustom.trim();
  const showTenant = !readOnly
    ? tenantPredefined.length > 0 ||
      selectedTenantActions.size > 0 ||
      !!tenantCustom.trim()
    : selectedTenantActions.size > 0 || !!tenantCustom.trim();

  const showObsSection = selectedType && (!readOnly || selectedObs.length > 0);

  const statusStyle = (s: (typeof STATUSES)[number]) => {
    if (s !== currentStatus)
      return "bg-background text-muted-foreground hover:bg-muted";
    if (s === "Violation") return "bg-destructive text-destructive-foreground";
    if (s === "Abated") return "bg-primary text-primary-foreground";
    return "bg-muted text-foreground font-semibold border-b border-border";
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <ViolationTypeSelector
            value={violation.violationKey}
            onChange={handleViolationSelect}
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
            onClick={() => onRemove(violation.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Status + Badges row */}
      {selectedType && (
        <div className="px-4 pb-3 flex items-center gap-2 flex-wrap border-b border-border/60">
          <span className="text-xs font-mono font-semibold text-foreground bg-muted rounded-md px-2.5 py-1">
            {selectedType.code}
          </span>
          {badge && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border ${badge.cls}`}
            >
              <Clock className="w-3 h-3" /> {badge.label}
            </span>
          )}
          <div className="ml-auto flex rounded-md border border-border overflow-hidden">
            {STATUSES.map((s, idx) => (
              <button
                key={s}
                type="button"
                disabled={readOnly}
                onClick={() => onChange(violation.id, "status", s)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none ${
                  idx > 0 ? "border-l border-border" : ""
                } ${statusStyle(s)}`}
              >
                {s === "Corrected on Site" ? "On Site" : s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Card Body */}
      {selectedType && (
        <div className="px-4 py-4 space-y-4">
          {/* ── Observations ──────────────────────────────────────────── */}
          {showObsSection && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Observations
                </p>
                {!readOnly &&
                  selectedType.observations &&
                  selectedType.observations.length > 0 && (
                    <span className="text-[10px] text-muted-foreground italic">
                      — tap to auto-select corrective actions
                    </span>
                  )}
              </div>

              {readOnly ? (
                /* Read-only: bullet list of all selected obs (predefined + custom) */
                <ObservationChips
                  observations={selectedType.observations ?? []}
                  selectedObs={selectedObs}
                  onToggle={() => {}}
                  readOnly
                />
              ) : (
                <>
                  {/* Chips row: predefined + custom together */}
                  {((selectedType.observations?.length ?? 0) > 0 ||
                    customObsList.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {/* Predefined observation chips */}
                      {(selectedType.observations ?? []).map((obs) => {
                        const active = selectedObs.includes(obs.text);
                        const count =
                          (obs.autoOwnerActions?.length ?? 0) +
                          (obs.autoTenantActions?.length ?? 0);
                        return (
                          <button
                            key={obs.text}
                            type="button"
                            onClick={() => handleToggleObservation(obs.text)}
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

                      {/* Custom observation chips */}
                      {customObsList.map((obsText) => (
                        <span
                          key={obsText}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-foreground border border-dashed border-border"
                        >
                          {obsText}
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomObs(obsText)}
                            className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors flex items-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Corrective action pickers for each custom observation */}
                  {customObsList.map((obsText) => {
                    if (
                      ownerPredefined.length === 0 &&
                      tenantPredefined.length === 0
                    )
                      return null;
                    const actions = customObsActions[obsText];
                    const label =
                      obsText.length > 45
                        ? obsText.slice(0, 45) + "…"
                        : obsText;
                    return (
                      <div
                        key={`picker-${obsText}`}
                        className="pl-3 border-l-2 border-border/50 space-y-1.5"
                      >
                        <p className="text-[10px] text-muted-foreground italic">
                          Corrective actions for "
                          <span className="font-medium not-italic">
                            {label}
                          </span>
                          ":
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {ownerPredefined.map((a) => (
                            <label
                              key={`o-${a.text}`}
                              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-border bg-card cursor-pointer hover:bg-muted transition-colors select-none"
                            >
                              <Checkbox
                                checked={actions?.owner.has(a.text) ?? false}
                                onCheckedChange={() =>
                                  handleToggleCustomObsAction(
                                    obsText,
                                    a.text,
                                    "Owner",
                                  )
                                }
                                className="w-3 h-3"
                              />
                              <span className="text-foreground font-semibold text-[10px]">
                                Owner
                              </span>
                              <span>{a.text}</span>
                            </label>
                          ))}
                          {tenantPredefined.map((a) => (
                            <label
                              key={`t-${a.text}`}
                              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-border bg-card cursor-pointer hover:bg-muted transition-colors select-none"
                            >
                              <Checkbox
                                checked={actions?.tenant.has(a.text) ?? false}
                                onCheckedChange={() =>
                                  handleToggleCustomObsAction(
                                    obsText,
                                    a.text,
                                    "Tenant",
                                  )
                                }
                                className="w-3 h-3"
                              />
                              <span className="text-foreground font-semibold text-[10px]">
                                Tenant
                              </span>
                              <span>{a.text}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Custom observation free-text input */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <Input
                      placeholder="Add a custom observation…"
                      value={customObsInput}
                      onChange={(e) => setCustomObsInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomObs();
                        }
                      }}
                      className="h-8 text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddCustomObs}
                      disabled={!customObsInput.trim()}
                      className="shrink-0 h-8 text-xs px-3 gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Corrective Actions ─────────────────────────────────────── */}
          {(showOwner || showTenant) && (
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Corrective Actions
              </p>
              {showOwner && (
                <ActionAssignmentPanel
                  party="Owner"
                  predefinedActions={ownerPredefined}
                  selectedTexts={selectedOwnerActions}
                  customText={ownerCustom}
                  onToggle={handleToggleOwner}
                  onCustomChange={handleOwnerCustomChange}
                  readOnly={readOnly}
                  autoSelectedTexts={autoOwner}
                  expandTrigger={expandOwnerTrigger}
                />
              )}
              {showTenant && (
                <ActionAssignmentPanel
                  party="Tenant"
                  predefinedActions={tenantPredefined}
                  selectedTexts={selectedTenantActions}
                  customText={tenantCustom}
                  onToggle={handleToggleTenant}
                  onCustomChange={handleTenantCustomChange}
                  readOnly={readOnly}
                  autoSelectedTexts={autoTenant}
                  expandTrigger={expandTenantTrigger}
                />
              )}
            </div>
          )}

          {/* ── Location + Due Date ────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Location
              </label>
              <Input
                placeholder="e.g. Unit 3B, Basement"
                value={violation.location}
                onChange={(e) =>
                  onChange(violation.id, "location", e.target.value)
                }
                className="text-sm h-8"
                disabled={readOnly}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Due Date
              </label>
              <Input
                type="date"
                value={violation.dueDate}
                onChange={(e) =>
                  onChange(violation.id, "dueDate", e.target.value)
                }
                className="text-sm h-8"
                disabled={readOnly}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
