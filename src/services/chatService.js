import axiosClient from "../api/axiosClient";

const chatService = {
  // Gửi tin nhắn
  sendMessage(senderId, receiverId, content) {
    return axiosClient.post(
      `/chat/send?senderId=${senderId}&receiverId=${receiverId}`,
      { content }
    );
  },

  // Lấy lịch sử nhắn tin giữa 2 người
  getHistory(user1, user2) {
    return axiosClient.get(`/chat/history?user1=${user1}&user2=${user2}`);
  },

  // Đánh dấu đã đọc
  markAsRead(senderId, receiverId) {
    return axiosClient.post(`/chat/read?senderId=${senderId}&receiverId=${receiverId}`);
  },

  // Chỉnh sửa tin nhắn
  editMessage(messageId, content) {
    return axiosClient.put(`/chat/message/${messageId}`, { content });
  },

  // Xóa tin nhắn
  deleteMessage(messageId) {
    return axiosClient.delete(`/chat/message/${messageId}`);
  },

  // Ghim / Bỏ ghim tin nhắn trực tiếp vào Database MySQL
  pinMessage(messageId, isPinned = true) {
    return axiosClient.put(`/chat/message/${messageId}/pin?isPinned=${isPinned}`);
  },
};

export default chatService;
