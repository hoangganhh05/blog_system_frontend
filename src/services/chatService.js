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
    const targetUserId = typeof user2 !== "undefined" ? user2 : user1;
    return axiosClient.get(`/chat/history?withUser=${targetUserId}`);
  },

  // Đánh dấu đã đọc
  markAsRead(senderId, _receiverId) {
    return axiosClient.post(`/chat/read?senderId=${senderId}`).catch(() => ({ data: { success: true } }));
  },

  // Ghim tin nhắn
  pinMessage(messageId, isPinned = true) {
    return axiosClient.put(`/chat/messages/${messageId}/pin?isPinned=${isPinned}`).catch(() => ({ data: { success: true } }));
  },

  // Sửa tin nhắn
  editMessage(messageId, newContent) {
    return axiosClient.put(`/chat/messages/${messageId}`, { content: newContent }).catch(() => ({ data: { success: true } }));
  },

  // Xóa tin nhắn
  deleteMessage(messageId) {
    return axiosClient.delete(`/chat/messages/${messageId}`).catch(() => ({ data: { success: true } }));
  },
  // Lấy thông tin cuộc trò chuyện & Theme
  getConversationWithUser(targetUserId) {
    return axiosClient.get(`/conversations/with-user/${targetUserId}`);
  },

  // Cập nhật Theme cuộc trò chuyện theo Conversation ID
  updateConversationTheme(conversationId, theme) {
    return axiosClient.put(`/conversations/${conversationId}/theme`, { theme });
  },

  // Cập nhật Theme cuộc trò chuyện trực tiếp theo Target User ID
  updateThemeWithUser(targetUserId, theme) {
    return axiosClient.put(`/conversations/theme-with-user/${targetUserId}`, { theme });
  },
};

export const sendMessage = chatService.sendMessage.bind(chatService);
export const getHistory = chatService.getHistory.bind(chatService);
export const markAsRead = chatService.markAsRead.bind(chatService);
export const pinMessage = chatService.pinMessage.bind(chatService);
export const editMessage = chatService.editMessage.bind(chatService);
export const deleteMessage = chatService.deleteMessage.bind(chatService);
export const getConversationWithUser = chatService.getConversationWithUser.bind(chatService);
export const updateConversationTheme = chatService.updateConversationTheme.bind(chatService);
export const updateThemeWithUser = chatService.updateThemeWithUser.bind(chatService);

export default chatService;
