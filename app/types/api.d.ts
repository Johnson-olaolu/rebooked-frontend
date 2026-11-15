export interface IDocument {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/** Success envelope returned by every endpoint: `{ message, status, data }`. */
export interface IResponse<D = null> {
  data: D;
  status: number;
  message: string;
}

/** Error body returned by the API's global exception handler. */
export interface IErrorResponse {
  status: number;
  message: string;
  /** Field-level messages, keyed by field path (e.g. `password`, `address.city`). */
  errors?: Record<string, string>;
}

export interface IResponsePagination<D> extends IResponse<D> {
  pagination: {
    currentPage: number;
    size: number;
    totalPages: number;
    totalElements: number;
  };
}

export interface IPageable<D> {
  content: D[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  pageable: {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    sort: { empty: boolean; sorted: boolean; unsorted: boolean };
    unpaged: boolean;
  };
  size: number;
  sort: { empty: boolean; sorted: boolean; unsorted: boolean };
  totalElements: number;
  totalPages: number;
}
