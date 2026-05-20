/**
 * PacketHearingOrder.tsx
 *
 * Renders the Director's Hearing Order page — attendance, findings, determinations,
 * permit decisions, nuisance conditions, and the signature block.
 */

import { formatDateBlank } from "@/utils/formatDate";

export type HearingOrderData = {
  attendees: { name: string; role: string; attended: boolean }[];
  determinations: {
    codeSection: string;
    determination: "upheld" | "dismissed" | "modified";
    notes: string;
  }[];
  permitNumber: string;
  permitDecision: string;
  reinspectionFee: string;
  nuisanceAbatementConditions: string;
  costRecovery: string;
  appealNotes: string;
  orderDate: string;
  hearingOfficer: string;
};

type Props = {
  packet: any;
  complaint: any;
  location: any;
  inspections: any;
  orderData: HearingOrderData;
};

/** Long date with blank fallback for legal form fields */
const fmt = formatDateBlank;

const BOX: React.CSSProperties = {
  border: "1px solid black",
  padding: "8px 12px",
  marginBottom: "12px",
};
const LABEL: React.CSSProperties = {
  fontSize: "9pt",
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: "4px",
};
const UNDERLINE: React.CSSProperties = {
  borderBottom: "1px solid black",
  minHeight: "22px",
  marginBottom: "4px",
  paddingBottom: "2px",
};

