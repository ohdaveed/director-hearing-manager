import { PhotoEntry } from "./PhotoCard";

const TYPE_ORDER = ["Violation", "Abatement", "Memo of Visit", "General"];

const TYPE_BADGE: Record<string, string> = {
  Violation: "background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5",
  Abatement: "background:#dcfce7;color:#15803d;border:1px solid #86efac",
  "Memo of Visit": "background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd",
  General: "background:#f3f4f6;color:#374151;border:1px solid #d1d5db",
};

type Props = {
  photos: PhotoEntry[];
  address: string;
  inspectionDate: string;
  complaintId: string;
};

export default function PhotoPrintSection({
  photos,
  address,
  inspectionDate,
  complaintId,
}: Props) {
  const uploaded = photos.filter((p) => p.uploadedUrl);
  if (uploaded.length === 0) return null;

  // Sort by type order
  const sorted = [...uploaded].sort((a, b) => {
    return TYPE_ORDER.indexOf(a.photoType) - TYPE_ORDER.indexOf(b.photoType);
  });

  // Chunk into pages of 3
  const pages: PhotoEntry[][] = [];
  for (let i = 0; i < sorted.length; i += 3) {
    pages.push(sorted.slice(i, i + 3));
  }

  const headerText = [
    address,
    inspectionDate,
    complaintId ? `Complaint #${complaintId}` : "",
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div className="print-photo-section">
      {pages.map((page, pi) => (
        <div
          key={pi}
          className="print-page"
          style={{
            pageBreakBefore: pi === 0 ? "always" : "always",
            padding: "24px",
          }}
        >
          {/* Page Header */}
          <div
            style={{
              borderBottom: "2px solid #1d4ed8",
              paddingBottom: "8px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#1d4ed8",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Photo Documentation
            </div>
            <div
              style={{ fontSize: "12px", color: "#374151", marginTop: "2px" }}
            >
              {headerText}
            </div>
            <div
              style={{ fontSize: "10px", color: "#6b7280", marginTop: "1px" }}
            >
              Page {pi + 1} of {pages.length} (Photos {pi * 3 + 1}–
              {Math.min((pi + 1) * 3, sorted.length)} of {sorted.length})
            </div>
          </div>

          {/* 3 photos stacked vertically */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {page.map((photo, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                }}
              >
                <img
                  src={photo.uploadedUrl}
                  alt={photo.caption || "Inspection photo"}
                  style={{
                    width: "280px",
                    height: "210px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, paddingTop: "4px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      ...parseStyle(TYPE_BADGE[photo.photoType]),
                    }}
                  >
                    {photo.photoType}
                  </span>
                  {photo.violationLabel && (
                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      {photo.violationLabel}
                    </div>
                  )}
                  {photo.caption && (
                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "12px",
                        color: "#374151",
                      }}
                    >
                      {photo.caption}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function parseStyle(styleStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  styleStr.split(";").forEach((part) => {
    const [key, value] = part.split(":");
    if (key && value) {
      const camel = key.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      result[camel] = value.trim();
    }
  });
  return result;
}
