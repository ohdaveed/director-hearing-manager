import { Violation } from './ViolationRow';
import { VIOLATION_TYPES } from './violationTypes';
import { PhotoEntry } from './PhotoCard';
import PhotoPrintSection from './PhotoPrintSection';

type Observation = { id: string; text: string; linkedViolationKey: string };

export type CustomCAEntry = { id: string; text: string; date: string; notes: string };

export type PrintFormProps = {
  facilityName: string;
  contactPhone: string;
  contactEmail: string;
  locationId: string;
  complaintId: string;
  reportTitle: string;
  ownerName: string;
  inspector: string;
  inspectionDate: string;
  timeIn: string;
  timeOut: string;
  facilityType: string;
  numApts: string;
  numRooms: string;
  buildingDetails: string[];
  inspectionType: string;
  inspectionRating: string;
  isHealthyHousing: boolean;
  currentBalance?: string;
  violations: Violation[];
  observations: Observation[];
  photos: PhotoEntry[];
  accessGrantedBy: string;
  // Narrative
  summary?: string;
  globalObservations?: string[];
  areasInspected?: string[];
  checkedStandardCAs?: Record<string, boolean>;
  standardCADetails?: Record<string, { date: string; notes: string }>;
  customCAs?: CustomCAEntry[];
};

// ── Shared helpers ─────────────────────────────────────────────────────────

