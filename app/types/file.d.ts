import type { IDocument } from "./api";

export interface IFile extends IDocument {
  name: string;
  url: string;
  mimetype: string;
  size: string;
  cloudinaryId: string;
}
