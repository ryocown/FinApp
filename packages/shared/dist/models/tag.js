import { v4 } from "uuid";
export class Tag {
    tagId;
    name;
    color;
    constructor(name, color) {
        this.tagId = v4();
        this.name = name;
        this.color = color;
    }
    static fromJSON(json) {
        const tag = new Tag(json.name, json.color);
        tag.tagId = json.tagId;
        return tag;
    }
}
