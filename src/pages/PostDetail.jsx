import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import postService from "../services/postService";
import commentService from "../services/commentService";
import likeService from "../services/likeService";
import bookmarkService from "../services/bookmarkService";
import ShareModal from "../components/ShareModal";
import CommentSection from "../components/Comment";
import aiService from "../services/aiService";
import { ConfirmModal } from "../components/CustomModal";
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

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const [summaryPoints, setSummaryPoints] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleConfirmDeletePost = async () => {
    try {
      await postService.delete(post.id);
      navigate("/");
    } catch {
      showToast("Không thể xóa bài viết!", "error");
    }
  };

  const menuRef = useRef(null);
  const reactionTimerRef = useRef(null);
  const suppressClickRef = useRef(false);
  const commentSectionRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // AI Summarizer
  const handleSummarizeAI = async () => {
    if (summaryPoints.length > 0) {
      setSummaryPoints([]);
      return;
    }
    if (!post?.content) return;
    try {
      setSummaryLoading(true);
      const points = await aiService.summarize(post.content);
      setSummaryPoints(points);
    } catch {
      showToast("Không thể tóm tắt bài viết!", "error");
    } finally {
      setSummaryLoading(false);
    }
  };

  // Text-to-Speech Voice Reader
  const handleToggleSpeech = () => {
    if (!window.speechSynthesis) {
      showToast("Trình duyệt không hỗ trợ đọc giọng nói!", "error");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = `${post?.title || ""}. ${post?.content || ""}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = "vi-VN";
    utterance.rate = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Đóng 3-dots menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Đếm lượt xem thực tế (Sau 2.5s đọc bài viết & lọc trùng 30 phút/phiên)
  useEffect(() => {
    let timer;
    if (id) {
      timer = setTimeout(() => {
        postService.incrementViewCount(id);
      }, 2500);
    }
    return () => timer && clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    let interval;
    const fetchData = async (isInitial = false) => {
      if (isInitial) setLoading(true);
      try {
        const postRes = await postService.getById(id);
        setPost(postRes.data);

        // Lấy thông tin Lượt thích & Thả cảm xúc
        const lRes = await likeService.getLikeCount(id);
        setLikeCount(lRes.data.count || 0);
        if (lRes.data.reactionsSummary)
          setReactionsSummary(lRes.data.reactionsSummary);

        if (currentUser?.id) {
          const checkL = await likeService.checkLiked(id, currentUser.id);
          setLiked(checkL.data.liked);
          setUserReaction(
            checkL.data.userReaction || (checkL.data.liked ? "LIKE" : null),
          );
          if (checkL.data.reactionsSummary)
            setReactionsSummary(checkL.data.reactionsSummary);

          const checkB = await bookmarkService.checkBookmarked(
            id,
            currentUser.id,
          );
          setBookmarked(checkB.data.bookmarked);
        }

        // Lấy bình luận của bài viết
        const cmtRes = await commentService.getAll();
        const filtered = cmtRes.data.filter((c) => c.post?.id === parseInt(id));
        setComments(filtered.reverse());
      } catch {
        if (isInitial) setError("Không tìm thấy bài viết!");
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    fetchData(true);
    interval = setInterval(() => fetchData(false), 1500);
    return () => interval && clearInterval(interval);
  }, [id, currentUser?.id]);

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
    try {
      const res = await likeService.toggleLike(id, currentUser.id, type);
      setLiked(res.data.liked);
      setUserReaction(res.data.userReaction);
      setLikeCount(res.data.count);
      if (res.data.reactionsSummary)
        setReactionsSummary(res.data.reactionsSummary);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        "Lỗi tương tác!";
      showToast(`Lỗi: ${msg}`, "error");
    }
    setShowReactionsPicker(false);
  };

  const handleMouseEnterLike = () => {
    reactionTimerRef.current = setTimeout(() => {
      setShowReactionsPicker(true);
    }, 280);
  };

  const handleMouseLeaveLike = () => {
    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    reactionTimerRef.current = setTimeout(() => {
      setShowReactionsPicker(false);
    }, 300);
  };

  const handleTouchStartLike = () => {
    suppressClickRef.current = false;
    setShowReactionsPicker(false);
  };

  const handleTouchEndLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    suppressClickRef.current = true;
    setShowReactionsPicker(false);
    handleToggleLike(e);
  };

  const handleBookmark = async () => {
    if (!currentUser) {
      showToast("Vui lòng đăng nhập để lưu bài viết!", "error");
      return;
    }
    try {
      const res = await bookmarkService.toggleBookmark(id, currentUser.id);
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

  const scrollToComments = () => {
    if (commentSectionRef.current) {
      commentSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <div className="post-detail-container">
          <div className="post-detail-card">
            <div className="skeleton" style={{ height: 350 }} />
            <div style={{ padding: 24 }}>
              <div
                className="skeleton"
                style={{ height: 32, width: "70%", marginBottom: 16 }}
              />
              <div
                className="skeleton"
                style={{ height: 16, marginBottom: 8 }}
              />
              <div
                className="skeleton"
                style={{ height: 16, width: "90%", marginBottom: 8 }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="app-layout">
        <div className="post-detail-container">
          <div className="card empty-state">
            <div className="empty-state-icon">😕</div>
            <h3>{error || "Không tìm thấy bài viết"}</h3>
            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => navigate("/")}
            >
              ← Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  const authorName = post.user?.fullName || post.user?.username || "Ẩn danh";
  const isOwner = currentUser && post.user?.id === currentUser.id;

  const activeReactionObj = userReaction
    ? REACTIONS.find((r) => r.type === userReaction)
    : liked
      ? REACTIONS[0]
      : null;

  const topReactions = REACTIONS.filter((r) => reactionsSummary[r.type] > 0);

  return (
    <>
      <div className="post-detail-page-wrapper">
        <div className="post-detail-modal-card">
          {/* PC Modal Header (Hiện trên PC > 768px) */}
          <div className="post-detail-pc-header">
            <h3 className="post-detail-pc-title">Bài viết của {authorName}</h3>
            <button
              type="button"
              className="post-detail-pc-close"
              onClick={() => navigate(-1)}
              title="Đóng bài viết"
            >
              ✕
            </button>
          </div>
          {/* Mobile Header (Hiện trên Điện thoại <= 768px) */}
          <div className="post-detail-mobile-header">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flex: 1,
                minWidth: 0,
              }}
            >
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  padding: "2px 6px",
                  lineHeight: 1,
                }}
                title="Quay lại"
              >
                ‹
              </button>
              {post.user?.avatarUrl ? (
                <img
                  src={post.user.avatarUrl}
                  alt=""
                  className="avatar avatar-sm"
                  style={{
                    width: 32,
                    height: 32,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  className="avatar avatar-sm"
                  style={{
                    width: 32,
                    height: 32,
                    fontSize: 11,
                    flexShrink: 0,
                    background: post.user?.avatarColor
                      ? `linear-gradient(135deg, ${post.user.avatarColor}, ${post.user.avatarColor}bb)`
                      : undefined,
                  }}
                >
                  {getInitials(authorName)}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {authorName}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--primary)",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  • Theo dõi
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                background: "none",
                border: "none",
                fontSize: 18,
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
              }}
            >
              ⋯
            </button>
          </div>
          {/* Nội dung cuộn chính */}
          <div className="post-detail-scroll-body">
            {/* Breadcrumb */}
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "var(--text-muted)",
                fontSize: 13.5,
              }}
            >
              <Link to="/" style={{ color: "var(--text-muted)" }}>
                🏠 Trang chủ
              </Link>
              <span>›</span>
              {post.category && (
                <>
                  <span style={{ color: "var(--primary)", fontWeight: 500 }}>
                    {post.category.name}
                  </span>
                  <span>›</span>
                </>
              )}
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                {post.title?.slice(0, 35)}
                {post.title?.length > 35 ? "..." : ""}
              </span>
            </div>

            {/* Post card */}
            <div className="post-detail-card">
              {/* Media / Thumbnail — ẩn nếu có nền màu */}
              {post.thumbNail &&
                !post.bgColor &&
                !post.sharedPost &&
                (isVideoUrl(post.thumbNail) ? (
                  <video
                    src={post.thumbNail}
                    controls
                    preload="metadata"
                    style={{
                      width: "100%",
                      maxHeight: 500,
                      objectFit: "contain",
                      background: "#000",
                      display: "block",
                    }}
                  />
                ) : (
                  <img
                    src={post.thumbNail}
                    alt={post.title}
                    className="post-detail-thumbnail"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ))}

              <div className="post-detail-body" style={{ padding: 24 }}>
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}
                >
                  {/* Tác giả & metadata */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      post.user?.id && navigate(`/profile/${post.user.id}`)
                    }
                    title={`Xem trang cá nhân của ${authorName}`}
                  >
                    {post.user?.avatarUrl ? (
                      <img
                        src={post.user.avatarUrl}
                        alt={authorName}
                        className="avatar avatar-lg"
                        style={{ objectFit: "cover" }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div
                        className="avatar avatar-lg"
                        style={
                          post.user?.avatarColor
                            ? {
                                background: `linear-gradient(135deg, ${post.user.avatarColor}, ${post.user.avatarColor}bb)`,
                              }
                            : {}
                        }
                      >
                        {getInitials(authorName)}
                      </div>
                    )}
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 16,
                          color: "var(--text-primary)",
                        }}
                      >
                        {authorName}
                      </div>
                      {/* Metadata dòng phụ xếp gọn gàng */}
                      <div
                        style={{
                          fontSize: 12.5,
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexWrap: "wrap",
                          marginTop: 2,
                        }}
                      >
                        <span>{timeAgo(post.createdAt)}</span>
                        {post.updatedAt &&
                          post.updatedAt !== post.createdAt && (
                            <span>• Đã chỉnh sửa</span>
                          )}
                        <span>•</span>
                        <span>
                          {post.status === "private"
                            ? "🔒 Riêng tư"
                            : "🌐 Công khai"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ⋯ Menu 3 chấm chuẩn Facebook ở góc phải */}
                  <div
                    ref={menuRef}
                    style={{ position: "relative", zIndex: 50 }}
                  >
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setMenuOpen((v) => !v)}
                      title="Tuỳ chọn bài viết"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        fontWeight: 700,
                        color: "var(--text-secondary)",
                      }}
                    >
                      ···
                    </button>

                    {menuOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "calc(100% + 6px)",
                          right: 0,
                          minWidth: 210,
                          background: "var(--bg-card)",
                          borderRadius: 12,
                          boxShadow:
                            "0 12px 28px rgba(0,0,0,0.18), 0 2px 4px rgba(0,0,0,0.1)",
                          border: "1px solid var(--border-light)",
                          zIndex: 1000,
                          overflow: "hidden",
                          animation: "dropdownFadeIn 0.15s ease",
                        }}
                      >
                        {/* Lưu bài viết */}
                        <button
                          onClick={handleBookmark}
                          style={{
                            width: "100%",
                            padding: "11px 16px",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: 500,
                            color: bookmarked
                              ? "var(--primary)"
                              : "var(--text-primary)",
                            textAlign: "left",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "var(--bg-secondary)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "none")
                          }
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill={bookmarked ? "var(--primary)" : "none"}
                            stroke={
                              bookmarked ? "var(--primary)" : "currentColor"
                            }
                            strokeWidth="2"
                          >
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                          {bookmarked ? "Bỏ lưu bài viết" : "Lưu bài viết"}
                        </button>

                        {/* Copy link */}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            showToast(
                              "Đã sao chép liên kết vào khay nhớ tạm!",
                              "success",
                            );
                            setMenuOpen(false);
                          }}
                          style={{
                            width: "100%",
                            padding: "11px 16px",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: 500,
                            color: "var(--text-primary)",
                            textAlign: "left",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "var(--bg-secondary)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "none")
                          }
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                          Sao chép liên kết
                        </button>

                        {/* Chỉnh sửa & Xóa nếu là chủ bài */}
                        {isOwner && (
                          <>
                            <div
                              style={{
                                height: 1,
                                background: "var(--border-light)",
                                margin: "4px 0",
                              }}
                            />

                            <button
                              onClick={() => {
                                navigate(`/dashboard?edit=${post.id}`);
                                setMenuOpen(false);
                              }}
                              style={{
                                width: "100%",
                                padding: "11px 16px",
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 14,
                                fontWeight: 500,
                                color: "var(--text-primary)",
                                textAlign: "left",
                                transition: "background 0.15s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "var(--bg-secondary)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "none")
                              }
                            >
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                              </svg>
                              Chỉnh sửa bài viết
                            </button>

                            <button
                              onClick={() => {
                                setMenuOpen(false);
                                setShowDeleteConfirm(true);
                              }}
                              style={{
                                width: "100%",
                                padding: "11px 16px",
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 14,
                                fontWeight: 500,
                                color: "var(--danger)",
                                textAlign: "left",
                                transition: "background 0.15s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(255,59,48,0.07)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "none")
                              }
                            >
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
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

                {/* Category badge */}
                {post.category && (
                  <div style={{ marginBottom: 12 }}>
                    <span className="badge">📂 {post.category.name}</span>
                  </div>
                )}

                {/* Thanh công cụ trợ lý AI & Đọc bài viết bằng giọng nói */}
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginBottom: 16,
                  }}
                >
                  <button
                    onClick={handleSummarizeAI}
                    disabled={summaryLoading}
                    className="btn btn-secondary btn-sm"
                    style={{
                      borderRadius: 20,
                      fontWeight: 600,
                      background: "var(--primary-light)",
                      color: "var(--primary)",
                      border: "1px solid var(--primary)",
                    }}
                  >
                    ⚡{" "}
                    {summaryLoading
                      ? "AI đang tóm tắt..."
                      : summaryPoints.length > 0
                        ? "Ẩn tóm tắt AI"
                        : "AI Tóm Tắt Bài Viết"}
                  </button>

                  <button
                    onClick={handleToggleSpeech}
                    className="btn btn-secondary btn-sm"
                    style={{
                      borderRadius: 20,
                      fontWeight: 600,
                      border: isSpeaking
                        ? "1.5px solid #ef4444"
                        : "1px solid var(--border)",
                      color: isSpeaking ? "#ef4444" : "var(--text-primary)",
                    }}
                  >
                    🔊{" "}
                    {isSpeaking ? "Dừng đọc giọng nói" : "Đọc bằng giọng nói"}
                  </button>
                </div>

                {/* Khung hiển thị Tóm tắt AI */}
                {summaryPoints.length > 0 && (
                  <div
                    style={{
                      background: "var(--primary-light)",
                      border: "1.5px solid var(--primary)",
                      borderRadius: 14,
                      padding: 16,
                      marginBottom: 20,
                      animation: "fadeIn 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: "var(--primary)",
                        fontSize: 14,
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>⚡ Tóm tắt thông minh bởi AI Assistant:</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        fontSize: 13.5,
                        color: "var(--text-primary)",
                      }}
                    >
                      {summaryPoints.map((pt, idx) => (
                        <div key={idx}>{pt}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Body */}
                {post.sharedPost ? (
                  /* GIAO DIỆN BÀI VIẾT CHIA SẺ CHUẨN FACEBOOK */
                  <div style={{ marginTop: 10 }}>
                    {post.content && (
                      <p
                        style={{
                          fontSize: 16,
                          color: "var(--text-primary)",
                          marginBottom: 16,
                          lineHeight: 1.5,
                        }}
                      >
                        {post.content}
                      </p>
                    )}

                    <div
                      onClick={() => navigate(`/posts/${post.sharedPost.id}`)}
                      style={{
                        border: "1px solid var(--border-light)",
                        borderRadius: 12,
                        padding: 20,
                        background: "var(--bg-input)",
                        cursor: "pointer",
                        transition: "background 0.2s",
                        position: "relative",
                        overflow: "hidden",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--bg-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "var(--bg-input)")
                      }
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          marginBottom: 14,
                        }}
                      >
                        {post.sharedPost.user?.avatarUrl ? (
                          <img
                            src={post.sharedPost.user.avatarUrl}
                            alt={
                              post.sharedPost.user?.fullName ||
                              post.sharedPost.user?.username
                            }
                            className="avatar avatar-md"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            className="avatar avatar-md"
                            style={
                              post.sharedPost.user?.avatarColor
                                ? {
                                    background: `linear-gradient(135deg, ${post.sharedPost.user.avatarColor}, ${post.sharedPost.user.avatarColor}bb)`,
                                  }
                                : {}
                            }
                          >
                            {getInitials(
                              post.sharedPost.user?.fullName ||
                                post.sharedPost.user?.username ||
                                "?",
                            )}
                          </div>
                        )}
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 14,
                              color: "var(--text-primary)",
                            }}
                          >
                            {post.sharedPost.user?.fullName ||
                              post.sharedPost.user?.username ||
                              "Ẩn danh"}
                          </div>
                          <div
                            style={{
                              fontSize: 11.5,
                              color: "var(--text-muted)",
                              marginTop: 2,
                            }}
                          >
                            {timeAgo(post.sharedPost.createdAt)}
                          </div>
                        </div>
                      </div>

                      {post.sharedPost.bgColor ? (
                        <div
                          style={{
                            background: post.sharedPost.bgColor,
                            borderRadius: 12,
                            padding: "36px 24px",
                            minHeight: 160,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          }}
                        >
                          <p
                            style={{
                              color: "#fff",
                              textAlign: "center",
                              fontSize:
                                post.sharedPost.content?.length < 80 ? 20 : 16,
                              fontWeight: 700,
                              lineHeight: 1.5,
                              margin: 0,
                              textShadow: "0 1px 4px rgba(0,0,0,0.25)",
                            }}
                          >
                            {post.sharedPost.content}
                          </p>
                        </div>
                      ) : (
                        <>
                          {post.sharedPost.thumbNail && (
                            <img
                              src={post.sharedPost.thumbNail}
                              alt={post.sharedPost.title}
                              style={{
                                width: "100%",
                                maxHeight: 300,
                                objectFit: "cover",
                                borderRadius: 8,
                                marginBottom: 12,
                              }}
                            />
                          )}
                          <h3
                            style={{
                              fontSize: 17,
                              fontWeight: 700,
                              marginBottom: 8,
                              color: "var(--text-primary)",
                            }}
                          >
                            {post.sharedPost.title}
                          </h3>
                          <p
                            style={{
                              fontSize: 14.5,
                              color: "var(--text-secondary)",
                              lineHeight: 1.45,
                            }}
                          >
                            {post.sharedPost.content}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ) : post.bgColor ? (
                  <div
                    style={{
                      background: post.bgColor,
                      borderRadius: 16,
                      padding: "48px 24px",
                      minHeight: 240,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 20,
                      boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                    }}
                  >
                    <p
                      style={{
                        color: "rgba(255,255,255,0.98)",
                        textAlign: "center",
                        fontSize: post.content?.length < 80 ? 28 : 20,
                        fontWeight: 700,
                        lineHeight: 1.55,
                        textShadow: "0 2px 6px rgba(0,0,0,0.3)",
                        margin: 0,
                      }}
                    >
                      {post.content}
                    </p>
                  </div>
                ) : (
                  <>
                    <h1
                      className="post-detail-title"
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        marginBottom: 12,
                      }}
                    >
                      {post.title}
                    </h1>
                    <div
                      className="post-detail-content"
                      style={{
                        fontSize: 15.5,
                        lineHeight: 1.6,
                        color: "var(--text-primary)",
                      }}
                    >
                      {post.content}
                    </div>
                  </>
                )}

                {/* Thống kê Cảm xúc & Bình luận (Stats Bar) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 0 8px 0",
                    marginTop: 20,
                    fontSize: 13,
                    color: "var(--text-muted)",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    {likeCount > 0 && (
                      <>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginLeft: 2,
                          }}
                        >
                          {topReactions.map((r, idx) => (
                            <span
                              key={r.type}
                              style={{
                                fontSize: 14,
                                marginLeft: idx > 0 ? -5 : 0,
                                zIndex: 5 - idx,
                                display: "inline-block",
                              }}
                            >
                              {r.emoji}
                            </span>
                          ))}
                        </div>
                        <span
                          style={{
                            fontWeight: 600,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {likeCount}
                        </span>
                      </>
                    )}
                  </div>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <span
                      onClick={scrollToComments}
                      style={{ cursor: "pointer", transition: "color 0.2s" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.textDecoration = "underline")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.textDecoration = "none")
                      }
                    >
                      {comments.length} bình luận
                    </span>
                  </div>
                </div>

                {/* Thanh 3 Nút Hành Động Chuẩn Facebook (Thích, Bình luận, Chia sẻ) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderTop: "1px solid var(--border-light)",
                    paddingTop: 4,
                    marginTop: 4,
                    position: "relative",
                  }}
                >
                  {/* Floating Reaction Picker popover */}
                  {showReactionsPicker && (
                    <div
                      onMouseEnter={handleMouseEnterLike}
                      onMouseLeave={handleMouseLeaveLike}
                      style={{
                        position: "absolute",
                        bottom: "calc(100% + 4px)",
                        left: 12,
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-light)",
                        borderRadius: 30,
                        boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
                        padding: "6px 10px",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        zIndex: 200,
                        animation:
                          "reactionPopIn 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                      }}
                    >
                      {REACTIONS.map((r) => (
                        <button
                          key={r.type}
                          type="button"
                          title={r.label}
                          onClick={() => handleSelectReaction(r.type)}
                          style={{
                            background: "none",
                            border: "none",
                            fontSize: 24,
                            cursor: "pointer",
                            padding: "2px 4px",
                            borderRadius: "50%",
                            transition: "transform 0.15s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.transform =
                              "scale(1.35) translateY(-6px)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.transform =
                              "scale(1) translateY(0)")
                          }
                        >
                          {r.emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Nút 1: Thích */}
                  <div
                    onMouseEnter={handleMouseEnterLike}
                    onMouseLeave={handleMouseLeaveLike}
                    style={{ flex: 1, display: "flex" }}
                  >
                    <button
                      className={`post-action-btn ${liked ? "liked" : ""}`}
                      onTouchStart={handleTouchStartLike}
                      onTouchEnd={handleTouchEndLike}
                      onClick={handleToggleLike}
                      style={{
                        width: "100%",
                        color: activeReactionObj
                          ? activeReactionObj.color
                          : "inherit",
                        fontWeight: liked ? "700" : "500",
                        gap: 6,
                        touchAction: "manipulation",
                      }}
                    >
                      {activeReactionObj ? (
                        <span style={{ fontSize: 18, lineHeight: 1 }}>
                          {activeReactionObj.emoji}
                        </span>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                        </svg>
                      )}
                      {activeReactionObj ? activeReactionObj.label : "Thích"}
                    </button>
                  </div>

                  {/* Nút 2: Bình luận */}
                  <div style={{ flex: 1, display: "flex" }}>
                    <button
                      className="post-action-btn"
                      onClick={scrollToComments}
                      style={{ width: "100%", gap: 6 }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Bình luận
                    </button>
                  </div>

                  {/* Nút 3: Chia sẻ */}
                  <div style={{ flex: 1, display: "flex" }}>
                    <button
                      className="post-action-btn"
                      onClick={() => setIsShareModalOpen(true)}
                      style={{ width: "100%", gap: 6 }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                      Chia sẻ
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Toast Notification */}
            {toast.show && (
              <div className={`custom-toast ${toast.type}`}>
                <span>
                  {toast.type === "success"
                    ? "✓"
                    : toast.type === "error"
                      ? "❌"
                      : "ℹ️"}
                </span>
                <span>{toast.message}</span>
              </div>
            )}

            {/* Comment Section với Ref */}
            <div ref={commentSectionRef}>
              <CommentSection
                postId={parseInt(id)}
                comments={comments}
                onCommentsChange={setComments}
              />
            </div>
          </div>
          <ShareModal
            post={post}
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            onToast={showToast}
          />
        </div>
      </div>

      {/* Modern Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Xóa bài viết?"
        message="Bạn có chắc chắn muốn xóa bài viết này? Bài viết sau khi xóa sẽ không thể phục hồi."
        confirmText="Xóa bài viết"
        confirmVariant="danger"
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDeletePost}
      />
    </>
  );
}

export default PostDetail;
