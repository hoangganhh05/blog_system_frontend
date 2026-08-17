/**
 * Cache Utility Functions
 * Xóa sạch dữ liệu cache cũ trong localStorage/sessionStorage
 */

export const clearAppCache = () => {
  if (typeof window === 'undefined') return;

  // Xóa các key cache liên quan đến posts, comments, likes
  const keysToRemove = [
    'posts',
    'posts_cache',
    'comments_cache',
    'likes_cache',
    'cached_posts',
    'cached_comments',
  ];

  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  // Xóa tất cả sessionStorage (để reset view count tracking)
  sessionStorage.clear();

  console.log('App cache cleared successfully');
};

export const clearAllLocalStorage = () => {
  if (typeof window === 'undefined') return;
  
  // Giữ lại các key authentication quan trọng
  const authKeys = ['blog_user', 'blog_session_id'];
  const authData = {};

  authKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      authData[key] = value;
    }
  });

  // Xóa toàn bộ localStorage
  localStorage.clear();

  // Khôi phục lại authentication data
  Object.entries(authData).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });

  console.log('LocalStorage cleared (except auth data)');
};
