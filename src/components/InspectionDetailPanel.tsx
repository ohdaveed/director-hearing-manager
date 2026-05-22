import { useState, useEffect } from "react";

import { Loader2, X, Printer, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inspectionService } from "@/services/inspectionService";

type Detail = any;

type Props = {
  inspectionId: string;
  onClose: () => void;
};

const statusBadge = (status?: string) => {
  if (status === "Abated") return "bg-primary/10 text-primary";
  if (status === "Corrected on Site") return "bg-muted text-foreground";
  return "bg-destructive/10 text-destructive";
};

export default function InspectionDetailPanel({ inspectionId, onClose }: Props) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<{
    observations?: { id: string; text: string; linkedViolationKey: string }[];
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    setDetail(null);
    inspectionService
      .getById(inspectionId)
      .then((d: any) => {
        setDetail(d);
        if (d.inspection.notes) {
          try {
            setNotes(JSON.parse(d.inspection.notes));
          } catch {
            /* no-op */
          }
        }
      })
      .catch(() => {
        /* no-op */
      })
      .finally(() => setLoading(false));
  }, [inspectionId]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-sm p-8 flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading inspection details...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-sm p-8 text-center text-muted-foreground">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p>Could not load inspection details.</p>
      </div>
    );
  }

  const { inspection, violations, location } = detail;
  const isSubmitted = inspection.status === "Submitted";

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <div>
          <p className="font-semibold text-foreground text-base">
            {inspection.facilityAddress || "Inspection Detail"}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {isSubmitted ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Submitted
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" /> Draft
              </span>
            )}
            {inspection.inspection_rating === "Satisfactory" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Satisfactory
              </span>
            )}
            {inspection.inspection_rating === "Unsatisfactory" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                <XCircle className="w-3 h-3" /> Unsatisfactory
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 print:hidden"
            onClick={handlePrint}
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-240px)]">
        {/* Summary fields */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Field label="Inspector" value={inspection.inspector} />
          <Field
            label="Date"
            value={
              inspection.inspection_date
                ? new Date(inspection.inspection_date).toLocaleDateString()
                : undefined
            }
          />
          <Field label="Time In" value={inspection.timeIn} />
          <Field label="Time Out" value={inspection.timeOut} />
          <Field label="Inspection Type" value={inspection.inspection_type} />
          <Field label="Access Granted By" value={inspection.accessGrantedBy} />
          <Field label="DBA" value={inspection.dba} />
          <Field label="Complaint ID" value={inspection.legacy_complaint_id} />
          {inspection.contactPhone && (
            <Field label="Contact Phone" value={inspection.contactPhone} />
          )}
          {inspection.contactEmail && (
            <Field label="Contact Email" value={inspection.contactEmail} />
          )}
          {location?.owner_name && <Field label="Owner" value={location.owner_name} />}
          {location?.facility_type && (
            <Field label="Facility Type" value={location.facility_type} />
          )}
          {location?.number_of_units && (
            <Field label="# Units" value={String(location.number_of_units)} />
          )}
          {location?.number_of_rooms && (
            <Field label="# Rooms" value={String(location.number_of_rooms)} />
          )}
          {location?.census_tract && <Field label="Census Tract" value={location.census_tract} />}
          {location?.current_fees != null && (
            <Field
              label="Current Fees"
              value={`$${(location.current_fees as number).toFixed(2)}`}
            />
          )}
        </div>

        {/* Violations */}
        {violations.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Violations ({violations.length})
            </h3>
            <div className="space-y-2">
              {violations.map((v: any, i: number) => (
                <div key={v.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-destructive/10 text-destructive text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-sm font-semibold text-foreground">{v.violation_label}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {v.responsible_party && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {v.responsible_party}
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${statusBadge(v.status)}`}
                      >
                        {v.status ?? "Violation"}
                      </span>
                    </div>
                  </div>
                  {v.location_in_property && (
                    <p className="text-xs text-muted-foreground ml-7">
                      📍 {v.location_in_property}
                    </p>
                  )}
                  {v.corrective_action && (
                    <p className="text-xs text-foreground mt-1.5 ml-7 leading-relaxed">
                      {v.corrective_action}
                    </p>
                  )}
                  {v.due_date && (
                    <p className="text-xs text-muted-foreground mt-1 ml-7">
                      Due: {new Date(v.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observations */}
        {notes?.observations && notes.observations.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Observations ({notes.observations.length})
            </h3>
            <div className="space-y-2">
              {notes.observations.map((obs, i) => (
                <div
                  key={obs.id}
                  className="border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
                >
                  <span className="text-xs text-muted-foreground mr-2">{i + 1}.</span>
                  {obs.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {isSubmitted && inspection.submittedAt && (
          <p className="text-xs text-muted-foreground text-right">
            Submitted {new Date(inspection.submittedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
