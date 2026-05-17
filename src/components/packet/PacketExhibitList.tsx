/**
 * PacketExhibitList.tsx
 *
 * Renders the exhibit index page listing all exhibits in the hearing packet
 * with their labels, dates, types, and descriptions.
 */

import { formatDateShort } from "@/utils/formatDate";

type Props = {
  exhibits: any;
  packet: any;
  complaint: any;
};

/** MM/DD/YYYY format; empty string fallback (cell stays blank, not "—") */
function fmt(d?: string): string {
  if (!d) return "";
  return formatDateShort(d);
}

export function PacketExhibitList({ exhibits, packet, complaint }: Props) {
  if (exhibits.length === 0) return null;

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
            fontSize: "14pt",
            fontWeight: "black",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            margin: "10px 0 4px",
          }}
        >
          Exhibit List — Director's Hearing Packet
        </h2>
        <p style={{ fontSize: "10pt", color: "#444" }}>
          Case No.: {packet.case_number ?? "_______________"} &nbsp;|&nbsp;{" "}
          {complaint?.address ?? ""}
        </p>
        {complaint?.complaintid && (
          <p style={{ fontSize: "10pt", color: "#444" }}>
            Complaint ID: {complaint.complaintid}
          </p>
        )}
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "10.5pt",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid black" }}>
            <th
              style={{
                textAlign: "left",
                padding: "4px 8px",
                width: "80px",
                fontWeight: "bold",
                fontSize: "9pt",
                textTransform: "uppercase",
              }}
            >
              Exhibit
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "4px 8px",
                width: "100px",
                fontWeight: "bold",
                fontSize: "9pt",
                textTransform: "uppercase",
              }}
            >
              Date
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "4px 8px",
                width: "120px",
                fontWeight: "bold",
                fontSize: "9pt",
                textTransform: "uppercase",
              }}
            >
              Type
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "4px 8px",
                fontWeight: "bold",
                fontSize: "9pt",
                textTransform: "uppercase",
              }}
            >
              Description
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "4px 8px",
                width: "80px",
                fontWeight: "bold",
                fontSize: "9pt",
                textTransform: "uppercase",
              }}
            >
              Pages
            </th>
          </tr>
        </thead>
        <tbody>
          {exhibits.map((ex: any, idx: number) => (
            <tr
              key={ex.id}
              style={{ borderBottom: "1px solid #ccc", verticalAlign: "top" }}
            >
              <td
                style={{
                  padding: "6px 8px",
                  fontWeight: "bold",
                  fontSize: "11pt",
                }}
              >
                Exhibit {ex.exhibitLetter ?? String.fromCharCode(65 + idx)}
              </td>
              <td
                style={{
                  padding: "6px 8px",
                  fontSize: "10pt",
                  whiteSpace: "nowrap",
                }}
              >
                {fmt(ex.exhibitDate)}
              </td>
              <td style={{ padding: "6px 8px", fontSize: "10pt" }}>
                {ex.exhibitType ?? ex.category ?? ""}
              </td>
              <td style={{ padding: "6px 8px", fontSize: "10pt" }}>
                <p style={{ margin: 0 }}>
                  {ex.description || ex.caption || ex.exhibit_label || "—"}
                </p>
              </td>
              <td
                style={{ padding: "6px 8px", fontSize: "10pt", color: "#777" }}
              >
                {/* Page ref populated after packet finalized */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "24px", fontSize: "9pt", color: "#555" }}>
        <p>
          * Exhibits are labeled sequentially in the order they appear in this
          packet. Exhibit page references will be populated upon final packet
          generation.
        </p>
      </div>
      <div className="page-number-slot" />
    </div>
  );
}
