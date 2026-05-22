/**
 * printUtils.tsx
 *
 * Shared print utilities for SFDPH hearing-packet documents.
 * Centralises the SF Seal URL, date formatter, checkbox widget,
 * and footer so every packet component pulls from a single source.
 */

import type { CSSProperties } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { STATIC_BLOCKS } from "../../config/documentTemplates";

// ─── PDF Generation ──────────────────────────────────────────────────────────

/**
 * Generates a multi-page PDF Blob from an HTML element.
 * @param elementId The ID of the HTML element to capture.
 * @returns A Promise that resolves to a PDF Blob.
 */
export async function elementToPdfBlob(elementId: string): Promise<Blob> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const imgWidth = 190;
  const pageHeight = 277;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF("p", "mm", "a4");
  let heightLeft = imgHeight;
  let position = 10;

  pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 10;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  return pdf.output("blob");
}

// ─── Official seal ────────────────────────────────────────────────────────────

export const SF_SEAL_URL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Seal_of_San_Francisco%2C_California.svg/240px-Seal_of_San_Francisco%2C_California.svg.png";

// ─── Locked office contact (sourced from config) ─────────────────────────────
const { officeAddressShort, officeCity, officePhone, officeFax, officeVoicemail } =
  STATIC_BLOCKS.common;

// ─── Date formatter ───────────────────────────────────────────────────────────

/** Format an ISO date string (YYYY-MM-DD) as MM/DD/YYYY. */
export function fmtDate(d: string | undefined): string {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

// ─── Checkbox widget ──────────────────────────────────────────────────────────

/** 11×11 px bordered checkbox used on print forms. */
export function PrintCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: "11px",
        height: "11px",
        border: "1px solid black",
        verticalAlign: "middle",
        marginRight: "4px",
        textAlign: "center",
        lineHeight: "11px",
        fontSize: "9pt",
        flexShrink: 0,
      }}
    >
      {checked ? "✓" : ""}
    </span>
  );
}

// ─── Exhibit Label ───────────────────────────────────────────────────────────

/** Red exhibit label positioned at the top-right of a page/section. */
export function ExhibitLabel({ letter, className = "" }: { letter?: string; className?: string }) {
  if (!letter) return null;
  return (
    <div
      className={`absolute top-0 right-0 exhibit-label-red ${className}`}
      data-testid={`exhibit-label-${letter.toLowerCase()}`}
    >
      Exhibit {letter}
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

/**
 * SFDPH office footer line used at the bottom of print pages.
 *
 * - columns=1 : centered single-line paragraph (no border)
 * - columns=2 : address left | phone right, with top border
 * - columns=3 : programName left | address center | phone+fax right, with top border
 *
 * Pass `containerStyle` to override margin/padding (e.g. marginTop: 'auto').
 */
export function SFDPHReportFooter({
  columns = 1,
  programName,
  containerStyle,
}: {
  columns?: 1 | 2 | 3;
  programName?: string;
  containerStyle?: CSSProperties;
}) {
  if (columns === 3) {
    return (
      <div
        style={{
          marginTop: "8px",
          borderTop: "1px solid black",
          paddingTop: "4px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          fontSize: "8pt",
          fontFamily: "Times New Roman, serif",
          ...containerStyle,
        }}
      >
        <div>
          <strong>{programName ?? ""}</strong>
          <br />
          Voice mail {officeVoicemail}
        </div>
        <div style={{ textAlign: "center" }}>
          {officeAddressShort}
          <br />
          {officeCity}
        </div>
        <div style={{ textAlign: "right" }}>
          Phone {officePhone}
          <br />
          Fax {officeFax}
        </div>
      </div>
    );
  }

  if (columns === 2) {
    return (
      <div
        style={{
          borderTop: "1px solid black",
          paddingTop: "4px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "8.5pt",
          fontFamily: "Times New Roman, serif",
          ...containerStyle,
        }}
      >
        <span>
          {officeAddressShort}, {officeCity}
        </span>
        <span>Phone {officePhone}</span>
      </div>
    );
  }

  // columns === 1 (default) – simple centred paragraph, no border
  return (
    <p
      style={{
        textAlign: "center",
        fontSize: "8.5pt",
        margin: "6px 0 0",
        fontFamily: "Times New Roman, serif",
        ...containerStyle,
      }}
    >
      {officeAddressShort}, {officeCity}
    </p>
  );
}
