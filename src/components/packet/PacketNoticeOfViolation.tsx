/**
 * PacketNoticeOfViolation.tsx
 *
 * Pixel-perfect reproduction of the official SFDPH "Notice of Violation" form
 * from the Healthy Housing and Vector Control Program.
 *
 * All static legal text (preamble, directive, six legal paragraphs, footer) is
 * sourced from STATIC_BLOCKS.nov in documentTemplates config — locked constants
 * that are never editable per-packet. Variable positions (owner name, address,
 * block/lot, violations table, investigator contact) are resolved from props and
 * are traceable to their database sources via NOV_VARIABLE_SLOTS.
 *
 * ── Editability model ──────────────────────────────────────────────────────────
 *  locked     : renders verbatim from STATIC_BLOCKS — no inspector touch
 *  auto-filled: resolved from database record, read-only in the rendered doc
 *  editable   : populated from DB but inspector may override in Hearing Prep
 *               (correctiveAction, dueDate, responsibleParty)
 */


import { SFDPHReportHeader } from './SFDPHReportHeader';
import { fmtDate, SFDPHReportFooter } from './printUtils';
import { STATIC_BLOCKS, LAYOUT_TOKENS } from '../../config/documentTemplates';
import { ComplaintSummary } from '@/types/complaint';

interface LocationRecord {
  owner_name?: string;
  owner_address?: string;
  responsible_party?: string;
  block_lot?: string;
  address?: string;
  dba?: string;
  id?: string;
}

interface Violation {
  violationCode?: string;
  violation_label?: string;
  corrective_action?: string;
  due_date?: string;
}

interface Inspection {
  inspection_date: string;
  violations: Violation[];
}

type Props = {
  packet?: any; // Hearing packet metadata, currently unused in this component
  complaint: ComplaintSummary;
  location: LocationRecord;
  inspections: Inspection[];
  inspector?: {
    name?: string;
    email?: string;
  };
};

/** Parse Block and Lot from a "Block/Lot" string like "2842/008" or "2842 008" */
function parseBlockLot(blockLot: string | undefined): { block: string; lot: string } {
  if (!blockLot) return { block: '', lot: '' };
  const parts = blockLot.split(/[\s\/\-]+/);
  return { block: parts[0] ?? '', lot: parts[1] ?? '' };
}

interface ViolationRow {
  code: string;
  label: string;
  correctiveAction: string;
  dueDate: string | undefined;
}

// ── Layout constants sourced from the locked token set ────────────────────────
const { fontFamily, pt } = LAYOUT_TOKENS;

// ── NOV static blocks alias for brevity ─────────────────────────────────────
const S = STATIC_BLOCKS.nov;
const C = STATIC_BLOCKS.common;

const CELL_STYLE = {
  border: '1px solid black',
  padding: '4px 6px',
  verticalAlign: 'top' as const,
  fontSize: pt.table,
  fontFamily,
};

