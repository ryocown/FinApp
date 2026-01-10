import type { Account } from "./account.js";
export declare enum SupportedInstitute {
    CHASE = "Chase",
    MORGAN_STANLEY = "Morgan Stanley",
    PAYPAY = "PayPay"
}
export declare enum InstituteTypes {
    BANK = "Bank",
    BROKERAGE = "Brokerage",
    FINANCIAL_SERVICE = "Financial Service",
    SUPERANNUATION = "Superannuation",
    OTHER = "Other"
}
export interface InstituteProp {
    instituteId: string;
    name: string;
    userId: string;
    accounts?: Account[];
    type: InstituteTypes;
}
export interface SupportedInstituteProp {
    instituteId: string;
    commonName: string;
    displayName: string;
    shortName: string;
    logo: string;
    logoFull: string;
    type: InstituteTypes;
}
export declare class Institute implements InstituteProp {
    instituteId: string;
    name: string;
    userId: string;
    accounts: Account[];
    type: InstituteTypes;
    constructor(name: string, userId: string, accounts: Account[], type: InstituteTypes);
    static fromProp(prop: InstituteProp): Institute;
}
