import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { packetService, PacketStatus } from "@/services/packetService";

export const PACKET_TRANSITIONS: Record<PacketStatus, PacketStatus[]> = {
  "Not Started": ["In Progress"],
  "In Progress": ["Under Review"],
  "Changes Requested": ["In Progress", "Under Review"],
  "Under Review": ["Changes Requested", "Approved"],
  Approved: ["Complete"],
  Complete: ["Submitted"],
  Submitted: [],
};

export function canTransitionPacket(
  fromStatus: PacketStatus,
  toStatus: PacketStatus,
) {
  return PACKET_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}

function requireTransition(fromStatus: PacketStatus, toStatus: PacketStatus) {
  if (!canTransitionPacket(fromStatus, toStatus)) {
    throw new Error(`Invalid packet transition: ${fromStatus} → ${toStatus}`);
  }
}

export function usePacketWorkflow({
  packetId,
  currentStatus,
}: {
  packetId: string;
  currentStatus: PacketStatus;
}) {
  const queryClient = useQueryClient();

  const invalidatePacketQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["packet", packetId] }),
      queryClient.invalidateQueries({ queryKey: ["packets"] }),
      queryClient.invalidateQueries({ queryKey: ["packet-files", packetId] }),
      queryClient.invalidateQueries({ queryKey: ["packet-events", packetId] }),
    ]);
  };

  const updatePacketMutation = useMutation({
    mutationFn: (updates: Record<string, unknown>) =>
      packetService.update(packetId, updates),
    onSuccess: async () => {
      await invalidatePacketQueries();
      toast.success("Packet updated");
    },
    onError: (error) => {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to update packet");
    },
  });

  const refreshSnapshotMutation = useMutation({
    mutationFn: () => packetService.refreshSnapshot(packetId),
    onSuccess: async () => {
      await invalidatePacketQueries();
      toast.success("Packet snapshot refreshed");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to refresh packet snapshot");
    },
  });

  const savePacket = (updates: Record<string, unknown>) => {
    updatePacketMutation.mutate(updates);
  };

  const sendToReview = () => {
    requireTransition(currentStatus, "Under Review");
    updatePacketMutation.mutate({ packet_status: "Under Review" });
  };

  const requestChanges = (revisionNotes: string) => {
    requireTransition(currentStatus, "Changes Requested");
    updatePacketMutation.mutate({
      packet_status: "Changes Requested",
      revision_notes: revisionNotes.trim(),
    });
  };

  const moveBackToProgress = () => {
    requireTransition(currentStatus, "In Progress");
    updatePacketMutation.mutate({ packet_status: "In Progress" });
  };

  const approvePacket = () => {
    requireTransition(currentStatus, "Approved");
    updatePacketMutation.mutate({
      packet_status: "Approved",
      approved_at: new Date().toISOString(),
    });
  };

  const markComplete = () => {
    requireTransition(currentStatus, "Complete");
    updatePacketMutation.mutate({ packet_status: "Complete" });
  };

  const submitPacket = () => {
    requireTransition(currentStatus, "Submitted");
    updatePacketMutation.mutate({
      packet_status: "Submitted",
      submitted_at: new Date().toISOString(),
    });
  };

  return {
    canTransition: (toStatus: PacketStatus) =>
      canTransitionPacket(currentStatus, toStatus),
    isUpdating: updatePacketMutation.isPending,
    isRefreshing: refreshSnapshotMutation.isPending,
    savePacket,
    sendToReview,
    requestChanges,
    moveBackToProgress,
    approvePacket,
    markComplete,
    submitPacket,
    refreshSnapshot: () => refreshSnapshotMutation.mutate(),
  };
}
