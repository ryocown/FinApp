import { v4 } from "uuid";
export class PricePoint {
    pricePointId;
    targetId;
    date;
    open;
    high;
    low;
    close;
    volume;
    constructor(targetId, date, open, high, low, close, volume) {
        this.pricePointId = v4();
        this.targetId = targetId;
        this.date = date;
        this.open = open;
        this.high = high;
        this.low = low;
        this.close = close;
        this.volume = volume;
    }
    static fromJSON(json) {
        const pricePoint = new PricePoint(json.targetId, new Date(json.date), json.open, json.high, json.low, json.close, json.volume);
        pricePoint.pricePointId = json.pricePointId;
        return pricePoint;
    }
}
