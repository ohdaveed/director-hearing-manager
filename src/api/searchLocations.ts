import { z } from 'zod';
import { createEndpoint, Locations } from 'zite-integrations-backend-sdk';

const locationSchema = z.object({
  id: z.string(),
  address: z.string().optional(),
  locationId: z.string().optional(),
  ownerName: z.string().optional(),
  ownerAddress: z.string().optional(),
  ownerPhone: z.string().optional(),
  ownerEmail: z.string().optional(),
  facilityType: z.string().optional(),
  numberOfUnits: z.number().optional(),
  numberOfRooms: z.number().optional(),
  healthyHousing: z.boolean().optional(),
  censusTract: z.string().optional(),
  currentFees: z.number().optional(),
});

function mapRecord(r: Awaited<ReturnType<typeof Locations.findAll>>['records'][0]) {
  return {
    id: r.id,
    address: r.address,
    locationId: r.locationId,
    ownerName: r.ownerName,
    ownerAddress: r.ownerAddress,
    ownerPhone: r.ownerPhone,
    ownerEmail: r.ownerEmail,
    facilityType: r.facilityType,
    numberOfUnits: r.numberOfUnits,
    numberOfRooms: r.numberOfRooms,
    healthyHousing: r.healthyHousing,
    censusTract: r.censusTract,
    currentFees: r.currentFees,
  };
}

export default createEndpoint({
  description: 'Search locations by address or Location ID',
  inputSchema: z.object({ query: z.string().optional() }),
  outputSchema: z.object({ locations: z.array(locationSchema) }),
  execute: async ({ input }) => {
    const q = input.query?.trim();

    if (!q) {
      // No query — return first 50 locations
      const { records } = await Locations.findAll({ limit: 50 });
      return { locations: records.map(mapRecord) };
    }

    // Search by address and by Location ID in parallel, then deduplicate
    const [byAddress, byLocationId] = await Promise.all([
      Locations.findAll({ filters: { address: { contains: q } }, limit: 30 }),
      Locations.findAll({ filters: { locationId: { contains: q } }, limit: 30 }),
    ]);

    const seen = new Set<string>();
    const merged = [...byAddress.records, ...byLocationId.records].filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    return { locations: merged.map(mapRecord) };
  },
});
