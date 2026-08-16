import axios from "axios";

const CLOUD_NAME = "drj3lvexy";
const UPLOAD_PRESET = "blogviet_upload";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

const uploadService = {
  /**
   * Upload file (ảnh hoặc video) trực tiếp lên Cloudinary
   * @param {File} file - File từ input
   * @param {Function} [onProgress] - Callback tiến trình (0 - 100)
   */
  async uploadFile(file, onProgress) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await axios.post(CLOUDINARY_URL, formData, {
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

    return {
      data: {
        url: response.data.secure_url,
        secureUrl: response.data.secure_url,
        resourceType: response.data.resource_type, // 'image' hoặc 'video'
        format: response.data.format,
        publicId: response.data.public_id,
      },
    };
  },

  async uploadImage(file, onProgress) {
    return this.uploadFile(file, onProgress);
  },

  async uploadMedia(file, onProgress) {
    return this.uploadFile(file, onProgress);
  },

  async uploadMultipleFiles(files, onProgress) {
    if (!files || files.length === 0) return [];
    const list = Array.from(files);
    const promises = list.map((file) => this.uploadFile(file));
    const results = await Promise.all(promises);
    return results.map((r) => r.data?.url).filter(Boolean);
  },
};

export const uploadFile = uploadService.uploadFile.bind(uploadService);
export const uploadImage = uploadService.uploadImage.bind(uploadService);
export const uploadMedia = uploadService.uploadMedia.bind(uploadService);
export const uploadMultipleFiles = uploadService.uploadMultipleFiles.bind(uploadService);

export default uploadService;
