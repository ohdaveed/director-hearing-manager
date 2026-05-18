export function formatPacketDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(
      value.includes("T") ? value : `${value}T00:00:00`,
    ).toLocaleDateString();
  } catch {
    return value;
  }
}

export function formatPacketDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export function parsePacketHistory(raw: unknown): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
