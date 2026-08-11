import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReactionsModalOpen, setIsReactionsModalOpen] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const menuRef = useRef(null);
  const likeBtnWrapperRef = useRef(null);
  const [pickerPos, setPickerPos] = useState({ left: 12, top: 12 });
  const reactionTimerRef = useRef(null);
  const suppressClickRef = useRef(false);

  const authorName = post.user?.fullName || post.user?.username || "Ẩn danh";
  const categoryName = post.category?.name || "";
  const isOwner = currentUser && Number(post.user?.id) === Number(currentUser.id || currentUser.userId);

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
        likeService.getLikeCount(post.id).then((res) => {
          setLikeCount(res.data.count || 0);
          if (res.data.reactionsSummary) setReactionsSummary(res.data.reactionsSummary);
        }).catch(() => {});

        if (currentUser?.id) {
          likeService.checkLiked(post.id, currentUser.id).then((res) => {
            setLiked(res.data.liked);
            setUserReaction(res.data.userReaction || (res.data.liked ? "LIKE" : null));
            if (res.data.reactionsSummary) setReactionsSummary(res.data.reactionsSummary);
          }).catch(() => {});

          bookmarkService.checkBookmarked(post.id, currentUser.id).then((res) => {
            setBookmarked(res.data.bookmarked);
          }).catch(() => {});
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
    const newCount = isSameType ? Math.max(0, likeCount - 1) : liked ? likeCount : likeCount + 1;

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
        if (res.data.reactionsSummary) setReactionsSummary(res.data.reactionsSummary);
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
      setIsReactionsModalOpen(false); // ensure modal closed when picker opens (mutual exclusion)
      // Compute picker position from wrapper for touch as well
      try {
        const rect = likeBtnWrapperRef.current && likeBtnWrapperRef.current.getBoundingClientRect();
        if (rect) {
          const left = Math.max(8, rect.left + rect.width / 2 - 110);
          const top = Math.max(8, rect.top - 54);
          setPickerPos({ left, top });
        }
      } catch (err) {
        // ignore
      }
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
    const isTouchDevice = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    if (isTouchDevice) return;
 
    // Clear any existing hide/show timer to avoid conflicting timers causing flicker
    if (reactionTimerRef.current) {
      clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = null;
    }
 
    reactionTimerRef.current = setTimeout(() => {
      setIsReactionsModalOpen(false); // ensure modal closed when picker opens (mutual exclusion)
      // Compute picker position from the like button wrapper to avoid layout jumps
      try {
        const rect = likeBtnWrapperRef.current && likeBtnWrapperRef.current.getBoundingClientRect();
        if (rect) {
          const left = Math.max(8, rect.left + rect.width / 2 - 110); // center picker (picker width ~220)
          const top = Math.max(8, rect.top - 54); // appear above the button
          setPickerPos({ left, top });
        }
      } catch (err) {
        // ignore
      }
      setShowReactionsPicker(true);
    }, 280);
  };

  const handleMouseLeaveLike = () => {
    const isTouchDevice = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
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
      showToast(res.data.bookmarked ? "Đã lưu bài viết!" : "Đã bỏ lưu bài viết!", "success");
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
    : (liked ? REACTIONS[0] : null);

  // Danh sách các emoji rải rác top đầu của bài viết
  const topReactions = REACTIONS.filter((r) => reactionsSummary[r.type] > 0);

  return (
    <article className="post-card feed-item-enter" style={style}>
      {/* Header */}
      <div className="post-card-header">
        <div className="post-card-author" onClick={goToProfile} style={{ cursor: "pointer" }}>
          {post.user?.avatarUrl ? (
            <img
              src={post.user.avatarUrl}
              alt={authorName}
              className="avatar avatar-md"
              style={{ objectFit: "cover" }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div
              className="avatar avatar-md"
              style={post.user?.avatarColor ? {
                background: `linear-gradient(135deg, ${post.user.avatarColor}, ${post.user.avatarColor}bb)`
              } : {}}
            >
              {getInitials(authorName)}
            </div>
          )}

          <div className="post-card-author-info">
            <span className="post-card-author-name">{authorName}</span>
            <div className="post-card-meta" style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "nowrap", whiteSpace: "nowrap" }}>
              <span>{timeAgo(post.createdAt)}</span>
              <span>•</span>
              <span>📖 {getReadingTime(post.content)}</span>
              <span>•</span>
              <span title={post.status === "private" ? "Riêng tư" : "Công khai"} style={{ fontSize: 13 }}>
                {post.status === "private" ? "🔒" : "🌐"}
              </span>
              {categoryName && (
                <span className="badge" style={{ marginLeft: 4, whiteSpace: "nowrap" }}>{categoryName}</span>
              )}
            </div>
          </div>
        </div>

        {/* ⋯ Dropdown menu */}
        <div ref={menuRef} style={{ position: "relative", zIndex: 50 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            title="Tuỳ chọn"
            style={{
              width: 36, height: 36, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 700, letterSpacing: 1,
              color: "var(--text-secondary)",
            }}
          >
            ···
          </button>

          {menuOpen && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              minWidth: 210,
              background: "var(--bg-card)",
              borderRadius: 12,
              boxShadow: "0 12px 28px rgba(0,0,0,0.18), 0 2px 4px rgba(0,0,0,0.1)",
              border: "1px solid var(--border-light)",
              zIndex: 1000,
              overflow: "hidden",
              animation: "dropdownFadeIn 0.15s ease",
            }}>
              {/* Lưu bài viết */}
              <button
                onClick={handleBookmark}
                style={{
                  width: "100%", padding: "11px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 14, fontWeight: 500,
                  color: bookmarked ? "var(--primary)" : "var(--text-primary)",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-secondary)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24"
                  fill={bookmarked ? "var(--primary)" : "none"}
                  stroke={bookmarked ? "var(--primary)" : "currentColor"}
                  strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                {bookmarked ? "Bỏ lưu bài viết" : "Lưu bài viết"}
              </button>

              {/* Copy link */}
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
                    try { document.execCommand("copy"); } catch {}
                    document.body.removeChild(ta);
                  }
                  showToast("Đã sao chép liên kết vào khay nhớ tạm!", "success");
                  setMenuOpen(false);
                }}
                style={{
                  width: "100%", padding: "11px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 14, fontWeight: 500,
                  color: "var(--text-primary)", textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-secondary)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                Sao chép liên kết
              </button>

              {/* Chỉnh sửa & Xóa */}
              {isOwner && (
                <>
                  <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard?edit=${post.id}`);
                      setMenuOpen(false);
                    }}
                    style={{
                      width: "100%", padding: "11px 16px",
                      display: "flex", alignItems: "center", gap: 12,
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 14, fontWeight: 500,
                      color: "var(--text-primary)", textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-secondary)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
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
                    style={{
                      width: "100%", padding: "11px 16px",
                      display: "flex", alignItems: "center", gap: 12,
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 14, fontWeight: 500,
                      color: "var(--danger)", textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,59,48,0.07)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Xóa bài viết
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media / Thumbnail — hỗ trợ Video playsInline di động & Xem ảnh toàn màn hình Facebook Lightbox */}
      {post.thumbNail && !post.bgColor && !post.sharedPost && (
        isVideoUrl(post.thumbNail) ? (
          <video
            src={post.thumbNail}
            controls
            playsInline
            webkit-playsinline="true"
            preload="metadata"
            style={{
              width: "100%",
              maxHeight: 450,
              objectFit: "contain",
              background: "#000",
              display: "block",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            src={post.thumbNail}
            alt={post.title}
            className="post-card-thumbnail"
            onClick={(e) => {
              e.stopPropagation();
              setShowLightbox(true);
            }}
            style={{ cursor: "pointer" }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        )
      )}

      {/* Body / Content */}
      {post.sharedPost ? (
        /* GIAO DIỆN BÀI VIẾT CHIA SẺ CHUẨN FACEBOOK (NHÚNG BÀI GỐC BÊN TRONG) */
        <div className="post-card-body" style={{ padding: "0 16px 16px 16px" }}>
          {/* Nội dung bình luận của người chia sẻ (nếu có) */}
          {post.content && (
            <p style={{ fontSize: 15, color: "var(--text-primary)", marginBottom: 12, lineHeight: 1.45 }}>
              {post.content}
            </p>
          )}

          {/* Hộp nhúng bài viết gốc bên trong */}
          <div
            onClick={() => navigate(`/posts/${post.sharedPost.id}`)}
            style={{
              border: "1px solid var(--border-light)",
              borderRadius: 12,
              padding: 16,
              background: "var(--bg-input)",
              cursor: "pointer",
              transition: "background 0.2s",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg-input)"}
          >
            {/* Header của bài viết gốc */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              {post.sharedPost.user?.avatarUrl ? (
                <img
                  src={post.sharedPost.user.avatarUrl}
                  alt={post.sharedPost.user?.fullName || post.sharedPost.user?.username}
                  className="avatar avatar-sm"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div
                  className="avatar avatar-sm"
                  style={post.sharedPost.user?.avatarColor ? {
                    background: `linear-gradient(135deg, ${post.sharedPost.user.avatarColor}, ${post.sharedPost.user.avatarColor}bb)`
                  } : {}}
                >
                  {getInitials(post.sharedPost.user?.fullName || post.sharedPost.user?.username || "?")}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text-primary)" }}>
                  {post.sharedPost.user?.fullName || post.sharedPost.user?.username || "Ẩn danh"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                  {timeAgo(post.sharedPost.createdAt)}
                </div>
              </div>
            </div>

            {/* Nội dung bài viết gốc */}
            {post.sharedPost.bgColor ? (
              <div
                style={{
                  background: post.sharedPost.bgColor,
                  borderRadius: 10,
                  padding: "24px 16px",
                  minHeight: 120,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}
              >
                <p style={{
                  color: "#fff",
                  textAlign: "center",
                  fontSize: post.sharedPost.content?.length < 80 ? 17 : 14,
                  fontWeight: 700,
                  lineHeight: 1.45,
                  margin: 0,
                  textShadow: "0 1px 3px rgba(0,0,0,0.2)"
                }}>
                  {post.sharedPost.content}
                </p>
              </div>
            ) : (
              <>
                {post.sharedPost.thumbNail && (
                  isVideoUrl(post.sharedPost.thumbNail) ? (
                    <video
                      src={post.sharedPost.thumbNail}
                      controls
                      style={{ width: "100%", maxHeight: 240, objectFit: "contain", background: "#000", borderRadius: 8, marginBottom: 10 }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <img
                      src={post.sharedPost.thumbNail}
                      alt={post.sharedPost.title}
                      style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8, marginBottom: 10 }}
                    />
                  )
                )}
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: "var(--text-primary)" }}>
                  {post.sharedPost.title}
                </h3>
                <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {post.sharedPost.content}
                </p>
              </>
            )}
          </div>
        </div>
      ) : post.bgColor ? (
        <div
          className="post-card-bg-color"
          style={{ background: post.bgColor }}
          onClick={goToDetail}
        >
          <p style={{
            color: "rgba(255,255,255,0.97)",
            textAlign: "center",
            fontSize: post.content?.length < 80 ? 24 : 17,
            fontWeight: 700,
            lineHeight: 1.55,
            textShadow: "0 1px 4px rgba(0,0,0,0.28)",
            margin: 0,
          }}>
            {post.content}
          </p>
        </div>
      ) : (
        <div className="post-card-body">
          <h2 className="post-card-title" onClick={goToDetail}>{post.title}</h2>
          <p className="post-card-excerpt">{post.content}</p>
        </div>
      )}

      {/* Stats — Hiển thị các icon cảm xúc top đầu */}
      <div className="post-card-stats">
        <div
          className="post-card-likes"
                  onClick={(e) => { e.stopPropagation(); setShowReactionsPicker(false); setIsReactionsModalOpen(true); }}
          style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
          title="Nhấp để xem danh sách người thả cảm xúc"
        >
          {likeCount > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", marginLeft: 2 }}>
                {topReactions.length > 0 ? (
                  topReactions.slice(0, 3).map((r, idx) => (
                    <span
                      key={r.type}
                      style={{
                        fontSize: 16,
                        marginLeft: idx > 0 ? -6 : 0,
                        zIndex: 3 - idx,
                        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
                      }}
                    >
                      {r.emoji}
                    </span>
                  ))
                ) : (
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: "#1877f2",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "white"
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                    </svg>
                  </div>
                )}
              </div>
              <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500, marginLeft: 4 }}>
                {likeCount}
              </span>
            </>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--text-muted)" }}>
          {post.viewCount > 0 && <span>{post.viewCount} lượt xem</span>}
          <span style={{ cursor: "pointer" }} onClick={goToDetail}>Xem bình luận</span>
        </div>
      </div>

      <div className="post-card-divider" />

      {/* Action buttons với Popup Emoji Cảm Xúc */}
      <div className="post-card-actions" style={{ position: "relative" }}>

        {/* Floating Emoji Popup Bar (Facebook Mobile Touch Drag & Hover Style) */}
        <div ref={likeBtnWrapperRef} onMouseEnter={handleMouseEnterLike} onMouseLeave={handleMouseLeaveLike} onTouchStart={handleTouchStartLike} onTouchMove={handleTouchMoveLike} onTouchEnd={handleTouchEndLike} style={{ flex: 1, display: "flex" }}>
          <button
            className={`post-action-btn ${liked ? "liked" : ""}`}
            onClick={handleToggleLike}
            style={{
              width: "100%",
              color: activeReactionObj ? activeReactionObj.color : "inherit",
              fontWeight: liked ? "700" : "500",
              gap: 6,
              userSelect: "none",
              touchAction: "manipulation",
            }}
          >
            {activeReactionObj ? (
              <span style={{ fontSize: 18, lineHeight: 1 }}>{activeReactionObj.emoji}</span>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
            )}
            {activeReactionObj ? activeReactionObj.label : "Thích"}
          </button>
        </div>

        {/* Portal-based Reaction Picker to avoid layout reflow/flicker */}
        {showReactionsPicker && pickerPos && createPortal(
          <div
            onMouseEnter={() => { if (reactionTimerRef.current) { clearTimeout(reactionTimerRef.current); reactionTimerRef.current = null; } }}
            onMouseLeave={handleMouseLeaveLike}
            style={{
              position: "fixed",
              left: pickerPos.left,
              top: pickerPos.top,
              background: "var(--bg-card)",
              borderRadius: 30,
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 10px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.12)",
              border: "1px solid var(--border-light)",
              zIndex: 9999,
              animation: "reactionPopIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              touchAction: "none",
            }}
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
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 28,
                    cursor: "pointer",
                    padding: 2,
                    lineHeight: 1,
                    transition: "transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    transform: isSelected ? "scale(1.5) translateY(-6px)" : "scale(1)",
                  }}
                  onMouseEnter={() => setHoveredReaction(r.type)}
                  onMouseLeave={() => setHoveredReaction(null)}
                >
                  <span data-reaction-type={r.type} style={{ pointerEvents: "none" }}>{r.emoji}</span>
                </button>
              );
            })}
          </div>,
          document.body
        )}


        <button className="post-action-btn" onClick={goToDetail}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Bình luận
        </button>

        <div style={{ flex: 1, display: "flex" }}>
          <button
            className="post-action-btn"
            onClick={() => setIsShareModalOpen(true)}
            style={{ width: "100%", gap: 6 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Chia sẻ
          </button>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        post={post}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onToast={showToast}
      />

      {/* Reactions Modal - Danh sách người thả cảm xúc */}
      <ReactionsModal
        postId={post.id}
        isOpen={isReactionsModalOpen}
        onClose={() => setIsReactionsModalOpen(false)}
        totalLikeCount={likeCount}
        reactionsSummary={reactionsSummary}
      />

      {/* Toast Notification */}
      {toast.show && (
        <div className={`custom-toast ${toast.type}`}>
          <span>{toast.type === "success" ? "✓" : toast.type === "error" ? "❌" : "ℹ️"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Facebook Lightbox Fullscreen Image Viewer Modal */}
      {showLightbox && (
        <div
          onClick={() => setShowLightbox(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.94)",
            zIndex: 99999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <button
            onClick={() => setShowLightbox(false)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255, 255, 255, 0.25)",
              color: "#ffffff",
              border: "none",
              borderRadius: "50%",
              width: 44,
              height: 44,
              fontSize: 22,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            ✕
          </button>
          <img
            src={post.thumbNail}
            alt=""
            style={{
              maxWidth: "100%",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: 12,
              boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </article>
  );
}

export default PostCard;





