import { v4 } from "uuid";
import type { Account } from "./account.js";

export enum SupportedInstitute {
    CHASE = 'Chase',
    MORGAN_STANLEY = 'Morgan Stanley',
    PAYPAY = 'PayPay'
}

export enum InstituteTypes {
    BANK = 'Bank',
    BROKERAGE = 'Brokerage',
    FINANCIAL_SERVICE = 'Financial Service',
    SUPERANNUATION = 'Superannuation',
    OTHER = 'Other'
}

export interface InstituteProp {
    instituteId: string;
    name: string;
    userId: string;
    accounts?: Account[];
    type: InstituteTypes;
    supportedInstituteId?: string;
}

export interface SupportedInstituteProp {
    instituteId: string;
    commonName: string;
    displayName: string;
    shortName: string;
    logo: string;
    logoFull: string;
    type: InstituteTypes;
    supportedInstituteId?: string;
}

export class Institute implements InstituteProp {
    instituteId: string;
    name: string;
    userId: string;
    accounts: Account[];
    type: InstituteTypes;
    supportedInstituteId?: string;

    constructor(name: string, userId: string, accounts: Account[], type: InstituteTypes, supportedInstituteId?: string) {
        this.instituteId = v4();
        this.name = name;
        this.userId = userId;
        this.accounts = accounts;
        this.type = type;
        this.supportedInstituteId = supportedInstituteId;
    }

    static fromProp(prop: InstituteProp): Institute {
        const inst = new Institute(prop.name, prop.userId, prop.accounts || [], prop.type, prop.supportedInstituteId);
        inst.instituteId = prop.instituteId;
        return inst;
    }
}