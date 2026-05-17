import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importService } from '../importService';
import { supabase } from '@/lib/supabase';
import { aiService } from '../aiService';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  },
}));

vi.mock('../aiService', () => ({
  aiService: {
    extractViolations: vi.fn(),
  },
}));

describe('importService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should import inspection history and call AI extraction', async () => {
    const packetId = 'packet_123';
    const inspectionIds = ['insp_1'];

    // Mock packet fetch
    vi.mocked(supabase.single).mockResolvedValueOnce({ data: { complaint: 'complaint_1' }, error: null } as any);
    // Mock inspection fetch
    vi.mocked(supabase.single).mockResolvedValueOnce({ 
      data: { inspection_id: 'insp_1', inspection_date: '2026-04-15', inspector: 'J. Smith', notes: 'Rodent issues' }, 
      error: null 
    } as any);
    // Mock AI extraction
    vi.mocked(aiService.extractViolations).mockResolvedValue([
      { code: '§ 581(b)(13)', observation: 'Rodents observed', correctiveAction: 'Seal gaps' }
    ]);
    // Mock chronology insert
    vi.mocked(supabase.single).mockResolvedValueOnce({ data: { id: 'chrono_1' }, error: null } as any);

    const result = await importService.importInspectionHistory({ packetId, inspectionIds });

    expect(result.chronologyEntriesCreated).toBe(1);
    expect(aiService.extractViolations).toHaveBeenCalledWith('Rodent issues');
    expect(supabase.insert).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        summary: expect.stringContaining('1 violations found'),
        violations_observed: expect.stringContaining('§ 581(b)(13)')
      })
    ]));
  });
});