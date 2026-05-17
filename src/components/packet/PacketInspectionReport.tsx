/**
 * PacketInspectionReport.tsx
 *
 * Renders a single inspection report page within the hearing packet.
 * Includes a bold red exhibit letter at the top-right corner (SOP requirement),
 * header info, violations table, and inspector notes.
 */

import { GetHearingPacketDataOutputType } from 'zite-endpoints-sdk';
import { formatDateShort } from '@/utils/formatDate';

type Inspection = GetHearingPacketDataOutputType['inspections'][0];
type Props = {
  inspection: Inspection;
  index: number;
  complaint: GetHearingPacketDataOutputType['complaint'];
  location: GetHearingPacketDataOutputType['location'];
  packet: GetHearingPacketDataOutputType['packet'];
  exhibitLetter?: string;
};

/** MM/DD/YYYY for inspection and violation due dates */
const fmt = formatDateShort;

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex text-xs border-b border-gray-200 py-0.5">
      <span className="font-semibold w-40 flex-shrink-0 text-gray-700">{label}:</span>
      <span>{value ?? '—'}</span>
    </div>
  );
}

export function PacketInspectionReport({ inspection, index, complaint, location, packet, exhibitLetter }: Props) {
  return (
    <div className="packet-page print-page-break">
      {/* Top row: title block + red exhibit label */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <p className="text-xs font-bold uppercase tracking-widest">
            City and County of San Francisco — Department of Public Health
          </p>
          <h2 className="text-base font-black uppercase tracking-wider mt-1">
            Inspection Report #{index + 1}
          </h2>
          <p className="text-xs text-gray-600">
            Case: {packet.caseNumber ?? '—'} | Complaint: {complaint?.complaintId ?? '—'}
          </p>
        </div>
        {exhibitLetter && (
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
            <p style={{ fontSize: '18pt', fontWeight: '900', color: '#dc2626', lineHeight: 1, margin: 0 }}>
              Exhibit {exhibitLetter}
            </p>
          </div>
        )}
      </div>

      {/* Header Info */}
      <div className="border border-black p-3 mb-4 grid grid-cols-2 gap-x-4">
        <Row label="Facility Address" value={inspection.facilityAddress ?? complaint?.address ?? location?.address} />
        <Row label="DBA" value={inspection.dba ?? location?.dba} />
        <Row label="Inspection Date" value={fmt(inspection.inspectionDate)} />
        <Row label="Inspection Type" value={inspection.inspectionType} />
        <Row label="Inspector" value={inspection.inspector} />
        <Row label="Time In / Out" value={inspection.timeIn ? `${inspection.timeIn} — ${inspection.timeOut ?? ''}` : undefined} />
        <Row label="Access Granted By" value={inspection.accessGrantedBy} />
        <Row label="Rating" value={inspection.inspectionRating} />
        <Row label="Owner" value={location?.ownerName} />
        <Row label="Owner Phone" value={location?.ownerPhone} />
      </div>

      {/* Violations Table */}
      <h3 className="text-xs font-bold uppercase tracking-wider mb-2 border-b border-black pb-1">
        Violations Found ({inspection.violations.length})
      </h3>
      {inspection.violations.length === 0 ? (
        <p className="text-xs text-gray-400 mb-4">No violations recorded for this inspection.</p>
      ) : (
        <table className="w-full border-collapse text-xs mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black px-2 py-1 text-left w-32">Code Section</th>
              <th className="border border-black px-2 py-1 text-left">Violation / Location</th>
              <th className="border border-black px-2 py-1 text-left">Corrective Action Required</th>
              <th className="border border-black px-2 py-1 text-left w-20">Due Date</th>
              <th className="border border-black px-2 py-1 text-left w-16">Status</th>
            </tr>
          </thead>
          <tbody>
            {inspection.violations.map((v, i) => (
              <tr key={v.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-black px-2 py-1 font-mono text-xs">{v.violationCode ?? '—'}</td>
                <td className="border border-black px-2 py-1">
                  <div className="font-medium">{v.violationLabel ?? '—'}</div>
                  {v.locationInProperty && <div className="text-gray-500">Location: {v.locationInProperty}</div>}
                </td>
                <td className="border border-black px-2 py-1">{v.correctiveAction ?? '—'}</td>
                <td className="border border-black px-2 py-1 whitespace-nowrap">{fmt(v.dueDate)}</td>
                <td className="border border-black px-2 py-1">{v.status ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {inspection.notes && (
        <div className="border border-black p-3 text-xs">
          <p className="font-bold uppercase tracking-wider mb-1">Inspector Notes</p>
          <p className="whitespace-pre-wrap">{inspection.notes}</p>
        </div>
      )}
      <div className="page-number-slot" />
    </div>
  );
}
