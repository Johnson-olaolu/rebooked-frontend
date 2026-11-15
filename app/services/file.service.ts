import type { IResponse } from "~/types/api";
import type { IFile } from "~/types/file";
import https from "~/utils/https";

class FileService {
  private baseUrl = "/file";

  /** Uploads one file (max 10MB). Use the returned `id` as e.g. `profilePictureId`. */
  async upload(file: File): Promise<IResponse<IFile>> {
    const formData = new FormData();
    formData.append("file", file);
    return await https.post({
      url: this.baseUrl,
      body: formData,
      headers: { "content-type": "multipart/form-data" },
    });
  }
}

export default new FileService();
