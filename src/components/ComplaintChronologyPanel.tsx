import { useState } from 'react';

import { BookOpen, User, ChevronDown, ChevronUp } from 'lucide-react';
import { sanitizeText } from '@/utils/sanitizeText';

type ChronologyEntry = any['chronology'][0];

type Props = {
  chronology: ChronologyEntry[];
  loading?: boolean;
};

function fmtDate(d?: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y}`;
}

const TYPE_BADGE: Record<string, string> = {
  'Inspection':       'bg-primary/10 text-primary',
  'NOV':              'bg-destructive/10 text-destructive',
  'Re-inspection':    'bg-accent/20 text-accent-foreground',
  'Contact Attempt':  'bg-muted text-muted-foreground',
  'Hearing Referral': 'bg-accent/10 text-accent-foreground',
  'Other':            'bg-muted text-muted-foreground',
};

const PREVIEW_COUNT = 5;

export default function ComplaintChronologyPanel({ chronology, loading }: Props) {
  const [showAll, setShowAll] = useState(false);

  // Sort newest-first for the preview
  const sorted = [...chronology].sort((a, b) =>
    (b.entryDate ?? '').localeCompare(a.entryDate ?? '')
  );
  const visible = showAll ? sorted : sorted.slice(0, PREVIEW_COUNT);
  const hasMore = sorted.length > PREVIEW_COUNT;

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Case Chronology</h3>
        </div>
        <div className="p-5 space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-muted/40 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Case Chronology</h3>
          {chronology.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {chronology.length}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground italic hidden sm:inline">Director's Hearing preview</span>
      </div>

      {chronology.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No chronology entries yet</p>
          <p className="text-xs mt-1 max-w-xs mx-auto">
            Entries are added automatically as inspections, NOVs, and other actions are recorded.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-3 py-2.5 font-bold text-foreground uppercase tracking-wide text-[10px] whitespace-nowrap w-20 border-r border-border">
                    Date
                  </th>
                  <th className="text-left px-3 py-2.5 font-bold text-foreground uppercase tracking-wide text-[10px] w-28 border-r border-border">
                    Type
                  </th>
                  <th className="text-left px-3 py-2.5 font-bold text-foreground uppercase tracking-wide text-[10px] border-r border-border">
                    Summary
                  </th>
                  <th className="text-left px-3 py-2.5 font-bold text-foreground uppercase tracking-wide text-[10px] w-24">
                    Exhibits
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className={`border-b border-border align-top ${i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}
                  >
                    <td className="px-3 py-2.5 border-r border-border whitespace-nowrap text-foreground font-medium">
                      {fmtDate(entry.entryDate)}
                    </td>
                    <td className="px-3 py-2.5 border-r border-border">
                      {entry.entryType ? (
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${TYPE_BADGE[entry.entryType] ?? 'bg-muted text-muted-foreground'}`}>
                          {entry.entryType}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 border-r border-border">
                      <div className="space-y-1">
                        {entry.summary && (
                          <p className="text-foreground leading-relaxed">{sanitizeText(entry.summary)}</p>
                        )}
                        {entry.violationsObserved && (
                          <p className="text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-foreground/70">Violations: </span>
                            {sanitizeText(entry.violationsObserved)}
                          </p>
                        )}
                        {!entry.summary && !entry.violationsObserved && (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {entry.createdBy && (
                          <p className="flex items-center gap-1 text-muted-foreground mt-1">
                            <User className="w-2.5 h-2.5 flex-shrink-0" />
                            {entry.createdBy}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {entry.exhibit_refs ? (
                        <span className="text-primary font-medium leading-snug">{entry.exhibit_refs}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                      {entry.attachmentPageRef && (
                        <p className="text-muted-foreground mt-0.5">p. {entry.attachmentPageRef}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer with count + expand toggle */}
          <div className="px-4 py-2.5 bg-muted/20 border-t border-border flex items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground italic">
              {hasMore && !showAll
                ? `Showing ${PREVIEW_COUNT} of ${sorted.length} entries (newest first)`
                : `${sorted.length} ${sorted.length === 1 ? 'entry' : 'entries'} — newest first`}
            </p>
            {hasMore && (
              <button
                type="button"
                onClick={() => setShowAll(v => !v)}
                className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
              >
                {showAll ? (
                  <><ChevronUp className="w-3.5 h-3.5" /> Collapse</>
                ) : (
                  <><ChevronDown className="w-3.5 h-3.5" /> View all {sorted.length}</>
                )}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
