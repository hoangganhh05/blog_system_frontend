import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Heart, MessageCircle, Share2, MoreHorizontal, Play,
  Volume2, VolumeX, Maximize2, Minimize2, X, Loader2,
  Video, Send, Plus, Trash2, Home, LayoutGrid, ChevronUp, ChevronDown, Bookmark, Smile,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import Avatar from "./Avatar";
import Comment from "./Comment";
import ShareModal from "./ShareModal";
import ShortVideoUpload from "./ShortVideoUpload";
import postService from "../services/postService";
import likeService from "../services/likeService";
import commentService from "../services/commentService";
import followService from "../services/followService";
import { isVideoUrl } from "../utils/mediaUtils";

export default function ShortVideoFeed() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false); // Default sound ON
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [qualitySetting, setQualitySetting] = useState("Auto");
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [shareVideo, setShareVideo] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [commentsFor, setCommentsFor] = useState(null);
  const [commentList, setCommentList] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [progressMap, setProgressMap] = useState({});
  const [expandedCaptions, setExpandedCaptions] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [followMap, setFollowMap] = useState({});
  const [playingMap, setPlayingMap] = useState({});
  const [viewedSet, setViewedSet] = useState(new Set());

  const videoRefs = useRef([]);
  const itemRefs = useRef([]);
  const containerRef = useRef(null);
  const lastTapRef = useRef(0);
  const currentIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const touchState = useRef({ startY: 0, startX: 0, startTime: 0, isVertical: false });
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [hasError, setHasError] = useState(false);

  const fetchVideoPosts = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    try {
      const res = await postService.getAll(0, 50);
      const allPosts = res.data?.content || res.data || [];
      const videoPosts = allPosts
        .filter((post) =>
          post.mediaType === "video" ||
          post.videoUrl ||
          (post.thumbNail && isVideoUrl(post.thumbNail)) ||
          (Array.isArray(post.imageUrls) && post.imageUrls.some(isVideoUrl))
        )
        .map((post) => ({
          id: post.id,
          url: post.videoUrl || post.thumbNail || post.imageUrls?.[0] || "",
          author: {
            id: post.user?.id || post.userId,
            username: post.user?.username,
            fullName: post.user?.fullName || post.user?.username,
            avatarUrl: post.user?.avatarUrl,
            avatarColor: post.user?.avatarColor,
          },
          description: post.content || post.title || "",
          likes: post.likesCount || 0,
          comments: post.commentsCount || 0,
          shares: post.sharesCount || 0,
          isLiked: post.likedByMe || false,
        }));
      setVideos(videoPosts);

      videoPosts.forEach((v) => {
        likeService
          .checkLiked(v.id)
          .then((r) => {
            setVideos((prev) =>
              prev.map((item) =>
                item.id === v.id
                  ? {
                      ...item,
                      isLiked: !!r.data?.liked,
                      likes: typeof r.data?.count === "number" ? r.data.count : item.likes,
                    }
                  : item
              )
            );
          })
          .catch(() => {});
      });
    } catch {
      setHasError(true);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVideoPosts(); }, [fetchVideoPosts]);

  useEffect(() => {
    const onRefresh = () => fetchVideoPosts();
    window.addEventListener("shorts_refresh", onRefresh);
    return () => window.removeEventListener("shorts_refresh", onRefresh);
  }, [fetchVideoPosts]);

  // Active Video Playback Controller
  useEffect(() => {
    videoRefs.current.forEach((v, index) => {
      if (!v) return;
      v.muted = isMuted;
      v.playbackRate = playbackSpeed;
      if (index === currentVideoIndex) {
        v.play().then(() => {
          setPlayingMap((prev) => ({ ...prev, [index]: true }));
        }).catch(() => {
          // If browser blocks unmuted autoplay, mute as fallback
          if (!isMuted) {
            v.muted = true;
            v.play().then(() => {
              setPlayingMap((prev) => ({ ...prev, [index]: true }));
            }).catch(() => {});
          }
        });
      } else {
        v.pause();
        v.currentTime = 0;
        setPlayingMap((prev) => ({ ...prev, [index]: false }));
      }
    });
  }, [currentVideoIndex, isMuted, playbackSpeed, videos]);

  useEffect(() => {
    if (videos.length === 0) return;
    const cv = videos[currentVideoIndex];
    if (!cv?.author?.id) return;
    const authorId = Number(cv.author.id);
    if (authorId === Number(currentUser?.id)) return;
    if (followMap[authorId] !== undefined) return;
    followService
      .checkFollowStatus(authorId)
      .then((r) => { setFollowMap((prev) => ({ ...prev, [authorId]: !!r.data?.isFollowing })); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideoIndex, videos]);

  useEffect(() => {
    if (videos.length === 0) return;
    const cv = videos[currentVideoIndex];
    if (!cv?.id || viewedSet.has(cv.id)) return;
    setViewedSet((prev) => new Set(prev).add(cv.id));
    postService.incrementViewCount(cv.id).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideoIndex, videos]);

  useEffect(() => { currentIndexRef.current = currentVideoIndex; }, [currentVideoIndex]);

  const handleLike = async (videoId) => {
    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? { ...v, likes: v.isLiked ? v.likes - 1 : v.likes + 1, isLiked: !v.isLiked }
          : v
      )
    );
    try {
      const r = await likeService.toggleLike(videoId);
      const liked = !!r.data?.liked;
      const count = typeof r.data?.count === "number" ? r.data.count : null;
      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId
            ? { ...v, isLiked: liked, likes: count != null ? count : v.likes }
            : v
        )
      );
    } catch {
      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId
            ? { ...v, likes: v.isLiked ? v.likes + 1 : v.likes - 1, isLiked: !v.isLiked }
            : v
        )
      );
      toast.error("Không thể thích video. Vui lòng thử lại!");
    }
  };

  const handleFollow = async (authorId) => {
    const wasFollowing = !!followMap[authorId];
    setFollowMap((prev) => ({ ...prev, [authorId]: !wasFollowing }));
    try {
      if (wasFollowing) {
        await followService.unfollowUser(authorId);
        toast.success("Đã hủy theo dõi");
      } else {
        await followService.followUser(authorId);
        toast.success("Đã theo dõi");
      }
    } catch {
      setFollowMap((prev) => ({ ...prev, [authorId]: wasFollowing }));
      toast.error("Không thể cập nhật theo dõi. Vui lòng thử lại!");
    }
  };

  const handleVideoClick = (e, index) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      e.stopPropagation();
      handleLike(videos[index].id);
    } else {
      togglePlay(e, index);
    }
    lastTapRef.current = now;
  };

  const handleShare = (video) => {
    if (!video?.id) return;
    setShareVideo({
      id: video.id,
      user: video.author || {},
      content: video.description || "",
      body: video.description || "",
      title: video.description || "",
      thumbNail: video.url,
      sharedPost: null,
      isShort: true,
    });
  };

  const handleComment = (videoId) => {
    if (showComments && commentsFor === videoId) {
      setShowComments(false);
      setCommentsFor(null);
      return;
    }
    setShowComments(true);
    setCommentsFor(videoId);
    setCommentLoading(true);
    setCommentList([]);
    setCommentText("");
    commentService
      .getByPostId(videoId)
      .then((r) => {
        const list = r.data || [];
        setCommentList(Array.isArray(list) ? list : []);
      })
      .catch(() => setCommentList([]))
      .finally(() => setCommentLoading(false));
  };

  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);

  const currentVideo = videos[currentVideoIndex];

  // Reset comments view on video swipe
  useEffect(() => {
    setShowComments(false);
    setCommentsFor(null);
    setCommentList([]);
    setCommentText("");
  }, [currentVideoIndex]);

  const handleCommentTextChange = async (e) => {
    const val = e.target.value;
    setCommentText(val);

    const lastAt = val.lastIndexOf("@");
    if (lastAt !== -1 && lastAt >= val.length - 15) {
      const keyword = val.slice(lastAt + 1).trim();
      if (!keyword.includes(" ")) {
        try {
          const res = await commentService.getMentionSuggestions(keyword);
          setMentionSuggestions(res.data || []);
          setShowMentionDropdown(true);
          return;
        } catch {
          // ignore mention error
        }
      }
    }
    setShowMentionDropdown(false);
  };

  const selectMentionUser = (username) => {
    const lastAt = commentText.lastIndexOf("@");
    if (lastAt !== -1) {
      const newText = commentText.slice(0, lastAt) + `@${username} `;
      setCommentText(newText);
    }
    setShowMentionDropdown(false);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !commentsFor || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const r = await commentService.create({ content: commentText.trim(), post: { id: commentsFor } });
      setCommentList((prev) => [r.data, ...prev]);
      setCommentText("");
      setVideos((prev) =>
        prev.map((v) => v.id === commentsFor ? { ...v, comments: v.comments + 1 } : v)
      );
      toast.success("Đã đăng bình luận!");
    } catch {
      toast.error("Không thể gửi bình luận. Vui lòng thử lại!");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const closeComments = () => {
    setShowComments(false);
    setCommentsFor(null);
    setCommentList([]);
    setCommentText("");
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentService.delete(commentId);
      setCommentList((prev) => prev.filter((c) => c.id !== commentId));
      setVideos((prev) =>
        prev.map((v) => v.id === commentsFor ? { ...v, comments: Math.max(0, v.comments - 1) } : v)
      );
      toast.success("Đã xóa bình luận!");
    } catch {
      toast.error("Không thể xóa bình luận. Vui lòng thử lại!");
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted((prev) => {
      const next = !prev;
      videoRefs.current.forEach((v) => { if (v) v.muted = next; });
      return next;
    });
  };

  const togglePlay = (e, index) => {
    e.stopPropagation();
    const v = videoRefs.current[index];
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlayingMap((prev) => ({ ...prev, [index]: true }));
    } else {
      v.pause();
      setPlayingMap((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleTimeUpdate = (e, index) => {
    const v = e.currentTarget;
    if (!v) return;
    setProgressMap((prev) => ({ ...prev, [index]: { current: v.currentTime || 0, duration: v.duration || 0 } }));
  };

  const handleSeek = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const v = videoRefs.current[index];
    if (v && v.duration) v.currentTime = ratio * v.duration;
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) { document.exitFullscreen(); setIsFullscreen(false); }
    else { document.documentElement.requestFullscreen?.(); setIsFullscreen(true); }
  };

  const toggleCaption = (index) => setExpandedCaptions((prev) => ({ ...prev, [index]: !prev[index] }));

  const scrollToVideo = useCallback((targetIndex) => {
    const container = containerRef.current;
    if (!container || videos.length === 0) return;
    const clampedIndex = Math.max(0, Math.min(videos.length - 1, targetIndex));
    if (clampedIndex === currentIndexRef.current && isAnimatingRef.current) return;
    
    isAnimatingRef.current = true;
    const targetElement = itemRefs.current[clampedIndex];
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setCurrentVideoIndex(clampedIndex);
    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 400);
  }, [videos.length]);

  const handleTouchStart = (e) => {
    touchState.current = {
      startY: e.touches[0].clientY,
      startX: e.touches[0].clientX,
      startTime: Date.now(),
      isVertical: false,
    };
  };

  const handleTouchMove = (e) => {
    const { startY, startX } = touchState.current;
    const deltaY = Math.abs(e.touches[0].clientY - startY);
    const deltaX = Math.abs(e.touches[0].clientX - startX);
    if (!touchState.current.isVertical && deltaY > deltaX && deltaY > 10) {
      touchState.current.isVertical = true;
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchState.current.isVertical || isAnimatingRef.current) return;
    const { startY, startTime } = touchState.current;
    const deltaY = startY - e.changedTouches[0].clientY;
    const deltaTime = Date.now() - startTime;
    if (Math.abs(deltaY) > 40 && deltaTime < 600) {
      const direction = deltaY > 0 ? 1 : -1;
      const newIndex = currentIndexRef.current + direction;
      scrollToVideo(newIndex);
    }
    touchState.current.isVertical = false;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let wheelTimeout = null;
    const handleWheel = (e) => {
      e.preventDefault();
      if (isAnimatingRef.current) return;
      if (Math.abs(e.deltaY) > 20) {
        const direction = e.deltaY > 0 ? 1 : -1;
        scrollToVideo(currentIndexRef.current + direction);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      if (wheelTimeout) clearTimeout(wheelTimeout);
    };
  }, [scrollToVideo]);

  const formatCount = (n) => {
    if (n == null) return "0";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
  };

  const formatTime = (sec) => {
    if (!sec || !isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const relativeTime = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "vừa xong";
    if (m < 60) return `${m}p`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  const isCommentOpen = showComments && commentsFor !== null;

  return (
    <div className="w-full flex-1 flex flex-col md:flex-row items-center md:items-stretch justify-center gap-3 transition-all duration-300 overflow-hidden">
      {/* 1. VIDEO BOX: 70% width when comment open, 100% width when comment closed */}
      <div className={`flex-1 ${isCommentOpen ? "md:flex-[7] md:w-7/12" : "md:flex-1 md:w-full"} flex items-center justify-center p-1 transition-all duration-300 min-w-0 relative group/videobox`}>
        {/* Dedicated Up / Down Navigation Arrow Controls */}
        <div className="hidden md:flex flex-col gap-3 absolute left-4 z-40">
          <button
            onClick={() => scrollToVideo(currentVideoIndex - 1)}
            disabled={currentVideoIndex === 0}
            className="w-10 h-10 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 backdrop-blur-md text-zinc-700 dark:text-zinc-200 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-md cursor-pointer"
            title="Video trước"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={() => scrollToVideo(currentVideoIndex + 1)}
            disabled={currentVideoIndex >= videos.length - 1}
            className="w-10 h-10 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 backdrop-blur-md text-zinc-700 dark:text-zinc-200 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-md cursor-pointer"
            title="Video kế tiếp"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Shorts Video: Dynamically scaled based on available viewport height & 9/16 aspect ratio */}
        <div
          className="relative bg-black rounded-2xl md:rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-zinc-800 shrink-0 transition-all duration-300"
          style={{
            height: "min(calc(100vh - 5rem), 760px)",
            maxHeight: "100%",
            maxWidth: "100%",
            aspectRatio: "9 / 16",
            width: "auto",
          }}
        >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
          <div className="flex items-center gap-2.5 pointer-events-auto">
            <button
              onClick={() => navigate("/")}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-xl ring-1 ring-white/20 text-white flex items-center justify-center hover:bg-black/60 active:scale-90 transition-all shadow-md cursor-pointer"
              title="Quay lại"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon Âm thanh cạnh nút X */}
            <button
              onClick={toggleMute}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-xl ring-1 ring-white/20 text-white flex items-center justify-center hover:bg-black/60 active:scale-90 transition-all shadow-md cursor-pointer"
              title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>

            <div className="flex items-center gap-1.5 ml-1">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-indigo-500 shadow" />
              <h1 className="text-white font-bold text-base tracking-tight drop-shadow">Shorts</h1>
            </div>
          </div>

          {/* Nút "..." bên phải header */}
          <div className="flex items-center gap-2 pointer-events-auto relative">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className={`w-9 h-9 rounded-full backdrop-blur-xl ring-1 transition-all active:scale-90 flex items-center justify-center shadow-md cursor-pointer ${
                showSettingsMenu
                  ? "bg-white text-black ring-white"
                  : "bg-black/40 ring-white/20 text-white hover:bg-black/60"
              }`}
              title="Tùy chỉnh Shorts"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Desktop Popover Menu (MD trở lên) */}
            {showSettingsMenu && (
              <div className="hidden md:block absolute right-0 top-11 w-64 bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 rounded-2xl shadow-2xl p-2.5 z-50 text-white animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[11px] font-bold text-zinc-400 px-2 py-1 uppercase tracking-wider">Cài đặt phát video</div>
                
                {/* Tự động chuyển video */}
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/10 transition cursor-pointer" onClick={() => setAutoPlayNext(!autoPlayNext)}>
                  <span className="text-xs font-medium">Tự động chuyển video</span>
                  <div className={`w-8 h-4.5 rounded-full transition-colors relative ${autoPlayNext ? "bg-emerald-500" : "bg-zinc-700"}`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${autoPlayNext ? "right-0.5" : "left-0.5"}`} />
                  </div>
                </div>

                {/* Tốc độ phát */}
                <div className="mt-2 pt-2 border-t border-zinc-800">
                  <div className="text-[11px] font-bold text-zinc-400 px-2 mb-1.5">Tốc độ phát</div>
                  <div className="grid grid-cols-4 gap-1">
                    {[0.5, 1, 1.5, 2].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          playbackSpeed === speed ? "bg-white text-black" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        }`}
                      >
                        {speed === 1 ? "Chuẩn" : `${speed}x`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chất lượng */}
                <div className="mt-2 pt-2 border-t border-zinc-800">
                  <div className="text-[11px] font-bold text-zinc-400 px-2 mb-1.5">Chất lượng video</div>
                  <div className="grid grid-cols-3 gap-1">
                    {["Auto", "360p", "480p", "720p", "1080p"].map((q) => (
                      <button
                        key={q}
                        onClick={() => setQualitySetting(q)}
                        className={`py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                          qualitySetting === q ? "bg-[#0866ff] text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Báo cáo */}
                <div className="mt-2 pt-2 border-t border-zinc-800">
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      setShowReportModal(true);
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-rose-400 hover:bg-rose-500/20 rounded-xl transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>🚩</span>
                    <span>Báo cáo video này</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video Feed Container */}
        <div
          ref={containerRef}
          className="w-full flex-1 overflow-y-hidden select-none"
          style={{ touchAction: "pan-y" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
                <span className="text-white/60 text-sm">Đang tải video...</span>
              </div>
            </div>
          ) : hasError ? (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <div className="flex flex-col items-center gap-5 text-center px-8">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                  <Video className="w-10 h-10 text-white/50" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl mb-2">Không thể tải video</h3>
                  <p className="text-white/55 text-sm">Có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại!</p>
                </div>
                <button
                  onClick={fetchVideoPosts}
                  className="px-8 py-3.5 bg-white text-black font-bold rounded-full text-sm hover:bg-white/90 active:scale-95 transition-all shadow-lg"
                >
                  Thử lại
                </button>
              </div>
            </div>
          ) : videos.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <div className="flex flex-col items-center gap-5 text-center px-8">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                  <Video className="w-10 h-10 text-white/50" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl mb-2">Chưa có video nào</h3>
                  <p className="text-white/55 text-sm">Hãy là người đầu tiên đăng tải video ngắn!</p>
                </div>
                <button
                  onClick={() => setShowUpload(true)}
                  className="px-8 py-3.5 bg-white text-black font-bold rounded-full text-sm hover:bg-white/90 active:scale-95 transition-all shadow-lg"
                >
                  Đăng video ngay
                </button>
              </div>
            </div>
          ) : (
            videos.map((video, index) => {
              const isPlaying = index === currentVideoIndex && !!playingMap[index];
              const authorId = Number(video.author?.id);
              const isOwnVideo = authorId === Number(currentUser?.id);
              const isFollowing = !!followMap[authorId];
              const prog = progressMap[index];

              return (
                <div
                  key={video.id}
                  ref={(el) => (itemRefs.current[index] = el)}
                  className="relative w-full h-full shrink-0 overflow-hidden bg-black flex items-center justify-center"
                >
                  <video
                    ref={(el) => (videoRefs.current[index] = el)}
                    src={video.url}
                    className="absolute inset-0 w-full h-full object-contain object-center"
                    loop={!autoPlayNext}
                    playsInline
                    onClick={(e) => handleVideoClick(e, index)}
                    onTimeUpdate={(e) => handleTimeUpdate(e, index)}
                    onEnded={() => {
                      if (autoPlayNext && index < videos.length - 1) {
                        scrollToIndex(index + 1);
                      }
                    }}
                    onPlay={() => setPlayingMap((prev) => ({ ...prev, [index]: true }))}
                    onPause={() => setPlayingMap((prev) => ({ ...prev, [index]: false }))}
                  />

                  {/* Gradient overlays */}
                  <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/65 to-transparent pointer-events-none z-[5]" />
                  <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none z-[5]" />

                  {/* Pause indicator */}
                  {!isPlaying && index === currentVideoIndex && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[10]">
                      <div className="w-16 h-16 rounded-full bg-black/45 backdrop-blur-xl ring-1 ring-white/15 flex items-center justify-center">
                        <Play className="w-8 h-8 text-white fill-white ml-1 drop-shadow-lg" />
                      </div>
                    </div>
                  )}



                  {/* TikTok Style Sleek Vertical Action Column */}
                  <div className="absolute right-3.5 bottom-[4.2rem] flex flex-col items-center gap-3 z-30 pointer-events-auto">
                    {/* Author Avatar with Follow Overlay Badge */}
                    <div className="relative mb-0.5">
                      <button onClick={() => navigate(`/profile/${video.author.id}`)} className="block shrink-0 ring-2 ring-white/80 rounded-full shadow-md">
                        <Avatar
                          userId={video.author.id}
                          src={video.author.avatarUrl}
                          name={video.author.fullName}
                          username={video.author.username}
                          avatarColor={video.author.avatarColor}
                          size="sm"
                        />
                      </button>
                      {!isOwnVideo && (
                        <button
                          onClick={() => handleFollow(video.author.id)}
                          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold transition-all shadow-md active:scale-90 ${isFollowing ? "bg-emerald-500" : "bg-rose-500 hover:bg-rose-600"}`}
                          title={isFollowing ? "Đang theo dõi" : "Theo dõi"}
                        >
                          {isFollowing ? "✓" : "+"}
                        </button>
                      )}
                    </div>

                    {/* Like Action */}
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        onClick={() => handleLike(video.id)}
                        className={`w-9 h-9 rounded-full backdrop-blur-md ring-1 transition-all active:scale-90 flex items-center justify-center shadow-md ${video.isLiked ? "bg-rose-500/90 ring-rose-400/40 scale-105" : "bg-black/35 ring-white/20 hover:bg-black/60"}`}
                        title="Thích"
                      >
                        <Heart className={`w-4 h-4 transition-all ${video.isLiked ? "text-white fill-white" : "text-white"}`} />
                      </button>
                      <span className="text-white text-[11px] font-bold drop-shadow">{formatCount(video.likes)}</span>
                    </div>

                    {/* Comment Action */}
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        onClick={() => handleComment(video.id)}
                        className={`w-9 h-9 rounded-full backdrop-blur-md ring-1 transition-all active:scale-90 flex items-center justify-center shadow-md ${showComments && commentsFor === video.id ? "bg-[#0866ff]/90 ring-[#0866ff]/40 scale-105" : "bg-black/35 ring-white/20 hover:bg-black/60"}`}
                        title="Bình luận"
                      >
                        <MessageCircle className="w-4 h-4 text-white" />
                      </button>
                      <span className="text-white text-[11px] font-bold drop-shadow">{formatCount(video.comments)}</span>
                    </div>

                    {/* Share Action */}
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        onClick={() => handleShare(video)}
                        className="w-9 h-9 rounded-full bg-black/35 backdrop-blur-md ring-1 ring-white/20 flex items-center justify-center hover:bg-black/60 active:scale-90 transition-all shadow-md"
                        title="Chia sẻ"
                      >
                        <Share2 className="w-4 h-4 text-white" />
                      </button>
                      <span className="text-white text-[11px] font-bold drop-shadow">{formatCount(video.shares)}</span>
                    </div>

                    {/* Bookmark / More Action */}
                    <button
                      className="w-9 h-9 rounded-full bg-black/35 backdrop-blur-md ring-1 ring-white/20 flex items-center justify-center hover:bg-black/60 active:scale-90 transition-all shadow-md"
                      title="Thêm"
                    >
                      <MoreHorizontal className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* Bottom Video Info Overlay (Username, Caption, Hashtags, Audio) */}
                  <div className="absolute left-3.5 right-[4.5rem] bottom-[3.2rem] z-30 flex flex-col gap-2 pointer-events-auto">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => navigate(`/profile/${video.author.id}`)}
                        className="text-white font-bold text-sm tracking-tight hover:underline truncate max-w-[150px]"
                      >
                        @{video.author.username}
                      </button>
                    </div>

                    {video.description && (
                      <div className="flex flex-col gap-0.5">
                        <p className={`text-white/95 text-[13px] leading-relaxed drop-shadow-sm ${expandedCaptions[index] ? "" : "line-clamp-2"}`}>
                          {video.description}
                        </p>
                        {video.description.length > 90 && (
                          <button onClick={() => toggleCaption(index)} className="text-white/60 text-xs font-semibold hover:text-white transition text-left">
                            {expandedCaptions[index] ? "Thu gọn" : "Xem thêm"}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-white/80 text-xs font-medium">
                      <div className="w-4 h-4 shrink-0 rounded-full bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-indigo-500 shadow animate-spin" style={{ animationDuration: "3s" }} />
                      <span className="truncate">Am thanh goc — {video.author.fullName || video.author.username}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="absolute inset-x-0 bottom-0 z-30 px-3.5 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={toggleFullscreen}
                        className="shrink-0 w-8 h-8 rounded-full bg-black/40 backdrop-blur-xl ring-1 ring-white/15 flex items-center justify-center hover:bg-black/60 active:scale-90 transition-all"
                        title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                      >
                        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-white" /> : <Maximize2 className="w-3.5 h-3.5 text-white" />}
                      </button>
                      <div className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden cursor-pointer group" onClick={(e) => handleSeek(e, index)}>
                        <div
                          className="h-full rounded-full bg-white/90 group-hover:bg-white transition-[width] duration-100"
                          style={{ width: `${prog?.duration ? (prog.current / prog.duration) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-white/60 text-[10px] font-semibold tabular-nums">
                        {prog?.duration ? `${formatTime(prog.current)} / ${formatTime(prog.duration)}` : "0:00"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      </div>

      {/* 2. COMMENT BOX: ~30% width (flex-[3]) when open */}
      {isCommentOpen && (
        <div className="hidden md:flex flex-col md:flex-[3] md:w-5/12 max-w-[420px] w-full shrink-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl md:rounded-3xl shadow-xl overflow-hidden animate-in slide-in-from-right duration-200" style={{ height: "min(calc(100vh - 5rem), 740px)" }}>
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#0866ff]" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Bình luận</h3>
              <span className="text-xs font-semibold text-zinc-400">
                ({currentVideo ? formatCount(currentVideo.comments) : 0})
              </span>
            </div>
            <button
              onClick={closeComments}
              className="w-7 h-7 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              title="Đóng bình luận"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 space-y-2 custom-scrollbar">
            {commentLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-zinc-300" /></div>
            ) : commentList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                  <MessageCircle className="w-6 h-6 text-zinc-400" />
                </div>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Chưa có bình luận nào</p>
                <p className="text-[11px] text-zinc-400 mt-1">Hãy là người đầu tiên thảo luận!</p>
              </div>
            ) : (
              commentList.map((c) => (
                <Comment
                  key={c.id}
                  comment={c}
                  onDelete={handleDeleteComment}
                  onUpdate={() => handleComment(currentVideo.id)}
                  onReplyCreated={() => handleComment(currentVideo.id)}
                />
              ))
            )}
          </div>

          <form
            onSubmit={handleSubmitComment}
            className="shrink-0 p-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2 bg-white dark:bg-zinc-900"
          >
            {showMentionDropdown && mentionSuggestions.length > 0 && (
              <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg p-1 max-h-36 overflow-y-auto">
                {mentionSuggestions.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selectMentionUser(u.username)}
                    className="flex items-center gap-2 w-full p-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg text-xs"
                  >
                    <Avatar userId={u.id} src={u.avatarUrl} name={u.fullName || u.username} size="xs" />
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">@{u.username}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Avatar
                userId={currentUser?.id}
                src={currentUser?.avatarUrl}
                name={currentUser?.fullName || currentUser?.username}
                username={currentUser?.username}
                avatarColor={currentUser?.avatarColor}
                size="sm"
                className="border border-zinc-200 dark:border-zinc-700 shrink-0"
              />
              <input
                type="text"
                value={commentText}
                onChange={handleCommentTextChange}
                placeholder="Viết bình luận (@bạn_bè)..."
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0866ff]/30"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmittingComment}
                className="shrink-0 w-8 h-8 rounded-full bg-[#0866ff] text-white hover:bg-[#0756d6] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center"
              >
                {isSubmittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Modal/Drawer for Comments */}
      {showComments && commentsFor !== null && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-50 bg-transparent md:hidden" onClick={closeComments} />
          <div className="fixed inset-x-0 bottom-0 z-50 h-[70dvh] bg-white dark:bg-zinc-900 rounded-t-3xl border-t border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col md:hidden animate-in slide-in-from-bottom duration-250">
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Bình luận</h3>
              <button onClick={closeComments} className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3.5">
              {commentLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-zinc-300" /></div>
              ) : commentList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                    <MessageCircle className="w-6 h-6 text-zinc-400" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Chưa có bình luận nào</p>
                  <p className="text-xs text-zinc-400 mt-1">Hãy là người đầu tiên bình luận!</p>
                </div>
              ) : (
                commentList.map((c) => (
                  <Comment
                    key={c.id}
                    comment={c}
                    onDelete={handleDeleteComment}
                    onUpdate={() => handleComment(commentsFor)}
                    onReplyCreated={() => handleComment(commentsFor)}
                  />
                ))
              )}
            </div>

            <form
              onSubmit={handleSubmitComment}
              className="shrink-0 px-3 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 bg-white dark:bg-zinc-900 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            >
              <Avatar
                userId={currentUser?.id}
                src={currentUser?.avatarUrl}
                name={currentUser?.fullName || currentUser?.username}
                username={currentUser?.username}
                avatarColor={currentUser?.avatarColor}
                size="sm"
                className="border border-zinc-200 dark:border-zinc-700 shrink-0"
              />
              <input
                type="text"
                value={commentText}
                onChange={handleCommentTextChange}
                placeholder="Viết bình luận..."
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0866ff]/30"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmittingComment}
                className="shrink-0 w-9 h-9 rounded-full bg-[#0866ff] text-white hover:bg-[#0756d6] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center"
              >
                {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </>,
        document.body
      )}

      {/* Upload Modal */}
      {showUpload && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowUpload(false); }}
        >
          <div className="w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-250">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Đăng video ngắn</h2>
              <button onClick={() => setShowUpload(false)} className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 max-h-[85dvh] overflow-y-auto">
              <ShortVideoUpload
                onUploadSuccess={() => { setShowUpload(false); fetchVideoPosts(); }}
                onCancel={() => setShowUpload(false)}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Mobile Bottom-Sheet for Settings Menu */}
      {showSettingsMenu && typeof document !== "undefined" && createPortal(
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
            onClick={() => setShowSettingsMenu(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-zinc-900 text-white rounded-t-3xl border-t border-zinc-800 shadow-2xl p-5 md:hidden animate-in slide-in-from-bottom duration-250 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="flex justify-center pb-3">
              <div className="w-10 h-1 rounded-full bg-zinc-700" />
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="font-bold text-base text-white">Tùy chỉnh Shorts</h3>
              <button
                onClick={() => setShowSettingsMenu(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Tự động chuyển video */}
              <div
                className="flex items-center justify-between p-3 rounded-2xl bg-zinc-800/70 border border-zinc-700/60 active:scale-[0.98] transition cursor-pointer"
                onClick={() => setAutoPlayNext(!autoPlayNext)}
              >
                <span className="text-sm font-semibold">Tự động chuyển video tiếp theo</span>
                <div className={`w-11 h-6 rounded-full transition-colors relative ${autoPlayNext ? "bg-emerald-500" : "bg-zinc-700"}`}>
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${autoPlayNext ? "right-0.5" : "left-0.5"}`} />
                </div>
              </div>

              {/* Tốc độ phát */}
              <div>
                <div className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Tốc độ phát</div>
                <div className="grid grid-cols-4 gap-2">
                  {[0.5, 1, 1.5, 2].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                        playbackSpeed === speed ? "bg-white text-black" : "bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      {speed === 1 ? "Chuẩn" : `${speed}x`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chất lượng */}
              <div>
                <div className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Chất lượng video</div>
                <div className="grid grid-cols-5 gap-1.5">
                  {["Auto", "360p", "480p", "720p", "1080p"].map((q) => (
                    <button
                      key={q}
                      onClick={() => setQualitySetting(q)}
                      className={`py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                        qualitySetting === q ? "bg-[#0866ff] text-white" : "bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Báo cáo */}
              <div className="pt-2 border-t border-zinc-800">
                <button
                  onClick={() => {
                    setShowSettingsMenu(false);
                    setShowReportModal(true);
                  }}
                  className="w-full py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer"
                >
                  <span>🚩</span>
                  <span>Báo cáo video này</span>
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Report Modal */}
      {showReportModal && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowReportModal(false); }}
        >
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 text-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">Báo cáo vi phạm</h3>
              <button onClick={() => setShowReportModal(false)} className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400 mb-4">Chọn lý do bạn muốn báo cáo nội dung video ngắn này:</p>
            <div className="space-y-2 mb-5">
              {["Nội dung vi phạm bản quyền", "Spam hoặc quảng cáo sai sự thật", "Bạo lực, nhạy cảm", "Lý do khác"].map((reason) => (
                <button
                  key={reason}
                  onClick={() => {
                    setShowReportModal(false);
                    toast.success("Cảm ơn bạn đã gửi báo cáo. Chúng tôi sẽ xem xét trong thời gian sớm nhất!");
                  }}
                  className="w-full text-left p-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-xs font-medium transition cursor-pointer"
                >
                  {reason}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowReportModal(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition"
            >
              Hủy
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Share Modal */}
      {shareVideo && <ShareModal post={shareVideo} onClose={() => setShareVideo(null)} />}
    </div>
  );
}
