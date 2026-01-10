export interface ILot {
    lotId: string;
    transactionId: string;
    quantity: number;
    purchaseDate: Date;
    costBasis: number;
}
export declare class Lot implements ILot {
    lotId: string;
    transactionId: string;
    quantity: number;
    purchaseDate: Date;
    costBasis: number;
    constructor(transactionId: string, quantity: number, purchaseDate: Date, costBasis: number);
    static fromJSON(json: any): Lot;
}
