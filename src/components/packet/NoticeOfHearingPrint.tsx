import { lazy, Suspense } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

const PacketNoticeOfHearing = lazy(() =>
  import("@/components/packet/PacketNoticeOfHearing").then((m) => ({
    default: m.PacketNoticeOfHearing,
  })),
);

export function NoticeOfHearingPrint({ data, onClose }: { data: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 overflow-auto">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #noh-print, #noh-print * { visibility: visible; }
          #noh-print { position: fixed; top: 0; left: 0; width: 100%; }
          .print-toolbar { display: none !important; }
          .packet-page { padding: 0.75in; min-height: 10.5in; box-sizing: border-box; }
        }
        @media screen {
          .packet-page { width: 8.5in; min-height: 11in; padding: 0.75in; background: white; margin: 0 auto 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.15); box-sizing: border-box; }
        }
      `}</style>
      <div className="print-toolbar sticky top-0 z-10 bg-card border-b border-border shadow-md px-6 py-3 flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          ← Back
        </button>
        <h2 className="text-sm font-bold text-foreground">Notice of Hearing</h2>
        <Button size="sm" className="gap-2" onClick={() => window.print()}>
          <Printer className="w-4 h-4" /> Print / Save PDF
        </Button>
      </div>
      <div className="py-8 px-4" id="noh-print">
        <Suspense
          fallback={
            <div className="text-center py-12 text-muted-foreground">
              Loading Notice of Hearing…
            </div>
          }
        >
          <PacketNoticeOfHearing
            packet={data.packet}
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
