export interface ITag {
    tagId: string;
    name: string;
    color: string;
}
export declare class Tag implements ITag {
    tagId: string;
    name: string;
    color: string;
    constructor(name: string, color: string);
    static fromJSON(json: any): Tag;
}
