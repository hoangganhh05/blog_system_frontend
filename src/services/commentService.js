import axiosClient from "../api/axiosClient";

const commentService = {
  // Lấy tất cả comments
  getAll() {
    return axiosClient.get("/comments");
  },

  // Lấy comments theo bài viết — khớp endpoint backend GET /comments?postId={id}
  getByPostId(postId) {
    return axiosClient.get(`/comments?postId=${postId}`);
  },

  // Alias cho getByPostId
  getByPost(postId) {
    return this.getByPostId(postId);
  },

  // Alias cho getByPostId
  getCommentsByPost(postId) {
    return this.getByPostId(postId);
  },

  // Lấy comment theo ID
  getById(id) {
    return axiosClient.get(`/comments/${id}`);
  },

  // Tạo comment mới
  create({ content, post, imageIndex = null }) {
    return axiosClient.post("/comments", { content, post, imageIndex });
  },

  // Alias cho create
  createComment(data) {
    return this.create(data);
  },

  // Cập nhật comment
  update(id, commentData) {
    return axiosClient.put(`/comments/${id}`, commentData);
  },

  // Xóa comment
  delete(id) {
    return axiosClient.delete(`/comments/${id}`);
  },

  // Lấy gợi ý mention khi gõ @
  getMentionSuggestions(keyword) {
    return axiosClient.get(`/users/mention-suggestions?keyword=${keyword || ''}`);
  },
};

export const getAll = commentService.getAll.bind(commentService);
export const getByPostId = commentService.getByPostId.bind(commentService);
export const getByPost = commentService.getByPost.bind(commentService);
export const getCommentsByPost = commentService.getCommentsByPost.bind(commentService);
export const getById = commentService.getById.bind(commentService);
export const create = commentService.create.bind(commentService);
export const createComment = commentService.createComment.bind(commentService);
export const update = commentService.update.bind(commentService);
export const deleteComment = commentService.delete.bind(commentService);
export const getMentionSuggestions = commentService.getMentionSuggestions.bind(commentService);

export default commentService;
