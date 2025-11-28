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

const StockTransactionType = {
    BUY: 'Buy',
    SELL: 'Sell',
    DIVIDEND: 'Dividend',
    INTEREST: 'Interest',
    REDEMPTION: 'Redemption',
    TRANSFER: 'Transfer',
    UNKNOWN: null
}

const StockSecurityType = {
    EQUITY: 'Equity',
    CRYPTO: 'Crypto',
    CFD: 'CFD',
    ETF: 'ETF',
    FOLLOW: 'Follow',
    FX: 'FX',
    OPTIONS: 'Options',
    BONDS: 'Bonds',
    CURRENCY: 'Currency',
    UNKNOWN: null
}

class StockTransaction extends Transaction {
    constructor(config) {
        super(config);

        // Basic Data
        this.category = StockSecurityType.UNKNOWN;
        this.type = StockTransactionType.UNKNOWN;

        // Core Data
        this.name = null;
        this.merchant = null;
        /** @type {MerchantData | null */
        this.merchantData = null;
        // Metadata
        this.reference = null;
        this.account = null;      // Account info from bank statement if available.


        // Location Data
        this.location = null;     // Raw capture (e.g. "JP")
        this.city = null;         // Raw capture (e.g. "Hyogo")
        this.state = null;
        this.country = null;
        /**@type {LocationData | null} */
        this.locationData = null; // The Full DB Object
    }

    /**
     * Sets the amount and credit flag.
     * Debits are positive, Credits are negative in this system.
     */
    setAmount(amount, isCredit = false) {
        if (amount == null) {
            this.amount = 0;
            return;
        }

        const val = parseFloat(String(amount).replace(/,/g, ''));
        this.amount = Math.abs(val);
        this.credit = isCredit;

        // Invert for credit
        if (isCredit) this.amount = -this.amount;
    }

    /**
     * Tracks balance amount from Bank statements.
     */
    setBalance(balance) {
        if (balance === null || balance === undefined) {
            this.balance = null;
            return;
        }
        this.balance = parseFloat(String(balance).replace(/[CR,]/g, '').trim());
        if (this.spendCurrency && this.spendCurrency !== 'AUD') {
            if (this.spendAmount && this.amount) {
                this.rate = Math.abs(this.amount) / this.spendAmount;
            }

            this.fx = {
                date: this.spendDate || this.date,
                amount: parseFloat(this.spendAmount),
                currency: this.spendCurrency,
                rate: this.rate
            };
        }
    }

    /**
     * THE BRAIN: Finalizes the transaction after basic parsing.
     * Resolves Location, Categories, Names, and Rates.
     */
    finalize() {
        // 1. Calculate Exchange Rate
        this._resolveCurrency();

        // 2. Resolve Name and Category
        this._resolveMerchantDetails();

        // 3. Skip logic for types that don't need location (Refunds, Transfers, etc.)
        const skipTypes = [
            TransactionType.REFUND,
            TransactionType.TRANSFER_IN,
            TransactionType.TRANSFER_OUT,
            TransactionType.INTEREST,
            TransactionType.PAYMENT
        ];

        if (skipTypes.includes(this.type)) return this;

        // 4. Resolve Location
        this._resolveLocations();

        // 5. Resolve Trip Association
        this.trip = TransactionUtils.resolveTrip(this.category, this.spendDate || this.date);

        return this;
    }

    /**
     * Resolves the merchant name and category.
     */
    _resolveMerchantDetails() {
        if (this.type === TransactionType.INTEREST) {
            this.name = `${this.config.name} Interest`;
            this.category = 'Interest';
            this.merchantData = {
                name: this.name,
                category: this.category,
                type: 'Interest'
            };
            return;
        }
        if (this.merchant) {
            this.merchantData = TransactionUtils.resolveName(this.merchant);
            this.name = this.merchantData.name;
            this.category = this.merchantData.category || this.category;
        }
    }

    /**
     * Resolves the exchange rate for the transaction.
     */
    _resolveCurrency() {
        if (this.spendCurrency && this.spendCurrency !== 'AUD') {
            if (this.spendAmount && this.amount) {
                this.rate = Math.abs(this.amount) / this.spendAmount;
            }

            this.fx = {
                date: this.spendDate || this.date,
                amount: parseFloat(this.spendAmount),
                currency: this.spendCurrency,
                rate: this.rate
            };
        }
    }

    /**
     * Internal helper to handle the complex Location Cascading logic
     */
    _resolveLocations() {

        if (this.spendCurrency === 'USD' && this.country && US_STATES[this.country]) {
            this.state = this.country;        // "CO" moves to State
            this.country = "United States";   // Country becomes US
            this.location = "US";             // Update raw location code context
        }

        const rawCountry = this.country || this.location;
        this.rawCountry = this.country;
        // Assumption: LocationService is a global object
        let workingCountryCode = LocationService.resolveCountryCode(rawCountry);

        this.locationData = null;

        // Strategy A: Check Captured City
        if (this.city) {
            const rawCity = this.city.trim();

            // 1. Exact DB Match
            this.locationData = LocationService.findExact(rawCity, workingCountryCode);

            // 2. Fuzzy Match on Captured City
            if (!this.locationData) {
                // Assumption: FuzzyMatcher is a global object
                this.locationData = FuzzyMatcher.findBestMatch(rawCity, workingCountryCode);
            }
        }

        // Strategy B: Deep Scan Description
        // If capture failed, scan the full merchant string
        if (!this.locationData) {
            const textToScan = [this.merchant, this.description, this.name].join(' ');
            this.locationData = FuzzyMatcher.findBestMatch(textToScan, workingCountryCode);
        }

        // Apply Results
        if (this.locationData) {
            this.city = this.locationData.city;
            this.state = this.locationData.state;
            this.country = this.locationData.countryName;
        } else {
            // Fallback formatting
            if (this.city) this.city = titleCase(this.city).trim();
            this.country = LocationService.resolveCountryName(workingCountryCode);
        }
    }
}