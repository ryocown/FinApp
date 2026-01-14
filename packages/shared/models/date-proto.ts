export interface DateProto {
    timestamp: number; // Unix timestamp for sorting
    year: number;
    month: number;     // 1-12
    day: number;       // 1-31
    quarter: number;   // 1-4
}

export function toDateProto(date: Date): DateProto {
    return {
        timestamp: date.getTime(),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        quarter: Math.floor(date.getMonth() / 3) + 1
    };
}
