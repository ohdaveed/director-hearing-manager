import { describe, it, expect, vi } from 'vitest';
import { aiService } from '../aiService';

// Mock Anthropic
const { mockMessagesCreate } = vi.hoisted(() => ({
  mockMessagesCreate: vi.fn(),
}));

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class {
      messages = {
        create: mockMessagesCreate,
      };
    },
  };
});

describe('aiService', () => {
  it('should extract violations from inspection report text', async () => {
    const reportText = 'INSPECTION REPORT\nFound rodent droppings. Citation: § 581(b)(13).';
    
    // Setup mock response
    mockMessagesCreate.mockResolvedValue({
      id: 'msg_123',
      type: 'message',
      role: 'assistant',
      model: 'claude-3-haiku-20240307',
      content: [
        { type: 'text', text: '[{ "code": "§ 581(b)(13)", "observation": "Found rodent droppings", "correctiveAction": "Seal all holes" }]' }
      ],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 20 }
    } as any);

    const violations = await aiService.extractViolations(reportText);
    
    expect(violations).toContainEqual(expect.objectContaining({
      code: '§ 581(b)(13)',
    }));
    // Check if standards were added via post-processing
    expect(violations[0].regulatoryStandards).toContain('STRUCTURAL GAPS & SEALING');
  });

  it('should filter out non-Article 11 codes', async () => {
    const reportText = 'Found state code violation: HSC 17920.';
    
    mockMessagesCreate.mockResolvedValue({
      id: 'msg_456',
      type: 'message',
      role: 'assistant',
      model: 'claude-3-haiku-20240307',
      content: [
        { type: 'text', text: '[{ "code": "HSC 17920", "observation": "State code violation", "correctiveAction": "Fix it" }]' }
      ],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 20 }
    } as any);

    const violations = await aiService.extractViolations(reportText);
    
    expect(violations).toHaveLength(0);
  });
});