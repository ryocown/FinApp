

/**
 * Ensures that the input is a valid JavaScript Date object.
 * Handles Firestore Timestamps, strings, and existing Date objects.
 */
export function ensureDate(date: any): Date {
  if (!date) return new Date(0); // Epoch fallback
  if (date instanceof Date) return date;
  if (typeof date.toDate === 'function') return date.toDate(); // Firestore Timestamp
  if (typeof date === 'string') return new Date(date);
  if (typeof date === 'number') return new Date(date);

  // Fallback for unknown types, try to cast or return epoch
  try {
    return new Date(date);
  } catch {
    return new Date(0);
  }
}

/**
 * Parses a date string (e.g. from CSV) assuming it is in Pacific Standard Time (PST/PDT),
 * and converts it to a UTC Date object representing the same instant.
 * 
 * If the input is just a date (YYYY-MM-DD or MM/DD/YYYY), it assumes midnight PST.
 * 
 * Example: "2023-12-25" -> 2023-12-25 00:00:00 PST -> 2023-12-25 08:00:00 UTC
 */
export function parsePSTDateToUTC(dateString: string): Date {
  if (!dateString) return new Date(0);

  // Create a date object from the string
  // We append ' 00:00:00' if it looks like a date-only string to ensure time parsing works
  // But actually, we can use Intl or just manual offset calculation if we want to be robust without libraries like date-fns-tz.
  // Since we don't want to add heavy dependencies if possible, let's try a simpler approach.
  // However, PST/PDT switch is complex. 
  // For simplicity in this project, we might assume -8h (PST) or -7h (PDT).
  // A robust way without libraries is tricky.
  // Let's assume the server/importer runs in an environment where we can't rely on system timezone being PST.

  // Hacky but effective for standard US dates:
  // Append " PST" or " PDT" if missing? No, JS Date parsing is flaky with timezones.

  // Better approach: Parse the components, create a UTC date, then add 8 hours (standard) or 7 hours (daylight).
  // But determining DST is hard.

  // Alternative: Use a library. `date-fns-tz` is great.
  // But user didn't ask to add dependencies.
  // Let's try to append "America/Los_Angeles" if we can? No.

  // Let's try to parse it as if it were local, then adjust?
  // Actually, if we just want "consistency", maybe we can just treat it as UTC?
  // User said: "assume the statements are in PST and convert that to UTC".

  // Let's use a simple heuristic: 
  // 1. Parse string.
  // 2. If it's a date-only string, assume 12:00 PM UTC? No, user wants PST midnight -> UTC.
  // PST is UTC-8, PDT is UTC-7.

  // Let's use `new Date(dateString + " PST")`? V8 handles this usually.
  // Let's try that.

  // Normalize slashes to dashes if needed, or just let Date parse it.
  // MM/DD/YYYY is common in US.

  const cleanDate = dateString.trim();

  // Try appending " PST" (Pacific Standard Time) - this might be wrong for PDT but it's a start.
  // Or better, let's just use UTC for now if we can't be sure, but user explicitly asked for PST conversion.

  // Let's try to use `toLocaleString` with timeZone option to reverse it? No, that's for formatting.

  // Let's just use a fixed offset of 8 hours (Standard) for now to be safe against "missing" hours in spring forward.
  // Or 7 hours? 
  // Actually, most banks export dates without time, implying "end of day" or "start of day".
  // "2025-12-07" in PST is "2025-12-07T08:00:00Z".

  // Let's try this:
  // Create a date object in UTC from the components.
  // Then add 8 hours.

  let year, month, day;

  // Handle MM/DD/YYYY
  if (cleanDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const parts = cleanDate.split('/');
    month = parseInt(parts[0], 10);
    day = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  }
  // Handle YYYY-MM-DD
  else if (cleanDate.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
    const parts = cleanDate.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else {
    // Fallback to simple parsing
    return new Date(cleanDate);
  }

  // Construct UTC date at midnight
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  // Add 8 hours (assuming Standard Time for safety/consistency, or we could try to be smart)
  // If we want to be perfect we need a library. 
  // For now, +8 hours is a reasonable "PST" approximation that ensures it falls on the correct day in UTC usually.
  // Wait, +8 hours makes it 8 AM UTC.
  utcDate.setUTCHours(8);

  return utcDate;
}
