import axios from "axios";
import { toast } from "sonner";
import { encryptData, decryptData } from "../utils/cryptoUtil";

// Sử dụng đường dẫn tương đối qua biến môi trường hoặc mặc định '/api'
const apiBaseUrl = import.meta.env.VITE_API_URL || "/api";

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

const PUBLIC_AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

const isPublicAuthRequest = (url = "") =>
  PUBLIC_AUTH_PATHS.some((path) => url.includes(path));

// =============================================
// REQUEST INTERCEPTOR: Token & Payload Encryption
// =============================================
axiosClient.interceptors.request.use(
  async (config) => {
    // 1. Gắn Token xác thực (Bỏ qua nếu token rác / null / undefined)
    const token = localStorage.getItem("blog_token");
    const requestUrl = `${config.url || ""}`;

    if (token && token !== "undefined" && token !== "null" && !isPublicAuthRequest(requestUrl)) {
      config.headers = config.headers || {};
      config.headers.Authorization = "Bearer " + token;
    }

    // 2. Tự động mã hóa Payload Request (AES-256) nếu môi trường hỗ trợ
    const method = (config.method || "get").toLowerCase();
    const isMutation = ["post", "put", "patch"].includes(method);
    const isFormData = typeof FormData !== "undefined" && config.data instanceof FormData;

    if (isMutation && config.data && !isFormData) {
      try {
        const result = await encryptData(config.data);
        if (result && result.success && result.data) {
          config.data = { encryptedData: result.data };
          config.headers = config.headers || {};
          config.headers["X-Encrypted"] = "true";
        }
      } catch (err) {
        console.warn("[AXIOS ENCRYPT WARNING]", err);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =============================================
// RESPONSE INTERCEPTOR: Payload Decryption & Errors
// =============================================
axiosClient.interceptors.response.use(
  async (response) => {
    // Tự động giải mã Payload Response nếu máy chủ trả về encryptedData
    if (response.data && typeof response.data === "object" && response.data.encryptedData) {
      try {
        const decrypted = await decryptData(response.data.encryptedData);
        response.data = decrypted;
      } catch (err) {
        console.warn("[AXIOS DECRYPT WARNING]", err);
      }
    } else if (typeof response.data === "string" && response.headers?.["x-encrypted"] === "true") {
      try {
        const decrypted = await decryptData(response.data);
        response.data = decrypted;
      } catch (err) {
        console.warn("[AXIOS DECRYPT WARNING]", err);
      }
    }

    return response;
  },

  async (error) => {
    // Nếu Error response cũng bị mã hóa, giải mã để lấy error message
    if (error.response?.data?.encryptedData) {
      try {
        error.response.data = await decryptData(error.response.data.encryptedData);
      } catch {}
    }

    const status = error.response?.status;
    const requestUrl = error.config?.url || "";
    const errorMessage =
      error.response?.data?.message ||
      (typeof error.response?.data === "string" &&
      error.response.data.includes("<!DOCTYPE")
        ? "Không thể kết nối đến máy chủ. Vui lòng thử lại!"
        : error.message || "Đã có lỗi xảy ra");

    // Nếu server/hosting trả về HTML thay vì JSON
    if (typeof error.response?.data === "string" && error.response.data.includes("<!DOCTYPE")) {
      error.response.data = { message: errorMessage };
    }

    // 401 (Unauthorized) - tự động logout và dọn sạch session rác
    if (status === 401 && !isPublicAuthRequest(requestUrl)) {
      localStorage.removeItem("blog_token");
      localStorage.removeItem("blog_user");
      localStorage.removeItem("blog_session_id");
      sessionStorage.clear();

      if (typeof window !== "undefined") {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login")
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
