import axiosClient from "../api/axiosClient";

const commentService = {
  // Lấy tất cả comments
  getAll() {
    return axiosClient.get("/comments");
  },

  // Lấy comment theo ID
  getById(id) {
    return axiosClient.get(`/comments/${id}`);
  },

  // Tạo comment mới
  // commentData: { content, post: { id }, user: { id } }
  create(commentData) {
    return axiosClient.post("/comments", commentData);
  },

  // Cập nhật comment
  update(id, commentData) {
    return axiosClient.put(`/comments/${id}`, commentData);
  },

  // Xóa comment
  delete(id) {
    return axiosClient.delete(`/comments/${id}`);
  },
};

export default commentService;
