import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, BookOpen, ClipboardList, Trash2 } from 'lucide-react';
import { Violation } from '@/components/ViolationRow';
import { VIOLATION_TYPES } from '@/components/violationTypes';

type Observation = { id: string; text: string; linkedViolationKey: string };
export type CustomCA = { id: string; text: string; date: string; notes: string };

const CA_SUGGESTIONS: Record<string, string[]> = {
  'Pests, Vermin & Animals': [
    'Hire licensed pest control operator (within 30 days)',
    'Seal all entry points, gaps, and cracks',
    'Remove harborage conditions (debris, clutter, food sources)',
    'Dispose of infested materials properly',
  ],
  'Sanitation': [
    'Remove all accumulated garbage, refuse, and debris',
    'Provide adequate lidded garbage containers',
    'Schedule regular refuse pickup',
    'Clean and sanitize affected area',
  ],
  'Garbage Area': [
    'Provide adequate lidded garbage containers',
    'Schedule regular refuse pickup',
    'Clean garbage area regularly',
    'Remove all uncontainerized waste immediately',
  ],
  'Unsanitary Conditions': [
    'Repair leaks and address all moisture sources',
    'Remediate mold and treat affected surfaces',
    'Remove all debris and accumulated materials',
    'Clean, paint, and restore all affected surfaces',
  ],
  'Other Health Code Violations': [
    'Remove all excessive accumulated materials',
    'Repair all identified structural deficiencies',
    'Pay all outstanding inspection program fees',
  ],
};

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
  onUpdateStandardCADetail: (key: string, field: 'date' | 'notes', value: string) => void;
  onAddCustomCA: () => void;
  onUpdateCustomCA: (id: string, field: 'text' | 'date' | 'notes', value: string) => void;
  onRemoveCustomCA: (id: string) => void;
  isSubmitted: boolean;
  onAnyChange: () => void;
}

