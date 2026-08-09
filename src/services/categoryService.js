import axiosClient from "../api/axiosClient";

const categoryService = {
  // Lấy tất cả categories
  getAll() {
    return axiosClient.get("/categories");
  },

  // Lấy category theo ID
  getById(id) {
    return axiosClient.get(`/categories/${id}`);
  },

  // Tạo category mới
  create(categoryData) {
    return axiosClient.post("/categories", {
      ...categoryData,
      createdAt: new Date().toISOString(),
    });
  },

  // Cập nhật category
  update(id, categoryData) {
    return axiosClient.put(`/categories/${id}`, categoryData);
  },

  // Xóa category
  delete(id) {
    return axiosClient.delete(`/categories/${id}`);
  },
};

export default categoryService;
