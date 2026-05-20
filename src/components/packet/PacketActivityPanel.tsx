import { History } from "lucide-react";
import { PacketGenerationEvent } from "@/services/packetService";
import { EVENT_BADGE } from "@/constants/packet";
import { formatPacketDateTime } from "@/utils/packetFormat";
import { StatusHistoryEntry } from "@/types/packet";

function PacketEventsPanel({ events }: { events: PacketGenerationEvent[] }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
        <History className="w-4 h-4 text-primary" />
        <div>
          <h3 className="text-sm font-bold text-foreground">Packet Event Log</h3>
          <p className="text-xs text-muted-foreground">
            Audit trail for packet refreshes, generation, and workflow events.
          </p>
        </div>
      </div>
      {events.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">
          No packet generation events yet.
        </div>
      ) : (
        <div className="divide-y divide-border max-h-72 overflow-y-auto">
          {events.map((event) => {
            const badge = EVENT_BADGE[event.event_status] ?? EVENT_BADGE.info;
            return (
              <div key={event.id} className="px-4 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-semibold text-foreground">
                    {event.event_type.replaceAll("_", " ")}
                  </p>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${badge}`}
                  >
                    {event.event_status}
                  </span>
                </div>
                {event.event_message && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {event.event_message}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatPacketDateTime(event.created_at)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusHistoryPanel({ history }: { history: StatusHistoryEntry[] }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
        <History className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Status History</h3>
      </div>
      {history.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">
          No status history recorded yet.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {history.map((entry, index) => (
            <div key={index} className="px-4 py-3">
              <p className="text-xs text-foreground">
                <span className="font-medium">{entry.userName ?? "User"}</span>{" "}
                {entry.action ?? "changed status"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {entry.fromStatus} → {entry.toStatus} · {formatPacketDateTime(entry.timestamp)}
              </p>
              {entry.notes && (
                <p className="text-[10px] text-muted-foreground mt-1 italic">“{entry.notes}”</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PacketActivityPanel({
  events,
  history,
}: {
  events: PacketGenerationEvent[];
  history: StatusHistoryEntry[];
}) {
  return (
    <div className="space-y-4">
      <PacketEventsPanel events={events} />
      <StatusHistoryPanel history={history} />
    </div>
  );
}
