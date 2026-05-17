/**
 * PacketEnforcementSummary.tsx
 *
 * Pixel-perfect reproduction of the official SFDPH
 * "Environmental Health Basis for Proposed Enforcement Action Summary" form.
 */

import type { CSSProperties } from 'react';
import { SFDPHReportHeader } from './SFDPHReportHeader';
import { PrintCheckbox, SFDPHReportFooter } from './printUtils';
import { SignatureBlock, type ParsedSignature } from './SignatureBlock';

type Props = {
  packet: any;
  complaint: any;
  location: any;
  inspections: any;
  inspector?: any;
  inspectorSig?: ParsedSignature | null;
  managerSig?: ParsedSignature | null;
};

const CELL: CSSProperties = {
  border: '1px solid black',
  padding: '3px 6px',
  verticalAlign: 'top',
  fontSize: '9pt',
  fontFamily: 'Times New Roman, serif',
};

const LABEL: CSSProperties = {
  fontSize: '7.5pt',
  color: '#333',
  display: 'block',
  marginBottom: '1px',
};

interface EnforcementFlags {
  nuisanceAbatement: boolean;
  costRecovery: boolean;
  appealHealthPermit: boolean;
  appealNonPermitted: boolean;
}

function parseFlags(raw: string | undefined, proposed: string[]): EnforcementFlags {
  if (raw) {
    try { return JSON.parse(raw) as EnforcementFlags; } catch { /* ignore */ }
  }
  const hasDeclare = proposed.some(a => a.toLowerCase().includes('nuisance'));
  const hasFines   = proposed.some(a => a.toLowerCase().includes('fine'));
  const hasPermit  = proposed.some(a => a.toLowerCase().includes('permit'));
  return {
    nuisanceAbatement: hasDeclare,
    costRecovery: hasDeclare,
    appealHealthPermit: hasPermit,
    appealNonPermitted: hasFines || !hasPermit,
  };
}

const ACTION_OPTIONS = [
  { label: 'Permit Suspension', key: 'permit_suspension' },
  { label: 'Permit Revocation', key: 'permit_revocation' },
  { label: 'Declare premises a public nuisance', key: 'Declare Nuisance' },
  { label: 'Assess fines or penalties', key: 'Assess Fines' },
];

function isActionChecked(key: string, proposed: string[]): boolean {
  return proposed.some(a =>
    a === key || a.toLowerCase().replace(/\s+/g, '_') === key.toLowerCase().replace(/\s+/g, '_')
  );
}

