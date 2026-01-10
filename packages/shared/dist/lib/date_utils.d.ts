/**
 * Ensures that the input is a valid JavaScript Date object.
 * Handles Firestore Timestamps, strings, and existing Date objects.
 */
export declare function ensureDate(date: any): Date;
/**
 * Parses a date string (e.g. from CSV) assuming it is in Pacific Standard Time (PST/PDT),
 * and converts it to a UTC Date object representing the same instant.
 *
 * If the input is just a date (YYYY-MM-DD or MM/DD/YYYY), it assumes midnight PST.
 *
 * Example: "2023-12-25" -> 2023-12-25 00:00:00 PST -> 2023-12-25 08:00:00 UTC
 */
export declare function parsePSTDateToUTC(dateString: string): Date;
/**
 * Parses a date string (e.g. "2025/12/07 13:02:19") assuming it is in Japan Standard Time (JST),
 * and converts it to a UTC Date object.
 * JST is UTC+9.
 */
export declare function parseJSTDateToUTC(dateString: string): Date;
