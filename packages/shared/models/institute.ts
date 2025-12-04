import type { Account } from "./account";

export class Institute {
    name: string;
    accounts: Account[];
    owner: string;

    constructor() {
        this.name = '';
        this.owner = '';
        this.accounts = [];
    }
}