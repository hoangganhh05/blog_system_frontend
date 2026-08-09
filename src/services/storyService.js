import axiosClient from "../api/axiosClient";

const storyService = {
  // Đăng Story mới
  create(userId, data) {
    // data: { mediaUrl, textContent, bgColor }
    return axiosClient.post(`/stories/create?userId=${userId}`, data);
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
  view(storyId, userId) {
    return axiosClient.post(`/stories/${storyId}/view?userId=${userId}`);
  },

  // Thả cảm xúc Story
  react(storyId, userId, reaction) {
    return axiosClient.post(`/stories/${storyId}/react?userId=${userId}&reaction=${encodeURIComponent(reaction)}`);
  },

  // Lấy người xem & cảm xúc story
  getViewers(storyId) {
    return axiosClient.get(`/stories/${storyId}/viewers`);
  },
};

export default storyService;
