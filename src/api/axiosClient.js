import axios from "axios";

const isLocalDevHost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

let apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (isLocalDevHost ? "http://localhost:8080" : "https://api.anhhoangg.id.vn");

// Tự động nâng cấp sang HTTPS bảo mật nếu gọi server sản xuất xa
if (
  apiBaseUrl.startsWith("http://") &&
  !apiBaseUrl.includes("localhost") &&
  !apiBaseUrl.includes("127.0.0.1")
) {
  apiBaseUrl = apiBaseUrl.replace("http://", "https://");
}

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
    const requestUrl = `${error.config?.url || ""}`;

    // Chỉ xử lý 401 (token hết hạn/không hợp lệ) - tự động logout
    if (status === 401 && !isPublicAuthRequest(requestUrl)) {
      // Token hết hạn, không hợp lệ
      localStorage.removeItem("blog_token");
      localStorage.removeItem("blog_user");
      localStorage.removeItem("blog_session_id");
      sessionStorage.clear();

      // Hiển thị thông báo
      if (typeof window !== "undefined") {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      // Chuyển hướng về trang login
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login")
      ) {
        window.location.href = "/login";
      }
    }
    // 403 (Forbidden) - chỉ log error, không tự động logout (có thể là permission issue bình thường)
    else if (status === 403 && !isPublicAuthRequest(requestUrl)) {
      console.warn(
        "Forbidden API request (permission denied):",
        requestUrl,
        error.response?.data || error.message,
      );
    }

    console.error("API Error:", {
      status,
      url: requestUrl,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  },
);

export default axiosClient;
