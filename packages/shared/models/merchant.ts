export interface IMerchant {
    merchantId: string;
    name: string;
    category: string;
    type: string;
}

export class Merchant implements Merchant {
    merchantId: string;
    name: string;
    category: string;
    type: string;

    constructor(name: string, category: string, type: string) {
        this.merchantId = ""; // TODO: Generate UUID
        this.name = name;
        this.category = category;
        this.type = type;
    }
}