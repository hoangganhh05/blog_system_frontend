import axiosClient from "../api/axiosClient";

const storyService = {
  // Đăng Story mới
  create(_userId, data) {
    // data: { mediaUrl, textContent, bgColor }
    return axiosClient.post("/stories/create", data);
  },

  // Lấy các story trong 24h qua
  getActiveStories() {
    return axiosClient.get("/stories/active");
  },

  // Xóa story
  delete(storyId) {
    return axiosClient.delete(`/stories/${storyId}`);
  },

  // Xem story
  view(storyId, _userId) {
    return axiosClient.post(`/stories/${storyId}/view`);
  },

  // Thả cảm xúc Story
  react(storyId, _userId, reaction) {
    return axiosClient.post(`/stories/${storyId}/react?reaction=${encodeURIComponent(reaction)}`);
  },

  // Lấy người xem & cảm xúc story
  getViewers(storyId) {
    return axiosClient.get(`/stories/${storyId}/viewers`);
  },
};

export default storyService;
