import type { IAccount } from "./account";

export class Institute {
    name: string;
    accounts: IAccount[];
    owner: string; // UserId

    constructor(name: string, owner: string, accounts: IAccount[]) {
        this.name = name;
        this.owner = owner;
        this.accounts = accounts;
    }
}