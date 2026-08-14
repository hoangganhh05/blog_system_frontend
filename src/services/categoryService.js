import axiosClient from "../api/axiosClient";

const categoryService = {
  // Lấy tất cả categories
  getAll() {
    return axiosClient.get("/categories");
  },

  getCategories() {
    return this.getAll();
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

export const getAll = categoryService.getAll.bind(categoryService);
export const getCategories = categoryService.getCategories.bind(categoryService);
export const getById = categoryService.getById.bind(categoryService);
export const create = categoryService.create.bind(categoryService);
export const update = categoryService.update.bind(categoryService);
export const deleteCategory = categoryService.delete.bind(categoryService);

export default categoryService;
