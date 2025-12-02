import { v4 } from "uuid";

export interface IPricePoint {
  pricePointId: string;
  targetId: string; // instrumentId or currencyPairId

  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class PricePoint implements IPricePoint {
  pricePointId: string;
  targetId: string;

  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;

  constructor(targetId: string, date: Date, open: number, high: number, low: number, close: number, volume: number) {
    this.pricePointId = v4();
    this.targetId = targetId;
    
    this.date = date;
    this.open = open;
    this.high = high;
    this.low = low;
    this.close = close;
    this.volume = volume;
  }
}
