import mammoth from "mammoth";

export const wordService = {
  async extractText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    // Convert ArrayBuffer to Node.js Buffer for mammoth compatibility if needed,
    // but mammoth.extractRawText accepts an arrayBuffer.
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  },
};
