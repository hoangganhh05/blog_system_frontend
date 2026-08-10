import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import commentService from "../services/commentService";
import uploadService from "../services/uploadService";
import { ConfirmModal } from "./CustomModal";

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

function CommentItem({ comment, onDelete, onReplyClick, onToast }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      onToast && onToast("Đã cập nhật bình luận!", "success");
    } catch {
      onToast && onToast("Lỗi khi cập nhật bình luận!", "error");
    } finally {
      setLoading(false);
    }
  };

  // Định dạng nội dung bình luận: Hỗ trợ thẻ Mention xanh và hiển thị Ảnh/GIF đính kèm
  const renderCommentContent = (content) => {
    if (!content) return null;

    let taggedUser = null;
    let actualText = content;

    const match = content.match(/^@([^:]+):\s*(.*)$/);
    if (match) {
      taggedUser = match[1].trim();
      actualText = match[2].trim();
      if (actualText.toLowerCase().startsWith(`@${taggedUser.toLowerCase()}`)) {
        actualText = actualText.substring(taggedUser.length + 1).trim();
      }
    }

    // Kiểm tra xem có đính kèm Ảnh hoặc GIF hay không
    let imageUrl = null;
    const imgMatch = actualText.match(/(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp)|📷\s*(https?:\/\/[^\s]+))/i);
    if (imgMatch) {
      imageUrl = imgMatch[2] || imgMatch[1];
      actualText = actualText.replace(imgMatch[0], "").trim();
    }

    return (
      <div>
        {taggedUser && (
          <span style={{ color: "var(--primary)", fontWeight: 700, marginRight: 6 }}>
            @{taggedUser}
          </span>
        )}
        <span>{actualText}</span>
        {imageUrl && (
          <div style={{ marginTop: 8 }}>
            <img
              src={imageUrl}
              alt="Mô tả"
              style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 12, objectFit: "cover" }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="comment-item" style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        {comment.user?.avatarUrl ? (
          <img
            src={comment.user.avatarUrl}
            alt={authorName}
            className="avatar avatar-sm"
            style={{ cursor: "pointer", objectFit: "cover", width: 32, height: 32 }}
            onClick={handleGoToProfile}
          />
        ) : (
          <div
            className="avatar avatar-sm"
            style={{
              cursor: "pointer",
              width: 32,
              height: 32,
              fontSize: 13,
              background: comment.user?.avatarColor ? `linear-gradient(135deg, ${comment.user.avatarColor}, ${comment.user.avatarColor}bb)` : undefined,
            }}
            onClick={handleGoToProfile}
          >
            {getInitials(authorName)}
          </div>
        )}

        <div className="comment-content-wrap" style={{ flex: 1 }}>
          <div className="comment-bubble" style={{ background: "var(--bg-input)", padding: "8px 12px", borderRadius: 16 }}>
            <div
              className="comment-author"
              style={{ fontWeight: 700, fontSize: 13, cursor: "pointer", color: "var(--text-primary)" }}
              onClick={handleGoToProfile}
            >
              {authorName}
            </div>

            {editing ? (
              <div className="comment-edit-form" style={{ marginTop: 6 }}>
                <textarea
                  className="form-input"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={2}
                  style={{ width: "100%", fontSize: 13, padding: 8 }}
                />
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleEdit} disabled={loading}>
                    {loading ? "..." : "Lưu"}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div className="comment-text">{renderCommentContent(comment.content)}</div>
            )}
          </div>
          <div className="comment-footer" style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-muted)", marginTop: 4, paddingLeft: 4 }}>
            <span>{timeAgo(comment.createdAt)}</span>
            <span
              className="comment-action"
              style={{ cursor: "pointer", fontWeight: 700, color: "var(--primary)" }}
              onClick={() => onReplyClick && onReplyClick(authorName)}
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
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Xóa
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Modal thay cho window.confirm */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Xóa bình luận?"
        message="Bạn có chắc chắn muốn xóa bình luận này không?"
        confirmText="Xóa bình luận"
        confirmVariant="danger"
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => onDelete(comment.id)}
      />
    </>
  );
}

