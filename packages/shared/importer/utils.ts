import { createDeterministicHash } from '../lib/hash.js';

export class TransactionUtils {

    static normalizeType(type: string): string {
        if (!type) return 'General';
        // Capitalize first letter
        return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    }

    static titleCase(str: string): string {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
    }

    static parseDate(value: string | Date, baseDate: Date | null = null, format: string | null = null): Date {
        if (value instanceof Date) return value;
        if (!value) return new Date();

        // Handle DD/MM/YYYY or DD/MM/YY
        if (format === 'DD/MM/YYYY' || format === 'DD/MM/YY') {
            const parts = value.split(/[\/\-\.]/);
            if (parts.length >= 2) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                let year = new Date().getFullYear();

                if (parts.length > 2) {
                    year = parseInt(parts[2], 10);
                    if (year < 100) year += 2000;
                } else if (baseDate) {
                    year = baseDate.getFullYear();
                }

                return new Date(year, month, day);
            }
        }

        // Handle DD MMM or D MMM (e.g. 14 Jan)
        if (format === 'D MMM' || format === 'DD MMM') {
            const parts = value.split(' ');
            if (parts.length >= 2) {
                const day = parseInt(parts[0], 10);
                const monthStr = parts[1].toLowerCase();
                const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                const month = months.findIndex(m => monthStr.startsWith(m));

                let year = new Date().getFullYear();
                if (baseDate) year = baseDate.getFullYear();

                // Adjust for year boundary if needed could be complex, assuming current/base year
                return new Date(year, month, day);
            }
        }

        const d = new Date(value);
        if (!isNaN(d.getTime())) return d;

        console.warn(`Could not parse date: ${value}`);
        return new Date();
    }

    static createDeterministicHash(content: string): string {
        return createDeterministicHash(content);
    }
}
