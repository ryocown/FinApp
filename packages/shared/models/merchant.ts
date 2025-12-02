import { v4 } from "uuid";

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
    this.merchantId = v4();

    this.name = name;
    this.category = category;
    this.type = type;
  }

  static fromJSON(json: any): Merchant {
    const merchant = new Merchant(json.name, json.category, json.type);
    merchant.merchantId = json.merchantId;
    return merchant;
  }
}