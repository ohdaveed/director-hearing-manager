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

- [ ] **Step 1: Update `src/index.css` with centered page numbering and red label styles.**

```css
@media print {
  @page {
    size: letter portrait;
    margin: 0.5in 0.5in 0.75in 0.5in;
  }

  .page-number-slot {
    position: fixed;
    bottom: 0.4in;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 9pt;
    font-family: var(--font-sans);
    color: black;
    pointer-events: none;
    z-index: 9999;
  }

  .exhibit-label-red {
    color: #dc2626 !important;
    font-weight: 800;
    font-size: 14pt;
    text-transform: uppercase;
    font-family: var(--font-sans);
  }
}
```

- [ ] **Step 2: Add `ExhibitLabel` component to `src/components/packet/printUtils.tsx`.**

```tsx
export function ExhibitLabel({ letter, className = "" }: { letter?: string; className?: string }) {
  if (!letter) return null;
  return (
    <div className={`absolute top-0 right-0 exhibit-label-red ${className}`}>
      Exhibit {letter}
    </div>
  );
}
```

- [ ] **Step 3: Commit.**

```bash
git add src/index.css src/components/packet/printUtils.tsx
git commit -m "style: add print styles for centered numbering and red exhibit labels"
```

### Task 2: SOP-Compliant Photo Appendix

**Files:**
- Modify: `src/components/packet/PacketPhotoAppendix.tsx`

- [ ] **Step 1: Refactor `PacketPhotoAppendix.tsx` for one-photo-per-page and metadata table.**
- [ ] **Step 2: Use `ExhibitLabel` in the top-right corner.**

```tsx
// Inside PacketPhotoAppendix mapping:
<div className="packet-page print-page relative min-h-[10.5in] flex flex-col pt-12 px-8">
  <ExhibitLabel letter={exhibitLetter} />
  
  <div className="flex-grow flex items-center justify-center mb-8">
    <img 
      src={photo.url} 
      className="max-w-full max-h-[6.5in] object-contain border border-gray-400 shadow-sm" 
    />
  </div>

  <table className="w-full border-collapse border border-black text-[10.5pt] mb-8">
    <tbody>
      <tr>
        <td className="border border-black p-2 font-bold bg-gray-50 w-1/4 text-right">Date / Time</td>
        <td className="border border-black p-2 w-3/4">{fmtDate(photo.timestamp)}</td>
      </tr>
      <tr>
        <td className="border border-black p-2 font-bold bg-gray-50 text-right">Inspector</td>
        <td className="border border-black p-2">{inspector.name}</td>
      </tr>
      <tr>
        <td className="border border-black p-2 font-bold bg-gray-50 text-right">Address</td>
        <td className="border border-black p-2">{location.address}</td>
      </tr>
      <tr>
        <td className="border border-black p-2 font-bold bg-gray-50 text-right">Violation</td>
        <td className="border border-black p-2">{photo.violationCode}</td>
      </tr>
      <tr>
        <td className="border border-black p-2 font-bold bg-gray-50 text-right">Description</td>
        <td className="border border-black p-2">{photo.caption}</td>
      </tr>
    </tbody>
  </table>
  <div className="page-number-slot" />
</div>
```

- [ ] **Step 3: Commit.**

```bash
git add src/components/packet/PacketPhotoAppendix.tsx
git commit -m "feat: implement SOP one-photo-per-page layout with metadata table"
```

### Task 3: Integrated Chronology & Proposed Order

**Files:**
- Modify: `src/components/packet/PacketChronology.tsx`

- [ ] **Step 1: Update `PacketChronology.tsx` to include `HearingOrderProposal` at the bottom of the log.**
- [ ] **Step 2: Remove standalone "Hearing Order" from document sequence.**

```tsx
// Inside PacketChronology.tsx:
{isLastPage && (
  <div className="mt-8 pt-6 border-t-2 border-black break-inside-avoid">
    <h3 className="text-center font-bold text-[14pt] mb-4 underline">PROPOSED HEARING ORDER</h3>
    <p className="mb-6 leading-relaxed">
      Based on the history of non-compliance documented above, the Department recommends that the Hearing Officer issue an order requiring the abatement of all outstanding violations at {location.address} within 30 days of the hearing date. Failure to comply will result in further administrative action and assessment of applicable fees.
    </p>
    <div className="grid grid-cols-2 gap-8 mt-12">
      <div className="border-t border-black pt-2">Inspector Signature</div>
      <div className="border-t border-black pt-2">Program Manager Signature</div>
    </div>
  </div>
)}
```

- [ ] **Step 3: Commit.**

```bash
git add src/components/packet/PacketChronology.tsx
git commit -m "feat: integrate Proposed Order into Case Chronology component"
```

### Task 4: Exhibit E Legal Bundle

**Files:**
- Create: `src/components/packet/PacketExhibitEBundle.tsx`
- Modify: `src/components/packet/PacketNoticeOfHearing.tsx`
- Modify: `src/components/packet/PacketNoticeOfViolation.tsx`

- [ ] **Step 1: Create `PacketExhibitEBundle.tsx` to group NOH, NOV, and Service Proof.**
- [ ] **Step 2: Ensure "Exhibit E" label appears only on the first page of the bundle.**

```tsx
// src/components/packet/PacketExhibitEBundle.tsx
export function PacketExhibitEBundle({ complaint, location, packet, inspector }) {
  return (
    <div className="print-bundle">
      {/* Notice of Hearing gets the Exhibit E label */}
      <PacketNoticeOfHearing 
        complaint={complaint} 
        location={location} 
        packet={packet} 
        inspector={inspector} 
        exhibitLetter="E" 
      />
      
      {/* NOV follows immediately */}
      <PacketNoticeOfViolation 
        complaint={complaint} 
        location={location} 
        packet={packet} 
      />
      
      {/* Proof of Service */}
      <PacketServiceLog 
        serviceLog={packet.serviceLog || []}
        complaint={complaint}
        location={location}
        packet={packet}
        inspector={inspector}
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit.**

```bash
git add src/components/packet/PacketExhibitEBundle.tsx
git commit -m "feat: add Exhibit E Legal Bundle component"
```

### Task 5: Packet Reordering & Centered Numbering

**Files:**
- Modify: `src/components/HearingPacketPreview.tsx`

- [ ] **Step 1: Reorder components in `HearingPacketPreview.tsx` render function.**
- [ ] **Step 2: Cover -> Summary -> Chronology -> Inspection Exhibits (A, B, C...) -> Exhibit E Bundle.**
- [ ] **Step 3: Update `updatePageNumbers` to use centered format `Page X of Y`.**

```tsx
// src/components/HearingPacketPreview.tsx
const updatePageNumbers = () => {
  const slots = document.querySelectorAll('.page-number-slot');
  slots.forEach((slot, index) => {
    slot.innerHTML = `Page ${String(index + 1).padStart(3, '0')} of ${String(slots.length).padStart(3, '0')}`;
    slot.style.textAlign = 'center';
  });
};
```

- [ ] **Step 4: Commit.**

```bash
git add src/components/HearingPacketPreview.tsx
git commit -m "feat: implement SOP document sequence and centered numbering logic"
```
