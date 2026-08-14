import axiosClient from "../api/axiosClient";

const chatService = {
  // Gửi tin nhắn
  sendMessage(_senderId, receiverId, content) {
    return axiosClient.post(
      `/chat/send?receiverId=${receiverId}`,
      { content }
    );
  },

  // Lấy lịch sử nhắn tin chuẩn REST API (tự động sử dụng JWT token cho người dùng hiện tại)
  getHistory(user1, user2) {
    // Nếu truyền 2 tham số, targetUserId là user2 (hoặc người khác ngoại trừ caller)
    const targetUserId = typeof user2 !== "undefined" ? user2 : user1;
    return axiosClient.get(`/chat/history?withUser=${targetUserId}`);
  },

  // Đánh dấu đã đọc
  markAsRead(senderId) {
    return axiosClient.post(`/chat/read?senderId=${senderId}`);
  },
};

export default chatService;