// Component bọc nhóm bình luận gốc + các phản hồi thu gọn/mở rộng chuẩn Facebook
function ParentCommentGroup({ parentCmt, childReplies, handleDelete, onReplyClick, onToast }) {
  const [showChildReplies, setShowChildReplies] = useState(false);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Bình luận gốc */}
      <CommentItem
        comment={parentCmt}
        onDelete={handleDelete}
        onReplyClick={onReplyClick}
        onToast={onToast}
      />

      {/* Nút Xem / Ẩn X phản hồi chuẩn Facebook */}
      {childReplies.length > 0 && (
        <div style={{ paddingLeft: 44, marginTop: 2 }}>
          {!showChildReplies ? (
            <button
              onClick={() => setShowChildReplies(true)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "2px 0",
              }}
            >
              <span style={{ fontSize: 11 }}>⌄</span> Xem {childReplies.length} phản hồi
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowChildReplies(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 11 }}>⌃</span> Ẩn phản hồi
              </button>

              <div
                style={{
                  paddingLeft: 20,
                  borderLeft: "2.5px solid var(--border-light)",
                  marginLeft: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {childReplies.map((replyCmt) => (
                  <CommentItem
                    key={replyCmt.id}
                    comment={replyCmt}
                    onDelete={handleDelete}
                    onReplyClick={onReplyClick}
                    onToast={onToast}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Component form + list comment cho một post
function CommentSection({ postId, comments, onCommentsChange }) {
  const { currentUser } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [commentImage, setCommentImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef(null);
  const commentInputRef = useRef(null);

  const handleReplyClick = (authorName) => {
    setReplyTarget(authorName);
    setNewComment(`@${authorName}: `);
    if (commentInputRef.current) {
      commentInputRef.current.focus();
      commentInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleImageFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    showToast("Đang tải ảnh lên...", "info");
    try {
      const res = await uploadService.uploadFile(file);
      setCommentImage(res.data.url);
      showToast("Đã đính kèm ảnh thành công!", "success");
    } catch {
      showToast("Tải ảnh thất bại. Vui lòng thử lại!", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() && !commentImage) return;
    if (!currentUser) {
      showToast("Vui lòng đăng nhập để bình luận!", "error");
      return;
    }
    setSubmitting(true);

    let finalContent = newComment.trim();
    if (commentImage) {
      finalContent = `${finalContent} 📷 ${commentImage}`.trim();
    }

    try {
      const res = await commentService.create({
        content: finalContent,
        createdAt: new Date().toISOString(),
        post: { id: parseInt(postId) },
        user: { id: parseInt(currentUser.id || currentUser.userId) },
      });
      const newCmt = { ...res.data, user: currentUser };
      onCommentsChange([newCmt, ...comments]);
      setNewComment("");
      setCommentImage("");
      setReplyTarget(null);
      setShowEmojiPicker(false);
      setShowGifPicker(false);
      setShowStickerPicker(false);
      showToast("Đã đăng bình luận!", "success");
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || err.message || "Không thể gửi bình luận!";
      showToast(`Lỗi: ${msg}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await commentService.delete(commentId);
      onCommentsChange(comments.filter((c) => c.id !== commentId));
      showToast("Đã xóa bình luận!", "success");
    } catch {
      showToast("Không thể xóa bình luận!", "error");
    }
  };

  // Phân loại bình luận gốc (Parent) và bình luận con (Replies)
  const parentComments = [];
  const replyMap = {};

  const sortedChrono = [...comments].sort((a, b) => new Date(a.createdAt || a.id) - new Date(b.createdAt || b.id));

  sortedChrono.forEach((c) => {
    if (c.content?.startsWith("@")) {
      const match = c.content.match(/^@([^:]+):/);
      const targetName = match ? match[1].trim() : null;
      if (targetName) {
        if (!replyMap[targetName]) replyMap[targetName] = [];
        replyMap[targetName].push(c);
      } else {
        parentComments.push(c);
      }
    } else {
      parentComments.push(c);
    }
  });

  const userName = currentUser?.fullName || currentUser?.username || "bạn";

  return (
    <div className="comment-section" style={{ display: "flex", flexDirection: "column" }}>
      <h3 className="comment-section-title" style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
        💬 Bình luận ({comments.length})
      </h3>

      {/* Danh sách comment phân cấp Cây & Xem X Phản hồi chuẩn Facebook */}
      {comments.length === 0 ? (
        <div className="empty-state" style={{ marginBottom: 20 }}>
          <div className="empty-state-icon">💬</div>
          <h3>Chưa có bình luận nào</h3>
          <p>Hãy là người đầu tiên bình luận!</p>
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          {parentComments.map((parentCmt) => {
            const parentAuthor = parentCmt.user?.fullName || parentCmt.user?.username || "";
            const childReplies = replyMap[parentAuthor] || [];

            return (
              <ParentCommentGroup
                key={parentCmt.id}
                parentCmt={parentCmt}
                childReplies={childReplies}
                handleDelete={handleDelete}
                onReplyClick={handleReplyClick}
                onToast={showToast}
              />
            );
          })}
        </div>
      )}

      {/* Khung thêm bình luận Facebook Style DUY NHẤT ở dưới cùng */}
      {currentUser ? (
        <form className="facebook-comment-form" onSubmit={handleSubmit} style={{ marginTop: 8, marginBottom: 8, position: "sticky", bottom: 0, zIndex: 10, background: "var(--bg-card)", paddingTop: 4 }}>
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageFileSelect}
          />

          {/* Thẻ chỉ báo đang trả lời ai */}
          {replyTarget && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--primary-light)", color: "var(--primary)", padding: "6px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              <span>Đang trả lời <strong style={{ color: "var(--primary)" }}>@{replyTarget}</strong></span>
              <button
                type="button"
                onClick={() => {
                  setReplyTarget(null);
                  setNewComment("");
                }}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
              >
                ✕ Hủy
              </button>
            </div>
          )}

          <div
            style={{
              background: "var(--bg-input)",
              borderRadius: 18,
              padding: "10px 14px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px var(--border-light)",
              position: "relative",
            }}
          >
            {/* Hàng trên: Avatar có icon mũi tên + Input text */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ position: "relative", display: "inline-block", flexShrink: 0, marginTop: 2 }}>
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={userName}
                    className="avatar avatar-sm"
                    style={{ objectFit: "cover", width: 32, height: 32 }}
                  />
                ) : (
                  <div
                    className="avatar avatar-sm"
                    style={{
                      width: 32,
                      height: 32,
                      fontSize: 13,
                      background: currentUser.avatarColor ? `linear-gradient(135deg, ${currentUser.avatarColor}, ${currentUser.avatarColor}bb)` : undefined,
                    }}
                  >
                    {getInitials(userName)}
                  </div>
                )}
                <span
                  style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "50%",
                    fontSize: 8,
                    width: 12,
                    height: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  ⌄
                </span>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <textarea
                  ref={commentInputRef}
                  className="comment-input"
                  placeholder={replyTarget ? `Trả lời @${replyTarget}...` : `Trả lời dưới tên ${userName}...`}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
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
                    outline: "none",
                    resize: "none",
                    fontSize: 14.5,
                    color: "var(--text-primary)",
                    fontFamily: "inherit",
                    minHeight: 42,
                  }}
                />

                {/* Preview Ảnh/GIF đính kèm nếu có */}
                {commentImage && (
                  <div style={{ position: "relative", marginTop: 6, display: "inline-block", alignSelf: "flex-start" }}>
                    <img
                      src={commentImage}
                      alt="Ảnh đính kèm"
                      style={{ height: 64, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border-light)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setCommentImage("")}
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        background: "var(--danger)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: 18,
                        height: 18,
                        fontSize: 10,
                        fontWeight: "bold",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Hàng dưới: Bộ Icon tương tác thực tế (Emoji, Camera, GIF, Sticker) & Nút Gửi */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 6,
                paddingTop: 6,
                borderTop: "1px solid var(--border-light)",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", gap: 14, color: "var(--text-muted)", alignItems: "center" }}>
                <button type="button" title="Thêm Biểu tượng cảm xúc" style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "flex", padding: 2 }} onClick={() => setShowEmojiPicker((v) => !v)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                </button>
                <button type="button" title="Tải ảnh đính kèm từ máy" style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "flex", padding: 2 }} onClick={() => fileInputRef.current?.click()}>
                  {uploadingImage ? (
                    <span style={{ fontSize: 12 }}>...</span>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  )}
                </button>
                <button type="button" title="Thêm Ảnh GIF" style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "flex", padding: 2 }} onClick={() => setShowGifPicker((v) => !v)}>
                  <span style={{ fontSize: 10, fontWeight: 800, border: "1.5px solid currentColor", borderRadius: 4, padding: "0 3px", lineHeight: "14px" }}>GIF</span>
                </button>
                <button type="button" title="Thêm Nhãn dán" style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "flex", padding: 2 }} onClick={() => setShowStickerPicker((v) => !v)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting || (!newComment.trim() && !commentImage)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: (newComment.trim() || commentImage) ? "var(--primary)" : "var(--text-muted)",
                  fontSize: 16,
                  opacity: (newComment.trim() || commentImage) ? 1 : 0.4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 4,
                }}
                title="Gửi bình luận"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>

              {/* Popover Bảng Chọn Emoji */}
              {showEmojiPicker && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 38,
                    left: 0,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-light)",
                    borderRadius: 14,
                    padding: 10,
                    width: 260,
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 6,
                    boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
                    zIndex: 99999,
                    animation: "scaleUp 0.15s ease",
                  }}
                >
                  {["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😍","🥰","😘","😋","😜","🥳","😎","🤩","😏","😒","😞","😔","😢","😭","😤","😡","🤬","🤯","😳","📁","❤️","🔥","🎉","👍","🙌","✨"].map((em) => (
                    <span
                      key={em}
                      style={{ fontSize: 18, cursor: "pointer", textAlign: "center", padding: "2px" }}
                      onClick={() => {
                        setNewComment((v) => v + em);
                        setShowEmojiPicker(false);
                      }}
                    >
                      {em}
                    </span>
                  ))}
                </div>
              )}

              {/* Popover Bảng Chọn Ảnh GIF */}
              {showGifPicker && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 38,
                    left: 40,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-light)",
                    borderRadius: 14,
                    padding: 10,
                    width: 250,
                    maxHeight: 190,
                    overflowY: "auto",
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 8,
                    boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
                    zIndex: 99999,
                    animation: "scaleUp 0.15s ease",
                  }}
                >
                  {[
                    "https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif",
                    "https://media.giphy.com/media/26n61r3OWvYFRb57O/giphy.gif",
                    "https://media.giphy.com/media/3o7TKsjN42gScZzs9a/giphy.gif",
                    "https://media.giphy.com/media/13hxe6f343OOWe/giphy.gif"
                  ].map((gif, idx) => (
                    <img
                      key={idx}
                      src={gif}
                      alt="GIF"
                      style={{ width: "100%", height: 60, objectFit: "cover", borderRadius: 8, cursor: "pointer", border: "1px solid var(--border-light)" }}
                      onClick={() => {
                        setCommentImage(gif);
                        setShowGifPicker(false);
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Popover Bảng Chọn Nhãn Dán Sticker */}
              {showStickerPicker && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 38,
                    left: 0,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-light)",
                    borderRadius: 14,
                    padding: 10,
                    width: 220,
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: 8,
                    boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
                    zIndex: 99999,
                    animation: "scaleUp 0.15s ease",
                  }}
                >
                  {["🥸","🐶","🐱","🐼","🦊","🦁","🐯","🐰","🐸","🦄"].map((st) => (
                    <span
                      key={st}
                      style={{ fontSize: 24, cursor: "pointer", textAlign: "center" }}
                      onClick={() => {
                        setNewComment((v) => v + " " + st);
                        setShowStickerPicker(false);
                      }}
                    >
                      {st}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>
      ) : (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          Vui lòng{" "}
          <Link to="/login" style={{ fontWeight: 700, color: "var(--primary)" }}>
            đăng nhập
          </Link>{" "}
          để bình luận.
        </div>
      )}

      {/* Thông báo Toast hiện đại thay cho alert */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: toast.type === "error" ? "#ef4444" : "var(--primary)",
            color: "#ffffff",
            padding: "10px 18px",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            fontWeight: 600,
            fontSize: 14,
            zIndex: 999999,
            animation: "slideUp 0.2s ease",
          }}
        >
          {toast.type === "error" ? "❌ " : "✅ "}
          {toast.message}
        </div>
      )}
    </div>
  );
}

export { CommentItem };
export default CommentSection;
