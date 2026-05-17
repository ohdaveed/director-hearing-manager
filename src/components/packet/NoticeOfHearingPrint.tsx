import { Suspense } from "react";
import { Loader2, Printer, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { elementToPdf } from "@/utils/pdfExport";
import type { PacketWithRelations } from "@/types/packet";
import { PacketNoticeOfHearing } from "@/components/packet/PacketNoticeOfHearing";

interface NoticeOfHearingPrintProps {
  data: PacketWithRelations;
  onClose: () => void;
}

export function NoticeOfHearingPrint({
  data,
  onClose,
}: NoticeOfHearingPrintProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 overflow-auto">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #noh-print, #noh-print * { visibility: visible; }
          #noh-print { position: fixed; top: 0; left: 0; width: 100%; }
          .print-toolbar { display: none !important; }
          .print-page-break { page-break-after: always; break-after: page; }
          .packet-page { padding: 0.75in; min-height: 10.5in; box-sizing: border-box; }
        }
        @media screen {
          .packet-page { width: 8.5in; min-height: 11in; padding: 0.75in; background: white; margin: 0 auto 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.15); box-sizing: border-box; }
        }
      `}</style>
      <div className="print-toolbar sticky top-0 z-10 bg-card border-b border-border shadow-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            ← Back
          </button>
          <h2 className="text-sm font-bold text-foreground">
            Notice of Hearing — Standalone Print
          </h2>
        </div>
        <Button size="sm" className="gap-2" onClick={() => window.print()}>
          <Printer className="w-4 h-4" /> Print / Save PDF
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() =>
            elementToPdf("noh-print", `notice-of-hearing-${Date.now()}`)
          }
        >
          <FileDown className="w-4 h-4" /> Download PDF
        </Button>
      </div>
      <div className="py-8 px-4" id="noh-print">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading Notice of Hearing…</span>
            </div>
          }
        >
          <PacketNoticeOfHearing
            packet={data}
            complaint={data.complaint}
            location={data.location}
            inspector={data.inspector}
            inspections={data.inspections}
          />
        </Suspense>
      </div>
    </div>
  );
}
