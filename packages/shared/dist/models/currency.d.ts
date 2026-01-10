export interface ICurrency {
    name: string;
    symbol: string;
    code: string;
}
export interface ICurrencyPair {
    base: ICurrency;
    quote: ICurrency;
    rate: number;
    date: Date;
}
export declare class Currency implements ICurrency {
    name: string;
    symbol: string;
    code: string;
    constructor(name: string, symbol: string, code: string);
    static fromJSON(json: any): Currency;
}
export declare class CurrencyPair implements ICurrencyPair {
    base: ICurrency;
    quote: ICurrency;
    rate: number;
    date: Date;
    constructor(base: ICurrency, quote: ICurrency, rate: number, date: Date);
    getCanonicalPair(): CurrencyPair;
    static getPairId(base: ICurrency | string, quote: ICurrency | string): string;
}
