import { describe, it, expect, vi } from 'vitest';
import { wordService } from '../wordService';

// Mock mammoth
vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({ value: 'Extracted text from docx' }),
  }
}));

describe('wordService', () => {
  it('extracts text from a .docx file', async () => {
    // Create a mock File object
    const file = new File(['dummy docx content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    
    // Call the service (which doesn't exist yet)
    const text = await wordService.extractText(file);
    
    // Assert the result
    expect(text).toBe('Extracted text from docx');
    
    // Verify mammoth was called
    const mammoth = (await import('mammoth')).default;
    expect(mammoth.extractRawText).toHaveBeenCalled();
  });
});