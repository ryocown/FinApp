import { describe, test, expect } from '@jest/globals';
import { INSTITUTE_CAPABILITIES, getSupportedAccountTypes, getImporterForInstitute } from './capabilities';
import { SupportedInstitute } from '../models/institute';
import { AccountType } from '../models/account';

describe('Importer Capabilities', () => {
  test('INSTITUTE_CAPABILITIES should have Chase and Morgan Stanley', () => {
    expect(INSTITUTE_CAPABILITIES[SupportedInstitute.CHASE]).toBeDefined();
    expect(INSTITUTE_CAPABILITIES[SupportedInstitute.MORGAN_STANLEY]).toBeDefined();
  });

  test('getSupportedAccountTypes should return correct types for Chase', () => {
    const types = getSupportedAccountTypes(SupportedInstitute.CHASE);
    expect(types).toContain(AccountType.BANK);
    expect(types).toContain(AccountType.CREDIT_CARD);
  });

  test('getSupportedAccountTypes should return correct types for Morgan Stanley', () => {
    const types = getSupportedAccountTypes(SupportedInstitute.MORGAN_STANLEY);
    expect(types).toContain(AccountType.INVESTMENT);
  });

  test('getImporterForInstitute should return importer for valid inputs', () => {
    const importer = getImporterForInstitute(SupportedInstitute.CHASE, AccountType.BANK, 'test-acc', 'test-user');
    expect(importer).toBeDefined();
  });

  test('getImporterForInstitute should return null for invalid inputs', () => {
    const importer = getImporterForInstitute(SupportedInstitute.CHASE, AccountType.INVESTMENT, 'test-acc', 'test-user');
    expect(importer).toBeNull();
  });
});
