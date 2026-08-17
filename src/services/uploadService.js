import axiosClient from "../api/axiosClient";

const uploadService = {
  /**
   * Upload file (ảnh, video, audio, media) lên Cloudflare R2 qua Backend API
   * @param {File} file - File từ input
   * @param {Function} [onProgress] - Callback tiến trình (0 - 100)
   * @param {string} [folder] - Thư mục lưu trữ (posts, avatars, chats, stories...)
   */
  async uploadFile(file, onProgress, folder = "media") {
    const formData = new FormData();
    formData.append("file", file);
    if (folder) {
      formData.append("folder", folder);
    }

    const response = await axiosClient.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    const fileUrl = response.data?.url || response.data?.secureUrl || response.data?.secure_url || "";
    return {
      data: {
        url: fileUrl,
        secureUrl: fileUrl,
        secure_url: fileUrl,
        filename: response.data?.filename,
        resourceType: file?.type?.startsWith("video/") ? "video" : file?.type?.startsWith("audio/") ? "audio" : "image",
      },
    };
  },

  async uploadImage(file, onProgress, folder = "posts") {
    return this.uploadFile(file, onProgress, folder);
  },

  async uploadAvatar(file, onProgress) {
    return this.uploadFile(file, onProgress, "avatars");
  },

  async uploadMedia(file, onProgress, folder = "media") {
    return this.uploadFile(file, onProgress, folder);
  },

  async uploadMultipleFiles(files, onProgress, folder = "media") {
    if (!files || files.length === 0) return [];
    const list = Array.from(files);
    const promises = list.map((file) => this.uploadFile(file, onProgress, folder));
    const results = await Promise.all(promises);
    return results.map((r) => r.data?.url).filter(Boolean);
  },
};

export const uploadFile = uploadService.uploadFile.bind(uploadService);
export const uploadImage = uploadService.uploadImage.bind(uploadService);
export const uploadAvatar = uploadService.uploadAvatar.bind(uploadService);
export const uploadMedia = uploadService.uploadMedia.bind(uploadService);
export const uploadMultipleFiles = uploadService.uploadMultipleFiles.bind(uploadService);

export default uploadService;
