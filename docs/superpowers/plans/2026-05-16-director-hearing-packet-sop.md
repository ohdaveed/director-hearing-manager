# SOP-Compliant Director's Hearing Packet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Hearing Packet generation system to comply with official SFDPH SOPs, including document reordering, centered page numbering, red exhibit labeling, and a one-photo-per-page layout.

**Architecture:** 
- Centralize print styles for page numbering and exhibit labels in `src/index.css`.
- Create a composite `PacketExhibitEBundle` component for legal notices.
- Update `HearingPacketPreview` to manage the strict SOP document sequence and dynamic numbering.

**Tech Stack:** React (TypeScript), Tailwind CSS, Framer Motion (for preview).

---

### Task 1: Print Layout & CSS Foundations

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/packet/printUtils.tsx`

- [x] **Step 1: Update `src/index.css` with centered page numbering and red label styles.**
- [x] **Step 2: Add `ExhibitLabel` component to `src/components/packet/printUtils.tsx`.**
- [x] **Step 3: Commit.**

### Task 2: SOP-Compliant Photo Appendix

**Files:**
- Modify: `src/components/packet/PacketPhotoAppendix.tsx`

- [x] **Step 1: Refactor `PacketPhotoAppendix.tsx` for one-photo-per-page and metadata table.**
- [x] **Step 2: Use `ExhibitLabel` in the top-right corner.**
- [x] **Step 3: Commit.**

### Task 3: Integrated Chronology & Proposed Order

**Files:**
- Modify: `src/components/packet/PacketChronology.tsx`

- [x] **Step 1: Update `PacketChronology.tsx` to include `HearingOrderProposal` at the bottom of the log.**
- [x] **Step 2: Remove standalone "Hearing Order" from document sequence.**
- [x] **Step 3: Commit.**

### Task 4: Exhibit E Legal Bundle

**Files:**
- Create: `src/components/packet/PacketExhibitEBundle.tsx`
- Modify: `src/components/packet/PacketNoticeOfHearing.tsx`
- Modify: `src/components/packet/PacketNoticeOfViolation.tsx`

- [x] **Step 1: Create `PacketExhibitEBundle.tsx` to group NOH, NOV, and Service Proof.**
- [x] **Step 2: Ensure "Exhibit E" label appears only on the first page of the bundle.**
- [x] **Step 3: Commit.**

### Task 5: Packet Reordering & Centered Numbering

**Files:**
- Modify: `src/components/HearingPacketPreview.tsx`

- [x] **Step 1: Reorder components in `HearingPacketPreview.tsx` render function.**
- [x] **Step 2: Cover -> Summary -> Chronology -> Inspection Exhibits (A, B, C...) -> Exhibit E Bundle.**
- [x] **Step 3: Update `updatePageNumbers` to use centered format `Page X of Y`.**
- [x] **Step 4: Commit.**
