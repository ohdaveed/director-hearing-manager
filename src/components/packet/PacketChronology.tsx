/**
 * PacketChronology.tsx
 *
 * Renders the Director's Hearing Case Chronology section of a hearing packet.
 *
 * All static boilerplate text is imported from STATIC_BLOCKS.chronology — nothing
 * is hard-coded inline. Variable data is sourced from props (database records).
 *
 * Signature slots auto-populate from the inspectorSig / managerSig props which
 * the parent (HearingPacketPreview) manages.
 */

import type { CSSProperties } from 'react';
import { formatDateShort } from '@/utils/formatDate';
import { STATIC_BLOCKS, LAYOUT_TOKENS } from '../../config/documentTemplates';
import { SignatureBlock, type ParsedSignature } from './SignatureBlock';

type Props = {
  chronology: any;
  complaint: any;
  packet: any;
  location?: any;
  inspector?: any;
  inspectorSig?: ParsedSignature | null;
  managerSig?: ParsedSignature | null;
};

/** Local alias */
const fmt = formatDateShort;

// ── Static text aliases ──────────────────────────────────────────────────────
const S = STATIC_BLOCKS.chronology;
const C = STATIC_BLOCKS.common;
const { fontFamily, pt } = LAYOUT_TOKENS;

const ROWS_PER_PAGE = 15;
const NEWLINE = '\n';

type SnapshotRow = { date: string; type: string; summary: string };

function parseFrozenSnapshot(snapshot: string): SnapshotRow[] {
  return snapshot.split(NEWLINE).filter(Boolean).map(line => {
    const parts = line.split('  |  ');
    return {
      date: parts[0]?.trim() ?? '—',
      type: parts[1]?.trim() ?? '—',
      summary: parts.slice(2).join(' | ').replace(/^\[.*?\]\s+/, '').trim() || '—',
    };
  });
}

