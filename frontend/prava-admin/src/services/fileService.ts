import api from "./api";

class FileService {
  private baseUrl = "/api/v1/files";

  async upload(file: File, folder?: string) {
    const formData = new FormData();
    formData.append("file", file);
    if (folder) formData.append("folder", folder);
    const res = await api.post(`${this.baseUrl}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data ?? res.data;
  }

  async uploadMultiple(files: File[], folder?: string) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    if (folder) formData.append("folder", folder);
    const res = await api.post(`${this.baseUrl}/upload/multiple`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data ?? res.data;
  }

  async downloadByName(fileName: string, folder?: string) {
    const params = new URLSearchParams({ fileName });
    if (folder) params.append("folder", folder);
    const res = await api.get(`${this.baseUrl}/download/by-name?${params}`, { responseType: "blob" });
    return res.data;
  }

  async downloadByUrl(fileUrl: string) {
    const res = await api.get(`${this.baseUrl}/download/by-url?fileUrl=${encodeURIComponent(fileUrl)}`, { responseType: "blob" });
    return res.data;
  }

  async updateByName(file: File, fileName: string, folder?: string) {
    const formData = new FormData();
    formData.append("file", file);
    const params = new URLSearchParams({ fileName });
    if (folder) params.append("folder", folder);
    const res = await api.put(`${this.baseUrl}/update/by-name?${params}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data ?? res.data;
  }

  async updateByUrl(file: File, fileUrl: string) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.put(`${this.baseUrl}/update/by-url?fileUrl=${encodeURIComponent(fileUrl)}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data ?? res.data;
  }

  async deleteByName(fileName: string, folder?: string) {
    const params = new URLSearchParams({ fileName });
    if (folder) params.append("folder", folder);
    const res = await api.delete(`${this.baseUrl}/delete/by-name?${params}`);
    return res.data?.data ?? res.data;
  }

  async deleteByUrl(fileUrl: string) {
    const res = await api.delete(`${this.baseUrl}/delete/by-url?fileUrl=${encodeURIComponent(fileUrl)}`);
    return res.data?.data ?? res.data;
  }

  async existsByName(fileName: string, folder?: string) {
    const params = new URLSearchParams({ fileName });
    if (folder) params.append("folder", folder);
    const res = await api.get(`${this.baseUrl}/exists/by-name?${params}`);
    return res.data?.data ?? res.data;
  }

  async existsByUrl(fileUrl: string) {
    const res = await api.get(`${this.baseUrl}/exists/by-url?fileUrl=${encodeURIComponent(fileUrl)}`);
    return res.data?.data ?? res.data;
  }

  async getStorageType() {
    const res = await api.get(`${this.baseUrl}/storage-type`);
    return res.data?.data ?? res.data;
  }

  // File URL helpers (for <img src> etc.)
  getQuestionImageUrl(filename: string) {
    return `${this.baseUrl}/questions/${filename}`;
  }

  getProfileImageUrl(filename: string) {
    return `${this.baseUrl}/profiles/${filename}`;
  }

  getGeneralFileUrl(filename: string) {
    return `${this.baseUrl}/general/${filename}`;
  }
}

export const fileService = new FileService();
export default fileService;
