/**
 * PacketPhotoAppendix.tsx
 *
 * Renders photo pages for a single inspection:
 * - "Exhibit" photos (selected via selectedPhotoIDs) are rendered one-per-page
 *   with a full metadata block and the red exhibit label.
 * - Non-exhibit photos are rendered in the existing 2×2 grid layout.
 *
 * globalPhotoOffset allows sequential photo numbering across multiple inspections.
 */

import { GetHearingPacketDataOutputType } from 'zite-endpoints-sdk';
import { formatDateShort } from '@/utils/formatDate';

type Photo = GetHearingPacketDataOutputType['allPhotos'][0];
type Inspection = GetHearingPacketDataOutputType['inspections'][0];

type Props = {
  inspection: Inspection;
  index: number;
  complaint: GetHearingPacketDataOutputType['complaint'];
  packet: GetHearingPacketDataOutputType['packet'];
  globalPhotoOffset: number;
  exhibitLetter?: string;
  allPhotosForInspection?: Photo[];
  exhibitPhotoIds?: string[];
};

const fmt = formatDateShort;

/** Single full-page photo with metadata block */
function ExhibitPhotoPage({
  photo,
  inspection,
  complaint,
  packet,
  exhibitLetter,
  photoNumber,
}: {
  photo: Photo;
  inspection: Inspection;
  complaint: Props['complaint'];
  packet: Props['packet'];
  exhibitLetter?: string;
  photoNumber: number;
}) {
  return (
    <div className="packet-page print-page-break" style={{ fontFamily: 'Times New Roman, serif', display: 'flex', flexDirection: 'column' }}>
      {/* Page header with exhibit label */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '8.5pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            City and County of San Francisco — Department of Public Health
          </p>
          <p style={{ fontSize: '11pt', fontWeight: '900', textTransform: 'uppercase', margin: '3px 0 2px' }}>
            {exhibitLetter ? `Exhibit ${exhibitLetter} — ` : ''}Inspection Photo #{photoNumber}
          </p>
          <p style={{ fontSize: '8.5pt', color: '#555', margin: 0 }}>
            {fmt(inspection.inspectionDate)} | Inspector: {inspection.inspector ?? '—'} | Case: {packet.caseNumber ?? '—'}
          </p>
        </div>
        {exhibitLetter && (
          <p style={{ fontSize: '18pt', fontWeight: '900', color: '#dc2626', lineHeight: 1, margin: 0, flexShrink: 0, marginLeft: '16px' }}>
            Exhibit {exhibitLetter}
          </p>
        )}
      </div>

      {/* Full-width photo */}
      <div style={{ flex: 1, border: '1px solid black', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f4', minHeight: '5in', maxHeight: '7in', marginBottom: '12px' }}>
        {photo.photoUrl ? (
          <img
            src={photo.photoUrl}
            alt={photo.caption ?? `Photo ${photoNumber}`}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
          />
        ) : (
          <div style={{ color: '#aaa', textAlign: 'center', fontSize: '10pt' }}>
            <div style={{ fontSize: '24pt', marginBottom: '8px' }}>📷</div>
            Photo not available
          </div>
        )}
      </div>

      {/* Metadata block */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid black', padding: '4px 6px', width: '50%' }}>
              <strong>Date / Time:</strong>{' '}
              {photo.uploadedAt
                ? new Date(photo.uploadedAt).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                : fmt(inspection.inspectionDate)}
            </td>
            <td style={{ border: '1px solid black', padding: '4px 6px', width: '50%' }}>
              <strong>Inspector:</strong> {inspection.inspector ?? '—'}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid black', padding: '4px 6px' }}>
              <strong>Address:</strong> {complaint?.address ?? inspection.facilityAddress ?? '—'}
            </td>
            <td style={{ border: '1px solid black', padding: '4px 6px' }}>
              <strong>Violation:</strong> {photo.violationLabel ?? '—'}
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '1px solid black', padding: '4px 6px' }}>
              <strong>Description:</strong> {photo.caption ?? '—'}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="page-number-slot" />
    </div>
  );
}

export function PacketPhotoAppendix({
  inspection,
  index,
  complaint,
  packet,
  globalPhotoOffset,
  exhibitLetter,
  allPhotosForInspection,
  exhibitPhotoIds = [],
}: Props) {
  // Determine exhibit vs regular photos
  const sourcePhotos = allPhotosForInspection ?? inspection.photos;
  const hasExhibitSelection = exhibitPhotoIds.length > 0;

  const exhibitPhotos = hasExhibitSelection
    ? sourcePhotos.filter(p => exhibitPhotoIds.includes(p.id))
    : [];
  const regularPhotos = hasExhibitSelection
    ? sourcePhotos.filter(p => !exhibitPhotoIds.includes(p.id))
    : sourcePhotos;

  if (sourcePhotos.length === 0) return null;

  // Group regular photos into 2×2 pages
  const PHOTOS_PER_PAGE = 4;
  const regularPages: Photo[][] = [];
  for (let i = 0; i < regularPhotos.length; i += PHOTOS_PER_PAGE) {
    regularPages.push(regularPhotos.slice(i, i + PHOTOS_PER_PAGE));
  }

  return (
    <>
      {/* Exhibit photos — one per page */}
      {exhibitPhotos.map((photo, ei) => (
        <ExhibitPhotoPage
          key={photo.id}
          photo={photo}
          inspection={inspection}
          complaint={complaint}
          packet={packet}
          exhibitLetter={exhibitLetter}
          photoNumber={globalPhotoOffset + ei + 1}
        />
      ))}

      {/* Regular photos — 2×2 grid */}
      {regularPages.map((pagePhotos, pageIdx) => {
        const pagePhotoOffset = globalPhotoOffset + exhibitPhotos.length + pageIdx * PHOTOS_PER_PAGE;
        return (
          <div key={`reg-${pageIdx}`} className="packet-page print-page-break">
            <div className="text-center mb-4">
              <p className="text-xs font-bold uppercase tracking-widest">
                City and County of San Francisco — Department of Public Health
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <h2 className="text-base font-black uppercase tracking-wider mt-1">
                  Photo Appendix — Inspection #{index + 1}
                  {regularPages.length > 1 ? ` (Page ${pageIdx + 1} of ${regularPages.length})` : ''}
                </h2>
                {exhibitLetter && (
                  <p style={{ fontSize: '16pt', fontWeight: '900', color: '#dc2626', lineHeight: 1, margin: '4px 0 0' }}>
                    Exhibit {exhibitLetter}
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-600">
                {fmt(inspection.inspectionDate)} | Inspector: {inspection.inspector ?? '—'} |
                Case: {packet.caseNumber ?? '—'} | Complaint: {complaint?.complaintId ?? '—'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
              {pagePhotos.map((photo, pi) => (
                <div
                  key={photo.id}
                  className="photo-card border border-black"
                  style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                >
                  <div style={{ height: '3.2in', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f4' }}>
                    {photo.photoUrl ? (
                      <img
                        src={photo.photoUrl}
                        alt={photo.caption ?? `Photo ${pagePhotoOffset + pi + 1}`}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                      />
                    ) : (
                      <div className="text-gray-400 text-xs text-center p-4">
                        <div className="text-2xl mb-1">📷</div>
                        Photo not available
                      </div>
                    )}
                  </div>
                  <div className="text-xs px-2 py-1.5 border-t border-black">
                    <span className="font-bold">Photo {pagePhotoOffset + pi + 1}.</span>{' '}
                    {photo.caption ?? '—'}
                    {photo.violationLabel && (
                      <span className="text-gray-500"> [{photo.violationLabel}]</span>
                    )}
                    {photo.photoType && (
                      <span className="ml-1 text-gray-400">({photo.photoType})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="page-number-slot" />
          </div>
        );
      })}
    </>
  );
}
