import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import commentService from "../services/commentService";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d} ngày trước` : new Date(dateStr).toLocaleDateString("vi-VN");
}

function CommentItem({ comment, onDelete, onReplySubmit }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [loading, setLoading] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const authorName = comment.user?.fullName || comment.user?.username || "Ẩn danh";
  const isOwner = currentUser && comment.user?.id === currentUser.id;

  const handleGoToProfile = (e) => {
    e.stopPropagation();
    if (comment.user?.id) {
      navigate(`/profile/${comment.user.id}`);
    }
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    setLoading(true);
    try {
      await commentService.update(comment.id, {
        ...comment,
        content: editText,
      });
      comment.content = editText;
      setEditing(false);
    } catch {
      alert("Lỗi khi cập nhật bình luận");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const fullReplyContent = `@${authorName}: ${replyText.trim()}`;
      await onReplySubmit(fullReplyContent);
      setReplyText("");
      setShowReplyForm(false);
    } catch {
      // Ignore
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="comment-item" style={{ marginBottom: 12 }}>
      {comment.user?.avatarUrl ? (
        <img
          src={comment.user.avatarUrl}
          alt={authorName}
          className="avatar avatar-sm"
          style={{ objectFit: "cover", cursor: "pointer" }}
          onClick={handleGoToProfile}
          title={`Xem trang cá nhân của ${authorName}`}
        />
      ) : (
        <div
          className="avatar avatar-sm"
          style={{
            background: comment.user?.avatarColor ? `linear-gradient(135deg, ${comment.user.avatarColor}, ${comment.user.avatarColor}bb)` : undefined,
            cursor: "pointer"
          }}
          onClick={handleGoToProfile}
          title={`Xem trang cá nhân của ${authorName}`}
        >
          {getInitials(authorName)}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div className="comment-bubble">
          <div
            className="comment-author"
            style={{ cursor: "pointer" }}
            onClick={handleGoToProfile}
            title={`Xem trang cá nhân của ${authorName}`}
          >
            {authorName}
          </div>
          {editing ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
              <input
                className="form-input"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                style={{ flex: 1, padding: "6px 10px", fontSize: 14 }}
                onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              />
              <button className="btn btn-primary btn-sm" onClick={handleEdit} disabled={loading}>
                {loading ? "..." : "Lưu"}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>
                Hủy
              </button>
            </div>
          ) : (
            <div className="comment-text">{comment.content}</div>
          )}
        </div>
        <div className="comment-footer" style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-muted)", marginTop: 4, paddingLeft: 4 }}>
          <span>{timeAgo(comment.createdAt)}</span>
          <span
            className="comment-action"
            style={{ cursor: "pointer", fontWeight: 700, color: "var(--primary)" }}
            onClick={() => {
              setShowReplyForm((v) => !v);
              if (!replyText) setReplyText(`@${authorName} `);
            }}
          >
            Trả lời
          </span>
          {isOwner && !editing && (
            <>
              <span className="comment-action" style={{ cursor: "pointer" }} onClick={() => setEditing(true)}>
                Chỉnh sửa
              </span>
              <span
                className="comment-action"
                style={{ color: "var(--danger)", cursor: "pointer" }}
                onClick={() => {
                  if (window.confirm("Xóa bình luận này?")) onDelete(comment.id);
                }}
              >
                Xóa
              </span>
            </>
          )}
        </div>

        {/* Form nhập phản hồi (Rep comment) */}
        {showReplyForm && (
          <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", paddingLeft: 8 }}>
            <input
              type="text"
              className="form-input"
              placeholder={`Trả lời @${authorName}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              style={{ flex: 1, padding: "6px 12px", fontSize: 13, borderRadius: 16 }}
              onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSendReply}
              disabled={replying || !replyText.trim()}
              style={{ borderRadius: 16, fontSize: 12, padding: "4px 10px" }}
            >
              {replying ? "..." : "Gửi"}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowReplyForm(false)}
              style={{ borderRadius: 16, fontSize: 12, padding: "4px 8px" }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Component form + list comment cho một post
function CommentSection({ postId, comments, onCommentsChange }) {
  const { currentUser } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!currentUser) {
      alert("Vui lòng đăng nhập để bình luận!");
      return;
    }
    setSubmitting(true);
    try {
      const res = await commentService.create({
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
        post: { id: parseInt(postId) },
        user: { id: parseInt(currentUser.id || currentUser.userId) },


      });
      // Thêm thông tin user đầy đủ vào comment mới
      const newCmt = { ...res.data, user: currentUser };
      onCommentsChange([newCmt, ...comments]);
      setNewComment("");
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || err.message || "Không thể gửi bình luận. Vui lòng thử lại!";
      alert(`Lỗi gửi bình luận: ${msg}`);
    } finally {
      setSubmitting(false);
    }

  };

  const handleReplySubmit = async (replyContent) => {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để phản hồi bình luận!");
      return;
    }
    try {
      const res = await commentService.create({
        content: replyContent,
        createdAt: new Date().toISOString(),
        post: { id: parseInt(postId) },
        user: { id: parseInt(currentUser.id || currentUser.userId) },
      });
      const newCmt = { ...res.data, user: currentUser };
      onCommentsChange([newCmt, ...comments]);
    } catch {
      alert("Không thể gửi phản hồi. Vui lòng thử lại!");
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await commentService.delete(commentId);
      onCommentsChange(comments.filter((c) => c.id !== commentId));
    } catch {
      alert("Không thể xóa bình luận");
    }
  };

  return (
    <div className="comment-section">
      <h3 className="comment-section-title">
        💬 Bình luận ({comments.length})
      </h3>

      {/* Form thêm comment */}
      {currentUser ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName || currentUser.username}
              className="avatar avatar-md"
              style={{ objectFit: "cover", cursor: "pointer" }}
              onClick={() => (currentUser.id || currentUser.userId) && window.location.assign(`/profile/${currentUser.id || currentUser.userId}`)}
              title="Xem trang cá nhân của tôi"
            />
          ) : (
            <div
              className="avatar avatar-md"
              style={{
                background: currentUser.avatarColor ? `linear-gradient(135deg, ${currentUser.avatarColor}, ${currentUser.avatarColor}bb)` : undefined,
                cursor: "pointer"
              }}
              onClick={() => (currentUser.id || currentUser.userId) && window.location.assign(`/profile/${currentUser.id || currentUser.userId}`)}
              title="Xem trang cá nhân của tôi"
            >
              {getInitials(currentUser.fullName || currentUser.username)}
            </div>
          )}
          <div className="comment-input-wrap" style={{ flex: 1 }}>
            <textarea
              className="comment-input"
              placeholder="Viết bình luận của bạn..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                resize: "none",
                fontSize: 15,
                color: "var(--text-primary)",
                fontFamily: "inherit",
              }}
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 18,
                opacity: newComment.trim() ? 1 : 0.4,
              }}
            >
              {submitting ? "⏳" : "📨"}
            </button>
          </div>
        </form>
      ) : (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          Vui lòng{" "}
          <a href="/login" style={{ fontWeight: 700 }}>
            đăng nhập
          </a>{" "}
          để bình luận.
        </div>
      )}

      {/* Danh sách comment với nút Trả lời / Rep chuẩn Facebook */}
      {comments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <h3>Chưa có bình luận nào</h3>
          <p>Hãy là người đầu tiên bình luận!</p>
        </div>
      ) : (
        comments.map((comment) => {
          const isReply = comment.content?.startsWith("@");
          return (
            <div
              key={comment.id}
              style={isReply ? { paddingLeft: 28, borderLeft: "2px solid var(--border-light)", marginLeft: 12, marginTop: 4 } : {}}
            >
              <CommentItem
                comment={comment}
                onDelete={handleDelete}
                onReplySubmit={handleReplySubmit}
              />
            </div>
          );
        })
      )}
    </div>
  );
}

export { CommentItem };
export default CommentSection;
