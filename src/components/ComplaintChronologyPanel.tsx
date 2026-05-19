import { useState } from "react";
import { BookOpen, User, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { sanitizeText } from "@/utils/sanitizeText";

type ChronologyEntry = any["chronology"][0];

type Props = {
  chronology: ChronologyEntry[];
  loading?: boolean;
};

function fmtDate(d?: string) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${m}/${day}/${y}`;
}

const TYPE_BADGE: Record<string, string> = {
  Inspection: "bg-primary/10 text-primary border-primary/20",
  NOV: "bg-destructive/10 text-destructive border-destructive/20",
  "Re-inspection": "bg-accent/20 text-accent-foreground border-accent/30",
  "Contact Attempt": "bg-muted text-muted-foreground border-border",
  "Hearing Referral": "bg-accent/10 text-accent-foreground border-accent/20",
  Other: "bg-muted text-muted-foreground border-border",
};

const PREVIEW_COUNT = 5;

export default function ComplaintChronologyPanel({
  chronology,
  loading,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  // Sort newest-first for the preview
  const sorted = [...chronology].sort((a, b) =>
    (b.entryDate ?? "").localeCompare(a.entryDate ?? ""),
  );
  const visible = showAll ? sorted : sorted.slice(0, PREVIEW_COUNT);
  const hasMore = sorted.length > PREVIEW_COUNT;

  if (loading) {
    return (
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="px-5 py-3 bg-muted/40 border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary/70" />
            <CardTitle className="text-xs tracking-widest">
              Case Chronology
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="px-5 py-3 bg-muted/40 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary/70" />
            <CardTitle className="text-xs tracking-widest">
              Case Chronology
            </CardTitle>
            {chronology.length > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] h-4 px-1.5 font-bold bg-muted text-muted-foreground border-none shadow-none"
              >
                {chronology.length}
              </Badge>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground italic uppercase tracking-wider font-semibold hidden sm:inline">
            Hearing Preview
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {chronology.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No chronology entries yet</p>
            <p className="text-xs mt-1 max-w-xs mx-auto">
              Entries are added automatically as inspections, NOVs, and other
              actions are recorded.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-3 py-2 font-bold text-muted-foreground uppercase tracking-wider w-20 border-r border-border">
                    Date
                  </th>
                  <th className="text-left px-3 py-2 font-bold text-muted-foreground uppercase tracking-wider w-28 border-r border-border">
                    Type
                  </th>
                  <th className="text-left px-3 py-2 font-bold text-muted-foreground uppercase tracking-wider border-r border-border">
                    Summary
                  </th>
                  <th className="text-left px-3 py-2 font-bold text-muted-foreground uppercase tracking-wider w-24">
                    Exhibits
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className={cn(
                      "border-b border-border last:border-0 align-top",
                      i % 2 === 0 ? "bg-background" : "bg-muted/10",
                    )}
                  >
                    <td className="px-3 py-2.5 border-r border-border whitespace-nowrap text-foreground font-medium">
                      {fmtDate(entry.entryDate)}
                    </td>
                    <td className="px-3 py-2.5 border-r border-border">
                      {entry.entryType ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] h-4.5 px-1.5 font-bold whitespace-nowrap",
                            TYPE_BADGE[entry.entryType] ??
                              "bg-muted text-muted-foreground",
                          )}
                        >
                          {entry.entryType}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 border-r border-border">
                      <div className="space-y-1">
                        {entry.summary && (
                          <p className="text-foreground leading-relaxed">
                            {sanitizeText(entry.summary)}
                          </p>
                        )}
                        {entry.violationsObserved && (
                          <p className="text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-foreground/70">
                              Violations:{" "}
                            </span>
                            {sanitizeText(entry.violationsObserved)}
                          </p>
                        )}
                        {!entry.summary && !entry.violationsObserved && (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {entry.createdBy && (
                          <p className="flex items-center gap-1 text-muted-foreground mt-1 font-medium">
                            <User className="w-2.5 h-2.5 flex-shrink-0" />
                            {entry.createdBy}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {entry.exhibit_refs ? (
                        <span className="text-primary font-bold leading-snug">
                          {entry.exhibit_refs}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                      {entry.attachmentPageRef && (
                        <p className="text-muted-foreground mt-0.5">
                          p. {entry.attachmentPageRef}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {chronology.length > 0 && (
        <CardFooter className="p-0 border-t border-border/60 bg-muted/20">
          <div className="w-full px-4 py-2 flex items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground italic font-medium">
              {hasMore && !showAll
                ? `Showing ${PREVIEW_COUNT} of ${sorted.length} entries`
                : `${sorted.length} entries — newest first`}
            </p>
            {hasMore && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="flex items-center gap-1 text-[11px] text-primary font-bold hover:underline"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" /> Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" /> View all
                  </>
                )}
              </button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
