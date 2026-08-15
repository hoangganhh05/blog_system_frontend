import axiosClient from "../api/axiosClient";

const songService = {
  // Lấy toàn bộ bài hát
  getAll() {
    return axiosClient.get("/songs");
  },

  // Lấy danh sách bài hát có phân trang (hỗ trợ hàng ngàn bài hát nhẹ mượt)
  getPaged(page = 0, size = 20) {
    return axiosClient.get(`/songs/paged?page=${page}&size=${size}`);
  },

  // Tìm kiếm bài hát
  search(query = "") {
    return axiosClient.get(`/songs/search?query=${encodeURIComponent(query)}`);
  },

  // Tìm kiếm có phân trang
  searchPaged(query = "", page = 0, size = 20) {
    return axiosClient.get(
      `/songs/search/paged?query=${encodeURIComponent(query)}&page=${page}&size=${size}`
    );
  },

  // Thêm 1 bài hát mới vào Database
  create(songData) {
    return axiosClient.post("/songs", songData);
  },

  // Nhập hàng loạt (Bulk Import) nhiều bài hát vào Database
  bulkImport(songList) {
    return axiosClient.post("/songs/bulk", songList);
  },

  // Cập nhật bài hát
  update(id, songData) {
    return axiosClient.put(`/songs/${id}`, songData);
  },

  // Xóa bài hát khỏi Database
  remove(id) {
    return axiosClient.delete(`/songs/${id}`);
  },
};

export default songService;
