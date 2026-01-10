export interface IUser {
    userId: string;
    email: string;
    name: string;
}
export declare class User implements IUser {
    userId: string;
    email: string;
    name: string;
    constructor(email: string, name: string);
    static fromJSON(json: any): User;
}
