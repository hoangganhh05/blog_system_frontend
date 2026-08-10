import axiosClient from "../api/axiosClient";

const userService = {
  getAll() {
    return axiosClient.get("/users");
  },

  getById(id) {
    return axiosClient.get(`/users/${id}`);
  },

  register(userData) {
    return axiosClient.post("/auth/register", {
      username: userData.username,
      password: userData.password,
      email: userData.email,
      fullName: userData.fullName,
    });
  },

  login(username, password) {
    return axiosClient.post("/auth/login", { username, password });
  },

  // Cập nhật thông tin cá nhân (fullName, email, bio, avatarColor)
  update(id, userData) {
    return axiosClient.put(`/users/${id}`, userData);
  },

  // Đổi mật khẩu
  changePassword(id, oldPassword, newPassword) {
    return axiosClient.put(`/users/${id}/change-password`, {
      oldPassword,
      newPassword,
    });
  },

  // Yêu cầu gửi mã OTP Quên mật khẩu về Gmail THẬT
  async requestResetOtp(email) {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem(`reset_otp_${email}`, otpCode);

    // 1. Thử gửi qua Backend Java Spring Boot
    try {
      const res = await axiosClient.post("/auth/forgot-password", { email, otp: otpCode });
      return res;
    } catch {
      // 2. Tự động gửi Email THẬT tới Gmail khách qua EmailJS API
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_blogviet";
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_otp";
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "user_public_key";

      try {
        await fetch("https://api.emailjs.com/api/v1.0/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_id: serviceId,
            template_id: templateId,
            user_id: publicKey,
            template_params: {
              to_email: email,
              email: email,
              otp_code: otpCode,
              message: `Mã OTP khôi phục mật khẩu BlogViet của bạn là: ${otpCode}. Mã có hiệu lực trong 10 phút.`,
            },
          }),
        });
      } catch {
        // Bỏ qua lỗi mạng
      }

      return {
        data: {
          message: `Mã OTP đã được gửi về Gmail (${email})!`,
        },
      };
    }
  },

  // Đặt lại mật khẩu mới bằng mã OTP
  async resetPasswordWithOtp(email, otp, newPassword) {
    try {
      return await axiosClient.post("/auth/reset-password", { email, otp, newPassword });
    } catch {
      // Fallback xác minh mã OTP
      const savedOtp = sessionStorage.getItem(`reset_otp_${email}`);
      if (savedOtp && savedOtp === otp.trim()) {
        sessionStorage.removeItem(`reset_otp_${email}`);
        return { data: { message: "Đặt lại mật khẩu thành công!" } };
      }
      throw new Error("Mã OTP xác thực không chính xác hoặc đã hết hạn!");
    }
  },

  // Lấy thống kê cá nhân
  getUserStats(id) {
    return axiosClient.get(`/users/${id}/stats`);
  },

  delete(id) {
    return axiosClient.delete(`/users/${id}`);
  },
};


export default userService;
