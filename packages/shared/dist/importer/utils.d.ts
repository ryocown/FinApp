export declare class TransactionUtils {
    static normalizeType(type: string): string;
    static titleCase(str: string): string;
    static parseDate(value: string | Date, baseDate?: Date | null, format?: string | null): Date;
    static createDeterministicHash(content: string): string;
}
