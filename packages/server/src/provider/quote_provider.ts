import type { IFinancialInstrument } from "@finapp/shared/models/financial_instrument";

export interface IQuoteProvider {
  getInstrumentByCusip(cusip: string): Promise<Partial<IFinancialInstrument> | null>;
}