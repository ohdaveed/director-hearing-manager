import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  User,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  CheckCircle2,
  Circle,
  Zap,
} from "lucide-react";
import { useActionSorting } from "../../hooks/useActionSorting";
import { ACTION_PARTY_THEME } from "@/utils/badgeThemes";
import { getBiohazardViolationError } from "@/utils/validationRules";

// Quick-text snippets available on all custom note panels
const SNIPPETS = [
  "Owner notified on-site.",
  "PCO invoice required within 30 days.",
  "Follow-up inspection scheduled.",
  "Owner did not respond to prior notice.",
  "Case history attached.",
];

interface Action {
  text: string;
  party: string;
}

interface Props {
  party: "Owner" | "Tenant";
  predefinedActions: Action[];
  selectedTexts: Set<string>;
  customText: string;
  onToggle: (text: string) => void;
  onCustomChange: (text: string) => void;
  readOnly?: boolean;
  autoSelectedTexts?: Set<string>;
  expandTrigger?: number;
}

export default function ActionAssignmentPanel({
  party,
  predefinedActions,
  selectedTexts,
  customText,
  onToggle,
  onCustomChange,
  readOnly,
  autoSelectedTexts,
  expandTrigger,
}: Props) {
  const [showCustom, setShowCustom] = useState(customText.trim().length > 0);
  const [collapsed, setCollapsed] = useState(true);
  const [showAllSnippets, setShowAllSnippets] = useState(false);
  const [customError, setCustomError] = useState<string | undefined>(undefined);
  const panelRef = useRef<HTMLDivElement>(null);

  const isOwner = party === "Owner";
  const { selectedItems, unselectedItems, showDivider } = useActionSorting(
    predefinedActions,
    selectedTexts,
  );
  const selectedCount = selectedTexts.size;
  const hasCustom = customText.trim().length > 0;
  const hasContent = selectedCount > 0 || hasCustom;
  const allSelected =
    predefinedActions.length > 0 &&
    predefinedActions.every((a) => selectedTexts.has(a.text));

  useEffect(() => {
    if (customText.trim().length > 0) setShowCustom(true);
  }, [customText]);

  // Expand and scroll when triggered by keyboard shortcut (Alt+1 / Alt+2)
  useEffect(() => {
    if (!expandTrigger) return;
    setCollapsed(false);
    setTimeout(() => {
      panelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 60);
  }, [expandTrigger]);

  if (readOnly && !hasContent) return null;
  if (!readOnly && predefinedActions.length === 0 && !hasContent) return null;

  const handleSelectAll = () =>
    predefinedActions.forEach((a) => {
      if (!selectedTexts.has(a.text)) onToggle(a.text);
    });
  const handleClearAll = () =>
    predefinedActions.forEach((a) => {
      if (selectedTexts.has(a.text)) onToggle(a.text);
    });

  const handleSnippet = (snippet: string) => {
    const next = customText.trim()
      ? `${customText.trim()}\n${snippet}`
      : snippet;
    onCustomChange(next);
    setCustomError(getBiohazardViolationError(next));
  };

  const handleCustomTextChange = (val: string) => {
    onCustomChange(val);
    setCustomError(getBiohazardViolationError(val));
  };

  const renderActionItem = (action: Action, checked: boolean) => {
    const isAuto = autoSelectedTexts?.has(action.text) && checked;
    return (
      <button
        key={action.text}
        type="button"
        disabled={readOnly}
        onClick={() => onToggle(action.text)}
        className={`w-full text-left flex items-start gap-3 px-3.5 py-2.5 transition-colors group ${
          checked
            ? "bg-primary/6 hover:bg-primary/10"
            : "bg-card hover:bg-muted/50"
        } ${readOnly ? "pointer-events-none" : "cursor-pointer"}`}
      >
        <span
          className={`mt-0.5 shrink-0 transition-colors ${
            checked
              ? "text-primary"
              : "text-border group-hover:text-muted-foreground"
          }`}
        >
          {checked ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </span>
        <span
          className={`flex-1 text-xs leading-relaxed ${
            checked ? "text-foreground font-medium" : "text-foreground/80"
          }`}
        >
          {action.text}
        </span>
        {isAuto && (
          <span className="shrink-0 flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded mt-0.5">
            <Zap className="w-2.5 h-2.5" /> Auto
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      ref={panelRef}
      className={`rounded-xl border overflow-hidden transition-all ${
        hasContent ? "border-primary/25 shadow-sm" : "border-border"
      }`}
    >
      {/* Panel header */}
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer select-none ${
          hasContent ? "bg-primary/8" : "bg-muted/40"
        }`}
        onClick={() => !readOnly && setCollapsed((v) => !v)}
      >
        <div className={`p-1 rounded-md ${ACTION_PARTY_THEME[party].icon}`}>
          {isOwner ? (
            <Building2 className="w-3.5 h-3.5" />
          ) : (
            <User className="w-3.5 h-3.5" />
          )}
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-xs font-bold text-foreground">
            {isOwner ? "Owner / Management" : "Tenant"} Actions
          </span>
          {!readOnly && predefinedActions.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {selectedCount} of {predefinedActions.length} selected
            </span>
          )}
          {!readOnly && expandTrigger !== undefined && (
            <kbd className="text-[9px] bg-muted border border-border/60 rounded px-1.5 py-0.5 font-mono text-muted-foreground">
              alt+{isOwner ? "1" : "2"}
            </kbd>
          )}
        </div>
        {selectedCount > 0 && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ACTION_PARTY_THEME[party].badge}`}
          >
            {selectedCount} ✓
          </span>
        )}
        {!readOnly && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((v) => !v);
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {collapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="bg-card">
          {/* Select all / Clear all toolbar */}
          {!readOnly && predefinedActions.length > 1 && (
            <div className="flex items-center gap-2 px-3.5 py-2 border-b border-border/60 bg-muted/20">
              <button
                type="button"
                onClick={handleSelectAll}
                disabled={allSelected}
                className="text-[10px] font-semibold text-primary hover:text-primary/70 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Select all
              </button>
              <span className="text-border">·</span>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={selectedCount === 0}
                className="text-[10px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Clear all
              </button>
              <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
                {predefinedActions.length} action
                {predefinedActions.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Two-group sorted action list */}
          {predefinedActions.length > 0 && (
            <div className="max-h-72 overflow-y-auto">
              {selectedItems.length > 0 && (
                <div className="divide-y divide-border/50">
                  {selectedItems.map((action) =>
                    renderActionItem(action, true),
                  )}
                </div>
              )}
              {showDivider && (
                <div className="px-3.5 py-1.5 bg-muted/40 border-y border-border/60">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Remaining actions
                  </span>
                </div>
              )}
              {unselectedItems.length > 0 && (
                <div className="divide-y divide-border/50">
                  {unselectedItems.map((action) =>
                    renderActionItem(action, false),
                  )}
                </div>
              )}
            </div>
          )}

          {/* Custom note + snippet toolbar */}
          <div className="px-3.5 pb-3.5">
            {showCustom || hasCustom ? (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Custom note
                  </span>
                  {!readOnly && !hasCustom && (
                    <button
                      type="button"
                      onClick={() => setShowCustom(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {readOnly ? (
                  <Textarea
                    value={customText}
                    className="min-h-[60px] resize-none text-xs"
                    disabled
                  />
                ) : (
                  <>
                    <div
                      className={`border rounded-lg overflow-hidden ${customError ? "border-destructive" : "border-border"}`}
                    >
                      <Textarea
                        value={customText}
                        onChange={(e) => handleCustomTextChange(e.target.value)}
                        placeholder={`Additional notes for ${isOwner ? "owner / management" : "tenant"}…`}
                        className="min-h-[60px] resize-none text-xs border-0 rounded-none focus-visible:ring-0 shadow-none"
                      />
                      <div className="border-t border-border bg-muted/30 px-3 py-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                          Snippets:
                        </span>
                        {(showAllSnippets
                          ? SNIPPETS
                          : SNIPPETS.slice(0, 3)
                        ).map((snippet) => (
                          <button
                            key={snippet}
                            type="button"
                            onClick={() => handleSnippet(snippet)}
                            className="text-[10px] px-2 py-0.5 rounded bg-card border border-border text-foreground hover:bg-muted whitespace-nowrap transition-colors"
                          >
                            {snippet.replace(/\.$/, "")}
                          </button>
                        ))}
                        {!showAllSnippets && (
                          <button
                            type="button"
                            onClick={() => setShowAllSnippets(true)}
                            className="text-[10px] px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground hover:bg-muted whitespace-nowrap transition-colors"
                          >
                            + {SNIPPETS.length - 3} more
                          </button>
                        )}
                      </div>
                    </div>
                    {customError && (
                      <p className="mt-1.5 px-0.5 text-[10px] text-destructive leading-snug">
                        {customError}
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : !readOnly ? (
              <button
                type="button"
                onClick={() => setShowCustom(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mt-3"
              >
                <Plus className="w-3.5 h-3.5" />
                Add custom note
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
