import { supabase } from '@/lib/supabase';
import { aiService } from './aiService';
import { pdfService } from './pdfService';
import { wordService } from './wordService';

export const importService = {
  async importDraftPacket({ packetId, file }: { packetId: string, file: File }) {
    let text = '';
    // 1. Extract text based on file type
    if (file.name.toLowerCase().endsWith('.pdf')) {
      text = await pdfService.extractText(file);
    } else if (file.name.toLowerCase().endsWith('.docx')) {
      text = await wordService.extractText(file);
    } else {
      throw new Error('Unsupported file format');
    }

    // 2. Extract violations via AI
    const extractedViolations = await aiService.extractViolations(text);

    // 3. Create or update records in Supabase
    // (This is a simplified version of the logic)
    const { data: packet } = await supabase
      .from('hearing_packets')
      .select('complaint')
      .eq('id', packetId)
      .single();

    if (!packet) throw new Error('Packet not found');

    const { data: chronoEntry, error: chronoError } = await supabase
      .from('chronology')
      .insert([{
        complaint: packet.complaint,
        entry_date: new Date().toISOString().split('T')[0],
        entry_type: 'Inspection',
        summary: `Imported from draft: ${file.name}. ${extractedViolations.length} violations found.`,
        violations_observed: JSON.stringify(extractedViolations)
      }])
      .select()
      .single();

    if (chronoError) throw chronoError;

    return {
      chronologyEntriesCreated: 1,
      violationsFound: extractedViolations.length
    };
  },
  async listInspectionsForImport({ packetId }: { packetId: string }) {
    // Fetch inspections that are NOT already imported for this packet
    // This is a simplified version of what would be in the SDK
    const { data: packet } = await supabase
      .from('hearing_packets')
      .select('complaint')
      .eq('id', packetId)
      .single();

    if (!packet) throw new Error('Packet not found');

    const { data: inspections, error } = await supabase
      .from('inspections')
      .select('*, violations(*), inspection_photos(*)')
      .eq('complaint', packet.complaint)
      .eq('status', 'Submitted');

    if (error) throw error;

    // Check which ones are already in chronology
    const { data: existingChrono } = await supabase
      .from('chronology')
      .select('related_inspection')
      .eq('complaint', packet.complaint);

    const importedIds = new Set(existingChrono?.map(c => c.related_inspection).filter(Boolean));

    return {
      inspections: inspections.map(i => ({
        ...i,
        alreadyImported: importedIds.has(i.inspection_id.toString()),
        violation_count: i.violations?.length || 0,
        photoCount: i.inspection_photos?.length || 0,
        photoThumbnails: i.inspection_photos?.slice(0, 3).map((p: any) => p.photo_url) || []
      }))
    };
  },

  async importInspectionHistory({ packetId, inspectionIds }: { packetId: string, inspectionIds: string[] }) {
    let chronologyEntriesCreated = 0;
    let exhibitsCreated = 0;
    let skipped = 0;

    const { data: packet } = await supabase
      .from('hearing_packets')
      .select('complaint')
      .eq('id', packetId)
      .single();

    if (!packet) throw new Error('Packet not found');

    for (const id of inspectionIds) {
      // 1. Fetch inspection data
      const { data: inspection } = await supabase
        .from('inspections')
        .select('*, violations(*)')
        .eq('inspection_id', id)
        .single();

      if (!inspection) continue;

      // 2. Perform AI Extraction (if report text exists)
      // In a real scenario, we might extract from the PDF, 
      // but here we'll use the 'notes' field as a proxy for the report text for now.
      const extractedViolations = await aiService.extractViolations(inspection.notes || '');

      // 3. Create Chronology Entry
      const { data: chronoEntry, error: chronoError } = await supabase
        .from('chronology')
        .insert([{
          complaint: packet.complaint,
          related_inspection: id,
          entry_date: inspection.inspection_date,
          entry_type: 'Inspection',
          summary: `Inspection conducted by ${inspection.inspector}. ${extractedViolations.length} violations found.`,
          violations_observed: JSON.stringify(extractedViolations)
        }])
        .select()
        .single();

      if (chronoError) throw chronoError;
      chronologyEntriesCreated++;

      // 4. Create Exhibit for Report
      const { error: exhibitError } = await supabase
        .from('exhibits')
        .insert([{
          complaint: packet.complaint,
          source_inspection: id,
          exhibit_type: 'Inspection Report',
          category: 'Inspection Report',
          description: `Inspection Report - ${inspection.inspection_date}`,
          exhibit_date: inspection.inspection_date
        }]);

      if (exhibitError) throw exhibitError;
      exhibitsCreated++;
    }

    return {
      chronologyEntriesCreated,
      exhibitsCreated,
      skipped
    };
  }
};