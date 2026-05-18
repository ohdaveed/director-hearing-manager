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
    throw new Error(`Invalid packet transition: ${fromStatus} to ${toStatus}`);
  }
}

function getEventType(status: PacketStatus) {
  return `packet_status_${status.toLowerCase().replaceAll(" ", "_")}`;
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

  const transitionMutation = useMutation({
    mutationFn: async (args: {
      toStatus: PacketStatus;
      updates: Record<string, unknown>;
      message: string;
      eventData?: Record<string, unknown>;
    }) => {
      requireTransition(currentStatus, args.toStatus);
      const updatedPacket = await packetService.update(packetId, args.updates);
      await packetService.logPacketEvent({
        packetId,
        complaintUuid: updatedPacket?.complaint_uuid ?? null,
        eventType: getEventType(args.toStatus),
        eventStatus: "success",
        eventMessage: args.message,
        eventData: {
          fromStatus: currentStatus,
          toStatus: args.toStatus,
          ...(args.eventData ?? {}),
        },
      });
      return updatedPacket;
    },
    onSuccess: async () => {
      await invalidatePacketQueries();
      toast.success("Packet workflow updated");
    },
    onError: (error) => {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to update packet workflow");
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
    transitionMutation.mutate({
      toStatus: "Under Review",
      updates: { packet_status: "Under Review" },
      message: "Packet sent to internal review.",
    });
  };

  const requestChanges = (revisionNotes: string) => {
    transitionMutation.mutate({
      toStatus: "Changes Requested",
      updates: {
        packet_status: "Changes Requested",
        revision_notes: revisionNotes.trim(),
      },
      message: "Packet changes requested.",
      eventData: { revisionNotes: revisionNotes.trim() },
    });
  };

  const moveBackToProgress = () => {
    transitionMutation.mutate({
      toStatus: "In Progress",
      updates: { packet_status: "In Progress" },
      message: "Packet moved back to in progress.",
    });
  };

  const approvePacket = () => {
    transitionMutation.mutate({
      toStatus: "Approved",
      updates: {
        packet_status: "Approved",
        approved_at: new Date().toISOString(),
      },
      message: "Packet approved.",
    });
  };

  const markComplete = () => {
    transitionMutation.mutate({
      toStatus: "Complete",
      updates: { packet_status: "Complete" },
      message: "Packet marked complete.",
    });
  };

  const submitPacket = () => {
    transitionMutation.mutate({
      toStatus: "Submitted",
      updates: {
        packet_status: "Submitted",
        submitted_at: new Date().toISOString(),
      },
      message: "Packet submitted.",
    });
  };

  return {
    canTransition: (toStatus: PacketStatus) =>
      canTransitionPacket(currentStatus, toStatus),
    isUpdating: updatePacketMutation.isPending || transitionMutation.isPending,
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
