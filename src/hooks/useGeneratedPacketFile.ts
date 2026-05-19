import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { packetService } from "@/services/packetService";

export function useGeneratedPacketFile() {
  const mutation = useMutation({
    mutationFn: (fileId: string) => packetService.getGeneratedFileUrl(fileId),
    onSuccess: (result) => {
      if (result.signedUrl) {
        window.open(result.signedUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error("No file URL was returned");
      }
    },
    onError: (error) => {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to open file");
    },
  });

  return {
    openFile: (fileId: string) => mutation.mutate(fileId),
    isOpening: mutation.isPending,
  };
}
