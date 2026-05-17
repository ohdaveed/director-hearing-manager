import { z } from 'zod';
import { createEndpoint, Exhibits } from 'zite-integrations-backend-sdk';

async function countPdfPages(fileUrl: string): Promise<number> {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) return 1;
    const buffer = await response.arrayBuffer();
    // Scan first 500 KB for page markers
    const slice = buffer.slice(0, 512000);
    const text = new TextDecoder('latin1').decode(slice);
    // Match /Type /Page but NOT /Type /Pages
    const matches = text.match(/\/Type\s*\/Page(?!s)/g);
    return matches ? Math.max(matches.length, 1) : 1;
  } catch {
    return 1;
  }
}

function inferExhibitType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes('inspection') || lower.includes('report')) return 'Inspection Report';
  if (lower.includes('nov') || lower.includes('notice')) return 'NOV';
  if (lower.includes('corr') || lower.includes('letter') || lower.includes('mail')) return 'Correspondence';
  const ext = lower.split('.').pop();
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') return 'Photo';
  return 'Other';
}

export default createEndpoint({
  description: 'Upload a file as an exhibit, extract page count, and create an Exhibit record',
  inputSchema: z.object({
    complaintId: z.string(),
    fileUrl: z.string(),
    fileName: z.string(),
    exhibitType: z.string().optional(),
    category: z.string().optional(),
  }),
  outputSchema: z.object({
    exhibit: z.object({
      id: z.string(),
      exhibitLabel: z.string().optional(),
      exhibitType: z.string().optional(),
      description: z.string().optional(),
      sortOrder: z.number().optional(),
      file: z.array(z.object({ url: z.string() })).optional(),
      category: z.string().optional(),
      exhibitDate: z.string().optional(),
      caption: z.string().optional(),
      pageCount: z.number().optional(),
    }),
  }),
  execute: async ({ input }) => {
    // Determine next sort order from existing exhibits
    const existingRes = await Exhibits.findAll({
      filters: { complaint: input.complaintId },
      limit: 200,
    });
    const maxOrder = existingRes.records.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (m, e) => Math.max(m, (e as any).sortOrder ?? 0),
      0,
    );

    // Count pages (PDF binary scan; photos = 1 page)
    const lower = input.fileName.toLowerCase();
    const isPdf = lower.endsWith('.pdf');
    const pageCount = isPdf ? await countPdfPages(input.fileUrl) : 1;

    const exhibitType = input.exhibitType || inferExhibitType(input.fileName);
    const category = input.category || exhibitType;
    const today = new Date().toISOString().split('T')[0];

    // Create the exhibit record (cast to any to include the new pageCount field)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record = await Exhibits.create({
      record: {
        exhibitLabel: input.fileName,
        exhibitType: exhibitType as 'Photo' | 'Inspection Report' | 'NOV' | 'Correspondence' | 'Other',
        category: category as 'Inspection Report' | 'Photos' | 'NOV' | 'Correspondence' | 'Proof of Service' | 'Other',
        description: input.fileName,
        sortOrder: maxOrder + 1,
        complaint: input.complaintId,
        file: [{ url: input.fileUrl }],
        exhibitDate: today,
        pageCount,
      } as unknown as Parameters<typeof Exhibits.create>[0]['record'],
    });

    return {
      exhibit: {
        id: record.id,
        exhibitLabel: record.exhibitLabel,
        exhibitType: record.exhibitType,
        description: record.description,
        sortOrder: record.sortOrder,
        file: record.file,
        category: record.category,
        exhibitDate: record.exhibitDate,
        caption: record.caption,
        // pageCount may not be in the returned type yet — fall back to computed value
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pageCount: (record as any).pageCount ?? pageCount,
      },
    };
  },
});
