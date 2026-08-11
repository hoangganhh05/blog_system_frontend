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
  // The backend obtains the author from the verified JWT.
  create({ content, post }) {
    return axiosClient.post("/comments", { content, post });
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
