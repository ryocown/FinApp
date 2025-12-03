import { Sector } from "@finapp/shared/models/financial_instrument";

export interface IAIProvider {
  getSector(companyName: string): Promise<Sector | null>;
}