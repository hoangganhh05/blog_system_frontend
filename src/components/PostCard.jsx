import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import likeService from "../services/likeService";
import bookmarkService from "../services/bookmarkService";
import ShareModal from "./ShareModal";
import ReactionsModal from "./ReactionsModal";
import aiService from "../services/aiService";
import { isVideoUrl } from "../utils/mediaUtils";

const REACTIONS = [
  { type: "LIKE", label: "Thích", emoji: "👍", color: "#1877f2" },
  { type: "LOVE", label: "Yêu thích", emoji: "❤️", color: "#f33e5b" },
  { type: "HAHA", label: "Haha", emoji: "😆", color: "#f7b125" },
  { type: "WOW", label: "Wow", emoji: "😮", color: "#f7b125" },
  { type: "SAD", label: "Buồn", emoji: "😢", color: "#f7b125" },
  { type: "ANGRY", label: "Phẫn nộ", emoji: "😡", color: "#e9710f" },
];

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
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function getReadingTime(text) {
  if (!text) return "1 phút đọc";
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 150));
  return `${minutes} phút đọc`;
}

function PostCard({ post, onDelete, style }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [liked, setLiked] = useState(false);
  const [userReaction, setUserReaction] = useState(null);
  const [reactionsSummary, setReactionsSummary] = useState({});
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReactionsPicker, setShowReactionsPicker] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReactionsModalOpen, setIsReactionsModalOpen] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const menuRef = useRef(null);
  const reactionTimerRef = useRef(null);
  const suppressClickRef = useRef(false);

  const authorName = post.user?.fullName || post.user?.username || "Ẩn danh";
  const categoryName = post.category?.name || "";
  const isOwner =
    currentUser &&
    Number(post.user?.id) === Number(currentUser.id || currentUser.userId);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Polling siêu tốc 1.5s cập nhật Lượt thích & Cảm xúc bài viết tức thì giữa mọi máy
  useEffect(() => {
    let interval;
    if (post?.id) {
      const fetchLiveReactions = () => {
        likeService
          .getLikeCount(post.id)
          .then((res) => {
            setLikeCount(res.data.count || 0);
            if (res.data.reactionsSummary)
              setReactionsSummary(res.data.reactionsSummary);
          })
          .catch(() => {});

        if (currentUser?.id) {
          likeService
            .checkLiked(post.id, currentUser.id)
            .then((res) => {
              setLiked(res.data.liked);
              setUserReaction(
                res.data.userReaction || (res.data.liked ? "LIKE" : null),
              );
              if (res.data.reactionsSummary)
                setReactionsSummary(res.data.reactionsSummary);
            })
            .catch(() => {});

          bookmarkService
            .checkBookmarked(post.id, currentUser.id)
            .then((res) => {
              setBookmarked(res.data.bookmarked);
            })
            .catch(() => {});
        }
      };

      fetchLiveReactions();
      interval = setInterval(fetchLiveReactions, 1500);
    }
    return () => interval && clearInterval(interval);
  }, [post?.id, currentUser?.id]);

  const handleToggleLike = async (e) => {
    if (e?.type === "click" && suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!currentUser) {
      showToast("Vui lòng đăng nhập để tương tác bài viết!", "error");
      return;
    }
    const defaultType = userReaction || "LIKE";
    handleSelectReaction(defaultType);
  };

  const handleSelectReaction = async (type) => {
    if (!currentUser) {
      showToast("Vui lòng đăng nhập để tương tác bài viết!", "error");
      return;
    }

    const currentUid = currentUser.id || currentUser.userId;

    // Optimistic UI Update tức thì không độ trễ
    const isSameType = userReaction === type;
    const newLiked = !isSameType;
    const newReaction = isSameType ? null : type;
    const newCount = isSameType
      ? Math.max(0, likeCount - 1)
      : liked
        ? likeCount
        : likeCount + 1;

    setLiked(newLiked);
    setUserReaction(newReaction);
    setLikeCount(newCount);
    setShowReactionsPicker(false);

    try {
      const res = await likeService.toggleLike(post.id, currentUid, type);
      if (res?.data) {
        setLiked(res.data.liked);
        setUserReaction(res.data.userReaction);
        if (typeof res.data.count === "number") setLikeCount(res.data.count);
        if (res.data.reactionsSummary)
          setReactionsSummary(res.data.reactionsSummary);
      }
    } catch (err) {
      // Đồng bộ ngầm không gây quấy rầy người dùng bằng popup lỗi [object Object]
      console.warn("Like sync error:", err);
    }
  };

  // Long Press & Touch Drag state cho Facebook Reaction Bar
  const [hoveredReaction, setHoveredReaction] = useState(null);
  const longPressTimerRef = useRef(null);
  const isLongPressRef = useRef(false);

  const handleTouchStartLike = (e) => {
    suppressClickRef.current = false;
    isLongPressRef.current = false;
    setHoveredReaction(null);
    setShowReactionsPicker(false);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setShowReactionsPicker(true);
    }, 250);
  };

  const handleTouchMoveLike = (e) => {
    if (!showReactionsPicker) return;
    const touch = e.touches[0];
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    if (elem) {
      const type = elem.getAttribute("data-reaction-type");
      if (type) {
        setHoveredReaction(type);
      }
    }
  };

  const handleTouchEndLike = (e) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    e.preventDefault();
    e.stopPropagation();

    if (isLongPressRef.current) {
      if (hoveredReaction) {
        handleSelectReaction(hoveredReaction);
      }
      setHoveredReaction(null);
      setShowReactionsPicker(false);
      suppressClickRef.current = false;
      return;
    }

    suppressClickRef.current = true;
    setShowReactionsPicker(false);
    handleToggleLike(e);
  };

  const handleMouseEnterLike = () => {
    const isTouchDevice =
      window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    if (isTouchDevice) return;

    reactionTimerRef.current = setTimeout(() => {
      setShowReactionsPicker(true);
    }, 280);
  };

  const handleMouseLeaveLike = () => {
    const isTouchDevice =
      window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    if (isTouchDevice) return;

    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    reactionTimerRef.current = setTimeout(() => {
      setShowReactionsPicker(false);
    }, 300);
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast("Vui lòng đăng nhập để lưu bài viết!", "error");
      return;
    }
    try {
      const res = await bookmarkService.toggleBookmark(post.id, currentUser.id);
      setBookmarked(res.data.bookmarked);
      showToast(
        res.data.bookmarked ? "Đã lưu bài viết!" : "Đã bỏ lưu bài viết!",
        "success",
      );
    } catch {
      setBookmarked((v) => !v);
    }
    setMenuOpen(false);
  };

  const goToDetail = () => navigate(`/posts/${post.id}`);
  const goToProfile = (e) => {
    e && e.stopPropagation();
    if (post.user?.id) {
      navigate(`/profile/${post.user.id}`);
    }
  };

  // Cấu hình cảm xúc hiện tại của user
  const activeReactionObj = userReaction
    ? REACTIONS.find((r) => r.type === userReaction)
    : liked
      ? REACTIONS[0]
      : null;

  // Danh sách các emoji rải rác top đầu của bài viết
  const topReactions = REACTIONS.filter((r) => reactionsSummary[r.type] > 0);

  return (
    <div className="bg-white text-gray-900 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 h-auto" style={style}>
      {/* Header - Author Info */}
      <div className="flex items-center gap-3 p-4">
        {post.user?.avatarUrl ? (
          <img 
            src={post.user.avatarUrl} 
            alt={authorName}
            onClick={goToProfile}
            className="w-10 h-10 rounded-full object-cover cursor-pointer"
          />
        ) : (
          <div
            onClick={goToProfile}
            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
            style={
              post.user?.avatarColor
                ? {
                    background: `linear-gradient(135deg, ${post.user.avatarColor}, ${post.user.avatarColor}bb)`,
                    color: "white",
                    fontWeight: "bold",
                  }
                : {
                    background: "#e5e7eb",
                    color: "#6b7280",
                    fontWeight: "bold",
                  }
            }
          >
            {getInitials(authorName)}
          </div>
        )}
        <div className="flex-1">
          <p 
            className="text-sm font-semibold text-gray-900 hover:underline cursor-pointer"
            onClick={goToProfile}
          >
            {authorName}
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <span>{timeAgo(post.createdAt)}</span>
            <span>·</span>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </p>
        </div>
        <div ref={menuRef} style={{ position: "relative" }}>
          <button 
            className="text-gray-400 hover:text-gray-600 p-1"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
              <button
                onClick={handleBookmark}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 text-sm"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={bookmarked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                {bookmarked ? "Bỏ lưu bài viết" : "Lưu bài viết"}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const shareUrl = window.location.origin + `/posts/${post.id}`;
                  if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(shareUrl).catch(() => {});
                  } else {
                    const ta = document.createElement("textarea");
                    ta.value = shareUrl;
                    document.body.appendChild(ta);
                    ta.select();
                    try {
                      document.execCommand("copy");
                    } catch {}
                    document.body.removeChild(ta);
                  }
                  showToast("Đã sao chép liên kết!", "success");
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 text-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                Sao chép liên kết
              </button>

              {isOwner && (
                <>
                  <div className="border-t border-gray-200" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard?edit=${post.id}`);
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 text-sm"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Chỉnh sửa bài viết
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Xóa bài viết này?")) {
                        onDelete && onDelete(post.id);
                      }
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-sm text-red-600"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Xóa bài viết
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3">
        {post.bgColor ? (
          <div className={`w-full flex items-center justify-center min-h-[200px] md:min-h-[300px] p-4 md:p-8 rounded-xl text-white font-bold text-center break-words shadow-sm cursor-pointer`} style={{ background: post.bgColor }} onClick={goToDetail}>
            <p className="max-w-full text-xl md:text-3xl leading-snug drop-shadow-md">
              {post.content}
            </p>
          </div>
        ) : (
          <>
            {post.content && !post.sharedPost && (
              <div className="w-full text-base md:text-lg text-gray-800 text-left whitespace-pre-wrap break-words">
                {post.content}
              </div>
            )}

            {post.thumbNail &&
              !post.sharedPost &&
              (isVideoUrl(post.thumbNail) ? (
                <video
                  src={post.thumbNail}
                  controls
                  playsInline
                  webkit-playsinline="true"
                  preload="metadata"
                  className="w-full max-h-[500px] object-contain bg-black"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <img
                  src={post.thumbNail}
                  alt={post.title}
                  className="w-full h-auto object-cover max-h-[500px] cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLightbox(true);
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ))}
          </>
        )}
      </div>

      {/* Shared Post */}
      {post.sharedPost && (
        <div className="px-4 pb-3">
          {post.content && (
            <p className="text-sm text-gray-900 leading-relaxed mb-3">
              {post.content}
            </p>
          )}
          <div
            className="border border-gray-200 rounded-lg p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => navigate(`/posts/${post.sharedPost.id}`)}
          >
            <div className="flex items-center gap-3 mb-3">
              {post.sharedPost.user?.avatarUrl ? (
                <img
                  src={post.sharedPost.user.avatarUrl}
                  alt={post.sharedPost.user?.fullName || post.sharedPost.user?.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={
                    post.sharedPost.user?.avatarColor
                      ? {
                          background: `linear-gradient(135deg, ${post.sharedPost.user.avatarColor}, ${post.sharedPost.user.avatarColor}bb)`,
                        }
                      : { background: "#9ca3af" }
                  }
                >
                  {getInitials(post.sharedPost.user?.fullName || post.sharedPost.user?.username || "?")}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {post.sharedPost.user?.fullName || post.sharedPost.user?.username || "Ẩn danh"}
                </p>
                <p className="text-xs text-gray-500">
                  {timeAgo(post.sharedPost.createdAt)}
                </p>
              </div>
            </div>
            {post.sharedPost.bgColor ? (
              <div
                className="rounded-lg p-6 text-center"
                style={{ background: post.sharedPost.bgColor }}
              >
                <p className="text-white font-bold leading-relaxed">
                  {post.sharedPost.content}
                </p>
              </div>
            ) : (
              <>
                {post.sharedPost.thumbNail && (
                  <img
                    src={post.sharedPost.thumbNail}
                    alt={post.sharedPost.title}
                    className="w-full h-auto object-cover rounded-lg mb-3 max-h-[200px]"
                  />
                )}
                {post.sharedPost.title && (
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    {post.sharedPost.title}
                  </h3>
                )}
                <p className="text-sm text-gray-600 line-clamp-3">
                  {post.sharedPost.content}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
        <div 
          className="flex items-center gap-1 cursor-pointer hover:underline"
          onClick={() => setIsReactionsModalOpen(true)}
        >
          <div className="flex -space-x-1">
            {topReactions.length > 0 ? (
              topReactions.slice(0, 3).map((r, idx) => (
                <span
                  key={r.type}
                  className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-xs"
                  style={{ marginLeft: idx > 0 ? "-4px" : "0", zIndex: 3 - idx }}
                >
                  {r.emoji}
                </span>
              ))
            ) : (
              <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>
          <span>{likeCount}</span>
        </div>
        <div className="flex gap-3">
          <span className="hover:underline cursor-pointer" onClick={goToDetail}>
            Xem bình luận
          </span>
          {post.viewCount > 0 && (
            <span>{post.viewCount} lượt xem</span>
          )}
        </div>
      </div>

      {/* Interactions - Like, Comment, Share */}
      <div className="flex items-center justify-around py-1 border-t border-gray-100 relative">
        {/* Reactions Picker */}
        {showReactionsPicker && (
          <div
            onMouseEnter={handleMouseEnterLike}
            onMouseLeave={handleMouseLeaveLike}
            onTouchMove={handleTouchMoveLike}
            onTouchEnd={handleTouchEndLike}
            className="absolute bottom-full left-2 mb-2 bg-white rounded-full px-3 py-2 flex items-center gap-2 shadow-lg border border-gray-200 z-50"
          >
            {REACTIONS.map((r) => {
              const isSelected = hoveredReaction === r.type || userReaction === r.type;
              return (
                <button
                  key={r.type}
                  type="button"
                  data-reaction-type={r.type}
                  title={r.label}
                  onClick={() => handleSelectReaction(r.type)}
                  className="text-2xl transition-transform hover:scale-125"
                  style={{
                    transform: isSelected ? "scale(1.5) translateY(-4px)" : "scale(1)",
                  }}
                  onMouseEnter={() => setHoveredReaction(r.type)}
                  onMouseLeave={() => setHoveredReaction(null)}
                >
                  {r.emoji}
                </button>
              );
            })}
          </div>
        )}

        <button
          onMouseEnter={handleMouseEnterLike}
          onMouseLeave={handleMouseLeaveLike}
          onTouchStart={handleTouchStartLike}
          onTouchMove={handleTouchMoveLike}
          onTouchEnd={handleTouchEndLike}
          onClick={handleToggleLike}
          className={`flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors ${liked ? "text-blue-500" : ""}`}
          style={{ color: activeReactionObj ? activeReactionObj.color : "" }}
        >
          {activeReactionObj ? (
            <span className="text-lg">{activeReactionObj.emoji}</span>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          )}
          <span className="text-sm font-medium">{activeReactionObj ? activeReactionObj.label : "Thích"}</span>
        </button>

        <button 
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          onClick={goToDetail}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm font-medium">Bình luận</span>
        </button>

        <button 
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          onClick={() => setIsShareModalOpen(true)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="text-sm font-medium">Chia sẻ</span>
        </button>
      </div>

      {/* Share Modal */}
      <ShareModal
        post={post}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onToast={showToast}
      />

      {/* Reactions Modal */}
      <ReactionsModal
        postId={post.id}
        isOpen={isReactionsModalOpen}
        onClose={() => setIsReactionsModalOpen(false)}
        totalLikeCount={likeCount}
        reactionsSummary={reactionsSummary}
      />

      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-5 right-5 px-4 py-3 rounded-lg shadow-lg text-white z-50 ${
            toast.type === "success" ? "bg-green-500" : toast.type === "error" ? "bg-red-500" : "bg-blue-500"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Lightbox */}
      {showLightbox && (
        <div
          onClick={() => setShowLightbox(false)}
          className="fixed inset-0 bg-black/94 z-[99999999] flex items-center justify-center p-4"
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-5 right-5 bg-white/25 text-white rounded-full w-11 h-11 flex items-center justify-center text-xl cursor-pointer hover:bg-white/40 transition-colors z-10"
          >
            ✕
          </button>
          <img
            src={post.thumbNail}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default PostCard;
