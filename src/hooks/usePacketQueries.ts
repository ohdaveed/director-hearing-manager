import { useQuery } from "@tanstack/react-query";
import { packetService } from "@/services/packetService";

export interface PacketListFilters {
  statusFilter?: string;
  assignedToFilter?: string;
}

export function packetQueryKeys() {
  return {
    all: ["packets"] as const,
    list: (filters: PacketListFilters = {}) =>
      [
        "packets",
        filters.statusFilter ?? "",
        filters.assignedToFilter ?? "",
      ] as const,
    detail: (packetId: string) => ["packet", packetId] as const,
    files: (packetId: string) => ["packet-files", packetId] as const,
    events: (packetId: string) => ["packet-events", packetId] as const,
  };
}

const keys = packetQueryKeys();

export function usePacketListQuery({
  statusFilter,
  assignedToFilter,
  enabled = true,
}: PacketListFilters & { enabled?: boolean }) {
  return useQuery({
    queryKey: keys.list({ statusFilter, assignedToFilter }),
    queryFn: () =>
      packetService.getAll({
        statusFilter: statusFilter || undefined,
        assignedToFilter: assignedToFilter || undefined,
      }),
    enabled,
  });
}

export function usePacketDetailQuery(packetId: string) {
  return useQuery({
    queryKey: keys.detail(packetId),
    queryFn: () => packetService.getById(packetId),
    enabled: !!packetId,
  });
}

export function usePacketFilesQuery(packetId: string) {
  return useQuery({
    queryKey: keys.files(packetId),
    queryFn: () => packetService.getPacketFiles(packetId),
    enabled: !!packetId,
  });
}

export function usePacketEventsQuery(packetId: string) {
  return useQuery({
    queryKey: keys.events(packetId),
    queryFn: () => packetService.getPacketEvents(packetId),
    enabled: !!packetId,
  });
}
