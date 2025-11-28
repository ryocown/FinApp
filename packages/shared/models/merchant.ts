interface Merchant {
    name: string;
    category: string;
    type: string;
}

class Merchant implements Merchant {
    name: string;
    category: string;
    type: string;

    constructor(name: string, category: string, type: string) {
        this.name = name;
        this.category = category;
        this.type = type;
    }
}