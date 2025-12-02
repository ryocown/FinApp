import { v4 } from "uuid";

export interface IUser {
  userId: string;

  email: string;
  name: string;
}

export class User implements IUser {
  userId: string;

  email: string;
  name: string;

  constructor(email: string, name: string) {
    this.userId = v4();
    this.email = email;
    this.name = name;
  }

  static fromJSON(json: any): User {
    const user = new User(json.email, json.name);
    user.userId = json.userId;
    return user;
  }
}
