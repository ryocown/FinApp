import { SupportedInstitute } from '../models/institute.js';
import { AccountType } from '../models/account.js';
import { ChaseCsvStatementImporter as ChaseBankStatementImporter, ChaseCreditCsvStatementImporter as ChaseCreditStatementImporter } from './institutions/chase.js';
import { MorganStanleyStatementImporter } from './institutions/morgan_stanley.js';
import { PayPayStatementImporter } from './institutions/paypay.js';
// This maps the institute to the account types it supports.
export const INSTITUTE_CAPABILITIES = {
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
export function getSupportedAccountTypes(institute) {
    const capabilities = INSTITUTE_CAPABILITIES[institute];
    return capabilities ? Object.keys(capabilities) : [];
}
export function getImporterForInstitute(instituteName, accountType, accountId, userId) {
    const instituteCapabilities = INSTITUTE_CAPABILITIES[instituteName];
    if (!instituteCapabilities)
        return null;
    const ImporterClass = instituteCapabilities[accountType];
    if (!ImporterClass)
        return null;
    return new ImporterClass(accountId, userId);
}