function fmtDate(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y}`;
}
function fmtTime(t: string) {
  if (!t) return '';
  const [h, min] = t.split(':');
  const hr = parseInt(h);
  return `${hr % 12 || 12}:${min} ${hr >= 12 ? 'PM' : 'AM'}`;
}

const cellBase: React.CSSProperties = {
  border: '1px solid #000', padding: '2px 4px',
  verticalAlign: 'top', fontSize: 8, lineHeight: 1.3,
};
const cellBold: React.CSSProperties = { ...cellBase, fontWeight: 'bold' };
const cellCenter: React.CSSProperties = { ...cellBold, textAlign: 'center' };

function Cb({ checked, label, code }: { checked?: boolean; label: string; code?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 3, marginBottom: 2 }}>
      <span style={{
        display: 'inline-block', flexShrink: 0, width: 9, height: 9,
        border: '1px solid #000', background: checked ? '#333' : '#fff', marginTop: 1,
      }} />
      <span style={{ fontSize: 8, lineHeight: 1.3 }}>
        {label}
        {code && <span style={{ fontSize: 7, color: '#333', marginLeft: 4 }}>{code}</span>}
      </span>
    </div>
  );
}

// Full-page wrapper — enforces letter content area height (11in – 1in margins = 10in)
const pageStyle: React.CSSProperties = {
  minHeight: '10in',
  boxSizing: 'border-box',
  pageBreakAfter: 'always',
  breakAfter: 'page',
  display: 'flex',
  flexDirection: 'column',
};

function PageDivider() {
  return <div style={{ pageBreakBefore: 'always', breakBefore: 'page' }} />;
}

// ── Page 1 — Main Inspection Form ──────────────────────────────────────────

function FormPage1(p: PrintFormProps) {
  const filled = p.violations.filter(v => v.violationKey);
  const labels = filled.map(v =>
    VIOLATION_TYPES.find(t => `${t.category}||${t.label}` === v.violationKey)?.label ?? ''
  );
  const hasV = (...names: string[]) =>
    names.some(n => labels.some(l => l.toLowerCase().includes(n.toLowerCase())));
  const allLocs = filled.map(v => v.location).join(' ').toLowerCase();
  const hasLoc = (...kw: string[]) => kw.some(k => allLocs.includes(k));
  const hasBd = (b: string) => p.buildingDetails.includes(b);

  const reinspDate = filled.length
    ? filled.reduce((m, v) => (!m || v.due_date < m ? v.due_date : m), '')
    : '';

  // Gather all owner and tenant actions across violations (new format + legacy fallback)
  const allOwnerActions: string[] = [];
  const allTenantActions: string[] = [];
  filled.forEach(v => {
    if ((v.ownerActions?.length ?? 0) > 0) {
      allOwnerActions.push(...(v.ownerActions ?? []));
    } else if (v.responsible_party === 'Owner' && v.corrective_action) {
      // Legacy: single corrective action for owner
      allOwnerActions.push(v.corrective_action);
    }
    if ((v.tenantActions?.length ?? 0) > 0) {
      allTenantActions.push(...(v.tenantActions ?? []));
    } else if (v.responsible_party === 'Tenant' && v.corrective_action) {
      // Legacy: single corrective action for tenant
      allTenantActions.push(v.corrective_action);
    }
  });

  // Earliest due date across all violations (for tenant section header)
  const earliestDueDate = filled.reduce((min, v) => (!min || v.due_date < min ? v.due_date : min), '');

  const obsLines: string[] = [];
  // Global observations appear as a numbered list above the narrative summary
  if ((p.globalObservations ?? []).length > 0) {
    (p.globalObservations ?? []).forEach((o, i) => obsLines.push(`${i + 1}. ${o}`));
  }
  if (p.summary) obsLines.push(p.summary);
  if (p.accessGrantedBy) obsLines.push(`Access granted by: ${p.accessGrantedBy}.`);
  const obsNotes = (p.observations ?? []).filter(o => o.text);
  if (obsNotes.length > 0) {
    obsLines.push('Observations:');
    obsNotes.forEach((o, i) => obsLines.push(`${i + 1}. ${o.text}`));
  }

  // Tenant corrective actions section
  if (allTenantActions.length > 0) {
    const duePart = earliestDueDate ? ` by ${fmtDate(earliestDueDate)}` : '';
    obsLines.push(`\nCorrective Actions — To Be Completed by Tenants${duePart}:`);
    allTenantActions.forEach((a, i) => obsLines.push(`${i + 1}. ${a}`));
  }

  // Owner / Property Management corrective actions section
  if (allOwnerActions.length > 0) {
    obsLines.push('\nCorrective Actions for Property Management:');
    allOwnerActions.forEach((a, i) => obsLines.push(`${i + 1}. ${a}`));
  }

  // Closing paragraph when actions exist
  if (allTenantActions.length > 0 || allOwnerActions.length > 0) {
    const deadlineStr = earliestDueDate ? fmtDate(earliestDueDate) : 'the correction date';
    obsLines.push(`\nAll corrective actions must be completed by ${deadlineStr}. Failure to comply will result in a citation to a Director's Hearing and the assessment of administrative fees. The initial inspection and first re-inspection are provided at no cost; all subsequent inspections will be billed at $229 per inspection.`);
  }

  // Append owner charges for Healthy Housing properties
  if (p.isHealthyHousing && p.currentBalance) {
    obsLines.push(`\nCurrent Owner Charges: ${p.currentBalance}`);
    obsLines.push('(Reinspections after the first are charged at $229/hour per SFHC Art. 11, Sec. 609)');
  }

  const obsText = obsLines.join('\n\n');

  const isOtherFacility = p.facility_type && !['Tourist Hotel', 'Residential Hotel', 'Apartments'].includes(p.facility_type);

  return (
    <div style={{ ...pageStyle, fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 8, color: '#000', lineHeight: 1.3, width: '100%' }}>

      {/* Letterhead */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ ...cellBase, width: '74%', textAlign: 'center', padding: '5px 8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: 10 }}>HEALTHY HOUSING &amp; VECTOR CONTROL INSPECTION REPORT/NOTICE OF VIOLATION</div>
              <div>SAN FRANCISCO DEPARTMENT OF PUBLIC HEALTH ENVIRONMENTAL HEALTH BRANCH</div>
              <div>49 SOUTH VAN NESS AVENUE, SUITE 600, SAN FRANCISCO, CA 94103</div>
              <div>OFFICE: (415) 252-3800&nbsp;&nbsp;&nbsp;FAX: (415) 252-3930&nbsp;&nbsp;&nbsp;WWW.SFDPH.ORG/DPH/EH</div>
            </td>
            <td style={{ ...cellBase, width: '26%', padding: '4px 8px' }}>
              <div style={{ marginBottom: 3 }}>Date: <strong>{fmtDate(p.inspection_date)}</strong></div>
              <div style={{ marginBottom: 3 }}>Time in w/ travel: <strong>{fmtTime(p.timeIn)}</strong></div>
              <div>Time out: <strong>{fmtTime(p.timeOut)}</strong></div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Info block */}
      <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none' }}>
        <tbody>
          <tr>
            <td style={{ ...cellBase, width: '45%' }}><strong>Location Address:</strong> {p.facilityName}</td>
            <td style={{ ...cellBase, width: '30%' }}><strong>Contact Phone(s):</strong> {p.contactPhone}</td>
            <td style={{ ...cellBase, width: '25%' }}><strong>Location ID:</strong> {p.location_id}</td>
          </tr>
          <tr>
            <td style={cellBase}><strong>DBA:</strong> {p.reportTitle}</td>
            <td style={cellBase}>&nbsp;</td>
            <td style={cellBase}><strong>Complaint ID:</strong> {p.complaintid}</td>
          </tr>
          <tr>
            <td style={cellBase}><strong>Management Name:</strong> {p.owner_name}</td>
            <td style={cellBase}><strong>Contact Email(s):</strong> {p.contactEmail}</td>
            <td style={cellBase}><strong>Re-inspection On/After:</strong> {fmtDate(reinspDate)}</td>
          </tr>
          <tr>
            <td style={cellBase} colSpan={3}><strong>Owner&apos;s Name:</strong> {p.owner_name}</td>
          </tr>
        </tbody>
      </table>

      {/* Healthy Housing Fee */}
      <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none' }}>
        <tbody>
          <tr>
            <td style={{ ...cellBase, padding: '3px 6px' }}>
              <span style={{ fontWeight: 'bold' }}>Vector Control and Healthy Housing Inspection Program Fee&nbsp;&nbsp;</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 12 }}>
                <span style={{ display: 'inline-block', width: 9, height: 9, border: '1px solid #000', background: p.isHealthyHousing ? '#333' : '#fff', verticalAlign: 'middle' }} />
                <span style={{ fontSize: 8 }}>Yes*</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', width: 9, height: 9, border: '1px solid #000', background: !p.isHealthyHousing ? '#333' : '#fff', verticalAlign: 'middle' }} />
                <span style={{ fontSize: 8 }}>No**</span>
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Facility Type / Units / Building Details */}
      <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none' }}>
        <tbody>
          <tr>
            <td style={{ ...cellCenter, width: '20%' }}>Type of Facility</td>
            <td style={{ ...cellCenter, width: '14%' }}>Number of Units</td>
            <td style={cellCenter}>Building Details</td>
          </tr>
          <tr>
            <td style={{ ...cellBase, verticalAlign: 'top' }}>
              <Cb checked={p.facility_type === 'Tourist Hotel'} label="Tourist Hotel" />
              <Cb checked={p.facility_type === 'Residential Hotel'} label="Residential Hotel" />
              <Cb checked={p.facility_type === 'Apartments'} label="Apartments" />
              <Cb checked={isOtherFacility || undefined} label={isOtherFacility ? `Other: ${p.facility_type}` : 'Other:'} />
            </td>
            <td style={{ ...cellBase, verticalAlign: 'top' }}>
              <div>Apts: {p.numApts}</div>
              <div style={{ marginTop: 3 }}>Rooms: {p.numRooms}</div>
            </td>
            <td style={{ ...cellBase, verticalAlign: 'top' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 8px' }}>
                <Cb checked={hasBd('Basement')} label="Basement" />
                <Cb checked={hasBd('Garage')} label="Garage" />
                <Cb checked={hasBd('Roof Access')} label="Roof access" />
                <Cb checked={hasBd('Backyard')} label="Backyard" />
                <Cb checked={hasBd('Hallways')} label="Hallways" />
                <Cb checked={hasBd('Secondary Egress')} label="Secondary egress" />
                <Cb checked={hasBd('Other')} label="Other:" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Inspection Type / Rating / Vector Survey */}
      <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none' }}>
        <tbody>
          <tr>
            <td style={cellCenter} colSpan={4}><strong>Type of Inspection</strong></td>
            <td style={cellCenter} colSpan={2}><strong>Inspection Rating</strong></td>
            <td style={cellCenter}><strong>Vector Survey</strong></td>
          </tr>
          <tr>
            <td style={cellBase}><Cb checked={p.inspection_type === 'Routine'} label="Routine" /></td>
            <td style={cellBase}><Cb checked={p.inspection_type === 'Routine Re-inspection'} label="Routine Re-inspection" /></td>
            <td style={cellBase} colSpan={2}><Cb checked={p.inspection_type === 'Citation to Hearing Issued'} label="Citation to Hearing Issued" /></td>
            <td style={cellBase}><Cb checked={p.inspection_rating === 'Satisfactory'} label="Satisfactory" /></td>
            <td style={cellBase}><Cb checked={p.inspection_rating === 'Unsatisfactory'} label="Unsatisfactory" /></td>
            <td style={cellBase}><Cb checked={false} label="Field Survey" /></td>
          </tr>
          <tr>
            <td style={cellBase}><Cb checked={p.inspection_type === 'Complaint'} label="Complaint" /></td>
            <td style={cellBase}><Cb checked={p.inspection_type === 'Complaint Re-inspection'} label="Complaint Re-inspection" /></td>
            <td style={cellBase} colSpan={2}><Cb checked={p.inspection_type === 'Field Consultation / Survey'} label="Field Consultation / Survey" /></td>
            <td style={cellBase} colSpan={3}>&nbsp;</td>
          </tr>
        </tbody>
      </table>

      {/* Areas Inspected + Violation Categories */}
      <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none' }}>
        <tbody>
          <tr>
            <td style={cellCenter}><strong>Areas Inspected</strong></td>
            <td style={cellCenter} colSpan={2}><strong>Violation Category (Article 11)</strong></td>
          </tr>
          <tr>
            <td style={{ ...cellBase, width: '17%', verticalAlign: 'top' }}>
              {(() => {
                const ai = p.areasInspected ?? [];
                const hasA = (formArea: string) => ai.includes(formArea);
                return (<>
                  <Cb checked={hasLoc('alley', 'easement')} label="Alleyway/Easement" />
                  <Cb checked={hasLoc('basement') || hasA('Basement / Substructure')} label="Basement" />
                  <Cb checked={hasLoc('front', 'backyard', 'yard') || hasA('Backyard / Exterior Grounds')} label="Front/Backyard" />
                  <Cb checked={hasLoc('garage', 'driveway') || hasA('Garage / Parking')} label="Garage/Driveway" />
                  <Cb checked={hasLoc('garbage area') || hasA('Trash / Refuse Area')} label="Garbage Area" />
                  <Cb checked={hasLoc('hallway', 'hall') || hasA('Hallways / Stairwells')} label="Hallways" />
                  <Cb checked={hasLoc('laundry') || hasA('Laundry Room')} label="Laundry Room" />
                  <Cb checked={hasLoc('lightwell')} label="Lightwells" />
                  <Cb checked={hasLoc('lobby') || hasA('Lobby / Common Areas')} label="Lobby" />
                  <Cb checked={hasLoc('roof') || hasA('Roof / Attic')} label="Roof" />
                  <Cb checked={hasLoc('stair') || hasA('Hallways / Stairwells')} label="Staircase" />
                  <Cb checked={hasLoc('bathroom', 'toilet', 'restroom') || hasA('Bathrooms / Plumbing Areas')} label="Bathroom" />
                  <Cb checked={hasA('Kitchen Areas') || hasA('Individual Units / Rooms') || hasA('Vacant Units')} label="Other:" />
                </>);
              })()}
            </td>
            <td style={{ ...cellBase, width: '42%', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold', marginBottom: 2 }}>Pests, Vermin, Animals</div>
              <Cb checked={hasV('Bed Bug')} label="Bed Bugs" code="Sec 581(b)(8)" />
              <Cb checked={hasV('Cockroach')} label="Cockroaches" />
              <Cb checked={hasV('Flies')} label="Flies" />
              <Cb checked={hasV('Mosquito')} label="Mosquitoes" />
              <Cb checked={hasV('Pigeon')} label="Pigeons" code="Sec 581(b)(7)" />
              <Cb checked={hasV('Poison Oak')} label="Poison Oak" code="Sec 581(b)(11)" />
              <Cb checked={hasV('Rodent')} label="Rodents" code="Sec 581(b)(13)" />
              <Cb checked={false} label="Other:" />
              <div style={{ fontWeight: 'bold', marginTop: 4, marginBottom: 2 }}>Sanitation</div>
              <Cb checked={hasV('Garbage / Refuse')} label="Garbage/Refuse/Waste/Debris" code="Sec 581(b)(1)" />
              <Cb checked={hasV('Human / Animal Waste')} label="Human/Animal Waste" code="Sec 581(b)(1)(5)" />
              <Cb checked={hasV('Overgrown')} label="Overgrown Vegetation" code="Sec 581(b)(2)" />
            </td>
            <td style={{ ...cellBase, width: '41%', verticalAlign: 'top' }}>
              <Cb checked={hasV('Unsanitary Bathroom')} label="Unsanitary Bathroom/Toilet" />
              <Cb checked={hasV('Floor, Walls')} label="Unsanitary/Floor, Walls, & Ceiling" code="Sec 581(b)(4)" />
              <Cb checked={hasV('Unsanitary Hallways')} label="Unsanitary Hallways" />
              <Cb checked={hasV('Unsanitary Common Kitchen')} label="Unsanitary Common Kitchen" />
              <Cb checked={hasV('Accumulation of Paper')} label="Accumulation of Paper Materials" code="Sec 581(b)(3)" />
              <Cb checked={hasV('Mold')} label="Mold Growth" code="Sec 581(b)(6)" />
              <Cb checked={hasV('Unpaid Fees')} label="Unpaid Fees" code="Sec 609" />
              <Cb checked={hasV('Excessive Materials')} label="Excessive Materials" code="Sec 581(b)(18)" />
              <Cb checked={false} label="Other:" />
              <div style={{ fontWeight: 'bold', marginTop: 4, marginBottom: 2 }}>Garbage Area</div>
              <Cb checked={hasV('Inadequate Garbage')} label="Inadequate Garbage Containers/Lids" code="Sec 581(b)(1)" />
              <Cb checked={hasV('Uncontainerized')} label="Uncontainerized Garbage" />
              <div style={{ marginTop: 2 }}>
                <Cb checked={false} label="Referral to: _____________________________" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Observations */}
      <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none' }}>
        <tbody>
          <tr>
            <td style={{ ...cellBold, padding: '3px 4px' }}>Observations, Corrective Actions, and Correction Date:</td>
          </tr>
          <tr>
            <td style={{ ...cellBase, minHeight: 200, flex: 1, verticalAlign: 'top', padding: 4 }}>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{obsText}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footnotes */}
      <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none' }}>
        <tbody>
          <tr>
            <td style={{ ...cellBase, fontSize: 7, padding: '3px 6px' }}>
              *Re-inspection fee of $______ will be charged on the 2nd re-inspection and on subsequent re-inspections until violations are corrected. Failure to cooperate with a re-inspection, or to pay authorized re-inspection fees pursuant to SFHC Art. 11, Sec. 609.1, will result in a finding that the violations are not abated.
            </td>
          </tr>
          <tr>
            <td style={{ ...cellBase, fontSize: 7, padding: '3px 6px' }}>
              **Up to $1000 fine per day may be charged after Director&apos;s Hearing if violations are not corrected, per SFHC Art. 11, Sec 600.
            </td>
          </tr>
        </tbody>
      </table>

      {/* Signature block */}
      <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none' }}>
        <tbody>
          <tr>
            <td style={{ ...cellBase, width: '60%' }}><strong>Inspector/Investigator Name:</strong> {p.inspector}</td>
            <td style={cellBase}><strong>Office Phone Number:</strong> (415) 252-3800</td>
          </tr>
          <tr>
            <td style={{ ...cellBase, paddingTop: 12 }}><strong>Inspector/Investigator Signature:</strong></td>
            <td style={{ ...cellBase, paddingTop: 12 }}><strong>Received by:</strong></td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 7 }}>
        <span>Page <strong>1</strong> of <strong>3</strong></span>
        <span>Revised 8/31/2020</span>
      </div>
    </div>
  );
}

