import { Sector } from "@finapp/shared";

export interface IAIProvider {
  getSector(companyName: string): Promise<Sector | null>;
}