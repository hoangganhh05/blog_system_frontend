import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  VolumeX,
  CornerDownRight,
  X,
  Play,
  Pause
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import likeService from "../services/likeService";
import bookmarkService from "../services/bookmarkService";
import postService from "../services/postService";
import aiService from "../services/aiService";
import { toast } from "sonner";
import EditPostModal from "./EditPostModal";
import ReactionsModal from "./ReactionsModal";
import ConfirmModal from "./ConfirmModal";
import ShareModal from "./ShareModal";
import PostTheaterModal from "./PostTheaterModal";
import Avatar from "./Avatar";
import { isVideoUrl } from "../utils/mediaUtils";

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

export default function PostCard({ post, onDelete, onEdit, onPostCreated, isDetailed = false }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  const [currentPost, setCurrentPost] = useState(post);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReactionsModalOpen, setIsReactionsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    setCurrentPost(post);
  }, [post]);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(currentPost?.likesCount || post?.likesCount || 0);
  const [likersPreview, setLikersPreview] = useState(null);
  const [isHoveringLike, setIsHoveringLike] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [commentCount, setCommentCount] = useState(currentPost?.commentsCount || post?.commentsCount || 0);
  const [menuOpen, setUserMenuOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [isPopping, setIsPopping] = useState(false);
  const [isTheaterOpen, setIsTheaterOpen] = useState(false);
  const [theaterInitialImageIndex, setTheaterInitialImageIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState({});
  const [isVideoMuted, setIsVideoMuted] = useState({});

  const postVideoRef = useRef(null);
  const postVideoObserverRef = useRef(null);

  const openTheater = (e, index = 0) => {
    if (e) e.stopPropagation();
    setTheaterInitialImageIndex(index);
    setIsTheaterOpen(true);
  };

  const toggleVideoPlay = (e, postId) => {
    e.stopPropagation();
    setIsVideoPlaying((prev) => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const toggleVideoMute = (e, postId) => {
    e.stopPropagation();
    setIsVideoMuted((prev) => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Load preview names when hovering over like section
  const handleLikeMouseEnter = () => {
    setIsHoveringLike(true);
    if (likeCount > 0 && !likersPreview && post?.id) {
      likeService
        .getReactionsList(post.id)
        .then((res) => {
          let list = [];
          if (Array.isArray(res.data)) list = res.data;
          else if (res.data?.content) list = res.data.content;
          else if (res.data?.data) list = res.data.data;

          const names = list
            .map((item) => item.fullName || item.username || item.user?.fullName || item.user?.username)
            .filter(Boolean);

          if (names.length === 0) {
            setLikersPreview(`${likeCount} người đã thích bài viết`);
          } else if (names.length === 1) {
            setLikersPreview(names[0]);
          } else if (names.length === 2) {
            setLikersPreview(`${names[0]} và ${names[1]}`);
          } else if (names.length === 3) {
            setLikersPreview(`${names[0]}, ${names[1]} và ${names[2]}`);
          } else {
            setLikersPreview(`${names[0]}, ${names[1]} và ${names.length - 2} người khác`);
          }
        })
        .catch(() => {
          setLikersPreview(`${likeCount} người đã thích`);
        });
    }
  };

  const menuRef = useRef(null);

  const author = currentPost?.user || post?.user || {};
  const authorName = author.fullName || author.username || "Người dùng";
  const authorId = Number(author.id || currentPost?.userId || post?.userId);
  const myId = Number(currentUserId || currentUser?.id);
  const isOwner = myId > 0 && authorId > 0 && authorId === myId;
  const authorAvatarUrl = isOwner ? (currentUser?.avatarUrl || author.avatarUrl) : (author.avatarUrl || author.avatar);
  const authorAvatarColor = isOwner ? (currentUser?.avatarColor || author.avatarColor) : author.avatarColor;

  const originalPost = currentPost?.originalPost || currentPost?.sharedPost || currentPost?.parentPost || currentPost?.repostOf;
  const origAuthor = originalPost?.user || originalPost?.author || {};
  const origAuthorName = origAuthor.fullName || origAuthor.username || "Tác giả gốc";
  const origAuthorAvatarUrl = origAuthor.avatarUrl || origAuthor.avatar;
  const origAuthorAvatarColor = origAuthor.avatarColor;
  const origContent = originalPost?.content || originalPost?.body || originalPost?.text || originalPost?.title || "";
  const origMedia = originalPost?.thumbNail || originalPost?.mediaUrl || originalPost?.imageUrl;

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

  // Autoplay single video when it enters viewport
  useEffect(() => {
    const videoEl = postVideoRef.current;
    if (!videoEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoEl.play().catch(() => {});
          } else {
            videoEl.pause();
          }
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(videoEl);
    postVideoObserverRef.current = observer;

    return () => {
      observer.disconnect();
      postVideoObserverRef.current = null;
    };
  }, [post?.id]);

  // Optimistic Like
  const handleToggleLike = async (e) => {
    e.stopPropagation();
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    const prevLiked = liked;
    const prevCount = likeCount;

    if (!prevLiked) {
      setIsPopping(true);
      setTimeout(() => setIsPopping(false), 500);
    }

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
    toast.info("Đã sao chép liên kết vào bộ nhớ tạm");
    setTimeout(() => {
      setIsCopied(false);
      setUserMenuOpen(false);
    }, 1500);
  };

  const handleEdit = (e) => {
    e?.stopPropagation();
    setUserMenuOpen(false);
    setIsEditModalOpen(true);
  };

  const handleDelete = (e) => {
    e?.stopPropagation();
    setUserMenuOpen(false);
    setIsDeleteModalOpen(true);
  };

  const confirmDeletePost = async () => {
    const targetPostId = post?.id || currentPost?.id;
    setIsDeleteModalOpen(false);
    try {
      await postService.delete(targetPostId);
      toast.success("Đã xóa bài viết thành công!");
      if (onDelete) onDelete(targetPostId);
      window.dispatchEvent(
        new CustomEvent("post_deleted", { detail: { postId: targetPostId } })
      );
    } catch (err) {
      console.error("❌ [PostCard] Lỗi khi gọi API xóa bài viết:", err.response?.status, err.response?.data || err);
      const msg =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message || err.message;
      toast.error(msg || "Không thể xóa bài viết!");
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
      toast.error("AI đang bận, vui lòng thử lại sau!");
    } finally {
      setIsSummarizing(false);
      setUserMenuOpen(false);
    }
  };

  const handleCardClick = (e) => {
    if (e.target.closest("button") || e.target.closest("a") || e.target.closest("input") || e.target.closest(".no-card-click")) {
      return;
    }
    if (!isDetailed) {
      e.preventDefault();
      const cardImages = [];
      if (Array.isArray(post.images) && post.images.length > 0) {
        cardImages.push(...post.images);
      } else if (Array.isArray(post.imageUrls) && post.imageUrls.length > 0) {
        cardImages.push(...post.imageUrls);
      } else if (post.thumbNail) {
        cardImages.push(post.thumbNail);
      }
      const isVideoPost = post.mediaType === "video" || post.videoUrl || (cardImages.length > 0 && isVideoUrl(cardImages[0]));
      if (isVideoPost) {
        navigate(`/posts/${post.id}`);
      } else {
        openTheater(e, 0);
      }
    }
  };

  const cardImagesList = [];
  if (Array.isArray(post.images) && post.images.length > 0) {
    cardImagesList.push(...post.images);
  } else if (Array.isArray(post.imageUrls) && post.imageUrls.length > 0) {
    cardImagesList.push(...post.imageUrls);
  } else if (post.thumbNail) {
    cardImagesList.push(post.thumbNail);
  }

  const isVideoPostType = !originalPost && (
    post?.mediaType === "video" ||
    !!post?.videoUrl ||
    (cardImagesList.length > 0 && isVideoUrl(cardImagesList[0]))
  );

  return (
    <article
      onClick={handleCardClick}
      className={`relative transition-all ${
        isVideoPostType
          ? "w-full md:w-auto -mx-2 sm:mx-0 rounded-none sm:rounded-2xl border-0 sm:border border-zinc-200/90 dark:border-zinc-800 bg-black sm:bg-white dark:sm:bg-zinc-900 p-0 sm:p-4 shadow-none sm:shadow-2xs overflow-hidden flex flex-col sm:flex-row gap-0 sm:gap-3.5"
          : "rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-2xs card-dynamic-hover hover:border-zinc-300 dark:hover:border-zinc-700 flex gap-3.5"
      } ${menuOpen ? "z-30" : "z-0"} ${!isDetailed ? "cursor-pointer" : ""}`}
    >
      {/* Mobile-only Video Fullscreen Layout */}
      {isVideoPostType ? (
        <div className="w-full relative bg-black flex flex-col sm:hidden overflow-hidden min-h-[82dvh] max-h-[88dvh] justify-center">
          {/* Main Video */}
          <video
            ref={postVideoRef}
            src={post.videoUrl || cardImagesList[0]}
            className="w-full h-full object-cover max-h-[88dvh]"
            controls={false}
            playsInline
            loop
            autoPlay
            muted={isVideoMuted[post.id] ?? true}
            onClick={(e) => toggleVideoPlay(e, post.id)}
            onPlay={() => setIsVideoPlaying((prev) => ({ ...prev, [post.id]: true }))}
            onPause={() => setIsVideoPlaying((prev) => ({ ...prev, [post.id]: false }))}
          />

          {/* Pause Overlay Indicator */}
          {isVideoPlaying[post.id] === false && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
              onClick={(e) => toggleVideoPlay(e, post.id)}
            >
              <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
                <Play className="w-8 h-8 fill-white ml-1" />
              </div>
            </div>
          )}

          {/* Mute/Unmute Control Top Right */}
          <button
            type="button"
            onClick={(e) => toggleVideoMute(e, post.id)}
            className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center cursor-pointer shadow-md"
            title={isVideoMuted[post.id] ? "Bật tiếng" : "Tắt tiếng"}
          >
            {isVideoMuted[post.id] ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Bottom Gradient Overlay */}
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

          {/* Right Vertical Action Rail (TikTok Style) */}
          <div className="absolute right-3 bottom-6 z-20 flex flex-col items-center gap-4 text-white">
            {/* Like */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={handleToggleLike}
                className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition active:scale-90 cursor-pointer ${
                  liked ? "bg-rose-500 text-white shadow-lg" : "bg-black/40 text-white hover:bg-black/60"
                }`}
              >
                <Heart className={`w-5 h-5 ${liked ? "fill-white" : ""}`} />
              </button>
              <span className="text-[11px] font-bold text-white drop-shadow-md">{likeCount}</span>
            </div>

            {/* Comment */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/posts/${post.id}`);
                }}
                className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition active:scale-90 cursor-pointer shadow-md"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <span className="text-[11px] font-bold text-white drop-shadow-md">{commentCount}</span>
            </div>

            {/* Bookmark */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={handleToggleBookmark}
                className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition active:scale-90 cursor-pointer ${
                  bookmarked ? "bg-amber-500 text-white shadow-lg" : "bg-black/40 text-white hover:bg-black/60"
                }`}
              >
                <Bookmark className={`w-5 h-5 ${bookmarked ? "fill-white" : ""}`} />
              </button>
            </div>

            {/* Share */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsShareModalOpen(true);
              }}
              className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition active:scale-90 cursor-pointer shadow-md"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Left Info Overlay */}
          <div className="absolute left-3 right-16 bottom-5 z-20 flex flex-col gap-1.5 text-white pointer-events-auto">
            <Link
              to={`/profile/${author.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 group w-fit"
            >
              <Avatar
                userId={author.id}
                src={authorAvatarUrl}
                name={authorName}
                username={author.username}
                avatarColor={authorAvatarColor}
                size="sm"
                className="border border-white/40 shadow-md"
              />
              <span className="font-bold text-sm text-white drop-shadow-md hover:underline">
                @{author.username || authorName}
              </span>
            </Link>

            {(post?.content || post?.title) && (
              <p className="text-xs text-white/90 line-clamp-2 leading-relaxed drop-shadow-md pr-2">
                {post?.content || post?.title}
              </p>
            )}
          </div>
        </div>
      ) : null}

      {/* Desktop / Non-video Avatar (Hidden on Mobile Video) */}
      <div className={`${isVideoPostType ? "hidden sm:block" : ""} shrink-0`}>
        <Avatar
          userId={author.id}
          src={authorAvatarUrl}
          name={authorName}
          username={author.username}
          avatarColor={authorAvatarColor}
          size="md"
          isOnline={author.isOnline}
          lastActiveAt={author.lastActiveAt}
          showActiveStatus={author.showActiveStatus}
          className="border border-zinc-200 dark:border-zinc-700 shadow-xs"
        />
      </div>

      {/* Cột Nội Dung & Tương Tác */}
      <div className={`flex-1 min-w-0 flex flex-col ${isVideoPostType ? "hidden sm:flex" : ""}`}>
        {/* Header Bài Viết */}
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <Link
              to={`/profile/${author.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 hover:underline truncate"
            >
              {authorName}
            </Link>
            {author.username && (
              <span className="text-xs text-zinc-500 truncate">
                @{author.username}
              </span>
            )}
            <span className="text-zinc-400 text-xs">·</span>
            <span className="text-xs text-zinc-500 hover:underline">
              {timeAgo(post.createdAt)}
            </span>
          </div>

          {/* Menu 3 chấm options */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setUserMenuOpen(!menuOpen);
              }}
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                {/* 1. Backdrop tàng hình để đóng khi click ra ngoài */}
                <div
                  className="fixed inset-0 z-40 bg-transparent cursor-default"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setUserMenuOpen(false);
                  }}
                />

                {/* 2. Menu Popup */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="absolute right-0 top-8 w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-1.5 z-50 pointer-events-auto flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleCopyLink(e);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 w-full text-left transition cursor-pointer"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopied ? "Đã sao chép" : "Sao chép liên kết"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleAiSummarize(e);
                    }}
                    disabled={isSummarizing}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-indigo-600 dark:text-indigo-400 w-full text-left transition cursor-pointer"
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
                          e.preventDefault();
                          setUserMenuOpen(false);
                          setIsEditModalOpen(true);
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 w-full text-left transition cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Chỉnh sửa bài viết</span>
                      </button>

                      <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-0.5" />

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setUserMenuOpen(false);
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
        </div>

        {/* AI Summary Box nếu được kích hoạt */}
        {summary && (
          <div className="my-2 p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 font-bold mb-1 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tóm tắt thông minh:</span>
            </div>
            <p className="whitespace-pre-line">{summary}</p>
          </div>
        )}

        {/* Thân Bài Viết (Typography Thoáng) */}
        {post?.title && post.title !== (post?.content || post?.body || post?.text) && post?.content && (
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            {post.title}
          </h2>
        )}
        {(post?.content || post?.body || post?.title || post?.text) && (
          <p className="text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200 my-2 whitespace-pre-line break-words">
            {post?.content || post?.body || post?.title || post?.text}
          </p>
        )}

        {/* Khung bài viết gốc khi được chia sẻ (Embedded Original Shared Post) */}
        {originalPost && (
          <div
            onClick={(e) => {
              if (originalPost.id) {
                e.stopPropagation();
                navigate(`/posts/${originalPost.id}`);
              }
            }}
            className="mt-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col gap-2 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition"
          >
            {/* Tác giả bài gốc */}
            <div className="flex items-center gap-2">
              <Link
                to={origAuthor.id ? `/profile/${origAuthor.id}` : "#"}
                onClick={(e) => {
                  if (origAuthor.id) {
                    e.stopPropagation();
                  }
                }}
                className="flex items-center gap-2 group hover:underline"
              >
                <Avatar
                  userId={origAuthor.id}
                  src={origAuthorAvatarUrl}
                  name={origAuthorName}
                  username={origAuthor.username}
                  avatarColor={origAuthorAvatarColor}
                  size="xs"
                  className="shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-xs"
                />
                <span className="min-w-0">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
                    {origAuthorName}
                    {originalPost.createdAt && (
                      <span className="text-[10px] text-zinc-400 font-normal shrink-0">
                        · {timeAgo(originalPost.createdAt)}
                      </span>
                    )}
                  </span>
                  {origAuthor.username && (
                    <span className="text-xs text-zinc-400 truncate block">
                      @{origAuthor.username}
                    </span>
                  )}
                </span>
              </Link>
            </div>

            {/* Tiêu đề bài gốc (nếu có) */}
            {originalPost.title && originalPost.title !== origContent && (
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {originalPost.title}
              </h3>
            )}

            {/* Nội dung bài gốc */}
            {origContent && (
              <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line break-words">
                {origContent}
              </p>
            )}

            {/* Ảnh bài gốc (nếu có) */}
            {origMedia && (
              <div
                className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 mt-1 max-h-[360px] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center cursor-pointer group/media"
                onClick={(e) => openTheater(e, 0)}
              >
                <img
                  src={origMedia}
                  alt=""
                  className="w-full h-auto max-h-[360px] object-cover object-center block hover:opacity-95 transition-opacity"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            )}
          </div>
        )}

        {/* Adaptive Image Grid (Hỗ trợ 1, 2, 3, 4+ ảnh chuẩn Facebook) */}
        {!originalPost && (() => {
          const cardImages = [];
          if (Array.isArray(post.images) && post.images.length > 0) {
            cardImages.push(...post.images);
          } else if (Array.isArray(post.imageUrls) && post.imageUrls.length > 0) {
            cardImages.push(...post.imageUrls);
          } else if (post.thumbNail) {
            cardImages.push(post.thumbNail);
          }

          // Check if the first media is a video
          const isVideo = cardImages.length > 0 && (
            isVideoUrl(cardImages[0]) ||
            post.mediaType === "video" ||
            !!post.videoUrl
          );

          if (cardImages.length === 0) return null;

          // Single video player
          if (cardImages.length === 1 && isVideo) {
            const videoSrc = post.videoUrl || cardImages[0];
            return (
              <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 my-2 max-h-[540px] relative group/media">
                <video
                  ref={postVideoRef}
                  src={videoSrc}
                  className="w-full h-auto max-h-[540px] object-contain"
                  controls
                  playsInline
                  autoPlay
                  muted
                  onPlay={() => setIsVideoPlaying(prev => ({ ...prev, [post.id]: true }))}
                  onPause={() => setIsVideoPlaying(prev => ({ ...prev, [post.id]: false }))}
                />
              </div>
            );
          }

          // Single image
          if (cardImages.length === 1) {
            return (
              <div
                className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 my-2 max-h-[540px] flex items-center justify-center cursor-pointer group/media"
                onClick={(e) => openTheater(e, 0)}
              >
                <img
                  src={cardImages[0]}
                  alt=""
                  className="w-full h-auto max-h-[540px] object-cover object-center block hover:opacity-95 transition-opacity"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            );
          }

          if (cardImages.length === 2) {
            return (
              <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 my-2 max-h-[380px]">
                {cardImages.slice(0, 2).map((img, idx) => (
                  <div
                    key={idx}
                    className="relative h-[280px] bg-zinc-100 dark:bg-zinc-800 cursor-pointer overflow-hidden group/media"
                    onClick={(e) => openTheater(e, idx)}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover group-hover/media:scale-105 transition duration-200"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ))}
              </div>
            );
          }

          if (cardImages.length === 3) {
            return (
              <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 my-2 max-h-[380px]">
                <div
                  className="col-span-2 relative h-[320px] bg-zinc-100 dark:bg-zinc-800 cursor-pointer overflow-hidden group/media"
                  onClick={(e) => openTheater(e, 0)}
                >
                  <img
                    src={cardImages[0]}
                    alt=""
                    className="w-full h-full object-cover group-hover/media:scale-105 transition duration-200"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="flex flex-col gap-1 h-[320px]">
                  {cardImages.slice(1, 3).map((img, idx) => (
                    <div
                      key={idx}
                      className="relative h-[158px] bg-zinc-100 dark:bg-zinc-800 cursor-pointer overflow-hidden group/media"
                      onClick={(e) => openTheater(e, idx + 1)}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover group-hover/media:scale-105 transition duration-200"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          // 4 ảnh trở lên
          return (
            <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 my-2 max-h-[400px]">
              {cardImages.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  className="relative h-[190px] bg-zinc-100 dark:bg-zinc-800 cursor-pointer overflow-hidden group/media"
                  onClick={(e) => openTheater(e, idx)}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover group-hover/media:scale-105 transition duration-200"
                    loading="lazy"
                    decoding="async"
                  />
                  {idx === 3 && cardImages.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl font-black">
                      +{cardImages.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}

        {/* Tag Chủ Đề */}
        {post.category?.name && (
          <div className="my-1">
            <span className="inline-block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-md">
              #{post.category.name}
            </span>
          </div>
        )}

        {/* Action Buttons (Dàn đều cân đối toàn bộ chiều rộng PostCard) */}
        <div className="flex items-center justify-between w-full text-zinc-500 pt-2 mt-1 px-2 sm:px-4">
          {/* Like & Reaction section with Hover Tooltip & Click Modal */}
          <div
            className="relative flex items-center gap-1 group/like"
            onMouseEnter={handleLikeMouseEnter}
            onMouseLeave={() => setIsHoveringLike(false)}
          >
            <button
              type="button"
              onClick={handleToggleLike}
              className={`flex items-center gap-1.5 text-xs font-medium transition cursor-pointer active:scale-95 ${
                liked ? "text-rose-500" : "hover:text-rose-500"
              }`}
              title={liked ? "Bỏ thích" : "Thích bài viết"}
            >
              <div className="relative p-2 min-w-[38px] min-h-[38px] rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center justify-center">
                <Heart
                  strokeWidth={1.8}
                  className={`w-4 h-4 transition duration-150 ${
                    liked ? "fill-rose-500 text-rose-500" : ""
                  } ${isPopping ? "animate-heart-pop" : ""}`}
                />
                {isPopping && (
                  <div className="absolute inset-0 rounded-full border border-rose-400 dark:border-rose-400 animate-heart-burst pointer-events-none" />
                )}
              </div>
            </button>

            {likeCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsReactionsModalOpen(true);
                }}
                className="text-xs text-zinc-500 dark:text-zinc-400 hover:underline hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer font-semibold px-1.5 py-1 min-h-[36px] flex items-center active:scale-95 transition-transform"
              >
                {likeCount}
              </button>
            )}

            {/* Hover Tooltip Popup (Hiển thị danh sách nhanh khi rê chuột) */}
            {isHoveringLike && likeCount > 0 && (
              <div className="absolute bottom-full left-0 mb-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-3 py-2 rounded-xl shadow-2xl z-50 pointer-events-none whitespace-nowrap backdrop-blur-md border border-white/10 dark:border-zinc-300 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs font-bold leading-none">
                  <span className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-[10px] text-white">
                    ❤️
                  </span>
                  <span>{likeCount} lượt thích</span>
                </div>
                {likersPreview && (
                  <span className="text-[11px] text-zinc-300 dark:text-zinc-600 font-normal leading-snug max-w-[220px] truncate">
                    {likersPreview}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Comment */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isDetailed) return;
              const cardImages = [];
              if (Array.isArray(post.images) && post.images.length > 0) {
                cardImages.push(...post.images);
              } else if (Array.isArray(post.imageUrls) && post.imageUrls.length > 0) {
                cardImages.push(...post.imageUrls);
              } else if (post.thumbNail) {
                cardImages.push(post.thumbNail);
              }
              const isVideoPost = post.mediaType === "video" || post.videoUrl || (cardImages.length > 0 && isVideoUrl(cardImages[0]));
              if (isVideoPost) {
                navigate(`/posts/${post.id}`);
              } else {
                openTheater(e, 0);
              }
            }}
            className="flex items-center gap-1.5 text-xs font-medium group hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer active:scale-95"
            title="Bình luận"
          >
            <div className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-full group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800 transition">
              <MessageCircle strokeWidth={1.8} className="w-4 h-4" />
            </div>
            <span>{commentCount > 0 ? commentCount : ""}</span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsShareModalOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs font-medium group hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer active:scale-95"
            title="Chia sẻ"
          >
            <div className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-full group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800 transition">
              <Repeat strokeWidth={1.8} className="w-4 h-4" />
            </div>
          </button>

          {/* Bookmark */}
          <button
            type="button"
            onClick={handleToggleBookmark}
            className={`flex items-center gap-1.5 text-xs font-medium group transition cursor-pointer active:scale-95 ${
              bookmarked ? "text-black dark:text-white" : "hover:text-black dark:hover:text-white"
            }`}
            title="Lưu bài viết"
          >
            <div className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-full group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800 transition">
              <Bookmark strokeWidth={1.8} className={`w-4 h-4 transition ${bookmarked ? "fill-black dark:fill-white" : ""}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Edit Post Modal */}
      {isOwner && (
        <EditPostModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          post={currentPost}
          onUpdated={(updated) => {
            setCurrentPost(updated);
            if (onEdit) onEdit(updated);
          }}
        />
      )}

      {/* Reactions / Likes List Modal */}
      {isReactionsModalOpen && (
        <ReactionsModal
          postId={currentPost?.id}
          isOpen={isReactionsModalOpen}
          onClose={() => setIsReactionsModalOpen(false)}
          totalLikeCount={likeCount}
        />
      )}

      {/* Share / Repost Modal */}
      {isShareModalOpen && (
        <ShareModal
          post={currentPost}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onPostShared={(shared) => {
            if (onPostCreated) onPostCreated(shared);
            if (onEdit) onEdit(shared);
          }}
        />
      )}

      {/* Delete Post Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Xóa bài viết"
        message="Bạn có chắc chắn muốn xóa vĩnh viễn bài viết này không? Hành động này không thể hoàn tác."
        confirmText="Xóa bài viết"
        isDanger={true}
        onConfirm={confirmDeletePost}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* Post Theater Modal (Facebook-style Split View on PC & Full View on Mobile) */}
      {isTheaterOpen && (
        <PostTheaterModal
          post={currentPost || post}
          initialImageIndex={theaterInitialImageIndex}
          isOpen={isTheaterOpen}
          onClose={() => setIsTheaterOpen(false)}
          onPostCreated={onPostCreated}
          onPostUpdated={(updated) => {
            setCurrentPost(updated);
            if (onEdit) onEdit(updated);
          }}
          onPostDeleted={(deletedId) => {
            if (onDelete) onDelete(deletedId);
          }}
        />
      )}
    </article>
  );
}
