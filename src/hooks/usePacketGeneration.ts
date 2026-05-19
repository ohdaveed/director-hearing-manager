import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { packetService } from "@/services/packetService";

export function usePacketGeneration(packetId: string) {
  const queryClient = useQueryClient();

  const invalidatePacketQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["packet", packetId] }),
      queryClient.invalidateQueries({ queryKey: ["packets"] }),
      queryClient.invalidateQueries({ queryKey: ["packet-files", packetId] }),
      queryClient.invalidateQueries({ queryKey: ["packet-events", packetId] }),
    ]);
  };

  const mutation = useMutation({
    mutationFn: (packetType: "draft" | "final") =>
      packetService.generateHearingPacket(packetId, packetType),
    onSuccess: async (result) => {
      await invalidatePacketQueries();
      toast.success(
        result.packetType === "final"
          ? "Final hearing packet generated"
          : "Draft hearing packet generated",
      );
      if (result.signedUrl) {
        window.open(result.signedUrl, "_blank", "noopener,noreferrer");
      }
    },
    onError: (error) => {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate hearing packet",
      );
    },
  });

  return {
    generateDraft: () => mutation.mutate("draft"),
    generateFinal: () => mutation.mutate("final"),
    isGenerating: mutation.isPending,
  };
}
