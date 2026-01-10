export var InstrumentType;
(function (InstrumentType) {
    InstrumentType["Unknown"] = "UNKNOWN";
    InstrumentType["Invalid"] = "INVALID";
    InstrumentType["Stock"] = "STOCK";
    InstrumentType["Bond"] = "BOND";
    InstrumentType["Option"] = "OPTION";
    InstrumentType["Index"] = "INDEX";
    InstrumentType["Future"] = "FUTURE";
    InstrumentType["Other"] = "OTHER";
})(InstrumentType || (InstrumentType = {}));
export var Sector;
(function (Sector) {
    Sector["Unknown"] = "UNKNOWN";
    Sector["Invalid"] = "INVALID";
    Sector["Energy"] = "ENERGY";
    Sector["Financials"] = "FINANCIALS";
    Sector["Healthcare"] = "HEALTHCARE";
    Sector["Industrials"] = "INDUSTRIALS";
    Sector["Materials"] = "MATERIALS";
    Sector["RealEstate"] = "REAL_ESTATE";
    Sector["Technology"] = "TECHNOLOGY";
    Sector["Utilities"] = "UTILITIES";
    Sector["Other"] = "OTHER";
})(Sector || (Sector = {}));
/**
 * Bonds
 * For the love of god dont trade bonds.
 */
export var BondType;
(function (BondType) {
    BondType["Corporate"] = "CORPORATE";
    BondType["Municipal"] = "MUNICIPAL";
    BondType["Treasury"] = "TREASURY";
    BondType["Other"] = "OTHER";
})(BondType || (BondType = {}));
/**
 * Derivatives
 */
export var OptionType;
(function (OptionType) {
    OptionType["Call"] = "CALL";
    OptionType["Put"] = "PUT";
})(OptionType || (OptionType = {}));
/**
 * examples
 */
// const appleCallOption: OptionInstrument = {
//   instrumentId: v4(),
//   accountId: "",
//   // Note: ISINs for options are often constructed based on the underlying
//   isin: 'US0378331005_OPT_241231C100',
//   cusip: '037833C10',
//   type: InstrumentType.Option,
//   name: 'AAPL Dec 31 2024 Call @ $100',
//   underlyingIsin!: appleCommonStock.isin,
//   underlyingTicker: 'AAPL',
//   underlyingType: InstrumentType.Stock,
//   optionType: OptionType.Call,
//   strikePrice: 100.00,
//   optionSymbol: 'AAPL241231C00100000',
//   expirationDate: new Date('2024-12-31'),
// };
