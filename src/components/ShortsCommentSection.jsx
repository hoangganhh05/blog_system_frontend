import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  X,
  Heart,
  MessageCircle,
  Send,
  Loader2,
  MoreHorizontal,
  Edit2,
  Trash2,
  Smile,
  AtSign,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import commentService from "../services/commentService";
import Avatar from "./Avatar";
import ConfirmModal from "./ConfirmModal";
import EmojiPicker from "./EmojiPicker";
import GifPicker from "./GifPicker";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  let formattedString = dateStr;
  if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.includes("+")) {
    formattedString = dateStr + "Z";
  }
  const diff = Date.now() - new Date(formattedString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m}p trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ngày trước`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} tháng trước`;
  return `${Math.floor(mo / 12)} năm trước`;
}

function parseCommentContent(content = "") {
  if (!content) return { text: "", mediaUrl: null };
  const mediaRegex = /📷\s*(https?:\/\/[^\s]+)/;
  const match = content.match(mediaRegex);
  if (match) {
    const mediaUrl = match[1];
    const text = content.replace(mediaRegex, "").trim();
    return { text, mediaUrl };
  }
  return { text: content, mediaUrl: null };
}

/**
 * TikTok / Reels Style Single Comment Item
 */
function ShortsCommentItem({
  comment,
  videoAuthorId,
  onDelete,
  onUpdate,
  onReplySuccess,
}) {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? currentUser.id || currentUser.userId : null;
  const currentUsername = currentUser?.username;

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likesCount || 0);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content || "");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const author = comment.user || comment.author || {};
  const authorId = author.id || comment.userId || comment.authorId;
  const authorUsername = author.username || comment.username;
  const authorName = author.fullName || author.username || comment.userFullName || "Người dùng";
  const isVideoCreator = videoAuthorId && Number(authorId) === Number(videoAuthorId);

  const isOwner = Boolean(
    (currentUserId && authorId && Number(authorId) === Number(currentUserId)) ||
    (currentUsername && authorUsername && String(currentUsername).toLowerCase() === String(authorUsername).toLowerCase()) ||
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "ROLE_ADMIN" ||
    (Array.isArray(currentUser?.roles) && currentUser.roles.some((r) => r === "ROLE_ADMIN" || r === "ADMIN"))
  );

  const parsed = parseCommentContent(comment.content);
  const replies = Array.isArray(comment.replies) ? comment.replies : [];

  const handleToggleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? Math.max(0, prev - 1) : prev + 1));
  };

  const handleEdit = async () => {
    if (!editText.trim() || isSubmittingEdit) return;
    setIsSubmittingEdit(true);
    try {
      const res = await commentService.update(comment.id, { content: editText.trim() });
      comment.content = editText.trim();
      setIsEditing(false);
      toast.success("Đã cập nhật bình luận!");
      if (onUpdate) onUpdate(res.data);
    } catch {
      toast.error("Không thể cập nhật bình luận!");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const confirmDelete = async () => {
    setIsDeleteModalOpen(false);
    try {
      await commentService.delete(comment.id);
      toast.success("Đã xóa bình luận!");
      if (onDelete) onDelete(comment.id);
    } catch {
      toast.error("Lỗi khi xóa bình luận!");
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmittingReply) return;
    setIsSubmittingReply(true);
    try {
      const payload = {
        content: `@${authorUsername || authorName}: ${replyText.trim()}`,
        post: { id: comment.postId || comment.post?.id },
        parentCommentId: comment.id,
      };
      const res = await commentService.create(payload);
      setReplyText("");
      setIsReplying(false);
      setShowReplies(true);
      toast.success("Đã gửi phản hồi!");
      if (onReplySuccess) onReplySuccess(res.data);
    } catch {
      toast.error("Không thể gửi phản hồi!");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 group/item py-2 text-zinc-900 dark:text-zinc-100">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Link to={`/profile/${authorId || authorUsername}`} className="shrink-0 pt-0.5">
          <Avatar
            userId={authorId}
            src={author.avatarUrl || author.avatar}
            name={authorName}
            username={authorUsername}
            avatarColor={author.avatarColor}
            size="sm"
            className="ring-1 ring-zinc-200 dark:ring-zinc-800"
          />
        </Link>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          {/* Author Name + Badges */}
          <div className="flex items-center gap-1.5 flex-wrap leading-tight">
            <Link
              to={`/profile/${authorId || authorUsername}`}
              className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 hover:underline truncate"
            >
              {authorName}
            </Link>
            {isVideoCreator && (
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                Tác giả
              </span>
            )}
          </div>

          {/* Comment text or Inline Edit */}
          {isEditing ? (
            <div className="mt-1.5 flex flex-col gap-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[#fe2c55]"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 rounded-full text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleEdit}
                  disabled={isSubmittingEdit}
                  className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#fe2c55] text-white hover:bg-[#e0264a] cursor-pointer"
                >
                  {isSubmittingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : "Lưu"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-0.5 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed break-words whitespace-pre-wrap">
              {parsed.text}
              {parsed.mediaUrl && (
                <div className="mt-1.5 rounded-xl overflow-hidden max-w-[200px] max-h-[160px] border border-zinc-200 dark:border-zinc-800">
                  <img
                    src={parsed.mediaUrl}
                    alt="Comment media"
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => window.open(parsed.mediaUrl, "_blank")}
                  />
                </div>
              )}
            </div>
          )}

          {/* Sub Row: Time + Reply + Menu + Heart */}
          <div className="flex items-center justify-between gap-2 mt-1.5 text-zinc-400 dark:text-zinc-500 text-[11px] font-medium select-none">
            <div className="flex items-center gap-3">
              <span>{timeAgo(comment.createdAt)}</span>
              <button
                type="button"
                onClick={() => setIsReplying(!isReplying)}
                className="font-semibold hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
              >
                Trả lời
              </button>

              {/* 3 dots menu for owner */}
              {isOwner && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 opacity-80 sm:opacity-0 group-hover/item:opacity-100 transition cursor-pointer"
                    title="Tùy chọn"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setMenuOpen(false)} />
                      <div className="absolute left-0 bottom-full mb-1 w-28 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 z-50 flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(true);
                            setMenuOpen(false);
                          }}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 w-full text-left cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            setIsDeleteModalOpen(true);
                          }}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 w-full text-left cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Like Heart Button */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleLike}
                className={`p-1 rounded-full transition active:scale-125 cursor-pointer ${
                  isLiked
                    ? "text-[#fe2c55]"
                    : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                }`}
                title="Thích"
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              </button>
              {likeCount > 0 && <span className="text-[11px] font-semibold">{likeCount}</span>}
            </div>
          </div>

          {/* Quick Reply Form */}
          {isReplying && (
            <form onSubmit={handleSendReply} className="mt-2 flex items-center gap-2 w-full">
              <input
                type="text"
                autoFocus
                placeholder={`Trả lời @${authorUsername || authorName}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#fe2c55]"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || isSubmittingReply}
                className="px-3 py-1.5 rounded-full bg-[#fe2c55] hover:bg-[#e0264a] text-white text-xs font-bold disabled:opacity-40 transition cursor-pointer"
              >
                {isSubmittingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : "Gửi"}
              </button>
            </form>
          )}

          {/* Expand / Collapse Nested Replies Thread */}
          {replies.length > 0 && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
              >
                <div className="w-6 h-[1px] bg-zinc-300 dark:bg-zinc-700" />
                <span>
                  {showReplies
                    ? "Ẩn câu trả lời"
                    : `Xem ${replies.length} câu trả lời`}
                </span>
                {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {/* Nested Replies List */}
              {showReplies && (
                <div className="mt-2 pl-4 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-2 animate-in fade-in duration-150">
                  {replies.map((reply) => (
                    <ShortsCommentItem
                      key={reply.id}
                      comment={reply}
                      videoAuthorId={videoAuthorId}
                      onDelete={onDelete}
                      onUpdate={onUpdate}
                      onReplySuccess={onReplySuccess}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Xóa bình luận"
        message="Bạn có chắc muốn xóa bình luận này không?"
        confirmText="Xóa"
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}

/**
 * Main ShortsCommentSection Component (TikTok / Reels Style)
 */
export default function ShortsCommentSection({
  comments = [],
  commentsCount = 0,
  loading = false,
  videoAuthorId,
  onClose,
  onSubmitComment,
  onDeleteComment,
  onUpdateComment,
  onRefresh,
  isMobileDrawer = false,
}) {
  const { currentUser } = useAuth();
  const [text, setText] = useState("");
  const [selectedGif, setSelectedGif] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);
  const touchStartY = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);

  // 1. Lock body background scroll on mobile drawer
  useEffect(() => {
    if (!isMobileDrawer) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileDrawer]);

  // 2. Swipe down on drag handle to dismiss
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 80 && onClose) {
      onClose();
    }
    setDragOffset(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !selectedGif) || isSubmitting) return;

    let finalContent = text.trim();
    if (selectedGif) {
      finalContent = finalContent ? `${finalContent} 📷 ${selectedGif}` : `📷 ${selectedGif}`;
    }

    setIsSubmitting(true);
    try {
      await onSubmitComment(finalContent);
      setText("");
      setSelectedGif(null);
      setShowEmoji(false);
      setShowGif(false);
    } catch {
      toast.error("Không thể gửi bình luận!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const handleGifSelect = (gifUrl) => {
    setSelectedGif(gifUrl);
    setShowGif(false);
  };

  return (
    <div
      className="flex flex-col h-full w-full bg-white dark:bg-[#18181b] select-none transition-transform duration-100"
      style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined}
    >
      {/* Drag Handle on Mobile (< 768px) with swipe to dismiss gesture */}
      {isMobileDrawer && (
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex justify-center pt-2.5 pb-1 shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
          title="Vuốt xuống để đóng"
        >
          <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600 transition-colors" />
        </div>
      )}

      {/* 1. HEADER: Title & Circular Close Button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
        <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 tracking-tight">
          Bình luận ({commentsCount})
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
            title="Đóng bình luận"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. BODY: Scrollable Comment List */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-3 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#fe2c55]" />
            <span className="text-xs">Đang tải bình luận...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center mb-3">
              <MessageCircle className="w-7 h-7 text-zinc-400" />
            </div>
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Chưa có bình luận nào</p>
            <p className="text-xs text-zinc-400 mt-1">Hãy là người đầu tiên nêu cảm nghĩ về video!</p>
          </div>
        ) : (
          comments.map((c) => (
            <ShortsCommentItem
              key={c.id}
              comment={c}
              videoAuthorId={videoAuthorId}
              onDelete={onDeleteComment}
              onUpdate={onUpdateComment}
              onReplySuccess={onRefresh}
            />
          ))
        )}
      </div>

      {/* 3. FOOTER: Sticky Bottom Input Form with TikTok Style */}
      <div
        className="shrink-0 border-t border-zinc-100 dark:border-zinc-800/80 p-3 bg-white dark:bg-[#18181b] relative z-20"
        style={isMobileDrawer ? { paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" } : {}}
      >
        {/* GIF Preview */}
        {selectedGif && (
          <div className="mb-2 relative inline-block">
            <img src={selectedGif} alt="Selected GIF" className="h-16 rounded-xl border border-zinc-200 dark:border-zinc-700 object-cover" />
            <button
              onClick={() => setSelectedGif(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-xs shadow-md cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Emoji & GIF Pickers Popovers */}
        {showEmoji && (
          <div className="absolute bottom-full left-4 mb-2 z-50 shadow-2xl">
            <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
          </div>
        )}
        {showGif && (
          <div className="absolute bottom-full left-4 mb-2 z-50 shadow-2xl">
            <GifPicker onSelect={handleGifSelect} onClose={() => setShowGif(false)} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
          <Avatar
            userId={currentUser?.id}
            src={currentUser?.avatarUrl}
            name={currentUser?.fullName || currentUser?.username}
            username={currentUser?.username}
            avatarColor={currentUser?.avatarColor}
            size="sm"
            className="shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-700"
          />

          <div className="flex-1 flex items-center bg-zinc-100 dark:bg-zinc-800/80 rounded-full px-3.5 py-2 border border-zinc-200/80 dark:border-zinc-700/80 focus-within:border-zinc-400 dark:focus-within:border-zinc-500 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Thêm bình luận..."
              className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
            />

            {/* Quick Actions (@, Emoji, GIF) */}
            <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
              <button
                type="button"
                onClick={() => setText((prev) => prev + "@")}
                className="hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
                title="Gắn thẻ bạn bè"
              >
                <AtSign className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEmoji(!showEmoji);
                  setShowGif(false);
                }}
                className="hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
                title="Biểu tượng cảm xúc"
              >
                <Smile className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowGif(!showGif);
                  setShowEmoji(false);
                }}
                className="hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
                title="Thêm GIF"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Distinctive Red-Pink Circular Submit Button */}
          <button
            type="submit"
            disabled={(!text.trim() && !selectedGif) || isSubmitting}
            className="shrink-0 w-9 h-9 rounded-full bg-[#fe2c55] hover:bg-[#e0264a] disabled:opacity-35 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
            title="Đăng bình luận"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4 ml-0.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
