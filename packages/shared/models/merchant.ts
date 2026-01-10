import { v4 } from "uuid";

export interface MerchantProp {
  merchantId: string;

  name: string;
  category: string;
  type: string;
}

export interface KnownMerchant {
  commonName: string;
  logo: string;
  logoFull: string;
  category: string;
  matcher: RegExp;
  website: string;
}

export class Merchant implements MerchantProp {
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