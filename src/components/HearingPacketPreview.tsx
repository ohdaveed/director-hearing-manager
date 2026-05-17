import { useRef, useEffect, useState } from 'react';
import { useAuth } from 'zite-auth-sdk';
import { GetHearingPacketDataOutputType, savePacketSignatures } from 'zite-endpoints-sdk';
import { Button } from '@/components/ui/button';
import { Printer, X, AlertTriangle, CheckCircle2, PenLine, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PacketCoverPage } from './packet/PacketCoverPage';
import { PacketEnforcementSummary } from './packet/PacketEnforcementSummary';
import { PacketNoticeOfViolation } from './packet/PacketNoticeOfViolation';
import { PacketNoticeOfHearing } from './packet/PacketNoticeOfHearing';
import { PacketChronology } from './packet/PacketChronology';
import { PacketExhibitList } from './packet/PacketExhibitList';
import { PacketInspectionReport } from './packet/PacketInspectionReport';
import { PacketPhotoAppendix } from './packet/PacketPhotoAppendix';
import { PacketServiceLog } from './packet/PacketServiceLog';
import { tryParseSignature, type ParsedSignature } from './packet/SignatureBlock';

type Props = {
  data: GetHearingPacketDataOutputType;
  onClose: () => void;
};

const MANAGER_ROLES = ['Program Manager', 'Admin', 'Super Admin'];

