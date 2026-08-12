import axios from "axios";

let apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
// Tự động nâng cấp sang HTTPS bảo mật nếu gọi server sản xuất xa
if (apiBaseUrl.startsWith("http://") && !apiBaseUrl.includes("localhost")) {
  apiBaseUrl = apiBaseUrl.replace("http://", "https://");
}

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// =============================================
// REQUEST INTERCEPTOR
// Chạy trước mỗi request — tự động gắn token
// =============================================
axiosClient.interceptors.request.use(
  (config) => {
    // Đọc token từ localStorage
    const token = localStorage.getItem("blog_token");

    if (token) {
      // Gắn vào header Authorization
      // Backend JwtFilter sẽ đọc header Authorization
      config.headers = config.headers || {};
      config.headers.Authorization = 'Bearer ' + token;
    }

    return config; // tiếp tục gửi request
  },
  (error) => Promise.reject(error)
);

// =============================================
// RESPONSE INTERCEPTOR
// Xử lý lỗi chung từ server
// =============================================
axiosClient.interceptors.response.use(
  (response) => response, // thành công → trả thẳng response

  (error) => {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      // Token hết hạn, không hợp lệ hoặc backend từ chối quyền truy cập
      localStorage.removeItem("blog_token");
      localStorage.removeItem("blog_user");
      localStorage.removeItem("blog_session_id");

      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axiosClient;


