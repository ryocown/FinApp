import { v4 } from "uuid";

export interface ITag {
  tagId: string;

  name: string;
  color: string;
}

export class Tag implements ITag {
  tagId: string;

  name: string;
  color: string;

  constructor(name: string, color: string) {
    this.tagId = v4();
    this.name = name;
    this.color = color;
  }

  static fromJSON(json: any): Tag {
    const tag = new Tag(json.name, json.color);
    tag.tagId = json.tagId;
    return tag;
  }
}
