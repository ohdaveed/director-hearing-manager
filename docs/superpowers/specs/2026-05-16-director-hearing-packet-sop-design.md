# Design Specification: SOP-Compliant Director's Hearing Packet

**Date:** 2026-05-16
**Topic:** Creation of a Director's Hearing Packet according to official SOP and sample templates.
**Status:** Approved

## 1. Overview
This design aims to align the Zite "Hearing Packet" generation system with the official Standard Operating Procedure (SOP) and sample templates provided by the SFDPH Environmental Health Division. The primary focus is on strict document sequencing, specific exhibit labeling, and legal document bundling (Exhibit E).

## 2. Document Sequence & Exhibit Mapping
The packet will be assembled in the following mandatory order:

1.  **Cover Page:** Title, Case #, Address.
2.  **Enforcement Action Summary:** Core purpose, responsible parties, and program manager signature block.
3.  **Case Chronology:** 11-page template format.
    *   Table columns: DATE, CODE SECTION, SUMMARY, EXHIBITS, PG.
    *   **Proposed Order:** Integrated at the end of the chronology (bottom of Page 1 or final page if continued).
    *   Signature slots for both Inspector and Program Manager.
4.  **Exhibits (Chronological Site Evidence):**
    *   **Exhibit A:** Initial Inspection (Report + Photos).
    *   **Exhibit B, C, D...:** Subsequent Re-inspections (Report + Photos).
5.  **Exhibit E (Legal & Service Bundle):**
    *   Notice of Hearing.
    *   Notice of Violation (NOV).
    *   Posting Documentation (Photos of NOH/NOV posted on-site).
    *   Mailing Documentation (Photos of regular and certified mail).
    *   Proof of Service (Signed).
6.  **Additional Documents:** APS referrals, pest control reports, etc.

## 3. Formatting Requirements
All documents must adhere to these visual standards:

### 3.1 Page Numbering
*   **Position:** Middle bottom of every page.
*   **Format:** `Page X of Y`.
*   **Typography:** Small, clear sans-serif font (e.g., Arial 9pt).

### 3.2 Exhibit Labels
*   **Position:** Top right corner.
*   **Color:** Red ink (`#dc2626`).
*   **Weight:** Bold/Heavy.
*   **Language:** "Exhibit [Letter]" (e.g., **Exhibit A**).

### 3.3 Photo Layout (The "One-Per-Page" Rule)
*   Strictly **one photograph per page** for all exhibit photos.
*   Each photo page must include a metadata table:
    *   **Date / Time**
    *   **Inspector**
    *   **Address**
    *   **Violation (Code/Label)**
    *   **Description (Caption)**

## 4. Technical Implementation
*   **Component Refactor:** `HearingPacketPreview.tsx` will be updated to enforce the new sequence.
*   **Exhibit E Component:** A new composite component `PacketExhibitEBundle.tsx` will be created to group notice and service documents.
*   **Page Numbering Utility:** The dynamic numbering logic in `HearingPacketPreview`'s `useEffect` will be adjusted to center numbers and use the `Page X of Y` format.
*   **Exhibit Labeling:** All `Packet*` components will be updated to accept an `exhibitLetter` prop and render the red label consistently.

## 5. Success Criteria
*   The printed PDF matches the document order defined in Section 2.
*   Page numbers are centered at the bottom of every page.
*   Exhibit photos are rendered one-per-page with full metadata.
*   The "Proposed Order" appears within the Chronology document.
*   "Exhibit E" correctly bundles all legal and service documentation.
