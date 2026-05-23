interface IDocument {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface IResponse<D = null> {
  data?: D;
  status: boolean;
  message: string;
}

export interface IPageable<D> {
  content: D[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: 1;
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
