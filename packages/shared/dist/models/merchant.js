import { v4 } from "uuid";
export class Merchant {
    merchantId;
    name;
    category;
    type;
    constructor(name, category, type) {
        this.merchantId = v4();
        this.name = name;
        this.category = category;
        this.type = type;
    }
    static fromJSON(json) {
        const merchant = new Merchant(json.name, json.category, json.type);
        merchant.merchantId = json.merchantId;
        return merchant;
    }
}
