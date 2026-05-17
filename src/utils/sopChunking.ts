export interface SopChunk {
  chunkIndex: number;
  content: string;
  sourceDocument: string;
  charCount: number;
}

export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
}

const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_OVERLAP = 50;

export function chunkDocument(
  text: string,
  sourceDocument: string,
  options: ChunkOptions = {},
): SopChunk[] {
  const { chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_OVERLAP } = options;
  const chunks: SopChunk[] = [];

  // Split by sentence boundaries first
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = "";
  let chunkIndex = 0;

  for (const sentence of sentences) {
    // If adding this sentence would exceed chunk size, save current chunk
    if (
      currentChunk.length + sentence.length > chunkSize &&
      currentChunk.length > 0
    ) {
      chunks.push({
        chunkIndex,
        content: currentChunk.trim(),
        sourceDocument,
        charCount: currentChunk.length,
      });
      chunkIndex++;

      // Start new chunk with overlap from previous chunk
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + sentence;
    } else {
      currentChunk += sentence + " ";
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      chunkIndex,
      content: currentChunk.trim(),
      sourceDocument,
      charCount: currentChunk.length,
    });
  }

  return chunks;
}

// Pre-chunked SOP documents
export const SOP_CHUNKS: SopChunk[] = [
  // SOP Cover Page
  ...chunkDocument(
    `The Cover Page must include: Case identification number, Respondent name and address, Hearing date, time, and location, Case type and program code, Assigned inspector name and badge number, Date of packet preparation. The cover page serves as the official case identifier and must be accurate and complete.`,
    "SOP_Cover_Page",
  ),
  // SOP Enforcement Summary
  ...chunkDocument(
    `The Enforcement Summary must include: Overview of violations found, History of enforcement actions at this location, Recommended hearing action, Legal basis for the recommended action, Timeline of case development. The enforcement summary provides context for the hearing officer and must be factual and comprehensive.`,
    "SOP_Enforcement_Summary",
  ),
  // SOP Chronology
  ...chunkDocument(
    `The Chronology must include: Date-ordered list of all case events, Initial complaint date and details, All inspection dates and findings, All notices served, All contact attempts, Hearing Order Proposal at the bottom. The chronology must be accurate and complete as it forms the legal record of the case.`,
    "SOP_Chronology",
  ),
  // SOP Inspection Exhibits
  ...chunkDocument(
    `Inspection Exhibits must include: Labeled photos (Exhibit A, B, C, etc.), Inspection reports, Violation details with codes, Date and time of inspections, Inspector observations. Each exhibit must be clearly labeled and referenced in the chronology.`,
    "SOP_Inspection_Exhibits",
  ),
  // SOP Exhibit E Bundle
  ...chunkDocument(
    `Exhibit E Bundle must include: Notice of Hearing (NOH), Notice of Violation (NOV), Proof of Service for all notices, Return of service documentation, Any additional service documentation. The Exhibit E bundle demonstrates proper legal notice was given to all parties.`,
    "SOP_Exhibit_E_Bundle",
  ),
];
