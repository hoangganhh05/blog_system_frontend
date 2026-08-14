import axiosClient from "../api/axiosClient";

const storyService = {
  // Đăng Story mới
  create(_userId, data) {
    const payload = typeof data !== "undefined" ? data : _userId;
    return axiosClient.post("/stories/create", payload);
  },

  // Lấy các story trong 24h qua
  getActiveStories() {
    return axiosClient.get("/stories/active");
  },

  // Lấy kho lưu trữ tin (Story Archive)
  getArchivedStories(userId) {
    return userId
      ? axiosClient.get(`/stories/archive/${userId}`)
      : axiosClient.get("/stories/archive");
  },

  getArchive(userId) {
    return this.getArchivedStories(userId);
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
    const reactionValue = typeof reaction !== "undefined" ? reaction : _userId;
    return axiosClient.post(`/stories/${storyId}/react?reaction=${encodeURIComponent(reactionValue)}`);
  },

  // Lấy người xem & cảm xúc story
  getViewers(storyId) {
    return axiosClient.get(`/stories/${storyId}/viewers`);
  },
};

export const create = storyService.create.bind(storyService);
export const getActiveStories = storyService.getActiveStories.bind(storyService);
export const getArchivedStories = storyService.getArchivedStories.bind(storyService);
export const getArchive = storyService.getArchive.bind(storyService);
export const deleteStory = storyService.delete.bind(storyService);
export const view = storyService.view.bind(storyService);
export const react = storyService.react.bind(storyService);
export const getViewers = storyService.getViewers.bind(storyService);

export default storyService;
