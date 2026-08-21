import { useState, useRef, useEffect, useCallback } from "react";
import {
  Heart, MessageCircle, Share2, MoreHorizontal, Play,
  Volume2, VolumeX, Maximize2, Minimize2, X, Loader2,
  Video, Send, Plus, Trash2, Home, LayoutGrid,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import Avatar from "./Avatar";
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
  const [isMuted, setIsMuted] = useState(true);
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
      if (index === currentVideoIndex) {
        v.play().then(() => {
          setPlayingMap((prev) => ({ ...prev, [index]: true }));
        }).catch(() => {});
      } else {
        v.pause();
        v.currentTime = 0;
        setPlayingMap((prev) => ({ ...prev, [index]: false }));
      }
    });
  }, [currentVideoIndex, isMuted, videos]);

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

  const closeComments = () => {
    setShowComments(false);
    setCommentsFor(null);
    setCommentList([]);
    setCommentText("");
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

  return (
    <div
      className="relative w-full bg-black overflow-hidden flex flex-col"
      style={{ height: "calc(100dvh - 3.5rem - env(safe-area-inset-bottom, 0px))" }}
    >

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 bg-gradient-to-b from-black/65 to-transparent pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-xl ring-1 ring-white/20 text-white flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all shadow-md"
            title="Quay lại"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-indigo-500 shadow" />
            <h1 className="text-white font-bold text-lg tracking-tight drop-shadow">Shorts</h1>
          </div>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 backdrop-blur-xl ring-1 ring-white/25 text-white text-xs font-bold hover:bg-white/25 active:scale-95 transition-all pointer-events-auto shadow-lg"
          title="Đăng video ngắn"
        >
          <Plus className="w-3.5 h-3.5" />
          Đăng
        </button>
      </div>

      {/* Video Feed */}
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
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  loop
                  playsInline
                  onClick={(e) => handleVideoClick(e, index)}
                  onTimeUpdate={(e) => handleTimeUpdate(e, index)}
                  onPlay={() => setPlayingMap((prev) => ({ ...prev, [index]: true }))}
                  onPause={() => setPlayingMap((prev) => ({ ...prev, [index]: false }))}
                />

                {/* Gradient overlays */}
                <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/65 to-transparent pointer-events-none z-[5]" />
                <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none z-[5]" />

                {/* Pause indicator */}
                {!isPlaying && index === currentVideoIndex && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[10]">
                    <div className="w-20 h-20 rounded-full bg-black/45 backdrop-blur-xl ring-1 ring-white/15 flex items-center justify-center">
                      <Play className="w-9 h-9 text-white fill-white ml-1 drop-shadow-lg" />
                    </div>
                  </div>
                )}

                {/* Mute button */}
                <div className="absolute right-3.5 top-[5rem] z-30 pointer-events-auto">
                  <button
                    onClick={toggleMute}
                    className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-xl ring-1 ring-white/20 text-white flex items-center justify-center hover:bg-black/65 active:scale-90 transition-all shadow-lg"
                    title={isMuted ? "Bật tiếng" : "Tắt tiếng"}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>

                {/* Action buttons — right */}
                <div className="absolute right-3 bottom-[5.5rem] flex flex-col items-center gap-5 z-30 pointer-events-auto">
                  <div className="flex flex-col items-center gap-1.5">
                    <button
                      onClick={() => handleLike(video.id)}
                      className={`w-12 h-12 rounded-full backdrop-blur-xl ring-1 transition-all active:scale-90 flex items-center justify-center shadow-lg ${video.isLiked ? "bg-rose-500/90 ring-rose-400/40 scale-105" : "bg-black/45 ring-white/20 hover:bg-black/65"}`}
                      title="Thích"
                    >
                      <Heart className={`w-6 h-6 transition-all ${video.isLiked ? "text-white fill-white" : "text-white"}`} />
                    </button>
                    <span className="text-white text-[11px] font-bold drop-shadow">{formatCount(video.likes)}</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <button
                      onClick={() => handleComment(video.id)}
                      className="w-12 h-12 rounded-full bg-black/45 backdrop-blur-xl ring-1 ring-white/20 flex items-center justify-center hover:bg-black/65 active:scale-90 transition-all shadow-lg"
                      title="Bình luận"
                    >
                      <MessageCircle className="w-6 h-6 text-white" />
                    </button>
                    <span className="text-white text-[11px] font-bold drop-shadow">{formatCount(video.comments)}</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <button
                      onClick={() => handleShare(video)}
                      className="w-12 h-12 rounded-full bg-black/45 backdrop-blur-xl ring-1 ring-white/20 flex items-center justify-center hover:bg-black/65 active:scale-90 transition-all shadow-lg"
                      title="Chia sẻ"
                    >
                      <Share2 className="w-6 h-6 text-white" />
                    </button>
                    <span className="text-white text-[11px] font-bold drop-shadow">{formatCount(video.shares)}</span>
                  </div>

                  <button
                    className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-xl ring-1 ring-white/20 flex items-center justify-center hover:bg-black/65 active:scale-90 transition-all shadow-lg"
                    title="Thêm"
                  >
                    <MoreHorizontal className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Author + caption — bottom left */}
                <div className="absolute left-3.5 right-[4.5rem] bottom-[3.5rem] z-30 flex flex-col gap-2.5 pointer-events-auto">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button onClick={() => navigate(`/profile/${video.author.id}`)} className="shrink-0">
                      <Avatar
                        userId={video.author.id}
                        src={video.author.avatarUrl}
                        name={video.author.fullName}
                        username={video.author.username}
                        avatarColor={video.author.avatarColor}
                        size="sm"
                        className="border-2 border-white/80 shadow-md"
                      />
                    </button>
                    <button
                      onClick={() => navigate(`/profile/${video.author.id}`)}
                      className="text-white font-bold text-sm tracking-tight hover:underline truncate max-w-[120px]"
                    >
                      @{video.author.username}
                    </button>
                    {!isOwnVideo && (
                      <button
                        onClick={() => handleFollow(video.author.id)}
                        className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${isFollowing ? "bg-white/15 backdrop-blur-md ring-1 ring-white/30 text-white hover:bg-white/25" : "bg-white text-black hover:bg-white/90 shadow-md"}`}
                      >
                        {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                      </button>
                    )}
                  </div>

                  {video.description && (
                    <div className="flex flex-col gap-0.5">
                      <p className={`text-white/95 text-[13px] leading-relaxed drop-shadow-sm ${expandedCaptions[index] ? "" : "line-clamp-2"}`}>
                        {video.description}
                      </p>
                      {video.description.length > 90 && (
                        <button onClick={() => toggleCaption(index)} className="text-white/55 text-xs font-semibold hover:text-white transition text-left">
                          {expandedCaptions[index] ? "Thu gọn" : "Xem thêm"}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-white/75 text-xs font-medium">
                    <div className="w-5 h-5 shrink-0 rounded-full bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-indigo-500 shadow animate-spin" style={{ animationDuration: "3s" }} />
                    <span className="truncate">Original Audio — {video.author.fullName || video.author.username}</span>
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

      {/* Comment Panel */}
      {showComments && commentsFor !== null && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={closeComments} />
          <div className="fixed inset-x-0 bottom-0 z-50 h-[65dvh] sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[400px] sm:h-auto bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-none border-t sm:border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-right duration-250">
            <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
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
                commentList.map((comment) => {
                  const author = comment.user || {};
                  const name = author.fullName || author.username || "Người dùng";
                  const isOwn = Number(author.id) === Number(currentUser?.id);
                  return (
                    <div key={comment.id} className="flex gap-2.5 group">
                      <div className="shrink-0">
                        <Avatar
                          userId={author.id}
                          src={author.avatarUrl}
                          name={name}
                          username={author.username}
                          avatarColor={author.avatarColor}
                          size="sm"
                          className="border border-zinc-100 dark:border-zinc-700"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{name}</span>
                              {comment.createdAt && (
                                <span className="text-[10px] text-zinc-400 shrink-0">· {relativeTime(comment.createdAt)}</span>
                              )}
                            </div>
                            {isOwn && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center transition-all"
                                title="Xóa bình luận"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed break-words whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
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
                onChange={(e) => setCommentText(e.target.value)}
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
        </>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setShowUpload(false); }}
        >
          <div className="w-full sm:w-auto sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-250">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Đăng video ngắn</h2>
              <button onClick={() => setShowUpload(false)} className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 max-h-[88dvh] overflow-y-auto">
              <ShortVideoUpload
                onUploadSuccess={() => { setShowUpload(false); fetchVideoPosts(); }}
                onCancel={() => setShowUpload(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareVideo && <ShareModal post={shareVideo} onClose={() => setShareVideo(null)} />}
    </div>
  );
}
