# Draft Compliance Phase 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Phase 4 of the Draft Compliance track to generate a final PDF from the approved compliance data, save it to Supabase Storage, and surface a download link in the UI.

**Architecture:** We will update the packet service to actually persist the mapped compliance data to the database. Then, we will enhance the existing `printUtils.tsx` to return a PDF `Blob` instead of just triggering a download. This Blob will be uploaded to Supabase Storage. Finally, we will update the UI to allow generating and downloading the final PDF.

**Tech Stack:** React, TypeScript, Supabase Storage, html2canvas, jsPDF

---

### Task 1: Persist Mapped Data to Database

**Files:**

- Modify: `src/services/packetService.ts`
- Test: `src/services/__tests__/packetService.test.ts` (create if doesn't exist)

- [ ] **Step 1: Write the failing test**

```typescript
// src/services/__tests__/packetService.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { packetService } from "../packetService";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: "123" }, error: null }),
  },
}));

describe("packetService.saveComplianceAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves mapped data correctly", async () => {
    const mockData = {
      extractedText: "test",
      complianceResult: {
        score: 100,
        isCompliant: true,
        issues: [],
        summary: "test",
        missingSections: [],
        recommendations: [],
      },
      mappedData: { caseNumber: "CASE-123", enforcementSummary: "test summary" },
      analyzedAt: new Date().toISOString(),
    };

    await packetService.saveComplianceAnalysis("packet-1", mockData);

    expect(supabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        case_number: "CASE-123",
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `vp test -- src/services/__tests__/packetService.test.ts`
Expected: FAIL because `case_number` is not being passed to `update()`.

- [ ] **Step 3: Write minimal implementation**

Modify `saveComplianceAnalysis` in `src/services/packetService.ts` to include fields from `complianceData.mappedData`:

```typescript
  async saveComplianceAnalysis(
    packetId: string,
    complianceData: {
      extractedText: string;
      complianceResult: any;
      mappedData: any;
      analyzedAt: string;
    },
  ) {
    const { data, error } = await supabase
      .from("hearing_packets")
      .update({
        notes: `[COMPLIANCE_ANALYSIS]\nAnalyzed at: ${complianceData.analyzedAt}\nScore: ${complianceData.complianceResult.score}\nStatus: ${complianceData.complianceResult.isCompliant ? "Compliant" : "Non-Compliant"}\nIssues: ${complianceData.complianceResult.issues.length}\n\n${complianceData.complianceResult.summary}`,
        packet_status: complianceData.complianceResult.isCompliant
          ? "In Progress"
          : "Under Review",
        case_number: complianceData.mappedData?.caseNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("id", packetId)
      .select(PACKET_LIST_COLUMNS)
      .single();

    if (error) throw error;
    return data;
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `vp test -- src/services/__tests__/packetService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/packetService.ts src/services/__tests__/packetService.test.ts
git commit -m "feat: persist mapped compliance data to database"
```

### Task 2: Implement PDF Blob Generation and Storage

**Files:**

- Modify: `src/components/packet/printUtils.tsx`
- Modify: `src/services/packetService.ts`

- [ ] **Step 1: Write PDF Blob utility**

Add `elementToPdfBlob` to `src/components/packet/printUtils.tsx`:

```typescript
// Add to src/components/packet/printUtils.tsx
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
```

- [ ] **Step 2: Update `generateAndStorePdf`**

Modify `src/services/packetService.ts` to actually upload to Supabase:

```typescript
  async generateAndStorePdf(
    packetId: string,
    pdfBlob: Blob,
  ): Promise<string> {
    const filePath = `packets/${packetId}/final_packet_${Date.now()}.pdf`;

    const { data, error } = await supabase.storage
      .from("documents")
      .upload(filePath, pdfBlob, {
        contentType: "application/pdf",
        upsert: true
      });

    if (error) {
      console.error("Storage upload error:", error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("documents")
      .getPublicUrl(filePath);

    // Save URL to packet record
    await supabase.from("hearing_packets").update({
      notes: `Final PDF generated and stored at ${publicUrl}`
    }).eq("id", packetId);

    return publicUrl;
  }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/packet/printUtils.tsx src/services/packetService.ts
git commit -m "feat: implement PDF blob generation and Supabase storage upload"
```

### Task 3: Add "Save Final PDF" Action to UI

**Files:**

- Modify: `src/components/HearingPacketPreview.tsx`

- [ ] **Step 1: Add Save Final PDF button**

In `src/components/HearingPacketPreview.tsx`, add imports and state:

```typescript
import { elementToPdfBlob } from "./packet/printUtils";
import { Save } from "lucide-react";
import { toast } from "sonner";
```

Inside the component:

```typescript
const [isSavingPdf, setIsSavingPdf] = useState(false);

const handleSaveFinalPdf = async () => {
  if (!printRef.current) return;
  try {
    setIsSavingPdf(true);
    toast.loading("Generating PDF...", { id: "save-pdf" });
    const blob = await elementToPdfBlob("hearing-packet-print");

    toast.loading("Uploading to storage...", { id: "save-pdf" });
    const url = await packetService.generateAndStorePdf(packet.id, blob);

    toast.success("Final PDF saved successfully!", { id: "save-pdf" });
    // Optionally open the URL
    window.open(url, "_blank");
  } catch (err) {
    console.error(err);
    toast.error("Failed to save final PDF", { id: "save-pdf" });
  } finally {
    setIsSavingPdf(false);
  }
};
```

Add the button next to the Print button in the toolbar:

```tsx
<Button
  onClick={handleSaveFinalPdf}
  size="sm"
  variant="outline"
  className="gap-2"
  disabled={renderStage !== "ready" || isSavingPdf}
>
  {isSavingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
  {isSavingPdf ? "Saving..." : "Save Final PDF"}
</Button>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/HearingPacketPreview.tsx
git commit -m "feat: add action to generate and save final PDF"
```
