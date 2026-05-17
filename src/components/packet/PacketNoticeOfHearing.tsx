/**
 * PacketNoticeOfHearing.tsx
 *
 * Pixel-perfect reproduction of the official SFDPH "Notice of Hearing" form.
 */


import { SFDPHReportHeader } from './SFDPHReportHeader';
import { fmtDate, PrintCheckbox, SFDPHReportFooter } from './printUtils';

type Props = {
  packet: any['packet'];
  complaint: any['complaint'];
  location: any['location'];
  inspector: any['inspector'];
  inspections: any['inspections'];
};

function FieldLine({ label, value, rightLabel, rightValue }: {
  label: string; value?: string; rightLabel?: string; rightValue?: string;
}) {
  return (
    <div style={{ marginBottom: '10px', fontSize: '11pt', fontFamily: 'Times New Roman, serif' }}>
      <strong>{label}</strong>{' '}
      <span style={{ borderBottom: '1px solid black', display: 'inline-block', minWidth: '200px', paddingBottom: '1px' }}>
        {value ?? ''}
      </span>
      {rightLabel && (
        <>
          {' '}&nbsp;&nbsp;&nbsp;<strong>{rightLabel}</strong>{' '}
          <span style={{ borderBottom: '1px solid black', display: 'inline-block', minWidth: '100px', paddingBottom: '1px' }}>
            {rightValue ?? ''}
          </span>
        </>
      )}
    </div>
  );
}

/** Determine program type checkbox from assignedProgram */
function getProgramChecks(assignedProgram: string | undefined, categories: string[] | undefined) {
  const prog = (assignedProgram ?? '').toLowerCase();
  return {
    food: prog.includes('food'),
    housing: prog.includes('health') || prog.includes('housing') || prog.includes('vector'),
    massage: prog.includes('massage'),
    tobacco: prog.includes('tobacco'),
    solidWaste: prog.includes('solid') || prog.includes('waste') || (categories ?? []).some(c => c.toLowerCase().includes('garbage') || c.toLowerCase().includes('waste')),
    other: !prog.includes('health') && !prog.includes('housing') && !prog.includes('vector') && !prog.includes('food') && !prog.includes('massage') && !prog.includes('tobacco'),
  };
}

/** Permit # logic: HHVC with 3+ units → use Location ID */
function getPermitNumber(complaint: Props['complaint'], location: Props['location'], packet: Props['packet']): string {
  const prog = (complaint?.assignedProgram ?? '').toLowerCase();
  const isHHVC = prog.includes('health') || prog.includes('housing') || prog.includes('vector');
  const units = location?.numberOfUnits ?? 0;
  if (isHHVC && units >= 3 && location?.id) {
    return location.id.slice(-8).toUpperCase();
  }
  return '';
}

