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

const bookmarkService = {
  // Toggle bookmark (lưu / bỏ lưu) bài viết
  toggleBookmark(postId, userId) {
    const uid = getUserId(userId);
    return axiosClient.post(`/posts/${postId}/bookmark?userId=${uid}`);
  },

  // Kiểm tra xem bài viết đã được lưu bởi user chưa
  checkBookmarked(postId, userId) {
    const uid = getUserId(userId);
    if (!uid) return Promise.resolve({ data: { bookmarked: false } });
    return axiosClient.get(`/posts/${postId}/bookmark/check?userId=${uid}`);
  },

  // Lấy danh sách các bài viết đã bookmark của user
  getUserBookmarks(userId) {
    const uid = getUserId(userId);
    return axiosClient.get(`/users/${uid}/bookmarks`);
  },
};

export default bookmarkService;
