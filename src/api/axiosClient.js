import axios from "axios";
import { toast } from "sonner";

// Sử dụng đường dẫn tương đối qua biến môi trường hoặc mặc định '/api/v1'
// Tất cả API request sẽ đi qua Reverse Proxy để ẩn domain backend thật trên F12 Network
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
// REQUEST INTERCEPTOR
// Chạy trước mỗi request — tự động gắn token
// =============================================
axiosClient.interceptors.request.use(
  (config) => {
    // Đọc token từ localStorage
    const token = localStorage.getItem("blog_token");
    const requestUrl = `${config.url || ""}`;

    if (token && !isPublicAuthRequest(requestUrl)) {
      // Gắn vào header Authorization
      // Backend JwtFilter sẽ đọc header Authorization
      config.headers = config.headers || {};
      config.headers.Authorization = "Bearer " + token;
    }

    return config; // tiếp tục gửi request
  },
  (error) => Promise.reject(error),
);

// =============================================
// RESPONSE INTERCEPTOR
// Xử lý lỗi chung từ server
// =============================================
axiosClient.interceptors.response.use(
  (response) => response, // thành công → trả thẳng response

  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";
    const errorMessage =
      error.response?.data?.message ||
      (typeof error.response?.data === "string" &&
      error.response.data.includes("<!DOCTYPE")
        ? "Không thể kết nối đến máy chủ. Vui lòng thử lại!"
        : error.message || "Đã có lỗi xảy ra");

    // Nếu server/hosting trả về HTML thay vì JSON, chuẩn hóa lại data để UI hiển thị thông báo sạch
    if (typeof error.response?.data === "string" && error.response.data.includes("<!DOCTYPE")) {
      error.response.data = { message: errorMessage };
    }

    // 400 (Bad Request) - In chi tiết dữ liệu validation từ Backend
    if (status === 400) {
      console.error("400 Backend Response:", error.response?.data);
    }

    // 401 (Unauthorized) - tự động logout
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
    // 403 (Forbidden)
    else if (status === 403 && !isPublicAuthRequest(requestUrl)) {
      console.warn(
        "Forbidden API request (permission denied):",
        requestUrl,
        errorMessage,
      );
    }

    console.error("API Error:", {
      status,
      url: requestUrl,
      data: error.response?.data,
      message: errorMessage,
    });
    return Promise.reject(error);
  },
);

export default axiosClient;
