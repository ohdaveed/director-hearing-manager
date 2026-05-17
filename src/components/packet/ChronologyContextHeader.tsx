import { MapPin, User, Calendar } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';
import { GetChronologyForPacketOutputType } from 'zite-endpoints-sdk';

type PacketMeta = NonNullable<GetChronologyForPacketOutputType['packetMeta']>;
type LocationMeta = NonNullable<GetChronologyForPacketOutputType['locationMeta']>;

interface Props {
  packetMeta?: PacketMeta;
  locationMeta?: LocationMeta;
}

export default function ChronologyContextHeader({ packetMeta, locationMeta }: Props) {
  const rpName = locationMeta?.responsibleParty || locationMeta?.ownerName;
  const rpPhone = locationMeta?.responsiblePartyPhone || locationMeta?.ownerPhone;
  const rpEmail = locationMeta?.responsiblePartyEmail || locationMeta?.ownerEmail;

  const siteLine = [
    locationMeta?.blockLot && `Block/Lot: ${locationMeta.blockLot}`,
    locationMeta?.facilityType,
    locationMeta?.numberOfUnits != null && `${locationMeta.numberOfUnits} units`,
  ].filter(Boolean).join(' · ');

  const hearingLine = [
    packetMeta?.caseNumber && `Case ${packetMeta.caseNumber}`,
    packetMeta?.programCode && `Program ${packetMeta.programCode}`,
  ].filter(Boolean).join(' · ');

  return (
    <section className="w-full border-b border-border bg-muted/30 flex-shrink-0">
      <div className="px-5 py-3 grid grid-cols-3 gap-4 text-xs">
        {/* Site Metadata */}
        <div>
          <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px] mb-1 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" /> Site Metadata
          </p>
          <p className="text-foreground font-medium">{locationMeta?.address || '—'}</p>
          <p className="text-muted-foreground text-[10px] mt-0.5">{siteLine || '—'}</p>
        </div>

        {/* Owner / RP Details */}
        <div>
          <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px] mb-1 flex items-center gap-1">
            <User className="w-2.5 h-2.5" /> Owner / RP Details
          </p>
          <p className="text-foreground font-medium">{rpName || '—'}</p>
          <p className="text-muted-foreground text-[10px] mt-0.5">
            {[rpPhone, rpEmail].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>

        {/* Hearing Schedule */}
        <div>
          <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px] mb-1 flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" /> Hearing Schedule
          </p>
          <p className="text-foreground font-medium">
            {packetMeta?.hearingDate
              ? `${formatDate(packetMeta.hearingDate)}${packetMeta.hearingTime ? ` · ${packetMeta.hearingTime}` : ''}`
              : '—'}
          </p>
          <p className="text-muted-foreground text-[10px] mt-0.5">{hearingLine || '—'}</p>
        </div>
      </div>
    </section>
  );
}
