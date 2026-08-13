// Shared date/time helpers.
// All wall-clock times in the app are displayed in Eastern Time (America/New_York),
// the timezone of Scribbles Learning Center — matching the backend, which stores and
// queries times in America/New_York. This mirrors the pattern used in AdminInquiries.

export const TIME_ZONE = 'America/New_York';

// API timestamps sometimes arrive without a timezone marker (e.g. "2026-08-13T17:46:00").
// They represent UTC, so append 'Z' when no zone info is present. This makes parsing
// consistent across browsers/devices regardless of their local timezone.
export const normalizeTimestamp = (ts) => {
  if (!ts || ts instanceof Date) return ts;
  let iso = String(ts);
  if (!iso.endsWith('Z') && !iso.includes('+') && !iso.includes('-', 10)) {
    iso += 'Z';
  }
  return iso;
};

// Parse a timestamp (string or Date) into a Date, or null if invalid.
export const parseTimestamp = (ts) => {
  if (!ts) return null;
  const d = ts instanceof Date ? ts : new Date(normalizeTimestamp(ts));
  return Number.isNaN(d.getTime()) ? null : d;
};

// "1:46 PM" — for check-in/out and punch times.
export const formatTimeET = (ts, fallback = '-') => {
  const d = parseTimestamp(ts);
  if (!d) return fallback;
  return d.toLocaleTimeString('en-US', {
    timeZone: TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// "Aug 13, 2026, 1:46 PM" — for full timestamps like audit log entries.
export const formatDateTimeET = (ts, fallback = '-') => {
  const d = parseTimestamp(ts);
  if (!d) return fallback;
  return d.toLocaleString('en-US', {
    timeZone: TIME_ZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

// Format the DATE PART of a full timestamp in Eastern Time (e.g. photo consent dates).
export const formatTimestampDateET = (
  ts,
  options = { month: 'numeric', day: 'numeric', year: 'numeric' },
  fallback = '-'
) => {
  const d = parseTimestamp(ts);
  if (!d) return fallback;
  return d.toLocaleDateString('en-US', { timeZone: TIME_ZONE, ...options });
};

// For DATE-ONLY values like "2026-08-13" (birthdays, hire dates, absence dates).
// new Date("YYYY-MM-DD") parses as UTC *midnight*, which displays as the PREVIOUS day
// in US timezones. Anchoring at local noon keeps the calendar date stable.
export const parseDateOnly = (d) => {
  if (!d) return null;
  const datePart = String(d).split('T')[0];
  const parsed = new Date(datePart + 'T12:00:00');
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// "Aug 13, 2026" (options configurable) — for date-only values.
export const formatDateET = (
  d,
  options = { month: 'short', day: 'numeric', year: 'numeric' },
  fallback = '-'
) => {
  const parsed = parseDateOnly(d);
  if (!parsed) return fallback;
  return parsed.toLocaleDateString('en-US', options);
};

// Convert a UTC timestamp into an Eastern Time "YYYY-MM-DDTHH:mm" string for
// <input type="datetime-local"> fields, so admins always see and edit ET wall time
// no matter what timezone their own device is set to.
export const toEasternInputValue = (ts) => {
  const d = parseTimestamp(ts);
  if (!d) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .formatToParts(d)
    .reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`;
};

// Current moment as an ET datetime-local input value.
export const nowEasternInputValue = () => toEasternInputValue(new Date());
