import { describe, it, expect } from '@jest/globals';
import { ensureDate, parsePSTDateToUTC } from './date_utils';

describe('ensureDate', () => {
    it('should return epoch for null/undefined input', () => {
        expect(ensureDate(null).getTime()).toBe(0);
        expect(ensureDate(undefined).getTime()).toBe(0);
    });

    it('should pass through Date objects unchanged', () => {
        const date = new Date('2025-01-15T12:00:00Z');
        const result = ensureDate(date);
        expect(result).toBe(date); // Same reference
    });

    it('should convert ISO string to Date', () => {
        const result = ensureDate('2025-06-15T00:00:00Z');
        expect(result.getFullYear()).toBe(2025);
        expect(result.getMonth()).toBe(5); // June is month 5 (0-indexed)
        expect(result.getDate()).toBe(15);
    });

    it('should convert numeric timestamp to Date', () => {
        const timestamp = 1704067200000; // Jan 1, 2024 00:00:00 UTC
        const result = ensureDate(timestamp);
        expect(result.getTime()).toBe(timestamp);
    });

    it('should handle Firestore Timestamp-like objects with toDate()', () => {
        const mockTimestamp = {
            toDate: () => new Date('2025-03-20T15:30:00Z')
        };
        const result = ensureDate(mockTimestamp);
        expect(result.toISOString()).toBe('2025-03-20T15:30:00.000Z');
    });
});

describe('parsePSTDateToUTC', () => {
    it('should return epoch for empty string', () => {
        expect(parsePSTDateToUTC('').getTime()).toBe(0);
    });

    it('should parse YYYY-MM-DD format and add PST offset (8 hours)', () => {
        const result = parsePSTDateToUTC('2025-12-25');
        // PST midnight = UTC 08:00
        expect(result.getUTCFullYear()).toBe(2025);
        expect(result.getUTCMonth()).toBe(11); // December
        expect(result.getUTCDate()).toBe(25);
        expect(result.getUTCHours()).toBe(8);
    });

    it('should parse MM/DD/YYYY format (US bank statement format)', () => {
        const result = parsePSTDateToUTC('03/15/2025');
        expect(result.getUTCFullYear()).toBe(2025);
        expect(result.getUTCMonth()).toBe(2); // March
        expect(result.getUTCDate()).toBe(15);
        expect(result.getUTCHours()).toBe(8);
    });

    it('should handle single-digit month and day', () => {
        const result = parsePSTDateToUTC('1/5/2025');
        expect(result.getUTCMonth()).toBe(0); // January
        expect(result.getUTCDate()).toBe(5);
    });

    it('should handle whitespace in input', () => {
        const result = parsePSTDateToUTC('  2025-07-04  ');
        expect(result.getUTCFullYear()).toBe(2025);
        expect(result.getUTCMonth()).toBe(6); // July
        expect(result.getUTCDate()).toBe(4);
    });
});
