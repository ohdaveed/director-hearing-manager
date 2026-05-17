/**
 * PacketServiceLog.tsx
 *
 * Pixel-perfect reproduction of the official SFDPH "Proof of Service" form.
 * Renders one page per service log entry; blank form if no entries exist.
 */


import { SFDPHReportHeader } from './SFDPHReportHeader';
import { fmtDate, PrintCheckbox, SFDPHReportFooter } from './printUtils';

type ServiceEntry = any['serviceLog'][0];
type Props = {
  serviceLog: any['serviceLog'];
  complaint: any['complaint'];
  location: any['location'];
  packet: any['packet'];
  inspector?: any['inspector'];
};

function BlankLine({ width = 220, value = '' }: { width?: number; value?: string }) {
  return (
    <span style={{
      borderBottom: '1px solid black',
      display: 'inline-block',
      minWidth: `${width}px`,
      paddingBottom: '1px',
    }}>
      {value || '\u00a0'}
    </span>
  );
}

function isMethodChecked(method: string | undefined, target: string): boolean {
  if (!method) return false;
  const m = method.toLowerCase();
  if (target === 'hand') return m.includes('personal') || m.includes('hand');
  if (target === 'postal') return m.includes('mail') || m.includes('postal') || m.includes('certified');
  if (target === 'posting') return m.includes('post');
  if (target === 'email') return m.includes('email') || m.includes('electronic');
  return false;
}

