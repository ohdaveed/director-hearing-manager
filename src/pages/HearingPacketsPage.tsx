import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PACKET_STATUSES } from "@/services/packetService";
import { usePacketListQuery } from "@/hooks/usePacketQueries";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PacketDetail } from "@/components/packet/PacketDetail";
import { PacketList } from "@/components/packet/PacketList";
import { Loader2, Package } from "lucide-react";

type Packet = import("@/types/packet").PacketSummary;

interface HearingPacketsPageProps {
  userScopedFilter?: boolean;
  inspectorName?: string;
  baseRoute?: string;
}

export default function HearingPacketsPage({
  userScopedFilter = false,
  inspectorName,
  baseRoute = "/enforcement/hearings",
}: HearingPacketsPageProps = {}) {
  const { id: urlPacketId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserRole = user?.role;
  const [statusFilter, setStatusFilter] = useState("");

  const assignedToFilter = userScopedFilter && inspectorName ? inspectorName : undefined;
  const {
    data: packets = [],
    isLoading,
    refetch,
    isRefetching,
  } = usePacketListQuery({
    statusFilter: statusFilter || undefined,
    assignedToFilter,
    enabled: !!user,
  });

  const selected = useMemo(() => {
    if (!urlPacketId) return null;
    return packets.find((packet: Packet) => packet.id === urlPacketId) || null;
  }, [urlPacketId, packets]);

  const handleSelectPacket = (packet: Packet | null) => {
    if (packet) navigate(`${baseRoute}/${packet.id}`, { replace: true });
    else navigate(baseRoute, { replace: true });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Hearing Packets</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {packets.length} packet{packets.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) =>
              setStatusFilter(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {PACKET_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching || isLoading}
            className="gap-1.5 h-8"
          >
            {isRefetching && <Loader2 className="w-3 h-3 animate-spin" />}
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : packets.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No hearing packets found</p>
          <p className="text-sm mt-1">
            Packets are created when complaints are escalated to hearing.
          </p>
        </div>
      ) : (
        <div className={`flex gap-6 ${selected ? "flex-col xl:flex-row" : ""}`}>
          <div className={`${selected ? "xl:w-1/2" : "w-full"} min-w-0`}>
            <PacketList
              packets={packets}
              selectedPacketId={selected?.id}
              onSelectPacket={handleSelectPacket}
            />
          </div>

          {selected && (
            <div className="xl:w-1/2 min-w-0">
              <PacketDetail
                packetId={selected.id}
                onClose={() => handleSelectPacket(null)}
                userRole={currentUserRole}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
