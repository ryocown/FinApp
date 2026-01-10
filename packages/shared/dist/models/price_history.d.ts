export interface IPricePoint {
    pricePointId: string;
    targetId: string;
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export declare class PricePoint implements IPricePoint {
    pricePointId: string;
    targetId: string;
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    constructor(targetId: string, date: Date, open: number, high: number, low: number, close: number, volume: number);
    static fromJSON(json: any): PricePoint;
}