function ChronologyTable({ entries, showBy }: { entries: any[]; showBy: boolean }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
      <thead>
        <tr style={{ background: '#f0f0f0' }}>
          {/* Headers from STATIC_BLOCKS.chronology.tableHeader */}
          <th style={{ border: '1px solid black', padding: '4px 6px', textAlign: 'left', width: '80px', fontWeight: 'bold' }}>{S.tableHeader.date}</th>
          <th style={{ border: '1px solid black', padding: '4px 6px', textAlign: 'left', width: '100px', fontWeight: 'bold' }}>{S.tableHeader.codeSection}</th>
          <th style={{ border: '1px solid black', padding: '4px 6px', textAlign: 'left', fontWeight: 'bold' }}>{S.tableHeader.summary}</th>
          <th style={{ border: '1px solid black', padding: '4px 6px', textAlign: 'left', width: '60px', fontWeight: 'bold' }}>{S.tableHeader.exhibits}</th>
          <th style={{ border: '1px solid black', padding: '4px 6px', textAlign: 'left', width: '40px', fontWeight: 'bold' }}>Pg.</th>
          {showBy && <th style={{ border: '1px solid black', padding: '4px 6px', textAlign: 'left', width: '80px', fontWeight: 'bold' }}>By</th>}
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, i) => (
          <tr key={entry.id} style={{ background: i % 2 === 0 ? 'white' : '#f9f9f9', verticalAlign: 'top', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <td style={{ border: '1px solid black', padding: '4px 6px', whiteSpace: 'nowrap' }}>{fmt(entry.entryDate)}</td>
            <td style={{ border: '1px solid black', padding: '4px 6px', fontSize: '8.5pt' }}>{entry.citationCode ?? entry.entryType ?? '—'}</td>
            <td style={{ border: '1px solid black', padding: '4px 6px' }}>
              {entry.sourceRecord && (
                <span style={{ color: '#777', marginRight: '4px', fontSize: '9pt' }}>[{entry.sourceRecord}]</span>
              )}
              <span>{entry.summary ?? '—'}</span>
              {entry.violationsObserved && (
                <p style={{ margin: '3px 0 0', color: '#444', fontSize: '8.5pt' }}>
                  <strong>Violations:</strong> {entry.violationsObserved}
                </p>
              )}
            </td>
            <td style={{ border: '1px solid black', padding: '4px 6px', fontSize: '9pt', color: '#555' }}>
              {entry.exhibitRefs ?? ''}
            </td>
            <td style={{ border: '1px solid black', padding: '4px 6px', fontSize: '9pt', color: '#777' }}>
              {entry.attachmentPageRef ?? ''}
            </td>
            {showBy && <td style={{ border: '1px solid black', padding: '4px 6px', fontSize: '8.5pt', color: '#666' }}>{entry.createdBy ?? '—'}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Shared cell/label styles for signature table
const CELL: CSSProperties = {
  border: '1px solid black',
  padding: '4px 6px',
  verticalAlign: 'top',
  fontSize: pt.body,
  fontFamily,
  width: '50%',
};
const LABEL: CSSProperties = {
  fontSize: '7.5pt',
  color: '#333',
  display: 'block',
  marginBottom: '2px',
};

function HearingOrderProposal({ address, adminFee, recommendedText }: { address: string; adminFee?: string; recommendedText?: string }) {
  return (
    <div style={{ borderTop: '2px solid black', paddingTop: '16px', marginTop: '16px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      {/* Recommendation clause — from STATIC_BLOCKS.chronology.recommendationClause */}
      <p style={{ fontSize: '8.5pt', fontWeight: 'bolder', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
        {S.recommendationClause}
      </p>
      {recommendedText ? (
        <p style={{ fontSize: pt.body, margin: '0 0 8px', lineHeight: 1.5 }}>{recommendedText}</p>
      ) : (
        <ol style={{ fontSize: pt.body, paddingLeft: '20px', margin: 0, lineHeight: '1.6' }}>
          <li style={{ marginBottom: '4px' }}>
            The property at <strong>{address}</strong> is hereby declared a public health nuisance.
          </li>
          <li style={{ marginBottom: '4px' }}>
            Property owner/representative shall abate the nuisance within <strong>30 days</strong> after
            the Director's Hearing Order has been signed by the Director's Hearing Officer.
          </li>
          <li style={{ marginBottom: '4px' }}>
            All responsible parties are required to abate all health code violations within 30 days of
            the signed Hearing Order.
          </li>
          <li style={{ marginBottom: '4px' }}>
            The Department of Public Health is authorized to refer this case to the City Attorney's
            Office for civil enforcement if violations are not abated.
          </li>
          <li style={{ marginBottom: '4px' }}>
            An administrative fee of <strong>{adminFee || '___________'}</strong> shall be assessed for
            failure to abate all health code violations by the abatement deadline.
          </li>
        </ol>
      )}
    </div>
  );
}

export function PacketChronology({ chronology, complaint, packet, location, inspector, inspectorSig, managerSig }: Props) {
  const frozenSnapshot = packet.chronologySnapshot;
  const publicEntries = chronology.filter((c: any) => c.visibility !== 'Internal');

  const pages: any[][] = [];
  if (!frozenSnapshot) {
    for (let i = 0; i < Math.max(publicEntries.length, 1); i += ROWS_PER_PAGE) {
      pages.push(publicEntries.slice(i, i + ROWS_PER_PAGE));
    }
  }

  const address = complaint?.address ?? location?.address ?? '—';
  const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

  const hearingDateFmt = packet.hearing_date
    ? new Date(packet.hearing_date + 'T00:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
    : '';

  // ── Header component ───────────────────────────────────────────────────────
  const Header = ({ page, total }: { page: number; total: number }) => (
    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
      {/* Locked: STATIC_BLOCKS.chronology.orgLine */}
      <p style={{ fontSize: '9pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px' }}>
        {S.orgLine}
      </p>
      {/* Locked: STATIC_BLOCKS.chronology.documentTitle */}
      <h2 style={{ fontSize: '14pt', fontWeight: 'bolder', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '4px 0 6px' }}>
        {S.documentTitle}
      </h2>

      {/* Case info row — variable slots */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: pt.body }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid black', padding: '3px 6px', width: '35%', textAlign: 'left' }}>
              <span style={{ fontSize: '7.5pt', display: 'block', color: '#555' }}>Location Address</span>
              <strong>{address}</strong>
            </td>
            <td style={{ border: '1px solid black', padding: '3px 6px', width: '15%', textAlign: 'left' }}>
              <span style={{ fontSize: '7.5pt', display: 'block', color: '#555' }}>Block/Lot</span>
              {location?.blockLot ?? ''}
            </td>
            <td style={{ border: '1px solid black', padding: '3px 6px', width: '30%', textAlign: 'left' }}>
              <span style={{ fontSize: '7.5pt', display: 'block', color: '#555' }}>Facility Name (DBA)</span>
              {location?.dba ?? ''}
            </td>
            <td style={{ border: '1px solid black', padding: '3px 6px', width: '20%', textAlign: 'left' }}>
              <span style={{ fontSize: '7.5pt', display: 'block', color: '#555' }}>Date of Submittal</span>
              {today}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid black', padding: '3px 6px', textAlign: 'left' }}>
              <span style={{ fontSize: '7.5pt', display: 'block', color: '#555' }}>Hearing Date</span>
              {hearingDateFmt}
            </td>
            <td style={{ border: '1px solid black', padding: '3px 6px', textAlign: 'left' }}>
              <span style={{ fontSize: '7.5pt', display: 'block', color: '#555' }}>Program Code</span>
              {packet.program_code ?? ''}
            </td>
            <td colSpan={2} style={{ border: '1px solid black', padding: '3px 6px', textAlign: 'left' }}>
              <span style={{ fontSize: '7.5pt', display: 'block', color: '#555' }}>Case Number</span>
              {packet.case_number ?? complaint?.complaintid ?? '—'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Presentation clause — locked: STATIC_BLOCKS.chronology.presentationClause */}
      <p style={{ fontSize: '9pt', margin: '0 0 6px', textAlign: 'left', fontStyle: 'italic' }}>
        {S.presentationClause}
      </p>

      {total > 1 && (
        <p style={{ fontSize: '8.5pt', color: '#777', marginTop: '2px' }}>Page {page} of {total}</p>
      )}
      {frozenSnapshot && (
        <p style={{ fontSize: '8.5pt', color: '#666', marginTop: '2px' }}>
          ⚖ Frozen chronology record — submitted for hearing
        </p>
      )}
    </div>
  );

  // ── Signature table (last page) ────────────────────────────────────────────
  const SignatureTable = () => (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
      <tbody>
        <tr>
          <td style={CELL}>
            <span style={LABEL}>{S.signatureLabels.inspectorName}</span>
            {inspector?.name ?? packet.assignedTo ?? ''}
          </td>
          <SignatureBlock
            label={S.signatureLabels.inspectorSignature}
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
            {C.investigatorDefaultPhone}
          </td>
        </tr>
        <tr>
          <td style={CELL}>
            <span style={LABEL}>{S.signatureLabels.managerName}</span>
            &nbsp;
          </td>
          <SignatureBlock
            label={S.signatureLabels.managerSignature}
            signature={managerSig ?? null}
            cellStyle={CELL}
            labelStyle={LABEL}
          />
        </tr>
      </tbody>
    </table>
  );

  // ── Frozen snapshot rendering ──────────────────────────────────────────────
  if (frozenSnapshot) {
    const rows = parseFrozenSnapshot(frozenSnapshot);
    return (
      <div className="packet-page print-page-break" style={{ fontFamily, display: 'flex', flexDirection: 'column' }}>
        <Header page={1} total={1} />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ border: '1px solid black', padding: '4px 6px', textAlign: 'left', width: '80px', fontWeight: 'bold' }}>{S.tableHeader.date}</th>
              <th style={{ border: '1px solid black', padding: '4px 6px', textAlign: 'left', width: '90px', fontWeight: 'bold' }}>Type</th>
              <th style={{ border: '1px solid black', padding: '4px 6px', textAlign: 'left', fontWeight: 'bold' }}>{S.tableHeader.summary}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f9f9f9', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <td style={{ border: '1px solid black', padding: '4px 6px', whiteSpace: 'nowrap' }}>{row.date}</td>
                <td style={{ border: '1px solid black', padding: '4px 6px' }}>{row.type}</td>
                <td style={{ border: '1px solid black', padding: '4px 6px' }}>{row.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <HearingOrderProposal address={address} adminFee={packet.adminFee} />
        <SignatureTable />
        <div className="page-number-slot" />
      </div>
    );
  }

  // ── Paginated rendering ────────────────────────────────────────────────────
  return (
    <>
      {pages.map((pageEntries, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;
        return (
          <div key={pageIdx} className="packet-page print-page-break" style={{ fontFamily, display: 'flex', flexDirection: 'column' }}>
            <Header page={pageIdx + 1} total={pages.length} />
            <ChronologyTable entries={pageEntries} showBy />
            {isLastPage && pageEntries.length < 5 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt', marginTop: '-1px' }}>
                <tbody>
                  {[...Array(Math.max(0, 5 - pageEntries.length))].map((_, i) => (
                    <tr key={i}>
                      <td style={{ border: '1px solid black', padding: '6px', width: '80px' }}>&nbsp;</td>
                      <td style={{ border: '1px solid black', padding: '6px', width: '100px' }}>&nbsp;</td>
                      <td style={{ border: '1px solid black', padding: '6px' }}>&nbsp;</td>
                      <td style={{ border: '1px solid black', padding: '6px', width: '60px' }}>&nbsp;</td>
                      <td style={{ border: '1px solid black', padding: '6px', width: '40px' }}>&nbsp;</td>
                      <td style={{ border: '1px solid black', padding: '6px', width: '80px' }}>&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {/* Continuation checkbox label (locked) */}
            {!isLastPage && (
              <p style={{ fontSize: '8pt', color: '#555', marginTop: '6px', textAlign: 'right', fontStyle: 'italic' }}>
                ☑ {S.continuationCheckboxLabel}
              </p>
            )}
            {isLastPage && (
              <>
                <p style={{ fontSize: '8pt', color: '#888', marginTop: '8px', textAlign: 'right' }}>
                  {publicEntries.length} entr{publicEntries.length !== 1 ? 'ies' : 'y'} total
                  {pages.length > 1 ? ` · ${pages.length} pages` : ''}
                </p>
                <HearingOrderProposal address={address} adminFee={packet.adminFee} />
                <SignatureTable />
              </>
            )}
            <div className="page-number-slot" />
          </div>
        );
      })}
    </>
  );
}
