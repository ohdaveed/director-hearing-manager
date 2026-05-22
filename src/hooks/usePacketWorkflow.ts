import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { packetService, PacketStatus } from "@/services/packetService";
import type { StatusHistoryEntry } from "@/types/packet";

export const PACKET_TRANSITIONS: Record<PacketStatus, PacketStatus[]> = {
  "Not Started": ["In Progress"],
  "In Progress": ["Under Review"],
  "Changes Requested": ["In Progress", "Under Review"],
  "Under Review": ["Changes Requested", "Approved"],
  Approved: ["Complete"],
  Complete: ["Submitted"],
  Submitted: [],
};

export function canTransitionPacket(fromStatus: PacketStatus, toStatus: PacketStatus) {
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

function appendStatusHistory(history: StatusHistoryEntry[] | undefined, entry: StatusHistoryEntry) {
  return [...(history ?? []), entry];
}

function buildStatusHistoryEntry({
  fromStatus,
  toStatus,
  userName,
  action,
  notes,
}: {
  fromStatus: PacketStatus;
  toStatus: PacketStatus;
  userName?: string;
  action?: string;
  notes?: string;
}): StatusHistoryEntry {
  return {
    timestamp: new Date().toISOString(),
    userName: userName?.trim() || undefined,
    fromStatus,
    toStatus,
    action,
    notes,
  };
}

function statusTimestampUpdates(toStatus: PacketStatus, updates: Record<string, unknown>) {
  const nextUpdates: Record<string, unknown> = {};
  if (toStatus === "Approved" && !("approved_at" in updates)) {
    nextUpdates.approved_at = new Date().toISOString();
  }
  if (toStatus === "Submitted" && !("submitted_at" in updates)) {
    nextUpdates.submitted_at = new Date().toISOString();
  }
  return nextUpdates;
}

export function usePacketWorkflow({
  packetId,
  currentStatus,
  statusHistory,
  userName,
}: {
  packetId: string;
  currentStatus: PacketStatus;
  statusHistory?: StatusHistoryEntry[];
  userName?: string;
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
    mutationFn: (updates: Record<string, unknown>) => packetService.update(packetId, updates),
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
      historyAction?: string;
      historyNotes?: string;
    }) => {
      requireTransition(currentStatus, args.toStatus);
      const historyEntry = buildStatusHistoryEntry({
        fromStatus: currentStatus,
        toStatus: args.toStatus,
        userName,
        action: args.historyAction ?? args.message,
        notes: args.historyNotes,
      });
      const nextHistory = appendStatusHistory(statusHistory, historyEntry);
      const nextUpdates = {
        ...args.updates,
        ...statusTimestampUpdates(args.toStatus, args.updates),
        packet_status: args.toStatus,
        status_history_json: nextHistory,
      };
      const updatedPacket = await packetService.update(packetId, nextUpdates);
      await packetService.logPacketEvent({
        packetId,
        complaintUuid: updatedPacket?.complaint_id ?? null,
        eventType: getEventType(args.toStatus),
        eventStatus: "success",
        eventMessage: args.message,
        eventData: {
          fromStatus: currentStatus,
          toStatus: args.toStatus,
          ...args.eventData,
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

  const transitionToStatus = (args: {
    toStatus: PacketStatus;
    updates: Record<string, unknown>;
    message?: string;
    historyAction?: string;
    historyNotes?: string;
  }) => {
    transitionMutation.mutate({
      toStatus: args.toStatus,
      updates: args.updates,
      message: args.message ?? `Packet status updated to ${args.toStatus}.`,
      historyAction: args.historyAction,
      historyNotes: args.historyNotes,
    });
  };

  const sendToReview = () => {
    transitionMutation.mutate({
      toStatus: "Under Review",
      updates: { packet_status: "Under Review" },
      message: "Packet sent to internal review.",
      historyAction: "Sent to internal review",
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
      historyAction: "Changes requested",
      historyNotes: revisionNotes.trim(),
      eventData: { revisionNotes: revisionNotes.trim() },
    });
  };

  const moveBackToProgress = () => {
    transitionMutation.mutate({
      toStatus: "In Progress",
      updates: { packet_status: "In Progress" },
      message: "Packet moved back to in progress.",
      historyAction: "Returned to in progress",
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
      historyAction: "Approved packet",
    });
  };

  const markComplete = () => {
    transitionMutation.mutate({
      toStatus: "Complete",
      updates: { packet_status: "Complete" },
      message: "Packet marked complete.",
      historyAction: "Marked complete",
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
      historyAction: "Submitted packet",
    });
  };

  return {
    canTransition: (toStatus: PacketStatus) => canTransitionPacket(currentStatus, toStatus),
    isUpdating: updatePacketMutation.isPending || transitionMutation.isPending,
    isRefreshing: refreshSnapshotMutation.isPending,
    savePacket,
    transitionToStatus,
    sendToReview,
    requestChanges,
    moveBackToProgress,
    approvePacket,
    markComplete,
    submitPacket,
    refreshSnapshot: () => refreshSnapshotMutation.mutate(),
  };
}
