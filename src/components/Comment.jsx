import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { MoreHorizontal, Trash2, Edit2, Reply, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import commentService from "../services/commentService";
import ConfirmModal from "./ConfirmModal";
import Avatar from "./Avatar";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  let formattedString = dateStr;
  if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.includes("+")) {
    formattedString = dateStr + "Z";
  }
  const diff = Date.now() - new Date(formattedString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m}p`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function parseCommentContent(content) {
  if (!content) return { text: "", mediaUrl: null };
  if (content.startsWith("📷 ")) {
    const url = content.replace("📷 ", "").trim();
    return { text: "", mediaUrl: url };
  }
  const urlRegex = /(https?:\/\/[^\s]+(?:\.gif|\.png|\.jpg|\.jpeg|giphy\.com[^\s]+|tenor\.com[^\s]+))/i;
  const match = content.match(urlRegex);
  if (match) {
    const mediaUrl = match[0];
    const text = content.replace(mediaUrl, "").trim();
    return { text, mediaUrl };
  }
  return { text: content, mediaUrl: null };
}

// Function to highlight @username mentions in comment text
function renderCommentTextWithMentions(text) {
  if (!text) return null;
  
  // Split text by @username mentions
  const parts = text.split(/(@\w+)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      const username = part.slice(1);
      return (
        <Link
          key={index}
          to={`/profile/${username}`}
          className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export default function Comment({ comment, onDelete, onReplyCreated, onUpdate }) {
  const { currentUser } = useAuth();

  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment?.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState("bottom");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const menuButtonRef = useRef(null);

  const handleToggleMenu = (e) => {
    e.stopPropagation();
    if (!menuOpen && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 120) {
        setMenuPlacement("top");
      } else {
        setMenuPlacement("bottom");
      }
    }
    setMenuOpen(!menuOpen);
  };

  const author = comment?.user || comment?.author || {};
  const authorId = author.id || comment?.userId || comment?.authorId;
  const authorUsername = author.username || comment?.username;
  const authorName = author.fullName || author.username || comment?.userFullName || "Người dùng";
  
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;
  const currentUsername = currentUser?.username;

  const isOwner = Boolean(
    (currentUserId && authorId && Number(authorId) === Number(currentUserId)) ||
    (currentUsername && authorUsername && String(currentUsername).toLowerCase() === String(authorUsername).toLowerCase()) ||
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "ROLE_ADMIN" ||
    (Array.isArray(currentUser?.roles) && currentUser.roles.some((r) => r === "ROLE_ADMIN" || r === "ADMIN"))
  );

  const authorAvatarUrl = isOwner ? (currentUser?.avatarUrl || author.avatarUrl) : (author.avatarUrl || author.avatar);
  const authorAvatarColor = isOwner ? (currentUser?.avatarColor || author.avatarColor) : author.avatarColor;

  const parsed = parseCommentContent(comment.content);

  const handleEdit = async () => {
    if (!editText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await commentService.update(comment.id, { content: editText.trim() });
      comment.content = editText.trim();
      comment.updatedAt = res.data?.updatedAt || new Date().toISOString();
      setIsEditing(false);
      toast.success("Đã cập nhật bình luận!");
      if (onUpdate) onUpdate(res.data);
    } catch {
      toast.error("Không thể cập nhật bình luận!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteComment = async () => {
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
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        content: `@${author.username || authorName}: ${replyText.trim()}`,
        post: { id: comment.postId || comment.post?.id }
      };
      const res = await commentService.create(payload);
      setReplyText("");
      setIsReplying(false);
      toast.success("Đã gửi phản hồi!");
      if (onReplyCreated) onReplyCreated(res.data);
    } catch {
      toast.error("Không thể gửi phản hồi!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex gap-3 py-3 border-b border-zinc-100 dark:border-zinc-900 group">
      {/* Cột Avatar */}
      <div className="shrink-0">
        <Avatar
          userId={author.id}
          src={authorAvatarUrl}
          name={authorName}
          username={author.username}
          avatarColor={authorAvatarColor}
          size="sm"
          isOnline={author.isOnline}
          lastActiveAt={author.lastActiveAt}
          showActiveStatus={author.showActiveStatus}
          className="border border-zinc-200 dark:border-zinc-800 shadow-xs"
        />
      </div>

      {/* Cột Nội Dung Bình Luận */}
      <div className="flex-1 min-w-0 flex flex-col items-start">
        {/* Container Bong Bóng Bình Luận */}
        <div className="relative group/bubble inline-block max-w-[90%] sm:max-w-[85%] bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200/50 dark:hover:bg-zinc-800 rounded-2xl rounded-tl-xs px-3.5 py-2.5 border border-slate-200/50 dark:border-zinc-700/40 transition-colors">
          {/* Header trong bong bóng: Tên người dùng + Thời gian */}
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <Link
                to={`/profile/${author.id || author.username}`}
                className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 hover:underline truncate"
              >
                {authorName}
              </Link>
              {author.username && (
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  @{author.username}
                </span>
              )}
              <span className="text-zinc-400 text-xs">·</span>
              <span className="text-[11px] text-zinc-400">
                {timeAgo(comment.createdAt)}
              </span>
            </div>

            {/* Menu Actions (3 chấm góc trên bên phải của bong bóng) */}
            {isOwner && (
              <div className="relative shrink-0">
                <button
                  ref={menuButtonRef}
                  type="button"
                  onClick={handleToggleMenu}
                  className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition opacity-80 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Tùy chọn bình luận"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[90] bg-transparent cursor-default"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div
                      className={`absolute right-0 w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-1 z-[100] flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 ${
                        menuPlacement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(true);
                          setMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 w-full text-left cursor-pointer transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          setIsDeleteModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 w-full text-left cursor-pointer transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Thân bình luận */}
          {isEditing ? (
            <div className="my-1 flex flex-col gap-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                className="w-full bg-white dark:bg-zinc-900 rounded-xl p-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 rounded-full text-xs font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleEdit}
                  disabled={isSubmitting}
                  className="px-4 py-1 rounded-full text-xs font-bold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Lưu"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {parsed.text && (
                <div className="text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 break-words whitespace-pre-wrap">
                  {renderCommentTextWithMentions(parsed.text)}
                </div>
              )}
              {parsed.mediaUrl && (
                <div className="mt-1.5 rounded-xl overflow-hidden max-w-[240px] max-h-[190px] border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
                  <img
                    src={parsed.mediaUrl}
                    alt="GIF / Ảnh bình luận"
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                    onClick={() => window.open(parsed.mediaUrl, "_blank")}
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nút Phản Hồi Dưới Bong Bóng */}
        <div className="flex items-center gap-4 mt-1 pl-1">
          <button
            type="button"
            onClick={() => setIsReplying(!isReplying)}
            className="flex items-center gap-1 text-[11px] sm:text-xs font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
          >
            <Reply className="w-3 h-3" />
            <span>Phản hồi</span>
          </button>
        </div>

        {/* Khung Phản Hồi Nhanh */}
        {isReplying && (
          <form onSubmit={handleSendReply} className="mt-2 flex items-center gap-2 w-full max-w-md">
            <input
              type="text"
              autoFocus
              placeholder={`Trả lời @${author.username || authorName}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-full px-3.5 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!replyText.trim() || isSubmitting}
              className="p-1.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 disabled:opacity-40 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>
        )}
      </div>

      {/* Delete Comment Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Xóa bình luận"
        message="Bạn có chắc muốn xóa bình luận này không?"
        confirmText="Xóa"
        isDanger={true}
        onConfirm={confirmDeleteComment}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
