import { SupportedInstitute } from '../models/institute';
import { AccountType } from '../models/account';
import type { IStatementImporter } from './importer';
import { ChaseCsvStatementImporter as ChaseBankStatementImporter, ChaseCreditCsvStatementImporter as ChaseCreditStatementImporter } from './institutions/chase';
import { MorganStanleyStatementImporter } from './institutions/morgan_stanley';
import { PayPayStatementImporter } from './institutions/paypay';

type ImporterConstructor = new (accountId: string, userId: string) => IStatementImporter;

// This maps the institute to the account types it supports.
export const INSTITUTE_CAPABILITIES: Record<SupportedInstitute, Partial<Record<AccountType, ImporterConstructor>>> = {

  // Chase
  [SupportedInstitute.CHASE]: {
    // All "banking" accounts, i.e., checking and savings accounts, use the same importer
    [AccountType.BANK]: ChaseBankStatementImporter,
    // All "credit card" accounts use the same importer
    [AccountType.CREDIT_CARD]: ChaseCreditStatementImporter,
  },

  // Morgan Stanley
  [SupportedInstitute.MORGAN_STANLEY]: {
    // Investment accounts should use `MorganStanleyStatementImporter`
    [AccountType.INVESTMENT]: MorganStanleyStatementImporter,
    [AccountType.LOAN]: MorganStanleyStatementImporter,
  },

  // PayPay
  [SupportedInstitute.PAYPAY]: {
    [AccountType.CREDIT_CARD]: PayPayStatementImporter,
  }

};

export function getSupportedAccountTypes(institute: SupportedInstitute): AccountType[] {
  const capabilities = INSTITUTE_CAPABILITIES[institute];
  return capabilities ? (Object.keys(capabilities) as AccountType[]) : [];
}

export function getImporterForInstitute(instituteName: string, accountType: AccountType, accountId: string, userId: string): IStatementImporter | null {
  const instituteCapabilities = INSTITUTE_CAPABILITIES[instituteName as SupportedInstitute];
  if (!instituteCapabilities) return null;

  const ImporterClass = instituteCapabilities[accountType];
  if (!ImporterClass) return null;

  return new ImporterClass(accountId, userId);
}

