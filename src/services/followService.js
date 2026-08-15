import axiosClient from "../api/axiosClient";

const followService = {
  // Theo dõi một người dùng (POST /follows/:targetUserId)
  followUser: (targetUserId) => {
    return axiosClient.post(`/follows/${targetUserId}`);
  },

  // Hủy theo dõi một người dùng (DELETE /follows/:targetUserId hoặc POST /follows/unfollow)
  unfollowUser: (targetUserId) => {
    return axiosClient.delete(`/follows/${targetUserId}`);
  },

  // Kiểm tra trạng thái theo dõi giữa current user và target user
  checkFollowStatus: (targetUserId) => {
    return axiosClient.get("/follows/status", {
      params: { targetUserId },
    });
  },

  // Lấy danh sách những người mà user đang theo dõi
  getFollowing: (userId) => {
    return axiosClient.get(userId ? `/follows/following/${userId}` : "/follows/following");
  },

  // Lấy danh sách ID những người mà user đang theo dõi (nhanh và nhẹ)
  getFollowingIds: (userId) => {
    return axiosClient.get(userId ? `/follows/following-ids/${userId}` : "/follows/following-ids");
  },

  // Lấy danh sách người đang theo dõi user
  getFollowers: (userId) => {
    return axiosClient.get(userId ? `/follows/followers/${userId}` : "/follows/followers");
  },

  // Lấy số lượng following & followers
  getFollowCounts: (userId) => {
    return axiosClient.get(userId ? `/follows/count/${userId}` : "/follows/count");
  },
};

export default followService;
