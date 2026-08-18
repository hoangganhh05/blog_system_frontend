import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Sparkles,
  Smile,
  Send,
  ArrowLeft,
  Loader2,
  Trash2,
  Copy,
  Check,
  Bookmark,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import postService from "../services/postService";
import likeService from "../services/likeService";
import commentService from "../services/commentService";
import bookmarkService from "../services/bookmarkService";
import aiService from "../services/aiService";
import Avatar from "./Avatar";
import Comment from "./Comment";
import EmojiPicker from "./EmojiPicker";
import GifPicker from "./GifPicker";
import ReactionsModal from "./ReactionsModal";
import ShareModal from "./ShareModal";
import ConfirmModal from "./ConfirmModal";

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

export default function PostTheaterModal({
  post,
  initialImageIndex = 0,
  isOpen,
  onClose,
  onPostUpdated,
  onPostDeleted
}) {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  // Trích xuất danh sách ảnh từ bài viết
  const images = [];
  if (Array.isArray(post?.images) && post.images.length > 0) {
    images.push(...post.images);
  } else if (post?.thumbNail) {
    images.push(post.thumbNail);
  } else if (post?.mediaUrl) {
    images.push(post.mediaUrl);
  } else if (post?.imageUrl) {
    images.push(post.imageUrl);
  }

  const hasImages = images.length > 0;

  const [activeImageIndex, setActiveImageIndex] = useState(initialImageIndex || 0);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [selectedGif, setSelectedGif] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likesCount || 0);
  const [bookmarked, setBookmarked] = useState(false);
  const [isPopping, setIsPopping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [summary, setSummary] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const [isReactionsModalOpen, setIsReactionsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const commentInputRef = useRef(null);
  const commentsEndRef = useRef(null);

  // Khóa cuộn trang chính khi mở modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setActiveImageIndex(initialImageIndex || 0);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, initialImageIndex]);

  // Load comments & check like / bookmark status
  useEffect(() => {
    if (!isOpen || !post?.id) return;

    setLoadingComments(true);
    commentService
      .getByPost(post.id)
      .then((res) => {
        setComments(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {})
      .finally(() => setLoadingComments(false));

    if (currentUserId) {
      likeService
        .checkLiked(post.id)
        .then((res) => {
          setLiked(Boolean(res.data?.liked));
        })
        .catch(() => {});

      const checkBm = bookmarkService.checkBookmarked || bookmarkService.isBookmarked;
      if (typeof checkBm === "function") {
        checkBm(post.id)
          .then((res) => {
            setBookmarked(Boolean(res.data?.bookmarked));
          })
          .catch(() => {});
      }
    }

    setLikeCount(post.likesCount || 0);
  }, [isOpen, post?.id, currentUserId]);

  // Chuyển ảnh tiếp theo
  const handleNextImage = useCallback(() => {
    if (images.length > 1) {
      setActiveImageIndex((prev) => (prev + 1) % images.length);
    }
  }, [images.length]);

  // Chuyển ảnh trước đó
  const handlePrevImage = useCallback(() => {
    if (images.length > 1) {
      setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  }, [images.length]);

  // Lắng nghe phím tắt bàn phím
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      } else if (e.key === "ArrowLeft") {
        handlePrevImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNextImage, handlePrevImage, onClose]);

  if (!isOpen || !post) return null;

  const author = post.user || {};
  const authorName = author.fullName || author.username || "Người dùng";
  const authorId = Number(author.id || post.userId);
  const myId = Number(currentUserId || currentUser?.id);
  const isOwner = myId > 0 && authorId > 0 && authorId === myId;
  const authorAvatarUrl = isOwner ? (currentUser?.avatarUrl || author.avatarUrl) : (author.avatarUrl || author.avatar);
  const authorAvatarColor = isOwner ? (currentUser?.avatarColor || author.avatarColor) : author.avatarColor;

  const handleLikeToggle = async (e) => {
    if (e) e.stopPropagation();
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập để thích bài viết!");
      return;
    }

    const prevLiked = liked;
    const prevCount = likeCount;

    setLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
    setIsPopping(true);
    setTimeout(() => setIsPopping(false), 400);

    try {
      await likeService.toggleLike(post.id);
      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          likesCount: prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1
        });
      }
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error("Không thể thao tác thích. Vui lòng thử lại!");
    }
  };

  const handleBookmarkToggle = async (e) => {
    if (e) e.stopPropagation();
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập để lưu bài viết!");
      return;
    }
    const prevBookmarked = bookmarked;
    setBookmarked(!prevBookmarked);
    try {
      await bookmarkService.toggleBookmark(post.id);
      toast.success(!prevBookmarked ? "Đã lưu vào danh sách đã lưu" : "Đã gỡ khỏi danh sách đã lưu");
    } catch {
      setBookmarked(prevBookmarked);
    }
  };

  const handleCreateComment = async (e) => {
    if (e) e.preventDefault();
    if ((!commentText.trim() && !selectedGif) || isSubmittingComment || !currentUserId) return;

    setIsSubmittingComment(true);
    try {
      let finalContent = commentText.trim();
      if (selectedGif) {
        finalContent = finalContent ? `${finalContent} 📷 ${selectedGif}` : `📷 ${selectedGif}`;
      }

      const payload = {
        content: finalContent,
        post: { id: Number(post.id) }
      };

      const res = await commentService.create(payload);
      setComments((prev) => [...prev, res.data]);
      setCommentText("");
      setSelectedGif(null);
      setShowEmojiPicker(false);
      setShowGifPicker(false);
      toast.success("Đã đăng bình luận!");

      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          commentsCount: (post.commentsCount || 0) + 1
        });
      }
    } catch {
      toast.error("Không thể gửi bình luận. Vui lòng thử lại!");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = (delId) => {
    setComments((prev) => prev.filter((c) => c.id !== delId));
    if (onPostUpdated) {
      onPostUpdated({
        ...post,
        commentsCount: Math.max(0, (post.commentsCount || 1) - 1)
      });
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      toast.success("Đã sao chép liên kết!");
      setTimeout(() => setIsCopied(false), 2000);
      setMenuOpen(false);
    });
  };

  const handleAiSummarize = async () => {
    if (summary) {
      setSummary(null);
      setMenuOpen(false);
      return;
    }
    const textContent = post.content || post.title || "";
    if (!textContent.trim()) return;

    setIsSummarizing(true);
    setMenuOpen(false);
    try {
      const res = await aiService.askAssistant({
        prompt: `Hãy tóm tắt ngắn gọn và súc tích bài viết sau trong 2-3 câu:\n"${textContent}"`
      });
      setSummary(res.data?.reply || res.data?.message || "Không thể tạo tóm tắt lúc này.");
    } catch {
      toast.error("AI tạm thời không phản hồi.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const confirmDeletePost = async () => {
    try {
      await postService.delete(post.id);
      toast.success("Đã xóa bài viết thành công!");
      setIsDeleteModalOpen(false);
      onClose();
      if (onPostDeleted) onPostDeleted(post.id);
    } catch {
      toast.error("Không thể xóa bài viết. Vui lòng thử lại!");
    }
  };

  const currentImage = images[activeImageIndex] || images[0];

  // Component Ô Nhập Bình Luận Cố Định Ở Đáy
  const commentComposer = (
    <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 relative">
      {selectedGif && (
        <div className="mb-2 relative inline-block">
          <img
            src={selectedGif}
            alt="GIF đính kèm"
            className="h-20 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700"
          />
          <button
            type="button"
            onClick={() => setSelectedGif(null)}
            className="absolute -top-1.5 -right-1.5 p-1 bg-zinc-900/80 hover:bg-zinc-900 text-white rounded-full text-xs cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {showEmojiPicker && (
        <div className="absolute bottom-16 right-4 z-50">
          <EmojiPicker
            onSelect={(emoji) => {
              setCommentText((prev) => prev + emoji);
              setShowEmojiPicker(false);
            }}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {showGifPicker && (
        <div className="absolute bottom-16 right-4 z-50">
          <GifPicker
            onSelect={(gifUrl) => {
              setSelectedGif(gifUrl);
              setShowGifPicker(false);
            }}
            onClose={() => setShowGifPicker(false)}
          />
        </div>
      )}

      <form onSubmit={handleCreateComment} className="flex items-center gap-2">
        <Avatar
          userId={currentUserId}
          src={currentUser?.avatarUrl}
          name={currentUser?.fullName || currentUser?.username}
          username={currentUser?.username}
          avatarColor={currentUser?.avatarColor}
          size="sm"
          className="shrink-0 hidden sm:block"
        />

        <div className="flex-1 flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-[#0866ff]/30 transition">
          <input
            ref={commentInputRef}
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Viết bình luận công khai..."
            className="flex-1 bg-transparent border-0 outline-none text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 py-1"
            disabled={isSubmittingComment}
          />

          <button
            type="button"
            onClick={() => setShowEmojiPicker((v) => !v)}
            className="p-1 rounded-full text-zinc-400 hover:text-amber-500 transition cursor-pointer"
            title="Chọn emoji"
          >
            <Smile className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowGifPicker((v) => !v)}
            className="px-1.5 py-0.5 rounded text-[10px] font-black text-zinc-400 hover:text-[#0866ff] bg-zinc-200/60 dark:bg-zinc-700/60 transition cursor-pointer"
            title="Chọn ảnh động GIF"
          >
            GIF
          </button>
        </div>

        <button
          type="submit"
          disabled={(!commentText.trim() && !selectedGif) || isSubmittingComment}
          className="p-2 rounded-full bg-[#0866ff] hover:bg-[#0756d6] disabled:opacity-40 text-white transition cursor-pointer shrink-0 active:scale-95"
          title="Gửi bình luận"
        >
          {isSubmittingComment ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );

  // Menu tùy chọn ba chấm
  const optionsMenu = (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition cursor-pointer"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-8 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 w-full text-left transition cursor-pointer"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? "Đã sao chép" : "Sao chép liên kết"}</span>
            </button>

            <button
              type="button"
              onClick={handleAiSummarize}
              disabled={isSummarizing}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-indigo-600 dark:text-indigo-400 w-full text-left transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSummarizing ? "Đang tóm tắt..." : summary ? "Ẩn tóm tắt" : "Tóm tắt với AI"}</span>
            </button>

            {isOwner && (
              <>
                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-0.5" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setIsDeleteModalOpen(true);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 w-full text-left transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa bài viết</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );

  // 4. Thanh Tương Tác & Thống Kê
  const interactionsSection = (
    <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <button
          type="button"
          onClick={() => setIsReactionsModalOpen(true)}
          className="flex items-center gap-1.5 hover:underline cursor-pointer"
        >
          {likeCount > 0 && (
            <>
              <span className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-[10px] text-white">
                ❤️
              </span>
              <span>{likeCount} lượt thích</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-3">
          <span>{comments.length} bình luận</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 py-1 border-y border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
        <button
          type="button"
          onClick={handleLikeToggle}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition cursor-pointer active:scale-95 ${
            liked
              ? "text-rose-500 font-bold bg-rose-50/50 dark:bg-rose-950/20"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform ${liked ? "fill-current scale-110" : ""} ${
              isPopping ? "animate-bounce" : ""
            }`}
          />
          <span>Thích</span>
        </button>

        <button
          type="button"
          onClick={() => commentInputRef.current?.focus()}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Bình luận</span>
        </button>

        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Chia sẻ</span>
        </button>

        <button
          type="button"
          onClick={handleBookmarkToggle}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition cursor-pointer ${
            bookmarked
              ? "text-amber-500 font-bold bg-amber-50/50 dark:bg-amber-950/20"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`} />
          <span>Lưu</span>
        </button>
      </div>
    </div>
  );

  // 5. Danh Sách Bình Luận
  const commentsListSection = (
    <div className="space-y-3 pt-2">
      <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
        Bình luận ({comments.length})
      </h4>

      {loadingComments ? (
        <div className="py-6 flex items-center justify-center text-zinc-400 gap-2 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-[#0866ff]" />
          <span>Đang tải bình luận...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center text-zinc-400 text-xs space-y-1">
          <MessageCircle className="w-8 h-8 mx-auto opacity-30" />
          <p className="font-semibold">Chưa có bình luận nào</p>
          <p className="text-[11px]">Hãy là người đầu tiên nêu cảm nghĩ về bài viết này!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              onDelete={handleDeleteComment}
              onReplyCreated={(newRep) => setComments((prev) => [...prev, newRep])}
            />
          ))}
          <div ref={commentsEndRef} />
        </div>
      )}
    </div>
  );

  // Khối Hiển Thị Ảnh (Nằm Ngay Dưới Caption Chữ)
  const imageGalleryBlock = hasImages && (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center my-2 select-none group/media">
      {/* Ảnh chính */}
      <img
        key={currentImage}
        src={currentImage}
        alt="Ảnh bài viết"
        className="w-full max-h-[70vh] sm:max-h-[75vh] object-contain select-none"
      />

      {/* Chỉ số ảnh (1 / 4) */}
      {images.length > 1 && (
        <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold pointer-events-none">
          {activeImageIndex + 1} / {images.length}
        </div>
      )}

      {/* Nút lùi ảnh */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrevImage();
          }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-md"
          title="Ảnh trước (Mũi tên trái)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Nút tiến ảnh */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNextImage();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-md"
          title="Ảnh tiếp theo (Mũi tên phải)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );

  // =========================================================================
  // GIAO DIỆN MODAL CHUẨN THỨ TỰ LOGIC:
  // 1. HEADER (Tác giả) -> 2. NỘI DUNG CHỮ -> 3. KHỐI ẢNH (DƯỚI CHỮ) -> 4. TƯƠNG TÁC -> 5. BÌNH LUẬN -> 6. COMPOSER
  // =========================================================================
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150 overflow-hidden pointer-events-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-zinc-900 sm:rounded-2xl w-full max-w-2xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative border-0 sm:border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-150 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. HEADER BÀI VIẾT (TRÊN CÙNG) */}
        <div className="p-3 sm:p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Nút Quay Lại */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -ml-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
              title="Đóng (Esc)"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <Link
              to={authorId ? `/profile/${authorId}` : "#"}
              onClick={onClose}
              className="flex items-center gap-2.5 group min-w-0"
            >
              <Avatar
                userId={authorId}
                src={authorAvatarUrl}
                name={authorName}
                username={author.username}
                avatarColor={authorAvatarColor}
                size="md"
              />
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:underline">
                  {authorName}
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <span>{timeAgo(post.createdAt)}</span>
                  <span>•</span>
                  <Globe className="w-3 h-3 inline-block opacity-70" />
                  {post.category?.name && (
                    <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                      • #{post.category.name}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-1">
            {optionsMenu}
            <button
              type="button"
              onClick={onClose}
              className="hidden sm:flex p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* THÂN MODAL CUỘN DỌC TỰ ĐỘNG */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin bg-white dark:bg-zinc-900">
          {/* AI Summary Box */}
          {summary && (
            <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 font-bold mb-1 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tóm tắt thông minh:</span>
              </div>
              <p className="whitespace-pre-line">{summary}</p>
            </div>
          )}

          {/* 2. NỘI DUNG / TIÊU ĐỀ / CAPTION BÀI VIẾT (Ở GIỮA 1 - NẰM TRÊN ẢNH) */}
          {post.title && post.title !== post.content && (
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {post.title}
            </h2>
          )}
          {post.content && (
            <div className="text-[15px] sm:text-[16px] leading-relaxed text-zinc-900 dark:text-zinc-100 whitespace-pre-line break-words">
              {post.content}
            </div>
          )}

          {/* 3. KHU VỰC HIỂN THỊ ẢNH (Ở GIỮA 2 - NẰM NGAY DƯỚI NỘI DUNG CHỮ) */}
          {imageGalleryBlock}

          {/* 4. THANH TƯƠNG TÁC & THỐNG KÊ (DƯỚI ẢNH) */}
          {interactionsSection}

          {/* 5. DANH SÁCH BÌNH LUẬN (DƯỚI CÙNG) */}
          {commentsListSection}
        </div>

        {/* 6. THANH NHẬP BÌNH LUẬN CỐ ĐỊNH Ở ĐÁY */}
        {commentComposer}
      </div>

      {/* Sub-modals */}
      {isReactionsModalOpen && (
        <ReactionsModal
          postId={post.id}
          isOpen={isReactionsModalOpen}
          onClose={() => setIsReactionsModalOpen(false)}
          totalLikeCount={likeCount}
        />
      )}

      {isShareModalOpen && (
        <ShareModal
          post={post}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onPostShared={(shared) => {
            if (onPostUpdated) onPostUpdated(shared);
          }}
        />
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Xóa bài viết"
        message="Bạn có chắc chắn muốn xóa vĩnh viễn bài viết này không? Hành động này không thể hoàn tác."
        confirmText="Xóa bài viết"
        isDanger={true}
        onConfirm={confirmDeletePost}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>,
    document.body
  );
}
