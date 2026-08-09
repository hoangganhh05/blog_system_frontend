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
};


export default postService;
