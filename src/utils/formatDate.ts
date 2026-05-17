/**
 * formatDate.ts
 *
 * Centralised date formatting utilities used throughout the app.
 *
 * WHY T00:00:00 is appended:
 *   Database date-only fields return YYYY-MM-DD strings (e.g. "2024-03-15").
 *   Parsing these without a time component causes JavaScript to interpret them
 *   as midnight UTC, which shifts the displayed date backward by one day for
 *   users in negative-offset timezones (e.g. US Pacific).
 *   Appending 'T00:00:00' forces local-time parsing, keeping the date correct
 *   regardless of the user's timezone.
 */

/**
 * Standard locale display — e.g. "3/15/2024"
 * Use for most UI labels, list items, and inline date displays.
 * Returns "—" for empty/undefined values.
 */
export function formatDate(d?: string): string {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString();
}

/**
 * MM/DD/YYYY format — e.g. "03/15/2024"
 * Used in printed hearing packet documents where a consistent short date is expected.
 * Returns "—" for empty/undefined values.
 */
export function formatDateShort(d?: string): string {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

/**
 * Long date format — e.g. "March 15, 2024"
 * Used in formal printed documents such as the cover page and NOH.
 * Returns "—" for empty/undefined values.
 */
export function formatDateLong(d?: string): string {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Long date with blank fallback — e.g. "March 15, 2024" or "_______________"
 * Used in legal/hearing forms where a visible blank is preferable to a dash.
 */
export function formatDateBlank(d?: string): string {
  if (!d) return '_______________';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Short date with blank fallback — e.g. "03/15/2024" or "_______________"
 * Used in printed enforcement/service forms where a short format blank is needed.
 */
export function formatDateShortBlank(d?: string): string {
  if (!d) return '_______________';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}
