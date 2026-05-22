import { useRef, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { packetService, type PacketValidationResult } from "@/services/packetService";
import { Button } from "@/components/ui/button";
import {
  Printer,
  X,
  AlertTriangle,
  CheckCircle2,
  PenLine,
  Loader2,
  Save,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PacketCoverPage } from "./packet/PacketCoverPage";
import { PacketEnforcementSummary } from "./packet/PacketEnforcementSummary";
import { PacketChronology } from "./packet/PacketChronology";
import { PacketInspectionReport } from "./packet/PacketInspectionReport";
import { PacketPhotoAppendix } from "./packet/PacketPhotoAppendix";
import { PacketExhibitEBundle } from "./packet/PacketExhibitEBundle";
import { tryParseSignature, type ParsedSignature } from "./packet/SignatureBlock";
import { elementToPdfBlob } from "./packet/printUtils";

type Props = {
  data: any; // Properly type later
  onClose: () => void;
};

const MANAGER_ROLES = ["Program Manager", "Admin", "Super Admin"];

export default function HearingPacketPreview({ data, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const { packet, complaint, location, inspector, inspections, chronology, exhibits, serviceLog } =
    data;

  // ── Compilation stage progress ───────────────────────────────────────────
  const [renderStage, setRenderStage] = useState<"rendering" | "numbering" | "ready">("rendering");

  const [prevDataId, setPrevDataId] = useState(data.packet.id);
  if (data.packet.id !== prevDataId) {
    setPrevDataId(data.packet.id);
    setRenderStage("rendering");
  }

  useEffect(() => {
    if (renderStage === "rendering") {
      const t = setTimeout(() => setRenderStage("numbering"), 450);
      return () => clearTimeout(t);
    }
  }, [renderStage]);

  // ── Signature state ─────────────────────────────────────────────────────
  const [inspectorSig, setInspectorSig] = useState<ParsedSignature | null>(null);
  const [managerSig, setManagerSig] = useState<ParsedSignature | null>(null);
  const [sigSaving, setSigSaving] = useState(false);
  const [isSavingPdf, setIsSavingPdf] = useState(false);

  // ── Validation state ────────────────────────────────────────────────────
  const [validationResults, setValidationResults] = useState<PacketValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const runValidation = async () => {
      if (!packet.id) return;
      setIsValidating(true);
      try {
        const results = await packetService.validatePacket(packet.id);
        setValidationResults(results);
      } catch (err) {
        console.error("Validation failed:", err);
      } finally {
        setIsValidating(false);
      }
    };

    runValidation();
  }, [packet.id]);

  const validationFailures = validationResults.filter((r) => r.status === "fail");
  const hasCriticalFailures = validationFailures.some((r) => r.severity === "critical");
  const isSubmitBlocked = validationFailures.length > 0;

  // Initialize signatures from saved packet data, or auto-fill from user profile
  const [prevPacketId, setPrevPacketId] = useState(packet.id);
  if (packet.id !== prevPacketId) {
    setPrevPacketId(packet.id);
    const savedInspector = tryParseSignature(packet.inspector_signature);
    const savedManager = tryParseSignature(packet.manager_signature);

    setManagerSig(savedManager);

    if (savedInspector) {
      setInspectorSig(savedInspector);
    } else if (user?.signatureText) {
      // Auto-fill inspector slot from current user's saved signature
      const autoSig: ParsedSignature = {
        text: user.signatureText,
        style: user.signatureStyle ?? "Style 1 — Classic",
      };
      setInspectorSig(autoSig);
      packetService
        .update(packet.id, {
          inspector_signature: JSON.stringify(autoSig),
        })
        .catch(() => {});
    }
  }

  const isManagerRole = user?.role && MANAGER_ROLES.includes(user.role);
  const hasNoSignature = !user?.signatureText;

  const handleCountersign = async () => {
    if (!user?.signatureText) return;
    setSigSaving(true);
    const sig: ParsedSignature = {
      text: user.signatureText,
      style: user.signatureStyle ?? "Style 1 — Classic",
    };
    setManagerSig(sig);
    try {
      await packetService.update(packet.id, {
        manager_signature: JSON.stringify(sig),
      });
    } catch {
      /* ignore */
    } finally {
      setSigSaving(false);
    }
  };

  const handleClearManagerSig = async () => {
    setManagerSig(null);
    try {
      await packetService.update(packet.id, { manager_signature: "" });
    } catch {
      /* ignore */
    }
  };

  const handleSaveFinalPdf = async () => {
    if (!printRef.current) return;
    setIsSavingPdf(true);
    toast.loading("Generating PDF...", { id: "save-pdf" });

    try {
      const blob = await elementToPdfBlob("hearing-packet-print");
      toast.loading("Uploading to storage...", { id: "save-pdf" });
      const url = await packetService.generateAndStorePdf(packet.id, blob);
      toast.success("Final PDF saved successfully!", { id: "save-pdf" });
      window.open(url, "_blank");
    } catch (err) {
      console.error("Failed to save PDF:", err);
      toast.error("Failed to save final PDF", { id: "save-pdf" });
    } finally {
      setIsSavingPdf(false);
    }
  };

  // Inject page numbers after render
  useEffect(() => {
    if (!printRef.current) return;
    const slots = printRef.current.querySelectorAll(".page-number-slot");
    const total = slots.length;
    slots.forEach((slot, i) => {
      const s = slot as HTMLElement;
      s.innerHTML = `Page ${String(i + 1).padStart(3, "0")} of ${String(total).padStart(3, "0")}`;
      s.style.textAlign = "center";
    });
    setRenderStage("ready");
  }, [data, inspectorSig, managerSig]);

  const handlePrint = () => window.print();

  // Assign exhibit letters A, B, C... to inspections in chronological order
  const inspectionExhibitLetters = inspections.map((_: any, idx: number) =>
    String.fromCharCode(65 + idx),
  );

  const selectedPhotoIds: string[] = packet.selected_photo_ids ?? [];

  const allPhotosPerInspection = inspections.map((insp: any, idx: number) => {
    const nextDate = inspections[idx + 1]?.inspection_date;
    return (data.allPhotos || []).filter((p: any) => {
      if (!p.uploaded_at || !insp.inspection_date) return idx === 0;
      const pDate = p.uploaded_at.slice(0, 10);
      return pDate >= insp.inspection_date && (!nextDate || pDate < nextDate);
    });
  });

  const photoOffsets: number[] = inspections.map((_: unknown, idx: number) => {
    let offset = 0;
    for (let i = 0; i < idx; i++) {
      offset += allPhotosPerInspection[i].length;
    }
    return offset;
  });

  const totalPhotos = (data.allPhotos || []).length;

  return (
    <div className="fixed inset-0 z-50 bg-deep/60 overflow-auto print:bg-transparent print:static">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #hearing-packet-print, #hearing-packet-print * { visibility: visible; }
          #hearing-packet-print {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
          }
          .print-page-break { page-break-after: always; break-after: page; }
          .print-page-break:last-child { page-break-after: avoid; break-after: avoid; }
          tr { break-inside: avoid; }
          .photo-card { break-inside: avoid; }
        }
        @media screen {
          .packet-page {
            width: 8.5in;
            min-height: 11in;
            padding: 0.75in;
            background: white;
            margin: 0 auto 24px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.15);
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }
        }
      `}</style>

      {/* Toolbar */}
      <div className="print-toolbar sticky top-0 z-10 bg-card border-b border-border shadow-md px-6 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-foreground">Director's Hearing Packet</h2>
            <p className="text-xs text-muted-foreground">
              {complaint?.legacy_complaint_id ? `#${complaint.legacy_complaint_id} — ` : ""}
              {complaint?.address ?? ""}
              {packet.case_number ? ` | Case ${packet.case_number}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Validation Status */}
          {validationFailures.length > 0 ? (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs ${
                hasCriticalFailures
                  ? "bg-destructive/10 border-destructive/30 text-destructive"
                  : "bg-warning/10 border-warning/30 text-warning"
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium">
                {validationFailures.length} compliance issue
                {validationFailures.length !== 1 ? "s" : ""}
              </span>
            </div>
          ) : !isValidating && renderStage === "ready" ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/30 rounded-lg text-xs text-success">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium">All compliance checks passed</span>
            </div>
          ) : null}

          {/* Signature warning */}
          {hasNoSignature && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 border border-warning/30 rounded-lg text-xs text-warning">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>No signature saved —</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/profile");
                }}
                className="underline underline-offset-2 hover:no-underline font-medium"
              >
                Set up on My Profile
              </button>
            </div>
          )}

          {/* Inspector sig indicator */}
          {inspectorSig && !hasNoSignature && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>Inspector signed</span>
            </div>
          )}

          {/* Manager countersign */}
          {isManagerRole &&
            (managerSig ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  <span>Countersigned</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearManagerSig}
                  className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-2 transition-colors"
                >
                  Clear
                </button>
              </div>
            ) : (
              <Button
                onClick={handleCountersign}
                disabled={sigSaving || !user?.signatureText}
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
              >
                <PenLine className="w-3.5 h-3.5" />
                {sigSaving ? "Signing…" : "Countersign"}
              </Button>
            ))}

          {/* Compilation stage indicator */}
          {renderStage !== "ready" ? (
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground px-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary flex-shrink-0" />
              <span>
                {renderStage === "rendering"
                  ? "Rendering packet pages…"
                  : "Calculating page numbers…"}
              </span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground px-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>Ready to print</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground hidden lg:block">
            {inspections.length} insp · {totalPhotos} photo
            {totalPhotos !== 1 ? "s" : ""} · {chronology.length} chrono · {exhibits.length} exhibit
            {exhibits.length !== 1 ? "s" : ""}
          </p>
          <Button
            onClick={handleSaveFinalPdf}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={renderStage !== "ready" || isSavingPdf || isSubmitBlocked}
          >
            {isSavingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSavingPdf ? "Saving..." : "Save Final PDF"}
          </Button>
          <Button
            onClick={handlePrint}
            size="sm"
            className="gap-2"
            disabled={renderStage !== "ready" || isSubmitBlocked}
          >
            {renderStage !== "ready" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            {renderStage !== "ready" ? "Assembling…" : "Print / Save PDF"}
          </Button>
        </div>
      </div>

      {/* Packet document order */}
      <div
        className="py-8 px-4 print:p-0"
        id="hearing-packet-print"
        ref={printRef}
        data-testid="hearing-packet-print"
      >
        {/* 1. Cover Page */}
        <section data-testid="packet-section-cover">
          <PacketCoverPage packet={packet} complaint={complaint} location={location} />
        </section>

        {/* 2. Environmental Health Basis for Proposed Enforcement Action */}
        <section data-testid="packet-section-summary">
          <PacketEnforcementSummary
            packet={packet}
            complaint={complaint}
            location={location}
            inspections={inspections}
            inspector={inspector}
            inspectorSig={inspectorSig}
            managerSig={managerSig}
          />
        </section>

        {/* 3. Director's Hearing Case Chronology (Proposed Order integrated inside) */}
        <section data-testid="packet-section-chronology">
          <PacketChronology
            chronology={chronology}
            complaint={complaint}
            packet={packet}
            location={location}
            inspectorSig={inspectorSig}
            managerSig={managerSig}
            inspector={inspector}
          />
        </section>

        {/* 4. Inspection Exhibits (A, B, C...) */}
        {inspections.map((insp: any, idx: number) => (
          <section
            key={insp.id}
            data-testid={`packet-exhibit-${inspectionExhibitLetters[idx]}`}
          >
            <PacketInspectionReport
              inspection={insp}
              index={idx}
              complaint={complaint}
              location={location}
              packet={packet}
              exhibitLetter={inspectionExhibitLetters[idx]}
            />
            <PacketPhotoAppendix
              inspection={insp}
              index={idx}
              complaint={complaint}
              packet={packet}
              globalPhotoOffset={photoOffsets[idx]}
              exhibitLetter={inspectionExhibitLetters[idx]}
              allPhotosForInspection={allPhotosPerInspection[idx]}
              exhibitPhotoIds={selectedPhotoIds}
            />
          </section>
        ))}

        {/* 5. Exhibit E Bundle (Notice of Hearing, NOV, Service Logs) */}
        <section data-testid="packet-exhibit-e">
          <PacketExhibitEBundle
            packet={packet}
            complaint={complaint}
            location={location}
            inspector={inspector}
            inspections={inspections}
            serviceLog={serviceLog}
          />
        </section>
      </div>
    </div>
  );
}
