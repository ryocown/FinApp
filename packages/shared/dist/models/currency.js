export class Currency {
    name;
    symbol;
    code;
    constructor(name, symbol, code) {
        this.name = name;
        this.symbol = symbol;
        this.code = code;
    }
    static fromJSON(json) {
        return new Currency(json.name, json.symbol, json.code);
    }
}
export class CurrencyPair {
    base;
    quote;
    rate;
    date;
    constructor(base, quote, rate, date) {
        this.base = base;
        this.quote = quote;
        this.rate = rate;
        this.date = date;
    }
    getCanonicalPair() {
        if (this.base.code > this.quote.code) {
            return new CurrencyPair(this.quote, this.base, 1 / this.rate, this.date);
        }
        return this;
    }
    static getPairId(base, quote) {
        const baseCode = typeof base === 'string' ? base : base.code;
        const quoteCode = typeof quote === 'string' ? quote : quote.code;
        if (baseCode > quoteCode) {
            return `${quoteCode}${baseCode}`;
        }
        return `${baseCode}${quoteCode}`;
    }
}