export default function NarrativeSection(p: NarrativeSectionProps) {
  const activeCategories = Array.from(new Set(
    p.violations.filter(v => v.violationKey)
      .map(v => VIOLATION_TYPES.find(t => `${t.category}||${t.label}` === v.violationKey)?.category ?? '')
      .filter(Boolean)
  ));

  const checkedCount = Object.values(p.checkedStandardCAs).filter(Boolean).length + p.customCAs.length;

  return (
    <div className="space-y-4 sm:space-y-6 mb-4 sm:mb-6">
      {/* Summary */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground text-lg">Summary</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Provide an overview of the inspection and key findings.</p>
        <Textarea
          placeholder="Describe the overall condition of the property and key findings from this inspection..."
          value={p.summary}
          onChange={e => { p.onSummaryChange(e.target.value); p.onAnyChange(); }}
          disabled={p.isSubmitted}
          className="min-h-[100px] resize-none text-sm"
        />
      </div>

      {/* Observations */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground text-lg">Observations</h2>
            <span className="text-sm text-muted-foreground hidden sm:inline">— list specific observations by number.</span>
          </div>
          <span className="bg-primary/10 text-primary text-sm font-semibold px-3 py-1 rounded-full">
            {p.observations.length} note{p.observations.length !== 1 ? 's' : ''}
          </span>
        </div>
        {p.observations.length === 0 ? (
          <div className="px-6 py-8 text-center text-muted-foreground text-sm">No observations added yet.</div>
        ) : (
          <div className="divide-y divide-border">
            <AnimatePresence mode="popLayout">
              {p.observations.map((obs, i) => (
                <motion.div key={obs.id}
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.18 }}
                  className="px-3 sm:px-6 py-4 flex flex-col sm:grid sm:grid-cols-12 gap-3 items-start"
                >
                  <div className="hidden sm:flex col-span-1 justify-center pt-7">
                    <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  </div>
                  <div className="col-span-7 space-y-1 w-full">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Observation</label>
                    <Textarea placeholder="e.g. Observed rodent droppings near south wall..."
                      value={obs.text}
                      onChange={e => { p.onObservationChange(obs.id, 'text', e.target.value); p.onAnyChange(); }}
                      className="min-h-[72px] resize-none text-sm" disabled={p.isSubmitted} />
                  </div>
                  <div className="col-span-3 space-y-1 w-full">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Linked Violation</label>
                    <Select value={obs.linkedViolationKey || 'none'}
                      onValueChange={val => { p.onObservationChange(obs.id, 'linkedViolationKey', val === 'none' ? '' : val); p.onAnyChange(); }}
                      disabled={p.isSubmitted}>
                      <SelectTrigger className="text-sm h-9"><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— None —</SelectItem>
                        {p.filledViolations.map(v => {
                          const vType = VIOLATION_TYPES.find(t => `${t.category}||${t.label}` === v.violationKey);
                          return vType ? <SelectItem key={v.id} value={v.violationKey}>{vType.label}</SelectItem> : null;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 flex items-center justify-end sm:justify-center sm:pt-7">
                    {!p.isSubmitted && (
                      <button type="button" onClick={() => p.onRemoveObservation(obs.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors text-lg leading-none p-1 rounded">×</button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        {!p.isSubmitted && (
          <div className="px-6 py-4 border-t border-border">
            <Button variant="outline" size="sm" className="gap-2" onClick={p.onAddObservation}>
              <Plus className="w-4 h-4" /> Add Observation
            </Button>
          </div>
        )}
      </div>

      {/* Corrective Actions */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground text-lg">Corrective Actions</h2>
          </div>
          {checkedCount > 0 && (
            <span className="bg-primary/10 text-primary text-sm font-semibold px-3 py-1 rounded-full">
              {checkedCount} action{checkedCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="p-4 sm:p-6 space-y-6">
          {activeCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Add violations above to see suggested corrective actions, or add a custom one below.</p>
          ) : activeCategories.map(cat => {
            const suggestions = CA_SUGGESTIONS[cat] ?? [];
            if (!suggestions.length) return null;
            return (
              <div key={cat}>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">{cat}</h3>
                <div className="space-y-2">
                  {suggestions.map(text => {
                    const key = `${cat}|||${text}`;
                    const isChecked = !!p.checkedStandardCAs[key];
                    const details = p.standardCADetails[key] ?? { date: '', notes: '' };
                    return (
                      <div key={key} className={`rounded-lg border transition-colors ${isChecked ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
                        <div className="flex items-start gap-3 p-3">
                          <Checkbox id={`ca-${key}`} checked={isChecked} disabled={p.isSubmitted}
                            onCheckedChange={checked => { p.onToggleStandardCA(key, !!checked); p.onAnyChange(); }}
                            className="mt-0.5" />
                          <label htmlFor={`ca-${key}`} className="text-sm cursor-pointer flex-1 font-medium">{text}</label>
                        </div>
                        <AnimatePresence>
                          {isChecked && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              className="border-t border-border px-3 pb-3 pt-2 grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Correction Date</label>
                                <Input type="date" value={details.date}
                                  onChange={e => { p.onUpdateStandardCADetail(key, 'date', e.target.value); p.onAnyChange(); }}
                                  disabled={p.isSubmitted} className="h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes (optional)</label>
                                <Input placeholder="Additional notes..." value={details.notes}
                                  onChange={e => { p.onUpdateStandardCADetail(key, 'notes', e.target.value); p.onAnyChange(); }}
                                  disabled={p.isSubmitted} className="h-8 text-sm" />
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
          })}

          {p.customCAs.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Custom Corrective Actions</h3>
              <div className="space-y-3">
                {p.customCAs.map((ca, i) => (
                  <div key={ca.id} className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-2">{i + 1}</span>
                      <Textarea placeholder="Describe the corrective action required..." value={ca.text}
                        onChange={e => { p.onUpdateCustomCA(ca.id, 'text', e.target.value); p.onAnyChange(); }}
                        disabled={p.isSubmitted} className="min-h-[60px] resize-none text-sm flex-1" />
                      {!p.isSubmitted && (
                        <button type="button" onClick={() => p.onRemoveCustomCA(ca.id)}
                          className="text-muted-foreground hover:text-destructive p-1 mt-1 flex-shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 pl-7">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Correction Date</label>
                        <Input type="date" value={ca.date}
                          onChange={e => { p.onUpdateCustomCA(ca.id, 'date', e.target.value); p.onAnyChange(); }}
                          disabled={p.isSubmitted} className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes (optional)</label>
                        <Input placeholder="Additional notes..." value={ca.notes}
                          onChange={e => { p.onUpdateCustomCA(ca.id, 'notes', e.target.value); p.onAnyChange(); }}
                          disabled={p.isSubmitted} className="h-8 text-sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!p.isSubmitted && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => { p.onAddCustomCA(); p.onAnyChange(); }}>
              <Plus className="w-4 h-4" /> Add Custom Corrective Action
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
