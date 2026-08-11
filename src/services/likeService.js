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
  toggleLike(postId, _userId, type = "LIKE") {
    return axiosClient.post(`/posts/${postId}/like?type=${encodeURIComponent(type)}`);
  },

  // Lấy tổng lượt like của bài viết
  getLikeCount(postId) {
    return axiosClient.get(`/posts/${postId}/likes/count`);
  },

  // Kiểm tra xem user hiện tại đã like bài viết chưa
  checkLiked(postId, userId) {
    if (!getUserId(userId)) return Promise.resolve({ data: { liked: false, count: 0 } });
    return axiosClient.get(`/posts/${postId}/likes/check`);
  },

  // Lấy chi tiết danh sách người dùng đã thả từng cảm xúc cho bài viết
  getReactionsList(postId) {
    return axiosClient.get(`/posts/${postId}/likes/list`).catch(() => {
      // Fallback nếu backend chưa mở endpoint /likes/list
      return { data: [] };
    });
  },
};

export default likeService;
