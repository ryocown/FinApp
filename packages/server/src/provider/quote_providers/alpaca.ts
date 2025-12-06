import Alpaca from '@alpacahq/alpaca-trade-api';
import { InstrumentType, type IFinancialInstrument, type StockInstrument } from "@finapp/shared/models/financial_instrument";
import type { IQuoteProvider } from "../quote_provider";
import { logger } from "../../logger";

export class AlpacaQuoteProvider implements IQuoteProvider {
  private alpaca: Alpaca;

  constructor() {
    const config: { keyId?: string; secretKey?: string; paper?: boolean } = {
      paper: true,
    };
    if (process.env.APCA_API_KEY_ID) {
      config.keyId = process.env.APCA_API_KEY_ID;
    }
    if (process.env.APCA_API_SECRET_KEY) {
      config.secretKey = process.env.APCA_API_SECRET_KEY;
    }
    this.alpaca = new Alpaca(config);
  }

  async getInstrumentByCusip(cusip: string): Promise<Partial<IFinancialInstrument> | null> {
    try {
      // Alpaca getAsset supports symbol or ID. 
      // Based on user input, we assume it might support CUSIP or we might need to search.
      // However, the user provided a curl example using what looked like a CUSIP in the path.
      // Let's try to get by CUSIP directly first.
      const asset = await this.alpaca.getAsset(cusip);

      if (!asset) {
        return null;
      }

      // Map Alpaca asset to StockInstrument
      // Alpaca asset class 'us_equity' maps to Stock
      if (asset.class === 'us_equity') {
        const instrument: Partial<StockInstrument> = {
          cusip: cusip,
          name: asset.name,
          type: InstrumentType.Stock,
          ticker: asset.symbol,
        };
        return instrument;
      }

      // For other types, we return a generic partial instrument
      return {
        cusip: cusip,
        name: asset.name,
        type: InstrumentType.Unknown,
      };
    } catch (error) {
      logger.error(`Error fetching instrument for CUSIP ${cusip} from Alpaca:`, error);
      return null;
    }
  }
}