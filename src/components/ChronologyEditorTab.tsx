/**
 * ChronologyEditorTab.tsx
 *
 * Split-view chronology workspace for Hearing Packets.
 * Top: read-only context header (site, owner, hearing metadata).
 * Left: editable case chronology with SFHC Article 11 citation guardrails.
 * Right: drag-and-drop exhibit upload panel with auto page-range calculation.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getChronologyForPacket,
  addChronologyEntry,
  updateChronologyEntry,
  deleteChronologyEntry,
  reorderChronology,
  GetChronologyForPacketOutputType,
} from 'zite-endpoints-sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, ChevronUp, ChevronDown,
  Loader2, Shield, BookOpen, Download,
} from 'lucide-react';
import { SFHC_ARTICLE_11_CODES } from '@/utils/sfhcArticle11';
import {
  getFieldValidationError,
  getSfhcSuggestion,
  replaceStateCodeWithSfhc,
  containsCAStateCode,
} from '@/utils/validationRules';
import { formatDateShort } from '@/utils/formatDate';
import ChronologyContextHeader from './packet/ChronologyContextHeader';
import ExhibitUploadPanel from './packet/ExhibitUploadPanel';
import InspectionImportWizard from './InspectionImportWizard';

type Entry = GetChronologyForPacketOutputType['chronology'][0];
type ExhibitType = GetChronologyForPacketOutputType['exhibits'][0];
type PacketMeta = GetChronologyForPacketOutputType['packetMeta'];
type LocationMeta = GetChronologyForPacketOutputType['locationMeta'];

const ENTRY_TYPES = ['Inspection', 'NOV', 'Re-inspection', 'Contact Attempt', 'Hearing Referral', 'Other'];

function entryLetter(idx: number): string {
  return idx < 26 ? String.fromCharCode(65 + idx) : `(${idx + 1})`;
}

// ── Entry form (add + edit) ───────────────────────────────────────────────────
interface FormState {
  entryDate: string;
  entryType: string;
  citationCode: string;
  summary: string;
  attachmentPageRef: string;
}

function EntryForm({
  initial, onSave, onCancel, saving, assignedLetter,
}: {
  initial?: FormState;
  onSave: (form: FormState) => void;
  onCancel: () => void;
  saving: boolean;
  assignedLetter: string;
}) {
  const [form, setForm] = useState<FormState>(
    initial ?? {
      entryDate: new Date().toISOString().split('T')[0],
      entryType: 'Inspection',
      citationCode: '',
      summary: '',
      attachmentPageRef: '',
    },
  );
  const [summaryError, setSummaryError] = useState<string | undefined>();
  const set = (k: keyof FormState, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="border border-primary/30 rounded-xl p-4 bg-primary/5 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Date</Label>
          <Input type="date" value={form.entryDate} onChange={e => set('entryDate', e.target.value)} className="h-8 text-xs" />
        </div>
        <div>
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Entry Type</Label>
          <Select value={form.entryType} onValueChange={v => set('entryType', v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ENTRY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1 block">
            <Shield className="w-2.5 h-2.5 text-primary" /> SFHC Article 11 Code
          </Label>
          <Select value={form.citationCode || 'none'} onValueChange={v => set('citationCode', v === 'none' ? '' : v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select code…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— No code section —</SelectItem>
              {SFHC_ARTICLE_11_CODES.map(c => (
                <SelectItem key={c.value} value={c.value}>
                  <span className="font-mono">{c.code}</span> — {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
          Summary of Actions / Observations / Notes
        </Label>
        <Textarea
          value={form.summary}
          onChange={e => {
            const val = e.target.value;
            set('summary', val);
            setSummaryError(getFieldValidationError(val));
          }}
          placeholder="Describe the action, observation, or contact…"
          rows={3}
          className={`text-xs resize-none ${summaryError ? 'border-destructive' : ''}`}
        />
        {summaryError && containsCAStateCode(form.summary) ? (() => {
          const suggestion = getSfhcSuggestion(form.summary);
          return (
            <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <p className="text-[10px] font-semibold text-destructive flex items-center gap-1.5">
                <Shield className="w-3 h-3 flex-shrink-0" /> California state codes are not accepted
              </p>
              <div className="rounded-md border border-border bg-card p-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">Did you mean:</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5 font-mono">
                    {suggestion.code} — {suggestion.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                    {suggestion.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newSummary = replaceStateCodeWithSfhc(form.summary, suggestion.code);
                    set('summary', newSummary);
                    set('citationCode', suggestion.code);
                    setSummaryError(getFieldValidationError(newSummary));
                  }}
                  className="flex-shrink-0 text-[10px] font-semibold bg-primary text-primary-foreground px-2.5 py-1.5 rounded-md hover:opacity-90 transition-opacity"
                >
                  Apply
                </button>
              </div>
            </div>
          );
        })() : summaryError ? (
          <p className="text-[10px] text-destructive flex items-center gap-1 mt-1">
            <span className="font-bold flex-shrink-0">⚠</span> {summaryError}
          </p>
        ) : null}
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
            Page Reference (optional)
          </Label>
          <Input
            value={form.attachmentPageRef}
            onChange={e => set('attachmentPageRef', e.target.value)}
            placeholder="e.g. 009–012"
            className="h-8 text-xs"
          />
        </div>
        <div className="text-center pb-0.5">
          <p className="text-[10px] text-muted-foreground mb-1">Exhibit</p>
          <span className="text-lg font-black text-primary leading-none">{assignedLetter}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border/60">
        <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
          <Shield className="w-3 h-3 text-primary" />
          SFHC articles only — California state health codes are blocked by policy
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onCancel} className="h-7 text-xs">Cancel</Button>
          <Button
            size="sm"
            onClick={() => { if (!summaryError) onSave(form); }}
            disabled={saving || !form.summary.trim() || !!summaryError}
            className="h-7 text-xs gap-1"
          >
            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
            Save Entry
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main editor component ─────────────────────────────────────────────────────
export default function ChronologyEditorTab({ packetId }: { packetId: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [exhibits, setExhibits] = useState<ExhibitType[]>([]);
  const [complaintId, setComplaintId] = useState<string | undefined>();
  const [packetMeta, setPacketMeta] = useState<PacketMeta | undefined>();
  const [locationMeta, setLocationMeta] = useState<LocationMeta | undefined>();
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getChronologyForPacket({ packetId });
      setEntries(data.chronology);
      setExhibits(data.exhibits);
      setComplaintId(data.complaintId ?? undefined);
      setPacketMeta(data.packetMeta ?? undefined);
      setLocationMeta(data.locationMeta ?? undefined);
    } catch {
      toast.error('Failed to load chronology');
    } finally {
      setLoading(false);
    }
  }, [packetId]);

  useEffect(() => { load(); }, [load]);

  const sorted = [...entries].sort((a, b) => {
    if (a.chronologyOrder != null && b.chronologyOrder != null) return a.chronologyOrder - b.chronologyOrder;
    if (a.chronologyOrder != null) return -1;
    if (b.chronologyOrder != null) return 1;
    return (a.entryDate ?? '').localeCompare(b.entryDate ?? '');
  });

  const handleAdd = async (form: FormState) => {
    if (!complaintId) return;
    setSavingId('new');
    try {
      await addChronologyEntry({
        complaintId,
        entryDate: form.entryDate,
        entryType: form.entryType,
        citationCode: form.citationCode || undefined,
        summary: form.summary,
        attachmentPageRef: form.attachmentPageRef || undefined,
      });
      setShowAddForm(false);
      await load();
      toast.success('Chronology entry added');
    } catch {
      toast.error('Failed to add entry');
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdate = async (id: string, form: FormState) => {
    setSavingId(id);
    try {
      await updateChronologyEntry({
        entryId: id,
        entryDate: form.entryDate,
        entryType: form.entryType,
        citationCode: form.citationCode || undefined,
        summary: form.summary,
        attachmentPageRef: form.attachmentPageRef || undefined,
      });
      setEditingId(null);
      await load();
      toast.success('Entry updated');
    } catch {
      toast.error('Failed to update entry');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteChronologyEntry({ entryId: id });
      await load();
      toast.success('Entry deleted');
    } catch {
      toast.error('Failed to delete entry');
    } finally {
      setDeletingId(null);
    }
  };

  const handleMove = async (idx: number, direction: 'up' | 'down') => {
    if (!complaintId) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const newSorted = [...sorted];
    [newSorted[idx], newSorted[swapIdx]] = [newSorted[swapIdx], newSorted[idx]];
    setEntries(newSorted.map((e, i) => ({ ...e, chronologyOrder: i + 1, exhibitRefs: entryLetter(i) })));
    setReordering(true);
    try {
      await reorderChronology({ complaintId, orderedIds: newSorted.map(e => e.id) });
    } catch {
      toast.error('Failed to reorder');
      await load();
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14 w-full" />
        <div className="p-5 flex gap-5">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="w-72 space-y-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!complaintId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
        <p className="text-sm font-medium">No complaint linked to this packet</p>
        <p className="text-xs mt-1">A complaint must be linked before the chronology can be managed.</p>
      </div>
    );
  }

  const nextLetter = entryLetter(sorted.length);

  return (
    <div className="flex flex-col" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      {/* ── Context header ── */}
      <ChronologyContextHeader packetMeta={packetMeta} locationMeta={locationMeta} />

      {/* ── Split workspace ── */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT: Chronology entries */}
        <div className="flex-1 min-w-0 p-5 space-y-4 overflow-y-auto">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-bold text-foreground">Case Chronology</h3>
              {sorted.length > 0 && (
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {sorted.length} {sorted.length === 1 ? 'entry' : 'entries'}
                </span>
              )}
            </div>
            {!showAddForm && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => setShowImportWizard(true)}
                >
                  <Download className="w-3 h-3" /> Import Past Inspections
                </Button>
                <Button size="sm" className="h-7 text-xs gap-1" onClick={() => { setShowAddForm(true); setEditingId(null); }}>
                  <Plus className="w-3 h-3" /> Add Entry
                </Button>
              </div>
            )}
          </div>

          {/* Add form */}
          {showAddForm && (
            <EntryForm
              onSave={handleAdd}
              onCancel={() => setShowAddForm(false)}
              saving={savingId === 'new'}
              assignedLetter={nextLetter}
            />
          )}

          {/* Empty state */}
          {sorted.length === 0 && !showAddForm && (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium">No chronology entries yet</p>
              <p className="text-xs mt-1">Click "Add Entry" to document this case history.</p>
            </div>
          )}

          {/* Entries table */}
          {sorted.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-3 py-2.5 font-semibold text-[10px] uppercase tracking-wide text-muted-foreground w-20">Date</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-[10px] uppercase tracking-wide text-muted-foreground w-36">Code / Type</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-[10px] uppercase tracking-wide text-muted-foreground">Summary</th>
                    <th className="text-center px-2 py-2.5 font-semibold text-[10px] uppercase tracking-wide text-muted-foreground w-12">Exh.</th>
                    <th className="text-left px-2 py-2.5 font-semibold text-[10px] uppercase tracking-wide text-muted-foreground w-24">Pages</th>
                    <th className="w-24" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((entry, idx) => {
                    const letter = entryLetter(idx);
                    const isEditing = editingId === entry.id;
                    const isSaving = savingId === entry.id;
                    const isDeleting = deletingId === entry.id;

                    if (isEditing) {
                      return (
                        <tr key={entry.id}>
                          <td colSpan={6} className="p-3">
                            <EntryForm
                              initial={{
                                entryDate: entry.entryDate ?? new Date().toISOString().split('T')[0],
                                entryType: entry.entryType ?? 'Other',
                                citationCode: entry.citationCode ?? '',
                                summary: entry.summary ?? '',
                                attachmentPageRef: entry.attachmentPageRef ?? '',
                              }}
                              onSave={form => handleUpdate(entry.id, form)}
                              onCancel={() => setEditingId(null)}
                              saving={isSaving}
                              assignedLetter={letter}
                            />
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={entry.id}
                        className={`border-b border-border align-top transition-colors ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-muted/30`}>
                        <td className="px-3 py-2.5 whitespace-nowrap font-medium text-foreground text-xs">
                          {formatDateShort(entry.entryDate)}
                        </td>
                        <td className="px-3 py-2.5">
                          {entry.citationCode ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono font-semibold">
                              <Shield className="w-2.5 h-2.5 flex-shrink-0" />
                              {entry.citationCode}
                            </span>
                          ) : null}
                          {entry.entryType && (
                            <p className={`text-[10px] text-muted-foreground ${entry.citationCode ? 'mt-0.5' : ''}`}>
                              {entry.entryType}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-foreground leading-relaxed text-xs">
                          <span>{entry.summary ?? '—'}</span>
                          {entry.createdBy && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">By: {entry.createdBy}</p>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <span className="text-xs font-black text-primary">{entry.exhibitRefs || letter}</span>
                        </td>
                        <td className="px-2 py-2.5 text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                          {entry.attachmentPageRef ?? '—'}
                        </td>
                        <td className="px-1.5 py-2.5">
                          <div className="flex items-center gap-0.5 justify-end">
                            <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0 || reordering}
                              className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Move up">
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleMove(idx, 'down')} disabled={idx === sorted.length - 1 || reordering}
                              className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Move down">
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <button onClick={() => { setEditingId(entry.id); setShowAddForm(false); }}
                              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit">
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleDelete(entry.id)} disabled={isDeleting}
                              className="p-1 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete">
                              {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Article 11 guardrail badge */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/15">
            <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">SFHC articles only.</span>{' '}
              California state health and safety codes are completely blocked by policy — use SFHC articles only
              (Article 11, Article 11A, Article 2, and other relevant sections).
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-border flex-shrink-0" />

        {/* RIGHT: Exhibit upload panel */}
        <div className="w-80 flex-shrink-0 p-5 overflow-y-auto bg-muted/10 flex flex-col">
          <ExhibitUploadPanel
            exhibits={exhibits}
            entries={sorted}
            complaintId={complaintId}
            batesStart={packetMeta?.batesStart ?? 1}
            onExhibitsChange={setExhibits}
            onEntryPageRefUpdated={load}
          />
        </div>
      </div>

      {/* Import wizard */}
      <InspectionImportWizard
        packetId={packetId}
        open={showImportWizard}
        onClose={() => setShowImportWizard(false)}
        onImportComplete={load}
      />
    </div>
  );
}
