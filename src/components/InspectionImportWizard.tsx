/**
 * InspectionImportWizard.tsx
 *
 * Sheet-based wizard for importing past submitted inspections into a
 * hearing packet's chronology and exhibit list.
 *
 * Features:
 * - Lists all submitted inspections with date, inspector, type, ratings,
 *   violation chips, and photo thumbnails
 * - Pre-selects un-imported inspections; marks already-imported ones
 * - Animated multi-stage progress overlay during import
 * - Calls importInspectionHistory and surfaces results via toast
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { importService } from '@/services/importService';
import { formatDateShort } from '@/utils/formatDate';
import {
  ClipboardCheck,
  Camera,
  Shield,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  XCircle,
} from 'lucide-react';

type Inspection = any; // Simplify for now, or extract from importService return type

// ── Progress stage definitions ─────────────────────────────────────────────

const STAGES = [
  { label: 'Scanning inspection records', pct: 10 },
  { label: 'Parsing violations & citations', pct: 28 },
  { label: 'Mapping SFHC Article 11 codes', pct: 45 },
  { label: 'Creating chronology entries', pct: 62 },
  { label: 'Ingesting exhibit records', pct: 78 },
  { label: 'Recalculating Bates numbers', pct: 92 },
  { label: 'Finalizing import', pct: 98 },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function ProgressOverlay({
  stage,
  progress,
}: {
  stage: number;
  progress: number;
}) {
  return (
    <div className="flex flex-col h-full items-center justify-center gap-8 px-10">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {STAGES[stage].label}…
          </p>
          <p className="text-xs text-muted-foreground">
            Please wait while records are being created.
          </p>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="space-y-2 pt-1">
          {STAGES.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-2.5 text-[11px] transition-colors ${
                i < stage
                  ? 'text-primary'
                  : i === stage
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground/50'
              }`}
            >
              {i < stage ? (
                <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
              ) : i === stage ? (
                <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin" />
              ) : (
                <div className="w-3 h-3 rounded-full border border-current/30 flex-shrink-0" />
              )}
              {s.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InspectionCard({
  inspection,
  checked,
  onToggle,
}: {
  inspection: Inspection;
  checked: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isDisabled = inspection.alreadyImported;

  // Collect unique displayed codes (prefer violationCode over category)
  const displayCodes = [
    ...new Set(
      inspection.violations
        .map(v => v.violationCode || v.category || '')
        .filter(Boolean),
    ),
  ].slice(0, 5);

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all duration-150 ${
        isDisabled
          ? 'border-border/40 bg-muted/20 opacity-65'
          : checked
          ? 'border-primary/40 bg-primary/[0.03] shadow-sm ring-1 ring-primary/20'
          : 'border-border bg-card hover:border-border'
      }`}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Checkbox */}
        <div className="pt-0.5 flex-shrink-0">
          <Checkbox
            checked={!isDisabled && checked}
            onCheckedChange={isDisabled ? undefined : onToggle}
            disabled={isDisabled}
            className="w-4 h-4"
          />
        </div>

        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Top: date + type + rating + status */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-bold text-foreground">
              {formatDateShort(inspection.inspection_date)}
            </span>
            {inspection.inspection_type && (
              <Badge
                variant="secondary"
                className="text-[10px] h-4 px-1.5 font-normal py-0"
              >
                {inspection.inspection_type}
              </Badge>
            )}
            {inspection.inspection_rating && (
              <Badge
                variant={
                  inspection.inspection_rating === 'Unsatisfactory'
                    ? 'destructive'
                    : 'outline'
                }
                className="text-[10px] h-4 px-1.5 font-normal py-0"
              >
                {inspection.inspection_rating}
              </Badge>
            )}
            {isDisabled && (
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 py-0 text-muted-foreground gap-1 border-border"
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-primary" />
                Already imported
              </Badge>
            )}
          </div>

          {/* Inspector */}
          {inspection.inspector && (
            <p className="text-[11px] text-muted-foreground">
              Inspector:{' '}
              <span className="font-medium text-foreground">
                {inspection.inspector}
              </span>
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <FileText className="w-3 h-3" />
              Report · ~5 pages
            </span>
            {inspection.violation_count > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-destructive/80 font-medium">
                <Shield className="w-3 h-3" />
                {inspection.violation_count} violation
                {inspection.violation_count !== 1 ? 's' : ''}
              </span>
            )}
            {inspection.photoCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Camera className="w-3 h-3" />
                {inspection.photoCount} photo
                {inspection.photoCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Citation chips */}
          {displayCodes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {displayCodes.map((code, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono font-semibold"
                >
                  {code}
                </span>
              ))}
              {inspection.violation_count > displayCodes.length && (
                <span className="text-[10px] text-muted-foreground px-1 py-0.5">
                  +{inspection.violation_count - displayCodes.length} more
                </span>
              )}
            </div>
          )}

          {/* Photo thumbnails */}
          {inspection.photoThumbnails.length > 0 && (
            <div className="flex gap-1.5 mt-0.5">
              {inspection.photoThumbnails.map((url, i) => (
                <div
                  key={i}
                  className="w-12 h-10 rounded-md overflow-hidden bg-muted border border-border flex-shrink-0"
                >
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {inspection.photoCount > inspection.photoThumbnails.length && (
                <div className="w-12 h-10 rounded-md bg-muted border border-border flex-shrink-0 flex items-center justify-center">
                  <span className="text-[9px] text-muted-foreground font-semibold">
                    +
                    {inspection.photoCount - inspection.photoThumbnails.length}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Expand violations toggle */}
          {inspection.violations.length > 0 && (
            <>
              <button
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors mt-1"
              >
                {expanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                {expanded ? 'Hide' : 'Show'} violations detail
              </button>

              {expanded && (
                <div className="space-y-1.5 border-t border-border/60 pt-2 mt-0.5">
                  {inspection.violations.map(v => (
                    <div
                      key={v.id}
                      className="flex items-start gap-2 text-[10px]"
                    >
                      <Shield className="w-2.5 h-2.5 text-destructive/50 flex-shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        {v.violationCode && (
                          <span className="font-mono font-semibold text-primary mr-1">
                            {v.violationCode}
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {v.observation || v.label || v.category || '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main wizard component ──────────────────────────────────────────────────

export default function InspectionImportWizard({
  packetId,
  open,
  onClose,
  onImportComplete,
}: {
  packetId: string;
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}) {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const data = await importService.listInspectionsForImport({ packetId });
      setInspections(data.inspections);
      // Pre-select all un-imported inspections
      const preSelected = new Set(
        data.inspections.filter((i: any) => !i.alreadyImported).map((i: any) => i.id),
      );
      setSelected(preSelected);
    } catch {
      toast.error('Failed to load inspections');
    } finally {
      setLoading(false);
    }
  }, [packetId, open]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () =>
    setSelected(
      new Set(inspections.filter(i => !i.alreadyImported).map(i => i.id)),
    );
  const deselectAll = () => setSelected(new Set());

  const startProgressAnim = () => {
    let idx = 0;
    progressRef.current = setInterval(() => {
      idx = Math.min(idx + 1, STAGES.length - 1);
      setStage(idx);
      setProgress(STAGES[idx].pct);
    }, 750);
  };

  const stopProgressAnim = () => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    setStage(0);
    setProgress(STAGES[0].pct);
    startProgressAnim();

    try {
      const result = await importService.importInspectionHistory({
        packetId,
        inspectionIds: Array.from(selected),
      });

      stopProgressAnim();
      setProgress(100);

      await new Promise(r => setTimeout(r, 500));

      const chronoWord =
        result.chronologyEntriesCreated === 1 ? 'entry' : 'entries';
      const exhibitWord =
        result.exhibitsCreated === 1 ? 'exhibit' : 'exhibits';

      toast.success(
        `Import complete — ${result.chronologyEntriesCreated} chronology ${chronoWord} ` +
          `and ${result.exhibitsCreated} ${exhibitWord} created.` +
          (result.skipped > 0
            ? ` (${result.skipped} already imported, skipped)`
            : ''),
      );

      onImportComplete();
      onClose();
    } catch {
      stopProgressAnim();
      toast.error('Import failed. Please try again.');
    } finally {
      setImporting(false);
      setProgress(0);
      setStage(0);
    }
  };

  const importableCount = inspections.filter(i => !i.alreadyImported).length;
  const selectedCount = selected.size;

  return (
    <Sheet
      open={open}
      onOpenChange={v => {
        if (!v && !importing) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col p-0 overflow-hidden gap-0"
      >
        {/* ── Header ── */}
        <SheetHeader className="px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SheetTitle className="flex items-center gap-2 text-base">
                <Download className="w-4 h-4 text-primary" />
                Import Past Inspections
              </SheetTitle>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Select inspections to auto-generate chronology entries, SFHC
                citations, and exhibit records. Or upload a PDF report for AI extraction.
              </p>
              <div className="pt-2">
                <Input 
                  type="file" 
                  accept=".pdf" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      toast.promise(importService.importFromPdf({ packetId, file }), {
                        loading: 'Analyzing PDF with AI...',
                        success: (data) => {
                          onImportComplete();
                          return `Successfully extracted ${data.violationsFound} violations.`;
                        },
                        error: 'Failed to parse PDF.'
                      });
                    }
                  }}
                  className="h-8 text-[11px]"
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* ── Body: progress OR content ── */}
        {importing ? (
          <ProgressOverlay stage={stage} progress={progress} />
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-5 w-48" />
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-28 w-full rounded-xl" />
                ))}
              </>
            ) : inspections.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">
                  No submitted inspections found
                </p>
                <p className="text-xs mt-1 max-w-xs mx-auto">
                  Inspections must have a status of "Submitted" before they can
                  be imported.
                </p>
              </div>
            ) : (
              <>
                {/* Select controls + count */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {importableCount}{' '}
                    {importableCount === 1 ? 'inspection' : 'inspections'}{' '}
                    available · {selectedCount} selected
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAll}
                      className="text-[10px] text-primary underline underline-offset-2 hover:opacity-80"
                    >
                      Select all
                    </button>
                    <span className="text-muted-foreground text-[10px]">/</span>
                    <button
                      onClick={deselectAll}
                      className="text-[10px] text-muted-foreground underline underline-offset-2 hover:opacity-80"
                    >
                      None
                    </button>
                  </div>
                </div>

                {/* What will be created info box */}
                {selectedCount > 0 && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 px-3.5 py-3 text-[11px] text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground text-xs">
                      What will be created for each import:
                    </p>
                    <p className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                      1 chronology entry with SFHC citation and narrative
                    </p>
                    <p className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                      1 exhibit record for the inspection report (~5 pages)
                    </p>
                    <p className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                      1 exhibit record for grouped photos (if any)
                    </p>
                    <p className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                      Sequential Bates page ranges auto-calculated
                    </p>
                  </div>
                )}

                <Separator />

                {/* Inspection cards */}
                <div className="space-y-2">
                  {inspections.map(insp => (
                    <InspectionCard
                      key={insp.id}
                      inspection={insp}
                      checked={selected.has(insp.id)}
                      onToggle={() => toggleSelect(insp.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        {!importing && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-border flex items-center justify-between bg-muted/20">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs gap-1"
            >
              <XCircle className="w-3 h-3" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={selectedCount === 0 || loading}
              className="h-8 text-xs gap-1.5"
            >
              <Download className="w-3 h-3" />
              Import {selectedCount > 0 ? `${selectedCount} ` : ''}
              {selectedCount === 1 ? 'Inspection' : 'Inspections'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
