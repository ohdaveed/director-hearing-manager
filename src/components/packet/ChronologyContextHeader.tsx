import { MapPin, User, Calendar } from "lucide-react";
import { formatDate } from "@/utils/formatDate";

type PacketMeta = any;
type LocationMeta = any;

interface Props {
  packetMeta?: PacketMeta;
  locationMeta?: LocationMeta;
}

export default function ChronologyContextHeader({ packetMeta, locationMeta }: Props) {
  const rpName = locationMeta?.responsible_party || locationMeta?.owner_name;
  const rpPhone = locationMeta?.responsible_party_phone || locationMeta?.owner_phone;
  const rpEmail = locationMeta?.responsible_party_email || locationMeta?.owner_email;

  const siteLine = [
    locationMeta?.block_lot && `Block/Lot: ${locationMeta.block_lot}`,
    locationMeta?.facility_type,
    locationMeta?.number_of_units != null && `${locationMeta.number_of_units} units`,
  ]
    .filter(Boolean)
    .join(" · ");

  const hearingLine = [
    packetMeta?.case_number && `Case ${packetMeta.case_number}`,
    packetMeta?.program_code && `Program ${packetMeta.program_code}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="w-full border-b border-border bg-muted/30 flex-shrink-0">
      <div className="px-5 py-3 grid grid-cols-3 gap-4 text-xs">
        {/* Site Metadata */}
        <div>
          <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px] mb-1 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" /> Site Metadata
          </p>
          <p className="text-foreground font-medium">{locationMeta?.address || "—"}</p>
          <p className="text-muted-foreground text-[10px] mt-0.5">{siteLine || "—"}</p>
        </div>

        {/* Owner / RP Details */}
        <div>
          <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px] mb-1 flex items-center gap-1">
            <User className="w-2.5 h-2.5" /> Owner / RP Details
          </p>
          <p className="text-foreground font-medium">{rpName || "—"}</p>
          <p className="text-muted-foreground text-[10px] mt-0.5">
            {[rpPhone, rpEmail].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>

        {/* Hearing Schedule */}
        <div>
          <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px] mb-1 flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" /> Hearing Schedule
          </p>
          <p className="text-foreground font-medium">
            {packetMeta?.hearing_date
              ? `${formatDate(packetMeta.hearing_date)}${packetMeta.hearingTime ? ` · ${packetMeta.hearingTime}` : ""}`
              : "—"}
          </p>
          <p className="text-muted-foreground text-[10px] mt-0.5">{hearingLine || "—"}</p>
        </div>
      </div>
    </section>
  );
}
