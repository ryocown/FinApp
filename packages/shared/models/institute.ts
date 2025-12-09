import { v4 } from "uuid";
import type { IAccount } from "./account";

export enum SupportedInstitute {
    CHASE = 'Chase',
    MORGAN_STANLEY = 'Morgan Stanley',
    PAYPAY = 'PayPay'
}

export interface IInstitute {
    instituteId: string;
    name: string;
    userId: string;
    accounts?: IAccount[];
}

export class Institute implements IInstitute {
    instituteId: string;
    name: string;
    userId: string;
    accounts: IAccount[];

    constructor(name: string, userId: string, accounts: IAccount[]) {
        this.instituteId = v4();
        this.name = name;
        this.userId = userId;
        this.accounts = accounts;
    }
}