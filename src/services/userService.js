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

  requestResetOtp(email) {
    return axiosClient.post("/auth/forgot-password", { email });
  },

  // Đặt lại mật khẩu mới bằng mã OTP
  resetPasswordWithOtp(email, otp, newPassword) {
    return axiosClient.post("/auth/reset-password", {
      email: email.trim(),
      otp,
      newPassword,
    });
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