export function PacketNoticeOfViolation({ packet: _packet, complaint, location, inspections, inspector }: Props) {
  // ── Resolve auto-filled variables from database records ───────────────────

  // Variable slot: Locations.owner_name (auto-filled, uppercase)
  const ownerName = location?.owner_name ?? '';
  // Variable slot: Locations.owner_address (auto-filled, uppercase)
  const ownerAddress = location?.owner_address ?? '';
  // Variable slot: Locations.responsible_party (editable)
  const responsibleParty = location?.responsible_party ?? '';
  // Variable slot: Locations.block_lot parsed → block, lot (auto-filled)
  const { block, lot } = parseBlockLot(location?.block_lot);
  // Variable slot: Complaints.address (auto-filled)
  const address = complaint?.address ?? location?.address ?? '';
  // Variable slot: Locations.dba (auto-filled, appended to address)
  const dba = location?.dba ?? '';

  // Variable slot: Inspections.inspection_date — earliest date as NOV date (auto-filled)
  const novDate = inspections.length > 0
    ? fmtDate(inspections[0].inspection_date)
    : fmtDate(new Date().toISOString().split('T')[0]);

  // Determine program name for header (auto-filled from complaint, defaulting to locked program name)
  const assignedProgram = complaint?.assignedProgram ?? '';
  const programName = assignedProgram
    ? C.programName  // all HHVC programs use the same locked header
    : C.programName;

  // ── Collect all violations deduplicated by code across all inspections ────
  // Variable slot: Violations.* (auto-filled repeater)
  const violationMap = new Map<string, ViolationRow>();
  for (const insp of inspections) {
    for (const v of insp.violations) {
      const key = v.violationCode || v.violation_label || '';
      if (key && !violationMap.has(key)) {
        violationMap.set(key, {
          code: v.violationCode ?? '',          // Violations.violationCode (auto-filled)
          label: v.violation_label ?? '',        // Violations.violation_label (auto-filled)
          correctiveAction: v.corrective_action ?? '', // Violations.corrective_action (editable)
          dueDate: v.due_date,                   // Violations.due_date (editable)
        });
      }
    }
  }
  const violations = Array.from(violationMap.values());

  // Split across pages
  const ROWS_FIRST = 8;
  const ROWS_CONT = 14;
  const firstPageRows = violations.slice(0, ROWS_FIRST);
  const remaining = violations.slice(ROWS_FIRST);
  const contPages: ViolationRow[][] = [];
  for (let i = 0; i < remaining.length; i += ROWS_CONT) {
    contPages.push(remaining.slice(i, i + ROWS_CONT));
  }

  const totalPages = 1 + contPages.length;
  const baseStyle = { fontFamily, fontSize: pt.body, display: 'flex' as const, flexDirection: 'column' as const };

  // ── Shared violation table renderer ──────────────────────────────────────
  const renderViolationRows = (rows: ViolationRow[]) => (
    <>
      {rows.length === 0 ? (
        <tr>
          <td colSpan={3} style={{ ...CELL_STYLE, color: '#666', textAlign: 'center', padding: '12px' }}>
            No violations recorded for this complaint.
          </td>
        </tr>
      ) : rows.map((v, i) => (
        <tr key={i}>
          {/* Column 1: SFHC Violation code + label — auto-filled from Violations table */}
          <td style={CELL_STYLE}>
            {v.code && <strong>{v.code}. </strong>}
            {v.label}
          </td>
          {/* Column 2: Steps to Abate — editable corrective action from Violations.corrective_action */}
          <td style={CELL_STYLE}>
            {v.correctiveAction
              ? v.correctiveAction.split('\n').map((line, li) => (
                  <p key={li} style={{ margin: '0 0 2px' }}>{'• '}{line.replace(/^[\u2022\-\*]\s*/, '')}</p>
                ))
              : <span style={{ color: '#888' }}>{'—'}</span>
            }
          </td>
          {/* Column 3: Deadline — editable Violations.due_date */}
          <td style={CELL_STYLE}>{fmtDate(v.dueDate)}</td>
        </tr>
      ))}
    </>
  );

  // ── Shared violation table header (column labels from STATIC_BLOCKS.nov.tableHeader) ──
  const renderTableHeader = () => (
    <thead>
      <tr>
        <th style={{ ...CELL_STYLE, width: '40%', fontWeight: 'bold', textTransform: 'uppercase', fontSize: pt.table }}>
          {S.tableHeader.violation}
        </th>
        <th style={{ ...CELL_STYLE, width: '45%', fontWeight: 'bold', textTransform: 'uppercase', fontSize: pt.table }}>
          {S.tableHeader.steps}
        </th>
        <th style={{ ...CELL_STYLE, width: '15%', fontWeight: 'bold', textTransform: 'uppercase', fontSize: pt.table }}>
          {S.tableHeader.deadline}
        </th>
      </tr>
    </thead>
  );

  return (
    <>
      {/* ===== PAGE 1 ===== */}
      <div className="packet-page print-page-break" style={baseStyle}>
        <SFDPHReportHeader
          layout="seal-dept-left"
          sectionLabel={C.sectionName}
          programName={programName}
          showOfficials
          officialsItalic
          showRule
          sealSize={56}
        />

        {/* Document title — locked: STATIC_BLOCKS.nov.documentTitle */}
        <p style={{
          textAlign: 'center',
          fontWeight: 'bold',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          fontSize: pt.novTitle,
          margin: '8px 0 12px',
        }}>
          {S.documentTitle}
        </p>

        {/* Owner block + Date/Block/Lot — variable slots (auto-filled) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            {/* Label: STATIC_BLOCKS.nov.ownerLabel */}
            <p style={{ fontWeight: 'bold', margin: '0 0 2px', fontSize: pt.body }}>{S.ownerLabel}</p>
            {/* Variable: Locations.owner_name */}
            {ownerName && <p style={{ margin: '0', fontWeight: 'bold', fontSize: pt.body }}>{ownerName.toUpperCase()}</p>}
            {/* Variable: Locations.owner_address */}
            {ownerAddress && <p style={{ margin: '0', fontSize: pt.body }}>{ownerAddress.toUpperCase()}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            {/* Label: STATIC_BLOCKS.nov.dateLabel — Variable: Inspections.inspection_date (earliest) */}
            <p style={{ margin: '0', fontSize: pt.body }}><strong>{S.dateLabel}</strong> {novDate}</p>
            {/* Labels: STATIC_BLOCKS.nov.blockLabel / lotLabel — Variables: Locations.block_lot parsed */}
            <p style={{ margin: '4px 0 0', fontSize: pt.body }}>
              <strong>{S.blockLabel}</strong> {block} &nbsp;&nbsp; <strong>{S.lotLabel}</strong> {lot}
            </p>
          </div>
        </div>

        {/* Responsible party — variable slot: Locations.responsible_party (editable) */}
        {responsibleParty && (
          <p style={{ margin: '0 0 8px', fontSize: pt.body }}>
            <strong>{S.responsiblePartyLabel}</strong> {responsibleParty}
          </p>
        )}

        {/* Property address — variable slot: Complaints.address (auto-filled) */}
        <p style={{ margin: '0 0 12px', fontSize: pt.body }}>
          <strong>{S.propertyAddressLabel}</strong> {address}{dba ? ` — ${dba}` : ''}
        </p>

        {/* Preamble — locked: STATIC_BLOCKS.nov.preamble */}
        <p style={{ margin: '0 0 10px', fontWeight: 'bold', fontSize: pt.body }}>
          {S.preamble}
        </p>

        {/* Directive — locked: STATIC_BLOCKS.nov.directive */}
        <p style={{ margin: '0 0 8px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: pt.body }}>
          {S.directive}
        </p>

        {/* Violations table — rows auto-filled from Violations records; correctiveAction + dueDate editable */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
          {renderTableHeader()}
          <tbody>{renderViolationRows(firstPageRows)}</tbody>
        </table>

        {/* ── Legal paragraphs — all locked from STATIC_BLOCKS.nov ── */}
        <div style={{ fontSize: pt.legalSmall, lineHeight: 1.4 }}>
          <p style={{ margin: '0 0 6px' }}>
            <strong>{S.reinspectionFeesLabel}</strong> {S.reinspectionFees}
          </p>
          <p style={{ margin: '0 0 6px' }}>
            <strong>{S.consequencesLabel}</strong> {S.consequencesOfFailure}
          </p>
          <p style={{ margin: '0 0 6px' }}>
            <strong>{S.chargesLabel}</strong> {S.chargesAndCosts}
          </p>
          <p style={{ margin: '0 0 8px' }}>
            <strong>{S.attorneysFeesLabel}</strong> {S.attorneysFees}
          </p>
        </div>

        {/* Inspector contact — variable slots (auto-filled from Users table) */}
        <div style={{ fontSize: pt.contactBlock, marginTop: 'auto' }}>
          {/* Prompt — locked: STATIC_BLOCKS.common.contactPrompt */}
          <p style={{ margin: '0 0 2px' }}>{C.contactPrompt}</p>
          {/* Variable: Users.firstName + lastName (matched via Complaints.assigned_to) */}
          <p style={{ margin: '0 0 1px' }}>
            <strong>Investigator:</strong> {inspector?.name ?? complaint?.assigned_to ?? ''}
          </p>
          {/* Variable: Users.email */}
          {inspector?.email && (
            <p style={{ margin: '0 0 1px' }}>e-mail: {inspector.email}</p>
          )}
          {/* Locked: STATIC_BLOCKS.common.investigatorDefaultPhone */}
          <p style={{ margin: '0 0 1px' }}>phone: {C.investigatorDefaultPhone}</p>
          {/* Variable: Complaints.complaintid (locked, read-only) */}
          {complaint?.complaintid && (
            <p style={{ margin: '0 0 1px' }}>Complaint ID: {complaint.complaintid}</p>
          )}
          {/* Variable: Locations.id — last 12 chars uppercase (locked, read-only) */}
          {location?.id && (
            <p style={{ margin: '0' }}>Location ID: {location.id.slice(-12).toUpperCase()}</p>
          )}
        </div>

        <SFDPHReportFooter columns={3} programName={programName} />
        <div className="page-number-slot" />
      </div>

      {/* ===== CONTINUATION PAGES ===== */}
      {contPages.map((rows, pi) => (
        <div key={pi} className="packet-page print-page-break" style={baseStyle}>
          <SFDPHReportHeader
            layout="seal-dept-left"
            sectionLabel={C.sectionName}
            programName={programName}
            showOfficials
            officialsItalic
            showRule
            sealSize={56}
          />

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', marginTop: '8px' }}>
            {renderTableHeader()}
            <tbody>{renderViolationRows(rows)}</tbody>
          </table>

          <p style={{ textAlign: 'center', fontSize: '8.5pt', color: '#666', margin: '4px 0' }}>
            (continued — page {pi + 2} of {totalPages})
          </p>

          <SFDPHReportFooter columns={3} programName={programName} />
          <div className="page-number-slot" />
        </div>
      ))}
    </>
  );
}
