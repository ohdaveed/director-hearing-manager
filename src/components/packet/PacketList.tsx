import { ChevronRight, Clock, FileText } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  "Not Started": "bg-muted text-muted-foreground",
  "In Progress": "bg-primary/10 text-primary",
  "Under Review": "bg-warning/10 text-warning",
  "Changes Requested": "bg-destructive/10 text-destructive",
  Approved: "bg-success/10 text-success",
  Complete: "bg-success/10 text-success",
  Submitted: "bg-primary/10 text-primary",
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(
      value.includes("T") ? value : `${value}T00:00:00`,
    ).toLocaleDateString();
  } catch {
    return value;
  }
}

export function PacketList({
  packets,
  selectedPacketId,
  onSelectPacket,
}: {
  packets: any[];
  selectedPacketId?: string | null;
  onSelectPacket: (packet: any | null) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="hidden md:grid grid-cols-12 px-4 py-2.5 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <div className="col-span-2">Hearing Date</div>
        <div className="col-span-2">Case #</div>
        <div className="col-span-4">Address</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2" />
      </div>
      <div className="divide-y divide-border">
        {packets.map((packet) => {
          const isSelected = selectedPacketId === packet.id;
          const badgeCls =
            STATUS_BADGE[packet.packet_status ?? ""] ??
            "bg-muted text-muted-foreground";
          return (
            <button
              key={packet.id}
              type="button"
              onClick={() => onSelectPacket(isSelected ? null : packet)}
              className={`w-full text-left hover:bg-muted/40 transition-colors ${
                isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""
              }`}
            >
              <div className="md:hidden px-4 py-3.5">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {packet.address ?? "—"}
                    </p>
                    {packet.complaintid && (
                      <p className="text-xs text-muted-foreground font-mono">
                        #{packet.complaintid}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${badgeCls}`}
                  >
                    {packet.packet_status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(packet.hearing_date)}
                </p>
              </div>
              <div className="hidden md:grid grid-cols-12 px-4 py-3 items-center gap-1">
                <div className="col-span-2 text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatDate(packet.hearing_date)}
                </div>
                <div className="col-span-2 text-xs font-mono text-foreground truncate">
                  {packet.case_number ?? "—"}
                </div>
                <div className="col-span-4">
                  <p className="text-sm font-medium truncate">
                    {packet.address ?? "—"}
                  </p>
                  {packet.complaintid && (
                    <p className="text-xs text-muted-foreground font-mono">
                      #{packet.complaintid}
                    </p>
                  )}
                </div>
                <div className="col-span-2 flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${badgeCls}`}
                  >
                    {packet.packet_status ?? "—"}
                  </span>
                  {packet.final_file_path && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/10 text-success">
                      Final
                    </span>
                  )}
                </div>
                <div className="col-span-2 flex justify-end items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <ChevronRight
                    className={`w-4 h-4 text-muted-foreground transition-transform ${
                      isSelected ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
