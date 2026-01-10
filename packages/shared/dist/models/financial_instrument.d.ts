export declare enum InstrumentType {
    Unknown = "UNKNOWN",
    Invalid = "INVALID",
    Stock = "STOCK",
    Bond = "BOND",
    Option = "OPTION",
    Index = "INDEX",
    Future = "FUTURE",
    Other = "OTHER"
}
export interface IFinancialInstrument {
    instrumentId: string;
    accountId: string;
    isin?: string;
    cusip: string;
    type: InstrumentType;
    name: string;
    sector?: string;
}
export declare enum Sector {
    Unknown = "UNKNOWN",
    Invalid = "INVALID",
    Energy = "ENERGY",
    Financials = "FINANCIALS",
    Healthcare = "HEALTHCARE",
    Industrials = "INDUSTRIALS",
    Materials = "MATERIALS",
    RealEstate = "REAL_ESTATE",
    Technology = "TECHNOLOGY",
    Utilities = "UTILITIES",
    Other = "OTHER"
}
/**
 * Stocks
 *
 * All stocks are required to have ISIN
 * US stocks can be identified with CUSIP and ticker
 * JP stocks can be identified with ticker only
 */
export interface StockInstrument extends IFinancialInstrument {
    type: InstrumentType.Stock;
    ticker?: string;
}
/**
 * Bonds
 * For the love of god dont trade bonds.
 */
export declare enum BondType {
    Corporate = "CORPORATE",
    Municipal = "MUNICIPAL",
    Treasury = "TREASURY",
    Other = "OTHER"
}
export interface BondInstrument extends IFinancialInstrument {
    type: InstrumentType.Bond;
    bondType: BondType;
    couponRate: number;
    maturityDate: Date;
    faceValue: number;
}
/**
 * Derivatives
 */
export declare enum OptionType {
    Call = "CALL",
    Put = "PUT"
}
export interface UnderlyingAsset {
    underlyingIsin: string;
    underlyingTicker: string;
    underlyingType: InstrumentType.Stock | InstrumentType.Index | InstrumentType.Future;
}
export interface OptionInstrument extends IFinancialInstrument, UnderlyingAsset {
    type: InstrumentType.Option;
    optionType: OptionType;
    strikePrice: number;
    optionSymbol: string;
    expirationDate: Date;
}
/**
 * examples
 */
