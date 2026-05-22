import { PacketNoticeOfHearing } from "./PacketNoticeOfHearing";
import { PacketNoticeOfViolation } from "./PacketNoticeOfViolation";
import { PacketServiceLog } from "./PacketServiceLog";

type Props = {
  complaint: any;
  location: any;
  packet: any;
  inspector: any;
  inspections: any;
  serviceLog: any[];
};

/**
 * PacketExhibitEBundle.tsx
 *
 * Groups legal and service documentation into a single Exhibit E bundle.
 * Sequence: Notice of Hearing (Labeled E) -> NOV -> Proof of Service.
 */
export function PacketExhibitEBundle({
  complaint,
  location,
  packet,
  inspector,
  inspections,
  serviceLog,
}: Props) {
  return (
    <div className="exhibit-e-bundle" data-testid="packet-exhibit-e-bundle">
      {/* 1. Notice of Hearing (The Exhibit E Anchor) */}
      <PacketNoticeOfHearing
        complaint={complaint}
        location={location}
        packet={packet}
        inspector={inspector}
        inspections={inspections}
        exhibitLetter="E"
      />

      {/* 2. Notice of Violation (Part of Exhibit E) */}
      <PacketNoticeOfViolation
        complaint={complaint}
        location={location}
        packet={packet}
        inspections={inspections}
        inspector={inspector}
      />

      {/* 3. Proof of Service */}
      <PacketServiceLog
        serviceLog={serviceLog || []}
        complaint={complaint}
        location={location}
        packet={packet}
        inspector={inspector}
      />
    </div>
  );
}