export function PacketNoticeOfHearing({ packet, complaint, location, inspector, inspections }: Props) {
  const noticeDate = complaint?.noticeOfHearingDate ?? new Date().toISOString().split('T')[0];
  const address = complaint?.address ?? location?.address ?? '';
  const ownerName = location?.ownerName ?? '';
  const ownerEmail = location?.ownerEmail ?? '';
  const ownerAddress = location?.ownerAddress ?? '';
  const dba = location?.dba ?? '';
  const permitNum = getPermitNumber(complaint, location, packet);

  const rpName = complaint?.hearingRpName || ownerName;
  const rpEmail = complaint?.hearingRpEmail || ownerEmail;
  const rpAddress = complaint?.hearingRpAddress || ownerAddress;

  const prog = getProgramChecks(complaint?.assignedProgram, complaint?.category);
  const otherProg = prog.other ? (complaint?.assignedProgram ?? '') : '';

  const codeSections = [...new Set(
    inspections.flatMap(i => i.violations.map(v => v.violationCode).filter(Boolean))
  )];

  const hearingDateTime = [fmtDate(packet.hearing_date), packet.hearingTime].filter(Boolean).join(', ');

  return (
    <div className="packet-page print-page-break" style={{ fontFamily: 'Times New Roman, serif', fontSize: '11pt', lineHeight: 1.5 }}>

      {/* Multilingual translation notice box */}
      <div style={{ border: '1px solid black', padding: '6px 10px', marginBottom: '14px', fontSize: '9pt' }}>
        <p style={{ margin: '0 0 2px' }}>For a translation of this Notice, please call the inspector's phone number listed below.</p>
        <p style={{ margin: '0 0 2px' }}>Para una traducción de este aviso, por favor llame al número de teléfono del inspector que aparece a continuación.</p>
        <p style={{ margin: '0 0 2px' }}>欲索取本通知的翻譯本，請打下列電話號碼給檢查員。</p>
        <p style={{ margin: '0' }}>Kung gusto ninyo ng pagsasalin ng Abisong ito, mangyaring tawagan ang numero ng telepono ng inspektor na nakalista sa ibaba.</p>
      </div>

      <SFDPHReportHeader
        layout="seal-dept-left"
        showOfficials
        marginBottom="10px"
      />

      {/* Title */}
      <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13pt', margin: '0 0 16px', letterSpacing: '0.02em' }}>
        Notice of Hearing
      </p>

      {/* Fields */}
      <FieldLine label="Date:" value={fmtDate(noticeDate)} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11pt' }}>
        <div style={{ flex: 1, marginRight: '20px' }}>
          <strong>Address of Violation(s):</strong>{' '}
          <span style={{ borderBottom: '1px solid black', display: 'inline-block', minWidth: '200px', paddingBottom: '1px' }}>
            {address}
          </span>
        </div>
        <div>
          <strong>Permit #:</strong>{' '}
          <span style={{ borderBottom: '1px solid black', display: 'inline-block', minWidth: '100px', paddingBottom: '1px' }}>
            {permitNum}
          </span>
        </div>
      </div>
      <FieldLine label="DBA:" value={dba} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11pt' }}>
        <div style={{ flex: 1, marginRight: '20px' }}>
          <strong>Property/Business Owner Name:</strong>{' '}
          <span style={{ borderBottom: '1px solid black', display: 'inline-block', minWidth: '150px', paddingBottom: '1px' }}>
            {rpName}
          </span>
        </div>
        <div>
          <strong>Email:</strong>{' '}
          <span style={{ borderBottom: '1px solid black', display: 'inline-block', minWidth: '130px', paddingBottom: '1px' }}>
            {rpEmail}
          </span>
        </div>
      </div>
      <FieldLine label="Address:" value={rpAddress} />

      {/* Program type checkboxes */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', fontSize: '11pt', flexWrap: 'wrap' }}>
        <span><PrintCheckbox checked={prog.food} /> Food</span>
        <span><PrintCheckbox checked={prog.housing} /> Housing</span>
        <span><PrintCheckbox checked={prog.massage} /> Massage</span>
        <span><PrintCheckbox checked={prog.tobacco} /> Tobacco</span>
        <span><PrintCheckbox checked={prog.solidWaste} /> Solid Waste</span>
        <span>
          <PrintCheckbox checked={prog.other} /> Other:{' '}
          <span style={{ borderBottom: '1px solid black', display: 'inline-block', minWidth: '100px' }}>{otherProg}</span>
        </span>
      </div>

      {/* Order to appear */}
      <p style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '11pt' }}>
        You are hereby ordered to appear at a hearing for failure to comply with the following code section(s):
      </p>
      <div style={{ border: '1px solid black', padding: '8px 10px', marginBottom: '14px', minHeight: '36px', fontSize: '10pt' }}>
        {codeSections.length > 0 ? codeSections.join('; ') : ''}
      </div>

      {/* Hearing line */}
      <p style={{ fontWeight: 'bold', marginBottom: '14px', fontSize: '11pt' }}>
        The hearing will be held at 49 So. Van Ness Ave., Rm. 192/194, on the following date and time:{' '}
        <span style={{ borderBottom: '1px solid black', display: 'inline-block', minWidth: '160px', fontWeight: 'normal', paddingBottom: '1px' }}>
          {hearingDateTime}
        </span>
      </p>

      {/* Failure to appear */}
      <p style={{ marginBottom: '14px', fontSize: '11pt' }}>
        Failure to appear may result in one or more of the following: penalties, suspension or revocation of any Permit to Operate, SFDPH initiated refuse collection service, and/or a referral to the San Francisco City Attorney's Office for the above referenced site.
      </p>

      {/* Multilingual interpretation box */}
      <div style={{ border: '1px solid black', padding: '6px 10px', marginBottom: '14px', fontSize: '9pt' }}>
        <p style={{ margin: '0 0 2px' }}>If you would like interpretation services at the Hearing, please inform the Inspector below at least 4 business days before the Hearing.</p>
        <p style={{ margin: '0 0 2px' }}>Si usted desea servicios de interpretación en la audiencia, por favor informe al inspector que aparece a continuación por lo menos 4 días hábiles antes de la audiencia.</p>
        <p style={{ margin: '0 0 2px' }}>如果您需要在聽證會上得到口譯/傳譯服務，請在聽證會之前至少4個工作日通知下列檢查員。</p>
        <p style={{ margin: '0' }}>Kung gusto ninyo ng mga serbisyo ng interpretasyon sa Pagdinig, mangyaring ipagbigay-alam sa Inspektor na nakalista sa ibaba ng hindi bababa sa 4 araw ng negosyo bago ang Pagdinig.</p>
      </div>

      {/* Inspector block */}
      <p style={{ marginBottom: '4px', fontSize: '11pt' }}>
        <strong>Inspector/Investigator:</strong>{' '}
        <span style={{ borderBottom: '1px solid black', display: 'inline-block', minWidth: '200px', paddingBottom: '1px' }}>
          {inspector?.name ?? complaint?.assignedTo ?? ''}
        </span>
      </p>
      <p style={{ marginBottom: '14px', fontSize: '11pt' }}>
        <strong>Phone:</strong>{' '}
        <span style={{ borderBottom: '1px solid black', display: 'inline-block', minWidth: '100px', paddingBottom: '1px', marginRight: '16px' }}>&nbsp;</span>
        <strong>Email:</strong>{' '}
        <span style={{ borderBottom: '1px solid black', display: 'inline-block', minWidth: '160px', paddingBottom: '1px' }}>
          {inspector?.email ?? ''}
        </span>
      </p>

      {/* Director signature */}
      <div style={{ marginTop: 'auto' }}>
        <p style={{ margin: '0', fontSize: '11pt' }}>Daniel Tsai</p>
        <p style={{ margin: '0', fontSize: '11pt' }}>Director of Health</p>
      </div>

      <SFDPHReportFooter columns={2} containerStyle={{ marginTop: '10px' }} />

      <div className="page-number-slot" />
    </div>
  );
}
