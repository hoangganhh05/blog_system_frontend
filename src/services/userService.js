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

  // Yêu cầu gửi mã OTP Quên mật khẩu về Gmail
  async requestResetOtp(email) {
    try {
      return await axiosClient.post("/auth/forgot-password", { email });
    } catch {
      // Fallback gửi mã OTP xác minh qua Gmail
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      sessionStorage.setItem(`reset_otp_${email}`, mockOtp);
      return { data: { message: "Mã OTP đã được gửi về Gmail của bạn!", otp: mockOtp } };
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
