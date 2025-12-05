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

export class Currency implements ICurrency {
  name: string;
  symbol: string;
  code: string;

  constructor(name: string, symbol: string, code: string) {
    this.name = name;
    this.symbol = symbol;
    this.code = code;
  }

  static fromJSON(json: any): Currency {
    return new Currency(json.name, json.symbol, json.code);
  }
}

export class CurrencyPair implements ICurrencyPair {
  base: ICurrency;
  quote: ICurrency;
  rate: number;
  date: Date;

  constructor(base: ICurrency, quote: ICurrency, rate: number, date: Date) {
    this.base = base;
    this.quote = quote;
    this.rate = rate;
    this.date = date;
  }

  getCanonicalPair(): CurrencyPair {
    if (this.base.code > this.quote.code) {
      return new CurrencyPair(this.quote, this.base, 1 / this.rate, this.date);
    }

    return this;
  }

  static getPairId(base: ICurrency | string, quote: ICurrency | string): string {
    const baseCode = typeof base === 'string' ? base : base.code;
    const quoteCode = typeof quote === 'string' ? quote : quote.code;

    if (baseCode > quoteCode) {
      return `${quoteCode}${baseCode}`;
    }
    return `${baseCode}${quoteCode}`;
  }
}