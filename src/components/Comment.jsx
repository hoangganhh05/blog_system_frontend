import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { MoreHorizontal, Trash2, Edit2, Reply, Send, Loader2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import commentService from "../services/commentService";

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

export default function Comment({ comment, onDelete, onReplyCreated }) {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment?.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const author = comment?.user || {};
  const authorName = author.fullName || author.username || "Người dùng";
  const isOwner = currentUserId && String(author.id) === String(currentUserId);

  const handleEdit = async () => {
    if (!editText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await commentService.update(comment.id, { content: editText.trim() });
      comment.content = editText.trim();
      setIsEditing(false);
    } catch {
      alert("Không thể cập nhật bình luận!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Bạn có chắc muốn xóa bình luận này?")) {
      try {
        await commentService.delete(comment.id);
        if (onDelete) onDelete(comment.id);
      } catch {
        alert("Lỗi khi xóa bình luận!");
      }
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
      if (onReplyCreated) onReplyCreated(res.data);
    } catch {
      alert("Không thể gửi phản hồi!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex gap-3 py-3 border-b border-zinc-100 dark:border-zinc-900 group">
      {/* Cột Avatar */}
      <Link to={`/profile/${author.id}`} className="shrink-0">
        {author.avatarUrl ? (
          <img
            src={author.avatarUrl}
            alt=""
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
            style={{ backgroundColor: author.avatarColor || "#4f46e5" }}
          >
            {getInitials(authorName)}
          </div>
        )}
      </Link>

      {/* Cột Nội Dung Bình Luận */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Link
              to={`/profile/${author.id}`}
              className="font-bold text-sm text-zinc-900 dark:text-white hover:underline truncate"
            >
              {authorName}
            </Link>
            {author.username && (
              <span className="text-xs text-zinc-400 truncate">
                @{author.username}
              </span>
            )}
            <span className="text-zinc-300 dark:text-zinc-700 text-xs">·</span>
            <span className="text-xs text-zinc-400">
              {timeAgo(comment.createdAt)}
            </span>
          </div>

          {/* Menu Actions */}
          {isOwner && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-6 w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg p-1 z-30 flex flex-col gap-0.5 animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 w-full text-left"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Sửa</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 w-full text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                </div>
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
              className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl p-2.5 text-sm text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 rounded-full text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleEdit}
                disabled={isSubmitting}
                className="px-4 py-1 rounded-full text-xs font-bold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950"
              >
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Lưu"}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 break-words my-0.5">
            {comment.content}
          </div>
        )}

        {/* Nút Phản Hồi Nhỏ Gọn */}
        <div className="flex items-center gap-4 mt-1">
          <button
            type="button"
            onClick={() => setIsReplying(!isReplying)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
          >
            <Reply className="w-3.5 h-3.5" />
            <span>Phản hồi</span>
          </button>
        </div>

        {/* Khung Phản Hồi Nhanh */}
        {isReplying && (
          <form onSubmit={handleSendReply} className="mt-2.5 flex items-center gap-2">
            <input
              type="text"
              autoFocus
              placeholder={`Trả lời @${author.username || authorName}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full px-3.5 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!replyText.trim() || isSubmitting}
              className="p-1.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 disabled:opacity-40"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