export function PacketEnforcementSummary({ packet, complaint, location, inspections, inspector, inspectorSig, managerSig }: Props) {
  const flags = parseFlags(packet.enforcement_flags, packet.proposed_actions ?? []);
  const proposed = packet.proposed_actions ?? [];

  const address = complaint?.address ?? location?.address ?? '—';
  const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

  const hearingDateFmt = packet.hearing_date
    ? new Date(packet.hearing_date + 'T00:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
    : '';

  // Collect unique violations across all inspections
  const violationMap = new Map<string, string>();
  for (const insp of inspections) {
    for (const v of insp.violations) {
      const key = v.violationCode || v.violation_label || '';
      if (key && !violationMap.has(key)) {
        violationMap.set(key, v.violation_label ?? '');
      }
    }
  }
  const codeEntries = Array.from(violationMap.entries());

  // Split code entries across pages (open area ~12 per page)
  const FIRST_PAGE_CODES = 6;
  const CODES_PER_CONT = 12;
  const firstPageCodes = codeEntries.slice(0, FIRST_PAGE_CODES);
  const remainingCodes = codeEntries.slice(FIRST_PAGE_CODES);
  const contPages: typeof codeEntries[] = [];
  for (let i = 0; i < remainingCodes.length; i += CODES_PER_CONT) {
    contPages.push(remainingCodes.slice(i, i + CODES_PER_CONT));
  }
  const totalPages = 1 + contPages.length;

  const style: CSSProperties = { fontFamily: 'Times New Roman, serif', fontSize: '9.5pt', display: 'flex', flexDirection: 'column' };

  return (
    <>
      {/* ===== PAGE 1 ===== */}
      <div className="packet-page print-page-break" style={style}>
        <SFDPHReportHeader layout="seal-left-dept-right" />

        {/* Title */}
        <p style={{ textAlign: 'center', fontWeight: 'bold', textDecoration: 'underline', fontSize: '10pt', margin: '0 0 8px', fontFamily: 'Times New Roman, serif' }}>
          Environmental Health Basis for Proposed Enforcement Action Summary
        </p>

        {/* Case info grid */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
          <tbody>
            <tr>
              <td style={{ ...CELL, width: '35%' }}>
                <span style={LABEL}>Location Address</span>
                <strong>{address}</strong>
              </td>
              <td style={{ ...CELL, width: '15%' }}>
                <span style={LABEL}>Block/Lot</span>
                {location?.block_lot ?? ''}
              </td>
              <td style={{ ...CELL, width: '30%' }}>
                <span style={LABEL}>Facility Name (DBA)</span>
                {location?.dba ?? ''}
              </td>
              <td style={{ ...CELL, width: '20%' }}>
                <span style={LABEL}>Date of Submittal</span>
                {today}
              </td>
            </tr>
            <tr>
              <td style={CELL}>
                <span style={LABEL}>Property Owner</span>
                {location?.owner_name ?? ''}
              </td>
              <td colSpan={2} style={CELL}>
                <span style={LABEL}>Phone</span>
                {location?.owner_phone ?? ''}
              </td>
              <td style={CELL}>
                <span style={LABEL}>Email</span>
                {location?.owner_email ?? ''}
              </td>
            </tr>
            <tr>
              <td style={CELL}>
                <span style={LABEL}>Responsible Party or Parties</span>
                {location?.responsible_party ?? ''}
              </td>
              <td colSpan={2} style={CELL}>
                <span style={LABEL}>Phone</span>
                {location?.responsible_party_phone ?? ''}
              </td>
              <td style={CELL}>
                <span style={LABEL}>Email</span>
                {location?.responsible_party_email ?? ''}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Purpose of Hearing row */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px' }}>
          <tbody>
            <tr>
              <td style={{ ...CELL, width: '55%' }}>
                <span style={LABEL}>Purpose of Hearing</span>
                {complaint?.purposeOfHearing ?? ''}
              </td>
              <td style={{ ...CELL, width: '20%' }}>
                <span style={LABEL}>Hearing Date</span>
                {hearingDateFmt}
              </td>
              <td style={{ ...CELL, width: '12%' }}>
                <span style={LABEL}>Program Code</span>
                {packet.program_code ?? ''}
              </td>
              <td style={{ ...CELL, width: '13%' }}>
                <span style={LABEL}>Case Number</span>
                {packet.case_number ?? ''}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Proposed enforcement action */}
        <div style={{ marginBottom: '6px', fontSize: '9pt' }}>
          <span style={{ fontWeight: 'bold' }}>Proposed enforcement action:</span>
          <br />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 16px', marginTop: '3px' }}>
            {ACTION_OPTIONS.map(opt => (
              <span key={opt.key} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <PrintCheckbox checked={isActionChecked(opt.key, proposed)} />
                {opt.label}
              </span>
            ))}
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <PrintCheckbox checked={isActionChecked('other', proposed)} />
              Other <span style={{ borderBottom: '1px solid black', display: 'inline-block', width: '100px', marginLeft: '4px' }}>&nbsp;</span>
            </span>
          </div>
        </div>

        {/* Code Sections and Descriptions */}
        <div style={{ border: '1px solid black', padding: '6px', marginBottom: '6px', minHeight: '100px', flex: 1 }}>
          <p style={{ fontWeight: 'bold', fontSize: '9.5pt', margin: '0 0 6px', textTransform: 'uppercase' }}>
            Code Section(s) and Descriptions
          </p>
          {firstPageCodes.length === 0 ? (
            <p style={{ fontSize: '9pt', color: '#555' }}>See attached inspection reports for applicable code sections.</p>
          ) : (
            <div>
              {firstPageCodes.map(([code, label], i) => (
                <p key={i} style={{ margin: '0 0 4px', fontSize: '9pt' }}>
                  <strong>{code}</strong>{label ? ` — ${label}` : ''}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Mandatory legal language */}
        <div style={{ border: '1px solid black', padding: '6px', marginBottom: '6px' }}>
          <p style={{ fontSize: '9pt', margin: '0 0 6px' }}>
            If checked, the below language <strong style={{ textDecoration: 'underline' }}>must be included</strong> in the decision letter and/or Order:
          </p>

          {/* Nuisance Abatement */}
          <p style={{ fontWeight: 'bold', margin: '0 0 2px', fontSize: '9pt' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <PrintCheckbox checked={flags.nuisanceAbatement} />
              <span>NUISANCE ABATEMENT </span>
              <em style={{ fontWeight: 'normal', fontSize: '8.5pt', marginLeft: '4px' }}>if case involves the Nuisance Code</em>
            </span>
          </p>
          <p style={{ fontSize: '8.5pt', margin: '0 0 6px', paddingLeft: '16px', lineHeight: 1.4 }}>
            Failure to abate and remove the nuisance may result in the abatement of the nuisance by the Department of Public Health and the Property Owner shall become indebted to the City and County of San Francisco for the costs, charges, and fees incurred by reason of the abatement and removal of such nuisance upon demand.
          </p>

          {/* Cost Recovery */}
          <p style={{ fontWeight: 'bold', margin: '0 0 2px', fontSize: '9pt' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <PrintCheckbox checked={flags.costRecovery} />
              <span>COST RECOVERY </span>
              <em style={{ fontWeight: 'normal', fontSize: '8.5pt', marginLeft: '4px' }}>if case involves the Nuisance Code</em>
            </span>
          </p>
          <p style={{ fontSize: '8.5pt', margin: '0 0 6px', paddingLeft: '16px', lineHeight: 1.4 }}>
            In accordance with the San Francisco Health Code, the Property Owner shall be indebted to the City and County of San Francisco for costs incurred in abating the effects of the violation, taking other remedial action, or imposing and collecting penalties, including but not limited to administrative costs, costs of issuing an order, inspection or monitoring costs, hearing officer costs, and reasonable attorney fees if sought by the Director in the Notice of Hearing. In any proceedings in which the Director seeks to recover attorney's fees, the prevailing party shall be entitled to reasonable attorney's fees. Failure to pay such costs, charges, and fees may result in a lien against the property.
          </p>

          {/* Appeal — Health Permit */}
          <p style={{ fontWeight: 'bold', margin: '0 0 2px', fontSize: '9pt' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <PrintCheckbox checked={flags.appealHealthPermit} />
              <span>APPEAL PROCESS </span>
              <em style={{ fontWeight: 'normal', fontSize: '8.5pt', marginLeft: '4px' }}>if the case involves a Health Permit</em>
            </span>
          </p>
          <p style={{ fontSize: '8.5pt', margin: '0 0 6px', paddingLeft: '16px', lineHeight: 1.4 }}>
            Within 15 calendar days of receipt of this letter, you have the right to appeal this decision regarding your permit to the San Francisco Board of Appeals. Appeals may be filed in-person (by appointment only), by phone ((628) 652-1150) or email (boardofappeals@sfgov.org). The Board's Office is located at 49 South Van Ness Avenue, Suite 1475. For more info, visit this website at: https://sf.gov/file-appeal-permit-or-decision.
          </p>

          {/* Appeal — Non-permitted */}
          <p style={{ fontWeight: 'bold', margin: '0 0 2px', fontSize: '9pt' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <PrintCheckbox checked={flags.appealNonPermitted} />
              <span>APPEAL PROCESS </span>
              <em style={{ fontWeight: 'normal', fontSize: '8.5pt', marginLeft: '4px' }}>if case involves a non-permitted facility and/or a penalty</em>
            </span>
          </p>
          <p style={{ fontSize: '8.5pt', margin: '0', paddingLeft: '16px', lineHeight: 1.4 }}>
            This Order is final and you may have the right to petition the Superior Court of San Francisco for judicial review or appropriate relief pursuant to Section 1094.6 of the California Code of Civil Procedures. The filing of a petition with the Superior Court shall not automatically stay the effectiveness of this Order or extend the time period in which you have to abate the violation.
          </p>
        </div>

        {/* Inspector / Manager Signature Block */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 'auto' }}>
          <tbody>
            <tr>
              <td style={CELL}>
                <span style={LABEL}>Inspector</span>
                {inspector?.name ?? packet.assigned_to ?? ''}
              </td>
              <SignatureBlock
                label="Inspector Signature"
                signature={inspectorSig ?? null}
                cellStyle={CELL}
                labelStyle={LABEL}
              />
            </tr>
            <tr>
              <td style={CELL}>
                <span style={LABEL}>Inspector Email</span>
                {inspector?.email ?? ''}
              </td>
              <td style={CELL}>
                <span style={LABEL}>Inspector Phone</span>
                &nbsp;
              </td>
            </tr>
            <tr>
              <td style={CELL}>
                <span style={LABEL}>Manager / Supervisor</span>
                &nbsp;
              </td>
              <SignatureBlock
                label="Manager Signature"
                signature={managerSig ?? null}
                cellStyle={CELL}
                labelStyle={LABEL}
              />
            </tr>
          </tbody>
        </table>

        <SFDPHReportFooter columns={1} />
        <div className="page-number-slot" />
      </div>

      {/* ===== CONTINUATION PAGES ===== */}
      {contPages.map((pageCodes, pi) => (
        <div key={pi} className="packet-page print-page-break" style={style}>
          <SFDPHReportHeader layout="seal-left-dept-right" />

          {/* Continuation title */}
          <p style={{ textAlign: 'center', fontWeight: 'bold', textDecoration: 'underline', fontSize: '10pt', margin: '0 0 4px', fontFamily: 'Times New Roman, serif' }}>
            Environmental Health Basis for Proposed Enforcement Action Summary (continued)
          </p>
          <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '10pt', margin: '0 0 8px' }}>
            Page {pi + 2} of {totalPages}
          </p>

          {/* Condensed header row */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px' }}>
            <tbody>
              <tr>
                <td style={{ ...CELL, width: '35%' }}>
                  <span style={LABEL}>Location Address</span>
                  {address}
                </td>
                <td style={{ ...CELL, width: '15%' }}>
                  <span style={LABEL}>Block/Lot</span>
                  {location?.block_lot ?? ''}
                </td>
                <td style={{ ...CELL, width: '30%' }}>
                  <span style={LABEL}>Facility Name (DBA)</span>
                  {location?.dba ?? ''}
                </td>
                <td style={{ ...CELL, width: '20%' }}>
                  <span style={LABEL}>Date of Submittal</span>
                  {today}
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={CELL}>
                  <span style={LABEL}>Responsible Party or Parties</span>
                  {location?.responsible_party ?? ''}
                </td>
                <td style={CELL}>
                  <span style={LABEL}>Hearing Date</span>
                  {hearingDateFmt}
                </td>
                <td style={CELL}>
                  <span style={LABEL}>Program Code / Case Number</span>
                  {packet.program_code ?? ''}{packet.case_number ? ` / ${packet.case_number}` : ''}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Code sections continued */}
          <div style={{ border: '1px solid black', padding: '6px', flex: 1 }}>
            <p style={{ fontWeight: 'bold', fontSize: '9.5pt', margin: '0 0 6px', textTransform: 'uppercase' }}>
              Code Section(s) and Descriptions
            </p>
            {pageCodes.map(([code, label], i) => (
              <p key={i} style={{ margin: '0 0 4px', fontSize: '9pt' }}>
                <strong>{code}</strong>{label ? ` — ${label}` : ''}
              </p>
            ))}
          </div>

          <SFDPHReportFooter columns={1} />
          <div className="page-number-slot" />
        </div>
      ))}
    </>
  );
}
