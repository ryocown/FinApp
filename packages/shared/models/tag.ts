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
}
