import { z } from 'zod';
import { createEndpoint, Locations } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Update location fields — all users can update',
  inputSchema: z.object({
    locationRecordId: z.string(),
    locationId: z.string().optional(),
    ownerName: z.string().optional(),
    ownerAddress: z.string().optional(),
    ownerPhone: z.string().optional(),
    ownerEmail: z.string().optional(),
    verificationDate: z.string().optional(),
    buildingFeatures: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input }) => {
    const record: Record<string, unknown> = {};
    if (input.locationId !== undefined) record.locationId = input.locationId;
    if (input.ownerName !== undefined) record.ownerName = input.ownerName;
    if (input.ownerAddress !== undefined) record.ownerAddress = input.ownerAddress;
    if (input.ownerPhone !== undefined) record.ownerPhone = input.ownerPhone;
    if (input.ownerEmail !== undefined) record.ownerEmail = input.ownerEmail;
    if (input.verificationDate !== undefined) record.verificationDate = input.verificationDate;
    if (input.buildingFeatures !== undefined) record.buildingFeatures = input.buildingFeatures;
    await Locations.update({ id: input.locationRecordId, record });
    return { success: true };
  },
});
