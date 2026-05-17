/**
 * PacketCoverPage.tsx
 *
 * Renders the cover page of a Director's Hearing packet — matches the official
 * SFDPH template: city seal and department header at the top, large centered
 * title block with case number and address, footer with office address.
 *
 * All static text (department identity, footer, typography scale, page margins)
 * is sourced from documentTemplates config. Variable positions (caseNumber,
 * propertyAddress) are resolved from props and are traceable to their database
 * source via COVER_PAGE_VARIABLE_SLOTS.
 */

import { SFDPHReportHeader } from './SFDPHReportHeader';
import {
  STATIC_BLOCKS,
  LAYOUT_TOKENS,
  COVER_PAGE_VARIABLE_SLOTS,
} from '../../config/documentTemplates';

type Props = {
  packet: any;
  complaint: any;
  location: any;
};

/**
 * Resolve a variable slot value from the packet data props.
 * Keys correspond to COVER_PAGE_VARIABLE_SLOTS[].key.
 */
function resolveVariable(
  key: string,
  packet: any,
  complaint: any,
  location: any,
): string {
  switch (key) {
    case 'caseNumber':
      return packet.case_number ?? '—';
    case 'propertyAddress':
      return complaint?.address ?? location?.address ?? '—';
    case 'programCode':
      return packet.program_code ?? '';
    default:
      return '';
  }
}

export function PacketCoverPage({ packet, complaint, location }: Props) {
  // Resolve variable slots through the config registry — traceable to source tables
  const caseNumberSlot = COVER_PAGE_VARIABLE_SLOTS.find(s => s.key === 'caseNumber')!;
  const addressSlot = COVER_PAGE_VARIABLE_SLOTS.find(s => s.key === 'propertyAddress')!;

  const caseNumber = resolveVariable(caseNumberSlot.key, packet, complaint, location);
  const address = resolveVariable(addressSlot.key, packet, complaint, location);

  // Layout constants from the locked token set
  const { fontFamily, pt, page, pageMargin } = LAYOUT_TOKENS;

  return (
    <div
      className="packet-page print-page-break"
      style={{ fontFamily, display: 'flex', flexDirection: 'column' }}
    >
      <SFDPHReportHeader layout="cover" sealSize={72} />

      {/* ── Large centered title block (STATIC_BLOCKS.cover supplies all label text) ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '60px 0',
        }}
      >
        {/* Document title — locked static string */}
        <h1 style={{ fontSize: pt.coverTitle, fontWeight: 'bolder', margin: '0 0 28px', letterSpacing: '0.03em' }}>
          {STATIC_BLOCKS.cover.documentTitle}
        </h1>

        {/* Case number — variable slot: HearingPackets.caseNumber */}
        <p style={{ fontSize: pt.coverSubtitle, margin: '0 0 18px', fontWeight: 'normal' }}>
          {STATIC_BLOCKS.cover.caseLabel} {caseNumber}
        </p>

        {/* Property address — variable slot: Complaints.address or Locations.address */}
        <p style={{ fontSize: pt.coverSubtitle, margin: '0', fontWeight: 'normal' }}>
          {STATIC_BLOCKS.cover.addressLabel} {address}
        </p>
      </div>

      {/* ── Footer — locked static text from STATIC_BLOCKS.cover ── */}
      <div
        style={{
          borderTop: '1px solid #888',
          paddingTop: '10px',
          textAlign: 'center',
          fontSize: pt.footer,
          color: '#555',
        }}
      >
        {STATIC_BLOCKS.cover.footerText}
      </div>

      <div className="page-number-slot" />
    </div>
  );
}
