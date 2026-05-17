import { CheckCircle2, AlertTriangle } from "lucide-react";
import SectionHeader from "./SectionHeader";

type Props = {
  missingReinspDate: { id: string; complaintid?: string; address?: string }[];
  missingAssignment: { id: string; complaintid?: string; address?: string }[];
};

export default function QualityChecksPanel({
  missingReinspDate,
  missingAssignment,
}: Props) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-5">
      <SectionHeader
        icon={<AlertTriangle className="w-4 h-4" />}
        title="Quality Checks"
      />
      {missingReinspDate.length === 0 && missingAssignment.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-success bg-success/10 border border-success/20 rounded-lg px-4 py-3">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          No data quality issues found.
        </div>
      ) : (
        <div className="space-y-3">
          {missingReinspDate.length > 0 && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                <span className="text-xs font-semibold text-warning">
                  {missingReinspDate.length} complaint
                  {missingReinspDate.length !== 1 ? "s" : ""} — Re-Inspection
                  Due but no date set
                </span>
              </div>
              <div className="space-y-1">
                {missingReinspDate.slice(0, 5).map((c) => (
                  <p
                    key={c.id}
                    className="text-xs text-muted-foreground truncate"
                  >
                    <span className="font-mono text-primary">
                      #{c.complaintid}
                    </span>{" "}
                    · {c.address}
                  </p>
                ))}
                {missingReinspDate.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{missingReinspDate.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}
          {missingAssignment.length > 0 && (
            <div className="bg-warning/15 border border-warning/35 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                <span className="text-xs font-semibold text-warning">
                  {missingAssignment.length} active complaint
                  {missingAssignment.length !== 1 ? "s" : ""} unassigned
                </span>
              </div>
              <div className="space-y-1">
                {missingAssignment.slice(0, 5).map((c) => (
                  <p
                    key={c.id}
                    className="text-xs text-muted-foreground truncate"
                  >
                    <span className="font-mono text-primary">
                      #{c.complaintid}
                    </span>{" "}
                    · {c.address}
                  </p>
                ))}
                {missingAssignment.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{missingAssignment.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
