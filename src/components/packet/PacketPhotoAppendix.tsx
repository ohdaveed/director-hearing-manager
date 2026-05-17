/**
 * PacketPhotoAppendix.tsx
 *
 * Refactored to strictly one-photo-per-page layout with metadata table
 * and exhibit label as per SOP requirements.
 */

import { ExhibitLabel, fmtDate } from "./printUtils";

type Photo = any;
type Inspection = any;

type Props = {
  inspection: Inspection;
  index: number;
  complaint: any;
  packet: any;
  globalPhotoOffset: number;
  exhibitLetter?: string;
  allPhotosForInspection?: Photo[];
  exhibitPhotoIds?: string[];
};

/** Single full-page photo with metadata block per SOP */
function PhotoPage({
  photo,
  inspection,
  complaint,
  exhibitLetter,
}: {
  photo: Photo;
  inspection: Inspection;
  complaint: any;
  exhibitLetter?: string;
}) {
  // Use uploaded_at if available, fallback to inspection_date.
  // We take the first 10 characters (YYYY-MM-DD) to ensure compatibility with fmtDate's T00:00:00 hack.
  const dateStr = (
    photo.uploaded_at ||
    inspection.inspection_date ||
    ""
  ).substring(0, 10);

  return (
    <div className="packet-page print-page relative min-h-[10.5in] flex flex-col pt-12 px-8">
      <ExhibitLabel letter={exhibitLetter} />

      <div className="flex-grow flex items-center justify-center mb-8">
        {photo.photo_url ? (
          <img
            src={photo.photo_url}
            alt={photo.caption ?? "Inspection Photo"}
            className="max-w-full max-h-[6.5in] object-contain border border-gray-400 shadow-sm"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 h-[5in]">
            <span className="text-4xl mb-2">📷</span>
            <span>Photo not available</span>
          </div>
        )}
      </div>

      <table className="w-full border-collapse border border-black text-[10.5pt] mb-8">
        <tbody>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-50 w-1/4 text-right">
              Date / Time
            </td>
            <td className="border border-black p-2 w-3/4">
              {fmtDate(dateStr)}
            </td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-50 text-right">
              Inspector
            </td>
            <td className="border border-black p-2">
              {inspection.inspector ?? "—"}
            </td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-50 text-right">
              Address
            </td>
            <td className="border border-black p-2">
              {complaint?.address ?? inspection.facilityAddress ?? "—"}
            </td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-50 text-right">
              Violation
            </td>
            <td className="border border-black p-2">
              {photo.violation_label ?? "—"}
            </td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-50 text-right">
              Description
            </td>
            <td className="border border-black p-2">{photo.caption ?? "—"}</td>
          </tr>
        </tbody>
      </table>
      <div className="page-number-slot" />
    </div>
  );
}

export function PacketPhotoAppendix({
  inspection,
  complaint,
  exhibitLetter,
  allPhotosForInspection,
}: Props) {
  const sourcePhotos = allPhotosForInspection ?? inspection.photos ?? [];

  if (sourcePhotos.length === 0) return null;

  return (
    <>
      {sourcePhotos.map((photo: any) => (
        <PhotoPage
          key={photo.id}
          photo={photo}
          inspection={inspection}
          complaint={complaint}
          exhibitLetter={exhibitLetter}
        />
      ))}
    </>
  );
}
