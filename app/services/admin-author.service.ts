import type { IResponse } from "~/types/api";
import type {
  AuthorOrigin,
  AuthorSource,
  AuthorStatus,
  IAdminAuthor,
  IAdminAuthorPage,
  IAdminAuthorUpdate,
  IAuthorAuditEntry,
  IAuthorImportError,
  IAuthorImportJob,
  IAuthorReviewItem,
  IMergePreview,
  IPage,
  ImportSource,
  ReviewItemType,
} from "~/types/author";
import type { IBook } from "~/types/book";
import https from "~/utils/https";

export interface AdminAuthorQuery {
  q?: string;
  status?: AuthorStatus;
  origin?: AuthorOrigin;
  page?: number;
  pageSize?: number;
}

/** superAdmin only (API_CHANGES #23f). */
class AdminAuthorService {
  private baseUrl = "/admin/author";
  private importUrl = "/admin/author-import";

  async list({ q, status, origin, page = 0, pageSize = 20 }: AdminAuthorQuery = {}): Promise<IResponse<IAdminAuthorPage>> {
    return await https.get({ url: this.baseUrl, query: { q: q || undefined, status, origin, page, pageSize } });
  }

  async get(id: string): Promise<IResponse<IAdminAuthor>> {
    return await https.get({ url: `${this.baseUrl}/${id}` });
  }

  /** Edited fields are marked ADMIN, so imports never overwrite them. */
  async update(id: string, body: IAdminAuthorUpdate): Promise<IResponse<IAdminAuthor>> {
    return await https.patch({ url: `${this.baseUrl}/${id}`, body });
  }

  async verify(id: string): Promise<IResponse<IAdminAuthor>> {
    return await https.post({ url: `${this.baseUrl}/${id}/verify`, body: {} });
  }

  async addExternalId(id: string, source: AuthorSource, sourceId: string): Promise<IResponse<IAdminAuthor>> {
    return await https.post({ url: `${this.baseUrl}/${id}/external-ids`, body: { source, sourceId } });
  }

  async removeExternalId(id: string, source: AuthorSource, sourceId: string): Promise<IResponse<IAdminAuthor>> {
    return await https.delete({ url: `${this.baseUrl}/${id}/external-ids/${source}/${encodeURIComponent(sourceId)}` });
  }

  /** Every status, drafts included. */
  async books(id: string, page = 0): Promise<IResponse<IPage<IBook>>> {
    return await https.get({ url: `${this.baseUrl}/${id}/books`, query: { page } });
  }

  async audit(id: string, page = 0): Promise<IResponse<IPage<IAuthorAuditEntry>>> {
    return await https.get({ url: `${this.baseUrl}/${id}/audit`, query: { page } });
  }

  /** Only when no book uses the author; otherwise 409 (merge it instead). */
  async remove(id: string): Promise<IResponse<null>> {
    return await https.delete({ url: `${this.baseUrl}/${id}` });
  }

  /* Review queue */

  async reviewItems({ type, page = 0 }: { type?: ReviewItemType; page?: number } = {}): Promise<IResponse<IPage<IAuthorReviewItem>>> {
    return await https.get({ url: `${this.baseUrl}/review`, query: { type, status: "OPEN", page } });
  }

  async keepSeparate(itemId: string, reason?: string): Promise<IResponse<IAuthorReviewItem>> {
    return await https.post({ url: `${this.baseUrl}/review/${itemId}/keep-separate`, body: { reason: reason || undefined } });
  }

  /* Merge */

  async mergePreview(id: string, intoId: string): Promise<IResponse<IMergePreview>> {
    return await https.get({ url: `${this.baseUrl}/${id}/merge-preview`, query: { intoId } });
  }

  /** Merges `id` into `intoId` and returns the surviving author. */
  async merge(id: string, intoId: string, reason: string): Promise<IResponse<IAdminAuthor>> {
    return await https.post({ url: `${this.baseUrl}/${id}/merge`, body: { intoId, reason } });
  }

  /* Imports */

  async imports(page = 0): Promise<IResponse<IPage<IAuthorImportJob>>> {
    return await https.get({ url: this.importUrl, query: { page } });
  }

  async importErrors(jobId: string, page = 0): Promise<IResponse<IPage<IAuthorImportError>>> {
    return await https.get({ url: `${this.importUrl}/${jobId}/errors`, query: { page } });
  }

  /** 409 while another import is running. */
  async startImport(source: ImportSource): Promise<IResponse<IAuthorImportJob>> {
    return await https.post({ url: this.importUrl, body: { source } });
  }
}

export default new AdminAuthorService();
