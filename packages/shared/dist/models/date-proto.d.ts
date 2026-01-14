export interface DateProto {
    timestamp: number;
    year: number;
    month: number;
    day: number;
    quarter: number;
}
export declare function toDateProto(date: Date): DateProto;
