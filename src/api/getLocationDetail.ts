import { z } from 'zod';
import { createEndpoint, Locations, ZiteError } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Get location detail including owner, contact, building features, and verification date',
  inputSchema: z.object({ locationRecordId: z.string() }),
  outputSchema: z.object({
    location: z.object({
      id: z.string(),
      address: z.string().optional(),
      locationId: z.string().optional(),
      blockLot: z.string().optional(),
      dba: z.string().optional(),
      ownerName: z.string().optional(),
      ownerAddress: z.string().optional(),
      ownerPhone: z.string().optional(),
      ownerEmail: z.string().optional(),
      managementName: z.string().optional(),
      responsibleParty: z.string().optional(),
      responsiblePartyPhone: z.string().optional(),
      responsiblePartyEmail: z.string().optional(),
      facilityType: z.string().optional(),
      numberOfUnits: z.number().optional(),
      numberOfRooms: z.number().optional(),
      currentFees: z.number().optional(),
      healthyHousing: z.boolean().optional(),
      censusTract: z.string().optional(),
      verificationDate: z.string().optional(),
      buildingFeatures: z.array(z.string()).optional(),
    }),
  }),
  execute: async ({ input }) => {
    const loc = await Locations.findOne({ id: input.locationRecordId });
    if (!loc) throw new ZiteError({ code: 'NOT_FOUND', message: 'Location not found' });
    return {
      location: {
        id: loc.id,
        address: loc.address,
        locationId: loc.locationId,
        blockLot: loc.blockLot,
        dba: loc.dba,
        ownerName: loc.ownerName,
        ownerAddress: loc.ownerAddress,
        ownerPhone: loc.ownerPhone,
        ownerEmail: loc.ownerEmail,
        managementName: loc.managementName,
        responsibleParty: loc.responsibleParty,
        responsiblePartyPhone: loc.responsiblePartyPhone,
        responsiblePartyEmail: loc.responsiblePartyEmail,
        facilityType: loc.facilityType,
        numberOfUnits: loc.numberOfUnits ?? undefined,
        numberOfRooms: loc.numberOfRooms ?? undefined,
        currentFees: loc.currentFees ?? undefined,
        healthyHousing: loc.healthyHousing ?? undefined,
        censusTract: loc.censusTract,
        verificationDate: loc.verificationDate,
        buildingFeatures: loc.buildingFeatures as string[] | undefined,
      },
    };
  },
});
