import { v4 } from "uuid";
export class Lot {
    lotId;
    transactionId;
    quantity;
    purchaseDate;
    costBasis;
    constructor(transactionId, quantity, purchaseDate, costBasis) {
        this.lotId = v4();
        this.transactionId = transactionId;
        this.quantity = quantity;
        this.purchaseDate = purchaseDate;
        this.costBasis = costBasis;
    }
    static fromJSON(json) {
        const lot = new Lot(json.transactionId, json.quantity, new Date(json.purchaseDate), json.costBasis);
        lot.lotId = json.lotId;
        return lot;
    }
}