export function PacketHearingOrder({ packet, complaint, location, inspections, orderData }: Props) {
  const codeSections = [
    ...new Set(
      inspections.flatMap((i: any) =>
        i.violations.map((v: any) => v.violationCode).filter(Boolean),
      ),
    ),
  ];

  const rpName = complaint?.hearingRpName || location?.owner_name || "";
  const rpAddr = complaint?.hearingRpAddress || location?.owner_address || "";

  const orderDate = orderData.orderDate || complaint?.hearingOrderDate || packet.hearing_date || "";

  return (
    <div
      className="packet-page print-page-break"
      style={{
        fontFamily: "Times New Roman, serif",
        fontSize: "11pt",
        lineHeight: 1.5,
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "20px",
          borderBottom: "2px solid black",
          paddingBottom: "12px",
        }}
      >
        <p
          style={{
            fontSize: "10pt",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          City and County of San Francisco — Department of Public Health
        </p>
        <h2
          style={{
            fontSize: "15pt",
            fontWeight: "black",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            margin: "10px 0 4px",
          }}
        >
          Director's Hearing Order
        </h2>
        <p style={{ fontSize: "10pt", color: "#444" }}>
          {complaint?.assignedProgram ?? packet.program_code ?? "Environmental Health"} Program
          &nbsp;|&nbsp; Case No.: {packet.case_number ?? "_______________"}
        </p>
      </div>

      {/* Case identifiers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px 24px",
          marginBottom: "16px",
        }}
      >
        <div>
          <span style={LABEL as React.CSSProperties}>Hearing Date: </span>
          {fmt(packet.hearing_date)}
        </div>
        <div>
          <span style={LABEL as React.CSSProperties}>Order Date: </span>
          {fmt(orderDate)}
        </div>
        <div>
          <span style={LABEL as React.CSSProperties}>Complaint ID: </span>
          {complaint?.complaintid ?? "___"}
        </div>
        <div>
          <span style={LABEL as React.CSSProperties}>Program Code: </span>
          {packet.program_code ?? "___"}
        </div>
      </div>

      {/* Property / Parties */}
      <div style={BOX}>
        <p style={LABEL}>Property &amp; Parties</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px 24px",
          }}
        >
          <div>
            <p style={{ fontSize: "9pt", margin: "0 0 2px", fontWeight: "bold" }}>
              Address of Violation
            </p>
            <div style={UNDERLINE}>{complaint?.address ?? location?.address ?? ""}</div>
          </div>
          <div>
            <p style={{ fontSize: "9pt", margin: "0 0 2px", fontWeight: "bold" }}>Block / Lot</p>
            <div style={UNDERLINE}>{location?.block_lot ?? ""}</div>
          </div>
          <div>
            <p style={{ fontSize: "9pt", margin: "0 0 2px", fontWeight: "bold" }}>
              Facility Name (DBA)
            </p>
            <div style={UNDERLINE}>{location?.dba ?? ""}</div>
          </div>
          <div>
            <p style={{ fontSize: "9pt", margin: "0 0 2px", fontWeight: "bold" }}>Facility Type</p>
            <div style={UNDERLINE}>{location?.facility_type ?? ""}</div>
          </div>
          <div>
            <p style={{ fontSize: "9pt", margin: "0 0 2px", fontWeight: "bold" }}>Property Owner</p>
            <div style={UNDERLINE}>{location?.owner_name ?? ""}</div>
          </div>
          <div>
            <p style={{ fontSize: "9pt", margin: "0 0 2px", fontWeight: "bold" }}>Owner Address</p>
            <div style={UNDERLINE}>{location?.owner_address ?? ""}</div>
          </div>
          {rpName !== location?.owner_name && (
            <>
              <div>
                <p
                  style={{
                    fontSize: "9pt",
                    margin: "0 0 2px",
                    fontWeight: "bold",
                  }}
                >
                  Responsible Party
                </p>
                <div style={UNDERLINE}>{rpName}</div>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "9pt",
                    margin: "0 0 2px",
                    fontWeight: "bold",
                  }}
                >
                  RP Address
                </p>
                <div style={UNDERLINE}>{rpAddr}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Attendance */}
      <div style={BOX}>
        <p style={LABEL}>Hearing Attendance</p>
        {orderData.attendees.length > 0 ? (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "10pt",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid black" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "2px 8px",
                    fontSize: "9pt",
                    textTransform: "uppercase",
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "2px 8px",
                    fontSize: "9pt",
                    textTransform: "uppercase",
                  }}
                >
                  Role
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "2px 8px",
                    fontSize: "9pt",
                    textTransform: "uppercase",
                  }}
                >
                  Attended
                </th>
              </tr>
            </thead>
            <tbody>
              {orderData.attendees.map((a, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "4px 8px" }}>{a.name || "—"}</td>
                  <td style={{ padding: "4px 8px" }}>{a.role || "—"}</td>
                  <td
                    style={{
                      padding: "4px 8px",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {a.attended ? "☑ Yes" : "☐ No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: "#777", fontSize: "10pt" }}>No attendance recorded.</p>
        )}
      </div>

      {/* Code sections & determinations */}
      <div style={BOX}>
        <p style={LABEL}>Hearing Officer Findings and Determinations</p>
        {orderData.determinations.length > 0 ? (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "10pt",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid black" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "2px 8px",
                    fontSize: "9pt",
                    textTransform: "uppercase",
                    width: "140px",
                  }}
                >
                  Code Section
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "2px 8px",
                    fontSize: "9pt",
                    textTransform: "uppercase",
                    width: "120px",
                  }}
                >
                  Determination
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "2px 8px",
                    fontSize: "9pt",
                    textTransform: "uppercase",
                  }}
                >
                  Notes / Conditions
                </th>
              </tr>
            </thead>
            <tbody>
              {orderData.determinations.map((d, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid #ddd",
                    verticalAlign: "top",
                  }}
                >
                  <td
                    style={{
                      padding: "5px 8px",
                      fontFamily: "monospace",
                      fontSize: "10pt",
                    }}
                  >
                    {d.codeSection || String(codeSections[i] ?? "") || "—"}
                  </td>
                  <td
                    style={{
                      padding: "5px 8px",
                      fontWeight: "bold",
                      fontSize: "10pt",
                      textTransform: "capitalize",
                    }}
                  >
                    {d.determination}
                  </td>
                  <td style={{ padding: "5px 8px", fontSize: "10pt" }}>{d.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : codeSections.length > 0 ? (
          <div>
            {codeSections.map((cs: any, i: number) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "16px",
                  borderBottom: "1px solid #ddd",
                  padding: "5px 0",
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    width: "140px",
                    flexShrink: 0,
                  }}
                >
                  {cs}
                </span>
                <span style={{ borderBottom: "1px solid black", flex: 1 }} />
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#777" }}>No determinations recorded.</p>
        )}
      </div>

      {/* Permit / Fee / Conditions */}
      {(orderData.permitNumber || orderData.permitDecision || orderData.reinspectionFee) && (
        <div style={BOX}>
          <p style={LABEL}>Permit &amp; Fee Decisions</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px 24px",
            }}
          >
            {orderData.permitNumber && (
              <div>
                <p
                  style={{
                    fontSize: "9pt",
                    margin: "0 0 2px",
                    fontWeight: "bold",
                  }}
                >
                  Permit Number
                </p>
                <div style={UNDERLINE}>{orderData.permitNumber}</div>
              </div>
            )}
            {orderData.permitDecision && (
              <div>
                <p
                  style={{
                    fontSize: "9pt",
                    margin: "0 0 2px",
                    fontWeight: "bold",
                  }}
                >
                  Permit Decision
                </p>
                <div style={UNDERLINE}>{orderData.permitDecision}</div>
              </div>
            )}
            {orderData.reinspectionFee && (
              <div>
                <p
                  style={{
                    fontSize: "9pt",
                    margin: "0 0 2px",
                    fontWeight: "bold",
                  }}
                >
                  Reinspection Fee
                </p>
                <div style={UNDERLINE}>{orderData.reinspectionFee}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nuisance abatement conditions */}
      {orderData.nuisanceAbatementConditions && (
        <div style={BOX}>
          <p style={LABEL}>Nuisance Abatement Conditions</p>
          <p style={{ fontSize: "10.5pt", whiteSpace: "pre-wrap" }}>
            {orderData.nuisanceAbatementConditions}
          </p>
        </div>
      )}

      {/* Cost recovery */}
      {orderData.costRecovery && (
        <div style={BOX}>
          <p style={LABEL}>Cost Recovery</p>
          <p style={{ fontSize: "10.5pt", whiteSpace: "pre-wrap" }}>{orderData.costRecovery}</p>
        </div>
      )}

      {/* Appeal process */}
      <div style={BOX}>
        <p style={LABEL}>Appeal Process</p>
        <p style={{ fontSize: "10pt" }}>
          {orderData.appealNotes ||
            "Any person aggrieved by this Order may appeal to the Department of Public Health within 30 days of the date of this Order. " +
              "Appeals must be filed in writing with the Director of Health at 101 Grove Street, Room 308, San Francisco, CA 94102."}
        </p>
      </div>

      {/* Signature block */}
      <div
        style={{
          marginTop: "28px",
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
        }}
      >
        <div>
          <div
            style={{
              borderBottom: "1px solid black",
              minHeight: "32px",
              marginBottom: "4px",
            }}
          >
            <span>{orderData.hearingOfficer}</span>
          </div>
          <p style={{ fontSize: "9pt" }}>Hearing Officer — Environmental Health Branch, SFDPH</p>
        </div>
        <div>
          <div
            style={{
              borderBottom: "1px solid black",
              minHeight: "32px",
              marginBottom: "4px",
            }}
          >
            <span>{fmt(orderDate)}</span>
          </div>
          <p style={{ fontSize: "9pt" }}>Date</p>
        </div>
      </div>
      <div className="page-number-slot" />
    </div>
  );
}
