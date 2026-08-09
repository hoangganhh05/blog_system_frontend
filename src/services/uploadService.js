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
};

export default uploadService;
