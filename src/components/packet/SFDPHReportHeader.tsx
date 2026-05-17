/**
 * SFDPHReportHeader.tsx
 *
 * Official SFDPH masthead shared across all hearing-packet print documents.
 * Supports four layout variants used in the packet suite:
 *
 *   'seal-left-dept-right' – seal left, dept text right-aligned (EnforcementSummary)
 *   'seal-dept-left'       – seal + dept left, optional officials sidebar (NOV/NOH/ServiceLog)
 *   'cover'                – cover-page layout: large seal + dept, city/mayor below, rule
 *
 * Official names (Mayor, Director of Health, EH Director) live here — update once
 * and all five documents inherit the change.
 */

import type { CSSProperties } from 'react';
import { SF_SEAL_URL } from './printUtils';
import { OFFICIALS } from '../../config/documentTemplates';

// ─── Official metadata sourced from documentTemplates config ─────────────────
// Update OFFICIALS in config/documentTemplates.ts — all documents inherit the change.
const MAYOR = OFFICIALS.mayor;
const DIRECTOR_OF_HEALTH = OFFICIALS.directorOfHealth;
const EH_DIRECTOR = OFFICIALS.ehDirector;

// ─── Types ────────────────────────────────────────────────────────────────────
type HeaderLayout = 'seal-left-dept-right' | 'seal-dept-left' | 'cover';

interface SFDPHReportHeaderProps {
  /** Visual layout variant. Default: 'seal-dept-left'. */
  layout?: HeaderLayout;
  /** Label for the EH section line. Default: 'Environmental Health'. */
  sectionLabel?: string;
  /** Optional program name shown underlined below the section label (NOV). */
  programName?: string;
  /** Render the Mayor / Director / EH Director sidebar. Default: false. */
  showOfficials?: boolean;
  /**
   * When true: officials are italic with NOV-style line breaks.
   * When false: officials use single-line format (NOH/ServiceLog).
   */
  officialsItalic?: boolean;
  /** Render a 2pt horizontal rule below the header (NOV). Default: false. */
  showRule?: boolean;
  /** Seal image size in px. Default: 60. */
  sealSize?: number;
  /** Outer container marginBottom (ignored when showRule=true). Default: '14px'. */
  marginBottom?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function SFDPHReportHeader({
  layout = 'seal-dept-left',
  sectionLabel = 'Environmental Health',
  programName,
  showOfficials = false,
  officialsItalic = false,
  showRule = false,
  sealSize = 60,
  marginBottom,
}: SFDPHReportHeaderProps) {
  const baseFont: CSSProperties = { fontFamily: 'Times New Roman, serif' };

  // ── 'seal-left-dept-right' (PacketEnforcementSummary) ──────────────────────
  if (layout === 'seal-left-dept-right') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: marginBottom ?? '8px',
          ...baseFont,
        }}
      >
        <img
          src={SF_SEAL_URL}
          alt="SF Seal"
          style={{ width: `${sealSize}px`, height: `${sealSize}px`, flexShrink: 0 }}
        />
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '11pt', margin: '0' }}>City and County of San Francisco</p>
          <p style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11pt', margin: '1px 0 0' }}>
            Department of Public Health
          </p>
          <p style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10pt', margin: '1px 0 0' }}>
            {sectionLabel}
          </p>
        </div>
      </div>
    );
  }

  // ── 'cover' (PacketCoverPage) ──────────────────────────────────────────────
  if (layout === 'cover') {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '12px' }}>
          <img
            src={SF_SEAL_URL}
            alt="City and County of San Francisco Seal"
            style={{ width: `${sealSize}px`, height: `${sealSize}px`, flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 'bold', fontSize: '13pt', margin: '0 0 3px' }}>
              San Francisco Department of Public Health
            </p>
            <p style={{ fontSize: '9.5pt', margin: '0' }}>{DIRECTOR_OF_HEALTH}, Director of Health</p>
            <p style={{ fontSize: '9.5pt', margin: '0' }}>{EH_DIRECTOR},</p>
            <p style={{ fontSize: '9.5pt', margin: '0' }}>Acting Director of Environmental Health</p>
          </div>
        </div>
        <div style={{ fontSize: '9.5pt', marginBottom: '16px' }}>
          <p style={{ margin: '0' }}>City and County of San Francisco</p>
          <p style={{ margin: '0' }}>{MAYOR}</p>
          <p style={{ margin: '0' }}>Mayor</p>
        </div>
        <hr style={{ border: 'none', borderTop: '2px solid black', margin: '0 0 16px' }} />
      </>
    );
  }

  // ── 'seal-dept-left' (NOV, NOH, ServiceLog) ───────────────────────────────
  const deptBlock = (
    <div>
      <p style={{ margin: '0', fontWeight: officialsItalic ? 'bold' : 'normal', fontSize: '10pt' }}>
        City and County of San Francisco
      </p>
      <p style={{ margin: '1px 0 0', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10pt' }}>
        Department of Public Health
      </p>
      <p style={{ margin: '1px 0 0', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9.5pt' }}>
        {sectionLabel}
      </p>
      {programName && (
        <p style={{ margin: '3px 0 0', fontWeight: 'bold', fontSize: '9pt', textDecoration: 'underline' }}>
          {programName}
        </p>
      )}
    </div>
  );

  const officialsBlock = showOfficials ? (
    officialsItalic ? (
      // NOV style: italic, Acting title split across lines
      <div style={{ textAlign: 'right', fontSize: '9pt', fontStyle: 'italic' }}>
        <p style={{ margin: '0' }}>{MAYOR}, Mayor</p>
        <p style={{ margin: '1px 0 0' }}>{DIRECTOR_OF_HEALTH}</p>
        <p style={{ margin: '1px 0 0' }}>Director of Health</p>
        <p style={{ margin: '1px 0 0' }}>{EH_DIRECTOR}</p>
        <p style={{ margin: '1px 0 0' }}>Acting Director of Environmental</p>
        <p style={{ margin: '1px 0 0' }}>Health</p>
      </div>
    ) : (
      // NOH / ServiceLog style: non-italic, single-line titles
      <div style={{ textAlign: 'right', fontSize: '9.5pt' }}>
        <p style={{ margin: '0' }}>{MAYOR}, Mayor</p>
        <p style={{ margin: '1px 0 0' }}>{DIRECTOR_OF_HEALTH}, Director of Health</p>
        <p style={{ margin: '1px 0 0' }}>{EH_DIRECTOR}</p>
        <p style={{ margin: '1px 0 0' }}>Director of Environmental Health</p>
      </div>
    )
  ) : null;

  return (
    <div style={{ ...baseFont, marginBottom: showRule ? undefined : (marginBottom ?? '14px') }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <img
            src={SF_SEAL_URL}
            alt="SF Seal"
            style={{ width: `${sealSize}px`, height: `${sealSize}px`, flexShrink: 0 }}
          />
          {deptBlock}
        </div>
        {officialsBlock}
      </div>
      {showRule && <hr style={{ borderTop: '2px solid black', margin: '6px 0' }} />}
    </div>
  );
}
