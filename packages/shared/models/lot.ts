import { v4 } from "uuid";

export interface ILot {
  lotId: string;
  transactionId: string;

  quantity: number;
  purchaseDate: Date;
  costBasis: number;
}

export class Lot implements ILot {
  lotId: string;
  transactionId: string;

  quantity: number;
  purchaseDate: Date;
  costBasis: number;

  constructor(transactionId: string, quantity: number, purchaseDate: Date, costBasis: number) {
    this.lotId = v4();
    this.transactionId = transactionId;

    this.quantity = quantity;
    this.purchaseDate = purchaseDate;
    this.costBasis = costBasis;
  }
}