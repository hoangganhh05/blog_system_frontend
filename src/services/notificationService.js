import axiosClient from "../api/axiosClient";

const notificationService = {
  getUserNotifications(_userId) {
    return axiosClient.get("/notifications");
  },

  getNotifications(userId) {
    return this.getUserNotifications(userId);
  },

  getUnreadCount() {
    return axiosClient.get("/notifications/unread-count");
  },

  markAsRead(id) {
    return axiosClient.put(`/notifications/${id}/read`);
  },

  markAllAsRead(_userId) {
    return axiosClient.put("/notifications/read-all");
  },

  deleteNotification(id) {
    return axiosClient.delete(`/notifications/${id}`);
  },
};

export const getUserNotifications = notificationService.getUserNotifications.bind(notificationService);
export const getNotifications = notificationService.getNotifications.bind(notificationService);
export const getUnreadCount = notificationService.getUnreadCount.bind(notificationService);
export const markAsRead = notificationService.markAsRead.bind(notificationService);
export const markAllAsRead = notificationService.markAllAsRead.bind(notificationService);
export const deleteNotification = notificationService.deleteNotification.bind(notificationService);

export default notificationService;
