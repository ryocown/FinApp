/** @typedef {
 * {
 *      date: Date,
 *      amount: number,
 *      currency: string,
 *      rate: number,
 * }    
 */
let FxTransaction;

/** @typedef {
 * {
 *      name: string,
 *      category: string,
 *      type: string,
 * }    
 */
let MerchantData;

class Trasnaction {
    constructor() {
        this.raw = null;
        this.date = null;
        this.description = '';
        this.amount = 0;

        // Tax
        this.isTaxDeductable = false;
        this.hasCapitalGains = false;

        // Metadata
        /** @type {BANK_CONFIGS<T>} */
        this.config = config;
        this.reference = null;

        // Purchase Information 
        /** @type {MerchantData | null */
        this.merchantData = null;
        /** @type {FxTransaction | null} */
        this.fx = null;

    }
}