// ── Page 2 — Code Sections Reference (static) ──────────────────────────────

type CodeRow = { header?: boolean; dark?: boolean; sec: string; text?: string };

const CODE_ROWS: CodeRow[] = [
  { header: true, dark: true, sec: 'SAN FRANCISCO HEALTH CODE ARTICLE 11 CODE SECTIONS' },
  { header: true, sec: 'PROHIBITED PUBLIC HEALTH NUISANCES' },
  { sec: 'Sec. 581 (a)', text: 'No Person shall have upon any premises or real property owned, occupied or controlled by him, or her, or it any public nuisance.' },
  { sec: 'Sec. 581 (b)(1)', text: 'Any accumulation of filth, garbage, decayed or spoiled food, unsanitary debris or waste material or decaying animal or vegetable matter unless such materials are set out for collection in compliance with Section 283 of this Code;' },
  { sec: 'Sec. 581 (b)(2)', text: 'Any accumulation of hay, grass, straw, weeds, or vegetation overgrowth;' },
  { sec: 'Sec. 581 (b)(3)', text: 'Any accumulation of waste paper, litter or combustible trash unless such materials are set out for collection in compliance with Section 283 of this Code;' },
  { sec: 'Sec. 581 (b)(4)', text: 'Any buildings, structures, or portion thereof found to be unsanitary;' },
  { sec: 'Sec. 581 (b)(5)', text: 'Any matter or material which constitutes, or is contaminated by, animal or human excrement, urine or other biological fluids;' },
  { sec: 'Sec. 581 (b)(6)', text: 'Any visible or otherwise demonstrable mold or mildew in the interiors of any buildings or facilities;' },
  { sec: 'Sec. 581 (b)(7)', text: 'Any pest harborage or infestation including but not limited to pigeons, skunks, raccoons, opossums, and snakes, except for pigeon harborages that comply with Section 37(e) of this Code;' },
  { sec: 'Sec. 581 (b)(8)', text: 'Any noxious insect harborage or infestation including, but not limited to cockroaches, bed bugs, fleas, scabies, lice, spiders or other arachnids, houseflies, wasps and mosquitoes, except for harborages for honey-producing bees regulated by the California Food and Agriculture Code Sections 29000 et seq.' },
  { sec: 'Sec. 581 (b)(9)', text: 'Any article of food or drink in the possession or under the control of any person which is tainted, decayed, spoiled or otherwise unwholesome or unfit to be eaten or drunk.' },
  { sec: 'Sec. 581 (b)(11)', text: 'Any vacant lots, open spaces, and other properties in the City and County of San Francisco, which become infested with poison oak (Toxicodendron diversilobum) or poison ivy shrub (Rhus toxicodendron) hereafter referred to as poisonous growth;' },
  { sec: 'Sec. 581 (b)(12)', text: 'Any violation of Section 37 of this Code; [Article 1]' },
  { sec: 'Sec. 581 (b)(13)', text: 'Any violation of Section 92 of this Code; [Article 2]' },
  { sec: 'Sec. 581 (b)(14)', text: 'Any violation of Section 590 of this Article;' },
  { sec: 'Sec. 581 (b)(17)', text: 'Any violations of rules or regulations the Director adopts to implement the provisions of this Article or applicable provisions of State law.' },
  { sec: 'Sec. 581 (b)(18)', text: 'Anything else that the Director deems to be a threat to public health and safety.' },
  { sec: 'Sec. 609 (a) et seq.', text: 'Vector Control And Healthy Housing Inspection Program Fee. Every owner of an apartment house or hotel shall pay an annual fee to the Department. The amount of the fee shall be determined by the number of rental units in the building.' },
  { header: true, sec: 'NOTICE OF VIOLATION & CONSEQUENCES OF FAILURE TO TIMELY ABATE' },
  { sec: 'Sec. 596 (b).', text: "Whenever the Director determines that a nuisance exists, the Director shall within 15 days cause a Notice of Violation to be served personally or by first class mailing to the Responsible Parties. The Notice shall be served on the Owner by mail to the address on the last assessment rolls of the City. If served on the Manager, it shall be mailed to the Manager's principal place of business. If served on any other Person, it shall be mailed to the Person's last known address. The Notice of violation shall be a public record subject to disclosure pursuant to Administrative Code Chapter 67." },
  { sec: 'Sec. 596 (e)(1).', text: 'The Director shall specify in the Notice of Violation the time period within which the Responsible Party must abate the nuisance. Such time period shall not exceed 30 days, unless extended by the Director if reasonably necessary to abate the nuisance.' },
  { sec: 'Sec. 596 (e)(3).', text: "If the Owner/Responsible Parties fail to comply with this Notice of Violation, the Director of Health may (A) hold a Director's Hearing to consider issuing a Director's Order to abate the nuisance or (B) cause the abatement and removal of the nuisance and the Owner shall be indebted to the City and County of San Francisco for all costs, charges and fees incurred." },
  { sec: 'Sec. 596 (e)(4).', text: "Owner/Responsible Parties may be liable for other charges, costs, including administrative costs, expenses incurred by the Department, fines, attorneys' fees, and penalties as provided for in Article 11." },
  { header: true, sec: 'LEGAL AUTHORITY' },
  { sec: 'Sec. 595.', text: 'Inspection of Premises. It shall be the duty of the Department of Public Health upon application from any person, firm, or corporation operating a hotel, before issuing the certificate specified in Section 594, to cause the premises to be inspected for purpose of ascertaining whether said premises are free of nuisances and are in a sanitary condition for human habitation.' },
  { sec: 'Sec. 596 (a).', text: 'Complaints. Whenever a written or oral complaint is made to the Department that a nuisance as defined by Section 581 exists, or the Director otherwise has reasonable cause to believe that such a nuisance exists, the Director shall inspect the building, structure or property to verify the existence of a nuisance thereon.' },
  { header: true, sec: 'DEFINITIONS' },
  { sec: 'Sec. 580 (a)', text: '"City" shall mean the City and County of San Francisco.' },
  { sec: 'Sec. 580 (b)', text: '"Department" shall mean the San Francisco Department of Public Health.' },
  { sec: 'Sec. 580 (c)', text: '"Director" shall mean the Director of Public Health or his or her designee.' },
  { sec: 'Sec. 580 (d)', text: '"Manager" shall mean the authorized agent for the Owner of a building, structure or property, who is responsible for the day-to-day operation of said building, structure or property.' },
  { sec: 'Sec. 580 (e)', text: '"Owner" shall mean any Person who possesses, has title to or an interest in, harbors or has control, custody or possession of any building, property, real estate, personality or chattel.' },
  { sec: 'Sec. 580 (f)', text: '"Person" shall mean and include corporations, estates, associations, partnerships and trusts, one or more individual human beings, any department, Board or Commission of the City and County of San Francisco, and any agencies or instrumentalities of the State of California or the United States to the extent allowable by law.' },
  { sec: 'Sec. 580 (h)', text: '"Responsible Party" shall include the Owner, Manager, tenant, or any Person having control over a property or who creates or allows or contributes to or fails to correct a condition that constitutes a nuisance as defined by this Article.' },
];

