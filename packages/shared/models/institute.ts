import { v4 } from "uuid";
import type { Account } from "./account";

export enum SupportedInstitute {
    CHASE = 'Chase',
    MORGAN_STANLEY = 'Morgan Stanley'
}

export interface IInstitute {
    instituteId: string;
    name: string;
    userId: string;
    accounts?: Account[];
}

export class Institute implements IInstitute {
    instituteId: string;
    name: string;
    userId: string;
    accounts: Account[];

    constructor(name: string, userId: string, accounts: Account[]) {
        this.instituteId = v4();
        this.name = name;
        this.userId = userId;
        this.accounts = accounts;
    }
}