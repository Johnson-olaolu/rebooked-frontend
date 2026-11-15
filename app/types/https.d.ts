export interface IDelete {
  url: string;
  body?: unknown;
}

export interface IPost extends IDelete {
  body?: unknown;
  headers?: Record<string, string>;
}

export type IPatch = IPost;
export type IPut = IPost;

export interface IGet extends IDelete {
  query?: Record<string, string | number | boolean | undefined | null>;
}