function FormPage2() {
  return (
    <div style={{ ...pageStyle, fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 8, color: '#000', lineHeight: 1.4, width: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
        <tbody>
          {CODE_ROWS.map((row, i) => {
            if (row.header) {
              return (
                <tr key={i}>
                  <td colSpan={2} style={{ ...cellBold, padding: '3px 6px', background: row.dark ? '#d0d0d0' : '#f0f0f0', fontStyle: 'italic' }}>
                    {row.sec}
                  </td>
                </tr>
              );
            }
            return (
              <tr key={i}>
                <td style={{ ...cellBase, width: '18%', fontWeight: 'bold', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{row.sec}</td>
                <td style={cellBase}>{row.text}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 7 }}>
        <span>Page <strong>2</strong> of <strong>3</strong></span>
        <span>Revised 8/31/2020</span>
      </div>
    </div>
  );
}

// ── Page 3 — Violations Detail ─────────────────────────────────────────────

function FormPage3(p: PrintFormProps) {
  const filled = p.violations.filter(v => v.violationKey);
  const reinspDate = filled.length
    ? filled.reduce((m, v) => (!m || v.due_date < m ? v.due_date : m), '')
    : '';

  return (
    <div style={{ ...pageStyle, fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 8, color: '#000', lineHeight: 1.3, width: '100%' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <div style={{ fontWeight: 'bold', fontSize: 12 }}>SAN FRANCISCO DEPARTMENT OF PUBLIC HEALTH</div>
        <div style={{ fontWeight: 'bold', fontSize: 9 }}>ENVIRONMENTAL HEALTH BRANCH</div>
        <div>49 South Van Ness Avenue, Suite 600</div>
        <div>San Francisco, CA 94103</div>
        <div style={{ fontWeight: 'bold', fontSize: 10, marginTop: 6, marginBottom: 6 }}>
          HEALTHY HOUSING &amp; VECTOR CONTROL PROGRAM INSPECTION REPORT
        </div>
      </div>

      {/* Info block */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
        <tbody>
          <tr>
            <td style={{ ...cellBase, width: '55%' }}><strong>Facility Address:</strong> {p.facilityName}</td>
            <td style={cellBase}><strong>Inspection Date:</strong> {fmtDate(p.inspection_date)}</td>
          </tr>
          <tr>
            <td style={cellBase}><strong>Business Name:</strong> {p.reportTitle}</td>
            <td style={cellBase}><strong>Reinspection Date:</strong> {fmtDate(reinspDate)}</td>
          </tr>
          <tr>
            <td style={cellBase}><strong>Owner Name(s):</strong> {p.owner_name}</td>
            <td style={cellBase}><strong>Inspection Type:</strong> {p.inspection_type}</td>
          </tr>
          <tr>
            <td style={cellBase}><strong>Facility Type:</strong> {p.facility_type}&nbsp;&nbsp;&nbsp;<strong>Phone Number:</strong> {p.contactPhone}</td>
            <td style={cellBase}><strong>Location ID:</strong> {p.location_id}</td>
          </tr>
        </tbody>
      </table>

      {/* Violations header */}
      <div style={{ border: '1px solid #000', borderTop: 'none', padding: '4px 6px' }}>
        <strong style={{ fontSize: 8 }}>The following Items Represent Health Code Violations and Must Be Corrected By the Indicated Date(s):</strong>
      </div>

      {/* Violations table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', borderTop: 'none' }}>
        <thead>
          <tr style={{ background: '#e8e8e8' }}>
            <td style={{ ...cellBold, width: '4%' }}>#</td>
            <td style={{ ...cellBold, width: '20%' }}>Violation / Code Section</td>
            <td style={{ ...cellBold, width: '12%' }}>Location</td>
            <td style={{ ...cellBold, width: '30%' }}>Owner / Mgmt Actions</td>
            <td style={{ ...cellBold, width: '25%' }}>Tenant Actions</td>
            <td style={{ ...cellBold, width: '9%' }}>Correct By</td>
          </tr>
        </thead>
        <tbody>
          {filled.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ ...cellBase, height: 40, textAlign: 'center', color: '#666' }}>
                No violations recorded.
              </td>
            </tr>
          ) : filled.map((v, i) => {
            const vt = VIOLATION_TYPES.find(t => `${t.category}||${t.label}` === v.violationKey);
            // Resolve owner and tenant actions (new format with fallback to legacy)
            const ownerCAs = (v.ownerActions?.length ?? 0) > 0
              ? (v.ownerActions ?? [])
              : (v.responsible_party === 'Owner' && v.corrective_action ? [v.corrective_action] : []);
            const tenantCAs = (v.tenantActions?.length ?? 0) > 0
              ? (v.tenantActions ?? [])
              : (v.responsible_party === 'Tenant' && v.corrective_action ? [v.corrective_action] : []);
            return (
              <tr key={v.id} style={{ verticalAlign: 'top' }}>
                <td style={{ ...cellBase, fontWeight: 'bold' }}>{i + 1}</td>
                <td style={cellBase}>
                  <div style={{ fontWeight: 'bold' }}>{vt?.label}</div>
                  <div style={{ fontSize: 7, color: '#444', marginTop: 1 }}>{vt?.code}</div>
                </td>
                <td style={cellBase}>{v.location}</td>
                <td style={{ ...cellBase, lineHeight: 1.4 }}>
                  {ownerCAs.length > 0
                    ? <ol style={{ margin: 0, paddingLeft: 10 }}>
                        {ownerCAs.map((a, idx) => <li key={idx} style={{ marginBottom: 2 }}>{a}</li>)}
                      </ol>
                    : <span style={{ color: '#999' }}>—</span>
                  }
                </td>
                <td style={{ ...cellBase, lineHeight: 1.4 }}>
                  {tenantCAs.length > 0
                    ? <ol style={{ margin: 0, paddingLeft: 10 }}>
                        {tenantCAs.map((a, idx) => <li key={idx} style={{ marginBottom: 2 }}>{a}</li>)}
                      </ol>
                    : <span style={{ color: '#999' }}>—</span>
                  }
                </td>
                <td style={{ ...cellBase, whiteSpace: 'nowrap' }}>{fmtDate(v.due_date)}</td>
              </tr>
            );
          })}
          {Array.from({ length: Math.max(0, 6 - filled.length) }).map((_, i) => (
            <tr key={`pad-${i}`}>
              <td style={{ ...cellBase, height: 18 }}>&nbsp;</td>
              <td style={cellBase}>&nbsp;</td>
              <td style={cellBase}>&nbsp;</td>
              <td style={cellBase}>&nbsp;</td>
              <td style={cellBase}>&nbsp;</td>
              <td style={cellBase}>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Bottom signature */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', borderTop: 'none' }}>
        <tbody>
          <tr>
            <td style={{ ...cellBase, width: '50%', paddingTop: 12 }}><strong>Inspector:</strong> {p.inspector}</td>
            <td style={{ ...cellBase, paddingTop: 12 }}><strong>Inspector Signature:</strong></td>
          </tr>
          <tr>
            <td style={cellBase}><strong>Phone:</strong> (415) 252-3800</td>
            <td style={cellBase}><strong>Received By:</strong></td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 7 }}>
        <span>Page <strong>3</strong> of <strong>3</strong></span>
        <span>Revised 8/31/2020</span>
      </div>
    </div>
  );
}

// ── Main PrintForm export ───────────────────────────────────────────────────

export default function PrintForm(props: PrintFormProps) {
  return (
    <>
      <FormPage1 {...props} />
      <FormPage2 />
      <FormPage3 {...props} />
      <PhotoPrintSection
        photos={props.photos}
        address={props.facilityName}
        inspectionDate={props.inspection_date}
        complaintId={props.complaintid}
      />
    </>
  );
}
