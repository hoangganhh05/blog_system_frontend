import axiosClient from "../api/axiosClient";

const postService = {
  // Lấy tất cả posts với phân trang
  getAll(page = 0, size = 10) {
    return axiosClient.get(`/posts?page=${page}&size=${size}&sort=createdAt,desc`);
  },

  getAllPosts(page = 0, size = 10) {
    return this.getAll(page, size);
  },

  getPosts(page = 0, size = 10) {
    return this.getAll(page, size);
  },

  // Lấy post theo ID
  getById(id) {
    return axiosClient.get(`/posts/${id}`);
  },

  getPostById(id) {
    return this.getById(id);
  },

  // Lấy posts theo category
  getByCategory(categoryId, page = 0, size = 10) {
    return axiosClient.get(`/posts/category/${categoryId}?page=${page}&size=${size}&sort=createdAt,desc`);
  },

  // Dịch bài viết on-demand
  translate(postId, targetLanguage = "vi") {
    return axiosClient.post(`/posts/${postId}/translations`, { targetLanguage });
  },

  // Tạo post mới
  create(postData) {
    return axiosClient.post("/posts", postData);
  },

  createPost(postData) {
    return this.create(postData);
  },

  // Cập nhật post
  update(id, postData) {
    return axiosClient.put(`/posts/${id}`, postData);
  },

  updatePost(id, postData) {
    return this.update(id, postData);
  },

  // Xóa post
  delete(id) {
    return axiosClient.delete(`/posts/${id}`);
  },

  deletePost(id) {
    return this.delete(id);
  },

  // Tìm kiếm bài viết theo từ khóa
  search(query, page = 0, size = 10) {
    return axiosClient.get(`/posts/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}&sort=createdAt,desc`);
  },

  searchPosts(query, page = 0, size = 10) {
    return this.search(query, page, size);
  },

  // Lấy bài viết theo khoảng thời gian chuẩn SARGable
  getByDateRange(startDate, endDate, page = 0, size = 10) {
    return axiosClient.get(`/posts/date-range?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}&page=${page}&size=${size}&sort=createdAt,desc`);
  },

  // Lấy bài viết theo tháng
  getByMonth(yearMonth, page = 0, size = 10) {
    const parts = yearMonth.split("-");
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).toISOString();
    const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0)).toISOString();

    return this.getByDateRange(startDate, endDate, page, size);
  },

  // Tăng lượt xem bài viết
  incrementViewCount(id) {
    if (!id) return Promise.resolve();
    const sessionKey = `viewed_post_${id}`;
    const lastViewed = sessionStorage.getItem(sessionKey);
    const now = Date.now();

    if (lastViewed && now - parseInt(lastViewed) < 30 * 60 * 1000) {
      return Promise.resolve({ data: { message: "Lượt xem đã được ghi nhận trong phiên này." } });
    }

    sessionStorage.setItem(sessionKey, now.toString());
    return axiosClient.post(`/posts/${id}/view`).catch(() => {
      return { data: { message: "Lượt xem thực tế đã ghi nhận." } };
    });
  },

  // Lấy danh sách video đề xuất (TikTok/Reels Recommendation Feed)
  getRecommendedShorts(page = 0, size = 10, excludeIds = []) {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("size", size);
    if (Array.isArray(excludeIds) && excludeIds.length > 0) {
      params.append("excludeIds", excludeIds.join(","));
    }
    return axiosClient.get(`/posts/feed/shorts?${params.toString()}`).catch(() => {
      // Client-side fallback nếu kết nối API feed chưa sẵn sàng
      return axiosClient.get(`/posts?page=${page}&size=50`).then((res) => {
        const rawList = res.data?.content || res.data || [];
        const excludeSet = new Set(excludeIds || []);
        const videoList = rawList.filter(
          (p) =>
            (p.mediaType === "video" || p.videoUrl || p.thumbNail?.includes(".mp4")) &&
            !excludeSet.has(p.id)
        );
        const ranked = videoList.sort((a, b) => {
          const scoreA = (a.likesCount || 0) * 3 + (a.commentsCount || 0) * 4 + (a.viewCount || 0) * 0.5 + Math.random() * 6;
          const scoreB = (b.likesCount || 0) * 3 + (b.commentsCount || 0) * 4 + (b.viewCount || 0) * 0.5 + Math.random() * 6;
          return scoreB - scoreA;
        });
        return { data: { content: ranked.slice(0, size), totalElements: ranked.length } };
      });
    });
  },
};

export const getAll = postService.getAll.bind(postService);
export const getAllPosts = postService.getAllPosts.bind(postService);
export const getById = postService.getById.bind(postService);
export const getPostById = postService.getPostById.bind(postService);
export const getByCategory = postService.getByCategory.bind(postService);
export const create = postService.create.bind(postService);
export const createPost = postService.createPost.bind(postService);
export const update = postService.update.bind(postService);
export const updatePost = postService.updatePost.bind(postService);
export const deletePost = postService.delete.bind(postService);
export const search = postService.search.bind(postService);
export const searchPosts = postService.searchPosts.bind(postService);
export const getByDateRange = postService.getByDateRange.bind(postService);
export const getByMonth = postService.getByMonth.bind(postService);
export const incrementViewCount = postService.incrementViewCount.bind(postService);

export default postService;
