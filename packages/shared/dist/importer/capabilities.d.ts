import { SupportedInstitute } from '../models/institute.js';
import { AccountType } from '../models/account.js';
import type { StatementImporterProto } from './importer.js';
type ImporterConstructor = new (accountId: string, userId: string) => StatementImporterProto;
export declare const INSTITUTE_CAPABILITIES: Record<SupportedInstitute, Partial<Record<AccountType, ImporterConstructor>>>;
export declare function getSupportedAccountTypes(institute: SupportedInstitute): AccountType[];
export declare function getImporterForInstitute(instituteName: string, accountType: AccountType, accountId: string, userId: string): StatementImporterProto | null;
export {};
