import { v4 } from "uuid";
export class User {
    userId;
    email;
    name;
    constructor(email, name) {
        this.userId = v4();
        this.email = email;
        this.name = name;
    }
    static fromJSON(json) {
        const user = new User(json.email, json.name);
        user.userId = json.userId;
        return user;
    }
}
