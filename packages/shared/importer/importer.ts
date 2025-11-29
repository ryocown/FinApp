import { IStatement } from "../models/statement";

export interface IStatementImporter {
  import(source: any, accountId: string): Promise<IStatement>;
}