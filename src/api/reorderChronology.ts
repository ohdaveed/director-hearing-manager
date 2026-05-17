import { z } from 'zod';
import { createEndpoint, Chronology } from 'zite-integrations-backend-sdk';

function entryLetter(idx: number): string {
  return idx < 26 ? String.fromCharCode(65 + idx) : `(${idx + 1})`;
}

export default createEndpoint({
  description: 'Reorder chronology entries and recalculate exhibit letters (A, B, C…)',
  inputSchema: z.object({
    complaintId: z.string(),
    orderedIds: z.array(z.string()),
  }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input }) => {
    // Update each entry's chronologyOrder and exhibitRefs letter in parallel
    await Promise.all(
      input.orderedIds.map((id, index) =>
        Chronology.update({
          id,
          record: {
            chronologyOrder: index + 1,
            exhibitRefs: entryLetter(index),
          },
        })
      )
    );
    return { success: true };
  },
});
