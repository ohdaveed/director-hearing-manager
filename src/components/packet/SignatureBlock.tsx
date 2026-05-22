/**
 * SignatureBlock.tsx
 *
 * Reusable printed signature slot for hearing packet documents.
 * Renders a cursive signature (or blank line) inside a labelled cell.
 * Used by PacketChronology, PacketEnforcementSummary, etc.
 */

import type { CSSProperties } from "react";
import { getSignatureFont } from "@/constants/signatureStyles";

export interface ParsedSignature {
  text: string;
  style: string;
}

/** Try to parse a stored signature JSON string */
export function tryParseSignature(raw: string | undefined | null): ParsedSignature | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.text) return parsed as ParsedSignature;
  } catch {
    /* not JSON — treat as plain text */
  }
  if (raw.trim()) return { text: raw.trim(), style: "Style 1 — Classic" };
  return null;
}

interface Props {
  label: string;
  signature: ParsedSignature | null;
  cellStyle: CSSProperties;
  labelStyle: CSSProperties;
}

export function SignatureBlock({ label, signature, cellStyle, labelStyle }: Props) {
  const { font, size } = getSignatureFont(signature?.style);
  return (
    <td style={cellStyle}>
      <span style={labelStyle}>{label}</span>
      {signature ? (
        <span
          style={{
            fontFamily: font,
            fontSize: size,
            display: "block",
            lineHeight: 1.1,
          }}
        >
          {signature.text}
        </span>
      ) : (
        <span
          style={{
            display: "block",
            borderBottom: "1px solid black",
            height: "24px",
          }}
        />
      )}
    </td>
  );
}
