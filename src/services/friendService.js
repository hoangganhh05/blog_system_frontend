import axiosClient from "../api/axiosClient";

const friendService = {
  // Gửi lời mời kết bạn
  sendFriendRequest(_senderId, receiverId) {
    const targetId = typeof receiverId !== "undefined" ? receiverId : _senderId;
    return axiosClient.post(`/friends/request?receiverId=${targetId}`);
  },

  sendRequest(senderId, receiverId) {
    return this.sendFriendRequest(senderId, receiverId);
  },

  // Chấp nhận lời mời kết bạn
  acceptRequest(_currentUserId, requesterId) {
    const targetId = typeof requesterId !== "undefined" ? requesterId : _currentUserId;
    return axiosClient.post(`/friends/accept?requesterId=${targetId}`);
  },

  acceptFriendRequest(currentUserId, requesterId) {
    return this.acceptRequest(currentUserId, requesterId);
  },

  // Hủy kết bạn / Từ chối / Rút lời mời
  removeFriendship(userId1, userId2) {
    const targetId = userId2 || userId1;
    return axiosClient.post(`/friends/remove?targetUserId=${targetId}`);
  },

  // Lấy trạng thái mối quan hệ giữa 2 user
  getStatus(_currentUserId, targetUserId) {
    const targetId = typeof targetUserId !== "undefined" ? targetUserId : _currentUserId;
    return axiosClient.get(`/friends/status?targetUserId=${targetId}`);
  },

  // Lấy danh sách bạn bè đã kết bạn
  getFriendsList(userId) {
    return userId
      ? axiosClient.get(`/friends/list/${userId}`)
      : axiosClient.get(`/friends/list`);
  },

  getFriends(userId) {
    return this.getFriendsList(userId);
  },

  // Lấy danh sách lời mời kết bạn đang chờ
  getPendingRequests(userId) {
    return userId
      ? axiosClient.get(`/friends/pending/${userId}`)
      : axiosClient.get(`/friends/pending`);
  },

  // Đếm số bạn bè
  getFriendCount(userId) {
    return userId
      ? axiosClient.get(`/friends/count/${userId}`)
      : axiosClient.get(`/friends/count`);
  },
};

export const sendFriendRequest = friendService.sendFriendRequest.bind(friendService);
export const sendRequest = friendService.sendRequest.bind(friendService);
export const acceptRequest = friendService.acceptRequest.bind(friendService);
export const acceptFriendRequest = friendService.acceptFriendRequest.bind(friendService);
export const removeFriendship = friendService.removeFriendship.bind(friendService);
export const getStatus = friendService.getStatus.bind(friendService);
export const getFriendsList = friendService.getFriendsList.bind(friendService);
export const getFriends = friendService.getFriends.bind(friendService);
export const getPendingRequests = friendService.getPendingRequests.bind(friendService);
export const getFriendCount = friendService.getFriendCount.bind(friendService);

export default friendService;
