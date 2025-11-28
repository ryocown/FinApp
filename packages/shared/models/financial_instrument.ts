export enum InstrumentType {
  Unknown = 'UNKNOWN',
  Invalid = 'INVALID',
  Stock = 'STOCK',
  Bond = 'BOND',
  Option = 'OPTION',
  Index = 'INDEX',
  Future = 'FUTURE',
  Other = 'OTHER',
}

export interface FinancialInstrument {
  instrumentId: string;
  accountId: string;

  isin: string;
  cusip: string;
  type: InstrumentType;
  name: string;

  sector?: string;
}

export enum Sector {
  Unknown = 'UNKNOWN',
  Invalid = 'INVALID',
  Energy = 'ENERGY',
  Financials = 'FINANCIALS',
  Healthcare = 'HEALTHCARE',
  Industrials = 'INDUSTRIALS',
  Materials = 'MATERIALS',
  RealEstate = 'REAL_ESTATE',
  Technology = 'TECHNOLOGY',
  Utilities = 'UTILITIES',
  Other = 'OTHER'
}

/**
 * Stocks
 */

export interface StockInstrument extends FinancialInstrument {
  type: InstrumentType.Stock;
  // apparently only stocks and mutual funds have ticker
  // mutual funds trades like stocks anyways
  ticker?: string;
}

/**
 * Bonds
 * For the love of god dont trade bonds.
 */

export enum BondType {
  Corporate = 'CORPORATE',
  Municipal = 'MUNICIPAL',
  Treasury = 'TREASURY',
  Other = 'OTHER',
}

export interface BondInstrument extends FinancialInstrument {
  type: InstrumentType.Bond;
  bondType: BondType;
  couponRate: number;
  maturityDate: Date;
  faceValue: number;
}

/**
 * Derivatives
 */

export enum OptionType {
  Call = 'CALL',
  Put = 'PUT',
}

export interface UnderlyingAsset {
  underlyingIsin: string;
  underlyingTicker: string;
  underlyingType: InstrumentType.Stock | InstrumentType.Index | InstrumentType.Future;
}

export interface OptionInstrument extends FinancialInstrument, UnderlyingAsset {
  type: InstrumentType.Option;
  optionType: OptionType;
  strikePrice: number;
  optionSymbol: string;
  expirationDate: Date;
}

/**
 * examples
 */

const appleCommonStock: StockInstrument = {
  instrumentId: "",
  accountId: "",
  isin: 'US0378331005',
  cusip: '037833100',
  type: InstrumentType.Stock,
  name: 'Apple Inc. Common Stock',
  ticker: 'AAPL',
};

const appleBond: BondInstrument = {
  instrumentId: "",
  accountId: "",
  isin: 'US037833AV20',
  cusip: '037833AV2',
  type: InstrumentType.Bond,
  name: 'Apple Corporate Bond 2.4% 2027',
  bondType: BondType.Corporate,
  couponRate: 0.024,
  maturityDate: new Date('2027-05-03'),
  faceValue: 1000,
};

const appleCallOption: OptionInstrument = {
  instrumentId: "",
  accountId: "",
  // Note: ISINs for options are often constructed based on the underlying
  isin: 'US0378331005_OPT_241231C100',
  cusip: '037833C10',
  type: InstrumentType.Option,
  name: 'AAPL Dec 31 2024 Call @ $100',

  underlyingIsin: appleCommonStock.isin,
  underlyingTicker: 'AAPL',
  underlyingType: InstrumentType.Stock,

  optionType: OptionType.Call,
  strikePrice: 100.00,
  optionSymbol: 'AAPL241231C00100000',
  expirationDate: new Date('2024-12-31'),
};