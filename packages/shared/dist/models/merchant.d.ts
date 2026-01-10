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
export declare class Merchant implements MerchantProp {
    merchantId: string;
    name: string;
    category: string;
    type: string;
    constructor(name: string, category: string, type: string);
    static fromJSON(json: any): Merchant;
}
