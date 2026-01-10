import type { IFinancialInstrument } from "@finapp/shared";

export interface IQuoteProvider {
  getInstrumentByCusip(cusip: string): Promise<Partial<IFinancialInstrument> | null>;
}