export default function HearingPacketPreview({ data, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const { packet, complaint, location, inspector, inspections, chronology, exhibits, serviceLog } = data;

  // ── Compilation stage progress ───────────────────────────────────────────
  const [renderStage, setRenderStage] = useState<'rendering' | 'numbering' | 'ready'>('rendering');

  useEffect(() => {
    setRenderStage('rendering');
    const t = setTimeout(() => setRenderStage('numbering'), 450);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.packet.id]);

  // ── Signature state ─────────────────────────────────────────────────────
  const [inspectorSig, setInspectorSig] = useState<ParsedSignature | null>(null);
  const [managerSig, setManagerSig] = useState<ParsedSignature | null>(null);
  const [sigSaving, setSigSaving] = useState(false);

  // Initialize signatures from saved packet data, or auto-fill from user profile
  useEffect(() => {
    const savedInspector = tryParseSignature(packet.inspectorSignature);
    const savedManager = tryParseSignature(packet.managerSignature);

    setManagerSig(savedManager);

    if (savedInspector) {
      setInspectorSig(savedInspector);
    } else if (user?.signatureText) {
      // Auto-fill inspector slot from current user's saved signature
      const autoSig: ParsedSignature = {
        text: user.signatureText,
        style: user.signatureStyle ?? 'Style 1 — Classic',
      };
      setInspectorSig(autoSig);
      // Persist to packet record silently
      savePacketSignatures({
        packetId: packet.id,
        inspectorSignature: JSON.stringify(autoSig),
      }).catch(() => { /* silent */ });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packet.id]);

  const isManagerRole = user?.role && MANAGER_ROLES.includes(user.role);
  const hasNoSignature = !user?.signatureText;

  const handleCountersign = async () => {
    if (!user?.signatureText) return;
    setSigSaving(true);
    const sig: ParsedSignature = {
      text: user.signatureText,
      style: user.signatureStyle ?? 'Style 1 — Classic',
    };
    setManagerSig(sig);
    try {
      await savePacketSignatures({
        packetId: packet.id,
        managerSignature: JSON.stringify(sig),
      });
    } catch { /* ignore */ } finally {
      setSigSaving(false);
    }
  };

  const handleClearManagerSig = async () => {
    setManagerSig(null);
    try {
      await savePacketSignatures({ packetId: packet.id, managerSignature: '' });
    } catch { /* ignore */ }
  };

  // Inject page numbers after render
  useEffect(() => {
    if (!printRef.current) return;
    const pages = printRef.current.querySelectorAll('.packet-page');
    const total = pages.length;
    pages.forEach((page, i) => {
      const slot = page.querySelector('.page-number-slot');
      if (slot) slot.textContent = `Page ${i + 1} of ${total}`;
    });
    setRenderStage('ready');
  }, [data, inspectorSig, managerSig]);

  const handlePrint = () => window.print();

  // Assign exhibit letters A, B, C... to inspections in chronological order
  const inspectionExhibitLetters = inspections.map((_, idx) => String.fromCharCode(65 + idx));

  const selectedPhotoIds: string[] = packet.selectedPhotoIds ?? [];

  const allPhotosPerInspection = inspections.map((insp, idx) => {
    const nextDate = inspections[idx + 1]?.inspectionDate;
    return data.allPhotos.filter(p => {
      if (!p.uploadedAt || !insp.inspectionDate) return idx === 0;
      const pDate = p.uploadedAt.slice(0, 10);
      return pDate >= insp.inspectionDate && (!nextDate || pDate < nextDate);
    });
  });

  let photoOffset = 0;
  const photoOffsets: number[] = inspections.map((_, idx) => {
    const offset = photoOffset;
    photoOffset += allPhotosPerInspection[idx].length;
    return offset;
  });

  const totalPhotos = data.allPhotos.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 overflow-auto print:bg-transparent print:static">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;700&family=Great+Vibes&family=Pinyon+Script&family=Pacifico&display=swap");
        @media print {
          body * { visibility: hidden; }
          #hearing-packet-print, #hearing-packet-print * { visibility: visible; }
          #hearing-packet-print {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
          }
          .print-toolbar { display: none !important; }
          .print-page-break { page-break-after: always; break-after: page; }
          .print-page-break:last-child { page-break-after: avoid; break-after: avoid; }
          .packet-page {
            padding: 0.75in;
            min-height: 10.5in;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }
          .page-number-slot {
            margin-top: auto;
            padding-top: 12pt;
            text-align: right;
            font-size: 9pt;
            color: #888;
            font-family: Arial, sans-serif;
          }
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
          .page-number-slot {
            margin-top: auto;
            padding-top: 12px;
            text-align: right;
            font-size: 11px;
            color: #aaa;
          }
        }
      `}</style>

      {/* Toolbar */}
      <div className="print-toolbar sticky top-0 z-10 bg-card border-b border-border shadow-md px-6 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-foreground">Director's Hearing Packet</h2>
            <p className="text-xs text-muted-foreground">
              {complaint?.complaintId ? `#${complaint.complaintId} — ` : ''}{complaint?.address ?? ''}
              {packet.caseNumber ? ` | Case ${packet.caseNumber}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Signature warning */}
          {hasNoSignature && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 border border-warning/30 rounded-lg text-xs text-warning">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>No signature saved —</span>
              <button
                type="button"
                onClick={() => { onClose(); navigate('/profile'); }}
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
          {isManagerRole && (
            managerSig ? (
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
                {sigSaving ? 'Signing…' : 'Countersign'}
              </Button>
            )
          )}

          {/* Compilation stage indicator */}
          {renderStage !== 'ready' ? (
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground px-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary flex-shrink-0" />
              <span>
                {renderStage === 'rendering' ? 'Rendering packet pages…' : 'Calculating page numbers…'}
              </span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground px-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>Ready to print</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground hidden lg:block">
            {inspections.length} insp ·{' '}
            {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''} ·{' '}
            {chronology.length} chrono · {exhibits.length} exhibit{exhibits.length !== 1 ? 's' : ''}
          </p>
          <Button
            onClick={handlePrint}
            size="sm"
            className="gap-2"
            disabled={renderStage !== 'ready'}
          >
            {renderStage !== 'ready' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            {renderStage !== 'ready' ? 'Assembling…' : 'Print / Save PDF'}
          </Button>
        </div>
      </div>

      {/* Packet document order */}
      <div className="py-8 px-4 print:p-0" id="hearing-packet-print" ref={printRef}>
        {/* 1. Cover Page */}
        <PacketCoverPage packet={packet} complaint={complaint} location={location} />

        {/* 2. Environmental Health Basis for Proposed Enforcement Action */}
        <PacketEnforcementSummary
          packet={packet}
          complaint={complaint}
          location={location}
          inspections={inspections}
          inspector={inspector}
          inspectorSig={inspectorSig}
          managerSig={managerSig}
        />

        {/* 3. Notice of Violation */}
        <PacketNoticeOfViolation
          packet={packet}
          complaint={complaint}
          location={location}
          inspections={inspections}
          inspector={inspector}
        />

        {/* 4. Notice of Hearing */}
        <PacketNoticeOfHearing
          packet={packet}
          complaint={complaint}
          location={location}
          inspector={inspector}
          inspections={inspections}
        />

        {/* 5. Director's Hearing Case Chronology */}
        <PacketChronology
          chronology={chronology}
          complaint={complaint}
          packet={packet}
          location={location}
          inspectorSig={inspectorSig}
          managerSig={managerSig}
          inspector={inspector}
        />

        {/* 6. Exhibit List */}
        <PacketExhibitList exhibits={exhibits} packet={packet} complaint={complaint} />

        {/* 7. Inspection Reports + Photo Appendices */}
        {inspections.map((insp, idx) => (
          <div key={insp.id}>
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
          </div>
        ))}

        {/* 8. Proof of Service */}
        <PacketServiceLog
          serviceLog={serviceLog}
          complaint={complaint}
          location={location}
          packet={packet}
          inspector={inspector}
        />
      </div>
    </div>
  );
}
