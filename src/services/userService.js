import axiosClient from "../api/axiosClient";

const userService = {
  getAll(query = "", page = 0, size = 20) {
    if (query) {
      return axiosClient.get(`/users?query=${encodeURIComponent(query)}&page=${page}&size=${size}`);
    }
    return axiosClient.get(`/users?page=${page}&size=${size}`);
  },

  getAllUsers(query = "", page = 0, size = 20) {
    return this.getAll(query, page, size);
  },

  getUsers(page = 0, size = 20) {
    return this.getAll("", page, size);
  },

  search(query = "", page = 0, size = 20) {
    return axiosClient.get(`/users/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`);
  },

  searchUsers(query = "", page = 0, size = 20) {
    return this.search(query, page, size);
  },

  getById(id) {
    return axiosClient.get(`/users/${id}`);
  },

  getUserById(id) {
    return this.getById(id);
  },

  getMe() {
    return axiosClient.get("/users/me");
  },

  heartbeat() {
    return axiosClient.post("/users/heartbeat");
  },

  setOffline() {
    return axiosClient.post("/users/offline");
  },

  updateActiveStatus(showActiveStatus) {
    return axiosClient.put("/users/active-status", { showActiveStatus });
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

  // Cập nhật thông tin cá nhân (fullName, email, bio, avatarColor, avatarUrl)
  update(id, userData) {
    return axiosClient.put(`/users/${id}`, userData);
  },

  updateUser(id, userData) {
    return this.update(id, userData);
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

export const getAll = userService.getAll.bind(userService);
export const getAllUsers = userService.getAllUsers.bind(userService);
export const getUsers = userService.getUsers.bind(userService);
export const search = userService.search.bind(userService);
export const searchUsers = userService.searchUsers.bind(userService);
export const getById = userService.getById.bind(userService);
export const getUserById = userService.getUserById.bind(userService);
export const register = userService.register.bind(userService);
export const login = userService.login.bind(userService);
export const update = userService.update.bind(userService);
export const updateUser = userService.updateUser.bind(userService);
export const changePassword = userService.changePassword.bind(userService);
export const requestResetOtp = userService.requestResetOtp.bind(userService);
export const resetPasswordWithOtp = userService.resetPasswordWithOtp.bind(userService);
export const getUserStats = userService.getUserStats.bind(userService);
export const deleteUser = userService.delete.bind(userService);

export default userService;