function ProofOfServicePage({
  entry,
  complaint,
  location,
  packet,
  inspector,
  hasViolations,
}: {
  entry: ServiceEntry | null;
  complaint: Props['complaint'];
  location: Props['location'];
  packet: Props['packet'];
  inspector?: Props['inspector'];
  hasViolations: boolean;
}) {
  const serverName = complaint?.assigned_to ?? inspector?.name ?? '';
  const serviceDate = fmtDate(entry?.serviceDate);
  const recipient = entry?.recipient ?? location?.owner_name ?? '';
  const recipientAddress = location?.owner_address ?? '';
  const method = entry?.serviceMethod ?? '';

  // Document checkboxes
  const hasHearingOrder = !!packet.hearingOrderData;
  const docNOV = hasViolations;
  const docHearing = true; // always included
  const docBrief = true;   // the packet itself is the brief
  const docOrder = hasHearingOrder;

  return (
    <div className="packet-page print-page-break" style={{ fontFamily: 'Times New Roman, serif', fontSize: '11pt', lineHeight: 1.6 }}>

      <SFDPHReportHeader
        layout="seal-dept-left"
        showOfficials
        marginBottom="14px"
      />

      {/* Title */}
      <p style={{ textAlign: 'center', fontWeight: 'bold', textDecoration: 'underline', fontSize: '13pt', letterSpacing: '0.1em', margin: '0 0 20px' }}>
        PROOF OF SERVICE
      </p>

      {/* Declaration preamble */}
      <p style={{ marginBottom: '14px', fontSize: '11pt' }}>
        I, <BlankLine width={200} value={serverName} />, declare as follows:
      </p>
      <p style={{ marginBottom: '14px', fontSize: '11pt' }}>
        I am a citizen of the United States, over the age of eighteen years and not a party to the above-entitled action. I am employed at the San Francisco Department of Public Health, Environmental Health Branch, 49 South Van Ness Avenue, Suite 600, San Francisco, CA 94103.
      </p>

      {/* Date served and documents */}
      <p style={{ marginBottom: '10px', fontSize: '11pt' }}>
        On <BlankLine width={120} value={serviceDate} /> I served the following document(s):
      </p>

      {/* Document checkboxes — two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px', marginBottom: '14px', fontSize: '11pt' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}><PrintCheckbox checked={docNOV} /> Notice of Violation</div>
        <div style={{ display: 'flex', alignItems: 'center' }}><PrintCheckbox checked={docBrief} /> SFDPH Hearing Brief</div>
        <div style={{ display: 'flex', alignItems: 'center' }}><PrintCheckbox checked={docHearing} /> Notice of Hearing</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <PrintCheckbox checked={false} /> Other:{' '}
          <span style={{ borderBottom: '1px solid black', display: 'inline-block', minWidth: '120px', marginLeft: '4px' }}>&nbsp;</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}><PrintCheckbox checked={docOrder} /> Director's Hearing Order</div>
      </div>

      {/* Recipients */}
      <p style={{ marginBottom: '4px', fontSize: '11pt' }}>on the following persons at the locations specified:</p>
      <div style={{ borderBottom: '1px solid black', minHeight: '24px', marginBottom: '4px', paddingBottom: '2px' }}>
        {recipient}
      </div>
      <div style={{ borderBottom: '1px solid black', minHeight: '24px', marginBottom: '4px', paddingBottom: '2px' }}>
        {recipientAddress}
      </div>
      <div style={{ borderBottom: '1px solid black', minHeight: '24px', marginBottom: '14px' }}>&nbsp;</div>

      {/* Manner of service */}
      <p style={{ marginBottom: '10px', fontSize: '11pt' }}>in the manner indicated below:</p>

      {/* Hand Delivery */}
      <div style={{ marginBottom: '12px', fontSize: '11pt' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <PrintCheckbox checked={isMethodChecked(method, 'hand')} />
          <span>
            <strong>HAND DELIVERY:</strong> I handed the documents to the person whose name and signature are:
          </span>
        </div>
        <div style={{ paddingLeft: '20px', marginTop: '6px', display: 'flex', gap: '24px' }}>
          <span>Recipient Name <BlankLine width={150} /></span>
          <span>Signature <BlankLine width={150} /></span>
        </div>
      </div>

      {/* US Postal Service */}
      <div style={{ marginBottom: '12px', fontSize: '11pt', display: 'flex', alignItems: 'center' }}>
        <PrintCheckbox checked={isMethodChecked(method, 'postal')} />
        <strong>BY U.S. POSTAL SERVICE</strong>
      </div>

      {/* By Posting */}
      <div style={{ marginBottom: '12px', fontSize: '11pt' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <PrintCheckbox checked={isMethodChecked(method, 'posting')} />
          <span>
            <strong>BY POSTING:</strong> I posted the document(s) in a conspicuous place on the building, structure or property
          </span>
        </div>
        <div style={{ borderBottom: '1px solid black', minHeight: '24px', marginTop: '6px', marginLeft: '20px' }}>&nbsp;</div>
      </div>

      {/* Electronic Mail */}
      <div style={{ marginBottom: '20px', fontSize: '11pt' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <PrintCheckbox checked={isMethodChecked(method, 'email')} />
          <span>
            <strong>BY ELECTRONIC MAIL:</strong> Based on an agreement of the parties to accept electronic service, I caused the documents to be sent to the person(s) at the electronic service address(es) listed above. Such document(s) were transmitted <em>via</em> electronic mail in portable document format ("PDF") Adobe Acrobat from the electronic address:{' '}
            <BlankLine width={200} value={isMethodChecked(method, 'email') ? (complaint?.hearingRpEmail ?? location?.owner_email ?? '') : ''} />
          </span>
        </div>
      </div>

      {/* Perjury declaration */}
      <p style={{ marginBottom: '14px', fontSize: '11pt' }}>
        I declare under penalty of perjury pursuant to the laws of the State of California that the foregoing is true and correct.
      </p>

      {/* Execution line */}
      <p style={{ marginBottom: '20px', fontSize: '11pt' }}>
        Executed <BlankLine width={120} /> at San Francisco, California.
      </p>

      {/* Signature line */}
      <div style={{ borderBottom: '1px solid black', width: '220px', minHeight: '24px' }}>&nbsp;</div>

      <SFDPHReportFooter columns={2} containerStyle={{ marginTop: 'auto' }} />

      <div className="page-number-slot" />
    </div>
  );
}

export function PacketServiceLog({ serviceLog, complaint, location, packet, inspector }: Props) {
  const hasViolations = true; // NOV is always included when there are violations in the packet

  if (serviceLog.length === 0) {
    return (
      <ProofOfServicePage
        entry={null}
        complaint={complaint}
        location={location}
        packet={packet}
        inspector={inspector}
        hasViolations={hasViolations}
      />
    );
  }

  return (
    <>
      {serviceLog.map(entry => (
        <ProofOfServicePage
          key={entry.id}
          entry={entry}
          complaint={complaint}
          location={location}
          packet={packet}
          inspector={inspector}
          hasViolations={hasViolations}
        />
      ))}
    </>
  );
}
