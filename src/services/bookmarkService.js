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
  toggleBookmark(postId) {
    return axiosClient.post(`/posts/${postId}/bookmark`);
  },

  // Kiểm tra xem bài viết đã được lưu bởi user chưa
  checkBookmarked(postId, userId) {
    if (!getUserId(userId)) return Promise.resolve({ data: { bookmarked: false } });
    return axiosClient.get(`/posts/${postId}/bookmark/check`);
  },

  isBookmarked(postId, userId) {
    return this.checkBookmarked(postId, userId);
  },

  // Lấy danh sách các bài viết đã bookmark của user
  getUserBookmarks(userId) {
    const uid = getUserId(userId);
    return axiosClient.get(`/users/${uid}/bookmarks`);
  },

  getBookmarks(userId) {
    return this.getUserBookmarks(userId);
  },
};

export const toggleBookmark = bookmarkService.toggleBookmark.bind(bookmarkService);
export const checkBookmarked = bookmarkService.checkBookmarked.bind(bookmarkService);
export const isBookmarked = bookmarkService.isBookmarked.bind(bookmarkService);
export const getUserBookmarks = bookmarkService.getUserBookmarks.bind(bookmarkService);
export const getBookmarks = bookmarkService.getBookmarks.bind(bookmarkService);

export default bookmarkService;
