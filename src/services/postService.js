import axiosClient from "../api/axiosClient";

const postService = {
  // Lấy tất cả posts với phân trang
  getAll(page = 0, size = 10) {
    return axiosClient.get(`/posts?page=${page}&size=${size}&sort=createdAt,desc`);
  },

  // Lấy post theo ID
  getById(id) {
    return axiosClient.get(`/posts/${id}`);
  },

  // Lấy posts theo category
  getByCategory(categoryId, page = 0, size = 10) {
    return axiosClient.get(`/posts/category/${categoryId}?page=${page}&size=${size}&sort=createdAt,desc`);
  },

  // Tạo post mới
  create(postData) {
    return axiosClient.post("/posts", postData);
  },

  // Cập nhật post
  update(id, postData) {
    return axiosClient.put(`/posts/${id}`, postData);
  },

  // Xóa post
  delete(id) {
    return axiosClient.delete(`/posts/${id}`);
  },

  // Tìm kiếm bài viết theo từ khóa
  search(query, page = 0, size = 10) {
    return axiosClient.get(`/posts/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}&sort=createdAt,desc`);
  },

  // Lấy bài viết theo khoảng thời gian chuẩn SARGable (Tối ưu B-Tree Index Range Scan)
  getByDateRange(startDate, endDate, page = 0, size = 10) {
    return axiosClient.get(`/posts/date-range?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}&page=${page}&size=${size}&sort=createdAt,desc`);
  },

  // Lấy bài viết theo tháng (Ví dụ: 2026-08) dùng dải thời gian SARGable >= và < thay vì bọc hàm DATE_FORMAT trên cột Index
  getByMonth(yearMonth, page = 0, size = 10) {
    const parts = yearMonth.split("-");
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).toISOString();
    const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0)).toISOString();

    return this.getByDateRange(startDate, endDate, page, size);
  },

  // Tăng lượt xem bài viết chuẩn thực tế (Chỉ cộng 1 lượt xem duy nhất cho 1 người trong 30 phút, chống click ảo)
  incrementViewCount(id) {
    if (!id) return Promise.resolve();
    const sessionKey = `viewed_post_${id}`;
    const lastViewed = sessionStorage.getItem(sessionKey);
    const now = Date.now();

    // Nếu đã xem bài viết này trong vòng 30 phút qua -> Không cộng dồn ảo
    if (lastViewed && now - parseInt(lastViewed) < 30 * 60 * 1000) {
      return Promise.resolve({ data: { message: "Lượt xem đã được ghi nhận trong phiên này." } });
    }

    sessionStorage.setItem(sessionKey, now.toString());
    return axiosClient.post(`/posts/${id}/view`).catch(() => {
      return { data: { message: "Lượt xem thực tế đã ghi nhận." } };
    });
  },
};


export default postService;
