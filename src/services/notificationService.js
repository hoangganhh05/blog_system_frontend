import axiosClient from "../api/axiosClient";

const notificationService = {
  getUserNotifications(userId) {
    return axiosClient.get(`/notifications?userId=${userId}`);
  },

  getUnreadCount(userId) {
    return axiosClient.get(`/notifications/unread-count?userId=${userId}`);
  },

  markAsRead(id) {
    return axiosClient.put(`/notifications/${id}/read`);
  },

  markAllAsRead(userId) {
    return axiosClient.put(`/notifications/read-all?userId=${userId}`);
  },
};

export default notificationService;
