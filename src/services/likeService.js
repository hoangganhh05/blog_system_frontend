import axiosClient from "../api/axiosClient";

function getUserId(userId) {
  if (userId) return userId;
  try {
    const saved = localStorage.getItem("blog_user");
    if (saved) {
      const u = JSON.parse(saved);
      return u.id || u.userId;
    }
  } catch {}
  return null;
}

const likeService = {
  // Toggle reaction (thích / thả tim / haha / ...) bài viết
  toggleLike(postId, userId, type = "LIKE") {
    const uid = getUserId(userId);
    return axiosClient.post(`/posts/${postId}/like?userId=${uid}&type=${type}`);
  },

  // Lấy tổng lượt like của bài viết
  getLikeCount(postId) {
    return axiosClient.get(`/posts/${postId}/likes/count`);
  },

  // Kiểm tra xem user hiện tại đã like bài viết chưa
  checkLiked(postId, userId) {
    const uid = getUserId(userId);
    if (!uid) return Promise.resolve({ data: { liked: false, count: 0 } });
    return axiosClient.get(`/posts/${postId}/likes/check?userId=${uid}`);
  },
};

export default likeService;
