import axiosClient from "../api/axiosClient";

const friendService = {
  // Gửi lời mời kết bạn
  sendFriendRequest(_senderId, receiverId) {
    return axiosClient.post(`/friends/request?receiverId=${receiverId}`);
  },

  // Backward-compatible alias for older call sites
  sendRequest(senderId, receiverId) {
    return this.sendFriendRequest(senderId, receiverId);
  },

  // Chấp nhận lời mời kết bạn
  acceptRequest(_currentUserId, requesterId) {
    return axiosClient.post(`/friends/accept?requesterId=${requesterId}`);
  },

  // Backward-compatible alias for older call sites
  acceptFriendRequest(currentUserId, requesterId) {
    return this.acceptRequest(currentUserId, requesterId);
  },

  // Hủy kết bạn / Từ chối / Rút lời mời
  removeFriendship(userId1, userId2) {
    return axiosClient.post(`/friends/remove?userId1=${userId1}&userId2=${userId2}`);
  },

  // Lấy trạng thái mối quan hệ giữa 2 user
  getStatus(_currentUserId, targetUserId) {
    return axiosClient.get(`/friends/status?targetUserId=${targetUserId}`);
  },

  // Lấy danh sách bạn bè đã kết bạn
  getFriendsList(userId) {
    return axiosClient.get(`/friends/list/${userId}`);
  },

  // Lấy danh sách lời mời kết bạn đang chờ
  getPendingRequests(userId) {
    return axiosClient.get(`/friends/pending/${userId}`);
  },

  // Đếm số bạn bè
  getFriendCount(userId) {
    return axiosClient.get(`/friends/count/${userId}`);
  },
};

export default friendService;
