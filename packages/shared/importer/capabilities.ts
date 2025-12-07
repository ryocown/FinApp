import { SupportedInstitute } from '../models/institute';
import { AccountType } from '../models/account';
import type { IStatementImporter } from './importer';
import { ChaseCsvStatementImporter, ChaseCreditCsvStatementImporter } from './institutions/chase';
import { MorganStanleyStatementImporter } from './institutions/morgan_stanley';

export const INSTITUTE_SUPPORTED_ACCOUNTS: Record<SupportedInstitute, AccountType[]> = {
  [SupportedInstitute.CHASE]: [AccountType.BANK, AccountType.CREDIT_CARD],
  [SupportedInstitute.MORGAN_STANLEY]: [AccountType.INVESTMENT],
};

type ImporterConstructor = new (accountId: string, userId: string) => IStatementImporter;
type InstituteImporterMap = Partial<Record<AccountType, ImporterConstructor>>;

export const IMPORTER_REGISTRY: Record<SupportedInstitute, InstituteImporterMap> = {
  // Chase
  [SupportedInstitute.CHASE]: {
    [AccountType.BANK]: ChaseCsvStatementImporter,
    [AccountType.CREDIT_CARD]: ChaseCreditCsvStatementImporter,
  },

  // Morgan Stanley
  [SupportedInstitute.MORGAN_STANLEY]: {
    [AccountType.INVESTMENT]: MorganStanleyStatementImporter,
  }
};
export function getImporterForInstitute(instituteName: string, accountType: AccountType, accountId: string, userId: string): IStatementImporter | null {
  const instituteRegistry = IMPORTER_REGISTRY[instituteName as SupportedInstitute];
  if (!instituteRegistry) return null;

  const ImporterClass = instituteRegistry[accountType];
  if (!ImporterClass) return null;

  return new ImporterClass(accountId, userId);
}

