import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Repeat,
  Bookmark,
  Share2,
  MoreHorizontal,
  Trash2,
  Edit,
  Copy,
  Check,
  Sparkles,
  Volume2,
  CornerDownRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import likeService from "../services/likeService";
import bookmarkService from "../services/bookmarkService";
import postService from "../services/postService";
import aiService from "../services/aiService";

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
  if (d < 7) return `${d}d`;
  return new Date(formattedString).toLocaleDateString("vi-VN", { month: "short", day: "numeric" });
}

export default function PostCard({ post, onDelete, onEdit, isDetailed = false }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likesCount || 0);
  const [bookmarked, setBookmarked] = useState(false);
  const [commentCount, setCommentCount] = useState(post?.commentsCount || 0);
  const [menuOpen, setUserMenuOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState(null);

  const menuRef = useRef(null);

  const author = post?.user || {};
  const authorName = author.fullName || author.username || "Người dùng";
  const isOwner = currentUserId && String(author.id) === String(currentUserId);

  // Check initial liked & bookmarked state
  useEffect(() => {
    if (!currentUserId || !post?.id) return;
    likeService.checkLiked(post.id)
      .then((res) => {
        setLiked(res.data?.liked || false);
        if (typeof res.data?.count === "number") {
          setLikeCount(res.data.count);
        }
      })
      .catch(() => {});

    bookmarkService.checkBookmarked(post.id)
      .then((res) => setBookmarked(res.data?.bookmarked || false))
      .catch(() => {});
  }, [currentUserId, post?.id]);

  // Click outside listener for menu
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Optimistic Like
  const handleToggleLike = async (e) => {
    e.stopPropagation();
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    const prevLiked = liked;
    const prevCount = likeCount;

    setLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      await likeService.toggleLike(post.id, "LIKE");
    } catch {
      // Revert on error
      setLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  // Optimistic Bookmark
  const handleToggleBookmark = async (e) => {
    e.stopPropagation();
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    const prevBookmarked = bookmarked;
    setBookmarked(!prevBookmarked);

    try {
      await bookmarkService.toggleBookmark(post.id);
    } catch {
      setBookmarked(prevBookmarked);
    }
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    const link = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
      setUserMenuOpen(false);
    }, 1500);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm("Bạn có chắc muốn xóa bài viết này?")) {
      try {
        await postService.delete(post.id);
        if (onDelete) onDelete(post.id);
      } catch {
        alert("Không thể xóa bài viết!");
      }
    }
  };

  const handleAiSummarize = async (e) => {
    e.stopPropagation();
    if (summary) {
      setSummary(null);
      return;
    }
    setIsSummarizing(true);
    try {
      const res = await aiService.summarizePost(post.content);
      setSummary(res);
    } catch {
      alert("AI đang bận, vui lòng thử lại sau!");
    } finally {
      setIsSummarizing(false);
      setUserMenuOpen(false);
    }
  };

  const handleCardClick = (e) => {
    // Avoid triggering card click when interacting with buttons or links
    if (e.target.closest("button") || e.target.closest("a") || e.target.closest("input")) {
      return;
    }
    if (!isDetailed) {
      navigate(`/posts/${post.id}`);
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className={`p-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 transition hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 flex gap-3.5 ${
        !isDetailed ? "cursor-pointer" : ""
      }`}
    >
      {/* Cột Avatar & Thread Connector Line */}
      <div className="flex flex-col items-center shrink-0">
        <Link
          to={`/profile/${author.id}`}
          onClick={(e) => e.stopPropagation()}
          className="relative group shrink-0"
        >
          {author.avatarUrl ? (
            <img
              src={author.avatarUrl}
              alt=""
              className="w-10 h-10 rounded-full object-cover group-hover:opacity-90 transition"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
              style={{ backgroundColor: author.avatarColor || "#4f46e5" }}
            >
              {getInitials(authorName)}
            </div>
          )}
        </Link>
        {/* Đường kẻ chỉ dẫn luồng thread nếu có bình luận */}
        {!isDetailed && commentCount > 0 && (
          <div className="w-0.5 flex-1 bg-zinc-200 dark:bg-zinc-800 mt-2 rounded-full" />
        )}
      </div>

      {/* Cột Nội Dung & Tương Tác */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header Bài Viết */}
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <Link
              to={`/profile/${author.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-sm text-zinc-900 dark:text-white hover:underline truncate"
            >
              {authorName}
            </Link>
            {author.username && (
              <span className="text-xs text-zinc-400 truncate">
                @{author.username}
              </span>
            )}
            <span className="text-zinc-400 text-xs">·</span>
            <span className="text-xs text-zinc-400 hover:underline">
              {timeAgo(post.createdAt)}
            </span>
          </div>

          {/* Menu 3 chấm options */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setUserMenuOpen(!menuOpen);
              }}
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-7 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-1.5 z-40 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 w-full text-left transition"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? "Đã sao chép" : "Sao chép liên kết"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAiSummarize}
                  disabled={isSummarizing}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-indigo-600 dark:text-indigo-400 w-full text-left transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSummarizing ? "Đang tóm tắt..." : summary ? "Ẩn tóm tắt" : "Tóm tắt với AI"}</span>
                </button>

                {isOwner && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUserMenuOpen(false);
                        if (onEdit) onEdit(post);
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 w-full text-left transition"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Chỉnh sửa bài viết</span>
                    </button>

                    <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-0.5" />

                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 w-full text-left transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Xóa bài viết</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Summary Box nếu được kích hoạt */}
        {summary && (
          <div className="my-2 p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 font-bold mb-1 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tóm tắt thông minh:</span>
            </div>
            <p>{summary}</p>
          </div>
        )}

        {/* Thân Bài Viết (Typography Thoáng) */}
        <div className="text-sm leading-relaxed text-zinc-900 dark:text-zinc-100 break-words whitespace-pre-line my-2">
          {post.content}
        </div>

        {/* Adaptive Image Grid */}
        {post.thumbNail && (
          <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 my-2 max-h-[480px]">
            <img
              src={post.thumbNail}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Tag Chủ Đề */}
        {post.category?.name && (
          <div className="my-1">
            <span className="inline-block text-xs font-medium text-primary hover:underline">
              #{post.category.name}
            </span>
          </div>
        )}

        {/* Hàng Action Buttons Tối Giản */}
        <div className="flex items-center justify-between text-zinc-500 pt-2 mt-1 max-w-[420px]">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            className={`flex items-center gap-1.5 text-xs font-medium group transition ${
              liked ? "text-rose-500" : "hover:text-rose-500"
            }`}
            title="Thích"
          >
            <div className="p-2 rounded-full group-hover:bg-rose-50 dark:group-hover:bg-rose-950/40 transition">
              <Heart
                strokeWidth={1.8}
                className={`w-4 h-4 transition ${liked ? "fill-rose-500 scale-110" : ""}`}
              />
            </div>
            <span>{likeCount > 0 ? likeCount : ""}</span>
          </button>

          {/* Comment Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/posts/${post.id}`);
            }}
            className="flex items-center gap-1.5 text-xs font-medium group hover:text-sky-500 transition"
            title="Bình luận"
          >
            <div className="p-2 rounded-full group-hover:bg-sky-50 dark:group-hover:bg-sky-950/40 transition">
              <MessageCircle strokeWidth={1.8} className="w-4 h-4" />
            </div>
            <span>{commentCount > 0 ? commentCount : ""}</span>
          </button>

          {/* Repost / Share Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs font-medium group hover:text-emerald-500 transition"
            title="Chia sẻ liên kết"
          >
            <div className="p-2 rounded-full group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 transition">
              <Repeat strokeWidth={1.8} className="w-4 h-4" />
            </div>
          </button>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={handleToggleBookmark}
            className={`flex items-center gap-1.5 text-xs font-medium group transition ${
              bookmarked ? "text-amber-500" : "hover:text-amber-500"
            }`}
            title="Lưu bài viết"
          >
            <div className="p-2 rounded-full group-hover:bg-amber-50 dark:group-hover:bg-amber-950/40 transition">
              <Bookmark
                strokeWidth={1.8}
                className={`w-4 h-4 transition ${bookmarked ? "fill-amber-500" : ""}`}
              />
            </div>
          </button>
        </div>
      </div>
    </article>
  );
}
