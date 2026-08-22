import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Heart, MessageCircle, Share2, MoreHorizontal, Play,
  Volume2, VolumeX, Maximize2, Minimize2, X, Loader2,
  Video, Send, Bookmark, ChevronUp, ChevronDown, Link as LinkIcon,
} from "lucide-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
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
import bookmarkService from "../services/bookmarkService";
import { isVideoUrl } from "../utils/mediaUtils";

export default function ShortVideoFeed() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
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
  const [bookmarkMap, setBookmarkMap] = useState({});
  const [playingMap, setPlayingMap] = useState({});
  const [viewedSet, setViewedSet] = useState(new Set());
  const [videoAspectRatios, setVideoAspectRatios] = useState({});
  const [videoLoadedMap, setVideoLoadedMap] = useState({});

  const pageRef = useRef(0);
  const sessionViewedIdsRef = useRef(new Set());

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();

  const initialVideoId = location.state?.initialVideoId || (searchParams.get("id") ? Number(searchParams.get("id")) : null);
  const initialVideosFromState = location.state?.initialVideos || null;
  const initialIndexFromState = location.state?.startIndex;

  const handleShortVideoMetadata = (e, index) => {
    const { videoWidth, videoHeight } = e.currentTarget;
    if (videoWidth && videoHeight) {
      const isLandscape = videoWidth > videoHeight;
      const ratio = videoWidth / videoHeight;
      setVideoAspectRatios((prev) => ({
        ...prev,
        [index]: { ratio, isLandscape, width: videoWidth, height: videoHeight },
      }));
      setVideoLoadedMap((prev) => ({ ...prev, [index]: true }));
    }
  };

  const videoRefs = useRef([]);
  const itemRefs = useRef([]);
  const containerRef = useRef(null);
  const lastTapRef = useRef(0);
  const currentIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const touchState = useRef({ startY: 0, startX: 0, startTime: 0, isVertical: false });

  const [hasError, setHasError] = useState(false);

  const formatVideoPost = (post) => ({
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
  });

  const fetchVideoPosts = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    pageRef.current = 0;

    // 1. Uu tien playlist truyen tu ReelsCarousel
    if (Array.isArray(initialVideosFromState) && initialVideosFromState.length > 0) {
      const formatted = initialVideosFromState.map(formatVideoPost);
      let targetIdx = 0;
      if (typeof initialIndexFromState === "number" && initialIndexFromState >= 0 && initialIndexFromState < formatted.length) {
        targetIdx = initialIndexFromState;
      } else if (initialVideoId) {
        const found = formatted.findIndex((v) => Number(v.id) === Number(initialVideoId));
        if (found !== -1) targetIdx = found;
      }
      setVideos(formatted);
      setCurrentVideoIndex(targetIdx);
      setHasMore(true);
      formatted.forEach((v) => sessionViewedIdsRef.current.add(v.id));
      setLoading(false);
      return;
    }

    // 2. Lay danh sach de xuat tu Backend API
    try {
      const res = await postService.getRecommendedShorts(0, 10, Array.from(sessionViewedIdsRef.current));
      const allPosts = res.data?.content || res.data || [];
      const videoPosts = allPosts
        .filter((post) =>
          post.mediaType === "video" ||
          post.videoUrl ||
          (post.thumbNail && isVideoUrl(post.thumbNail)) ||
          (Array.isArray(post.imageUrls) && post.imageUrls.some(isVideoUrl))
        )
        .map(formatVideoPost);

      let targetIdx = 0;
      if (initialVideoId) {
        const foundIdx = videoPosts.findIndex((v) => Number(v.id) === Number(initialVideoId));
        if (foundIdx !== -1) {
          targetIdx = foundIdx;
        } else {
          try {
            const singleRes = await postService.getById(initialVideoId);
            if (singleRes.data) {
              videoPosts.unshift(formatVideoPost(singleRes.data));
            }
          } catch (ignored) {}
        }
      }

      setVideos(videoPosts);
      setCurrentVideoIndex(targetIdx);
      setHasMore(allPosts.length >= 8);

      videoPosts.forEach((v) => {
        sessionViewedIdsRef.current.add(v.id);
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
  }, [initialVideoId, initialVideosFromState, initialIndexFromState]);

  const fetchMoreVideos = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    try {
      const res = await postService.getRecommendedShorts(nextPage, 8, Array.from(sessionViewedIdsRef.current));
      const allPosts = res.data?.content || res.data || [];
      const videoPosts = allPosts
        .filter((post) =>
          post.mediaType === "video" ||
          post.videoUrl ||
          (post.thumbNail && isVideoUrl(post.thumbNail)) ||
          (Array.isArray(post.imageUrls) && post.imageUrls.some(isVideoUrl))
        )
        .map(formatVideoPost);

      if (videoPosts.length === 0) {
        setHasMore(false);
      } else {
        setVideos((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const unique = videoPosts.filter((p) => !existingIds.has(p.id));
          return [...prev, ...unique];
        });

        videoPosts.forEach((v) => {
          sessionViewedIdsRef.current.add(v.id);
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

        pageRef.current = nextPage;
      }
    } catch {
      // Ignored
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  useEffect(() => {
    if (videos.length > 0 && currentVideoIndex >= videos.length - 3) {
      fetchMoreVideos();
    }
  }, [currentVideoIndex, videos.length, fetchMoreVideos]);

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

  // Lock document body overflow while on ShortVideoFeed page
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Click outside to close settings popup menu
  useEffect(() => {
    if (!showSettingsMenu) return;
    const handleClickOutside = () => {
      setShowSettingsMenu(false);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [showSettingsMenu]);

  const fetchComments = useCallback(async (videoId) => {
    if (!videoId) return;
    setCommentLoading(true);
    try {
      const r = await commentService.getByPostId(videoId);
      const list = r.data || [];
      setCommentList(Array.isArray(list) ? list : []);
    } catch {
      setCommentList([]);
    } finally {
      setCommentLoading(false);
    }
  }, []);

  // Auto load comments on PC when active video changes (if comments panel is open)
  useEffect(() => {
    if (videos.length === 0) return;
    const activeVideo = videos[currentVideoIndex];
    if (activeVideo?.id && showComments) {
      setCommentsFor(activeVideo.id);
      fetchComments(activeVideo.id);
    }
  }, [currentVideoIndex, videos, showComments, fetchComments]);

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

  const handleBookmark = async (videoId) => {
    const wasBookmarked = !!bookmarkMap[videoId];
    setBookmarkMap((prev) => ({ ...prev, [videoId]: !wasBookmarked }));
    try {
      const res = await bookmarkService.toggleBookmark(videoId);
      const isBm = !!res.data?.bookmarked;
      setBookmarkMap((prev) => ({ ...prev, [videoId]: isBm }));
      if (isBm) {
        toast.success("Đã lưu video vào bộ sưu tập!");
      } else {
        toast.info("Đã bỏ lưu video!");
      }
    } catch {
      setBookmarkMap((prev) => ({ ...prev, [videoId]: wasBookmarked }));
      toast.error("Không thể thao tác lưu video.");
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

  const handleCopyLink = (videoId) => {
    const targetId = videoId || currentVideo?.id;
    if (!targetId) return;
    const link = `${window.location.origin}/shorts?id=${targetId}`;
    navigator.clipboard.writeText(link);
    toast.success("Đã sao chép liên kết video!");
  };

  const handleToggleComments = (videoId) => {
    const targetId = videoId || currentVideo?.id;
    if (!targetId) return;
    if (showComments && commentsFor === targetId) {
      setShowComments(false);
      setCommentsFor(null);
    } else {
      setShowComments(true);
      setCommentsFor(targetId);
      fetchComments(targetId);
    }
  };

  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);

  const currentVideo = videos[currentVideoIndex];
  const currentRatioData = videoAspectRatios[currentVideoIndex];
  const isLandscape = currentRatioData ? currentRatioData.isLandscape : false;
  const isCurrentVideoReady = !!videoLoadedMap[currentVideoIndex];

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
    const targetId = commentsFor || currentVideo?.id;
    if (!commentText.trim() || !targetId || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const r = await commentService.create({ content: commentText.trim(), post: { id: targetId } });
      setCommentList((prev) => [r.data, ...prev]);
      setCommentText("");
      setVideos((prev) =>
        prev.map((v) => v.id === targetId ? { ...v, comments: v.comments + 1 } : v)
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
  };

  const handleDeleteComment = async (commentId) => {
    const targetId = commentsFor || currentVideo?.id;
    try {
      await commentService.delete(commentId);
      setCommentList((prev) => prev.filter((c) => c.id !== commentId));
      setVideos((prev) =>
        prev.map((v) => v.id === targetId ? { ...v, comments: Math.max(0, v.comments - 1) } : v)
      );
      toast.success("Đã xóa bình luận!");
    } catch {
      toast.error("Không thể xóa bình luận. Vui lòng thử lại!");
    }
  };

  const toggleMute = (e) => {
    e?.stopPropagation();
    setIsMuted((prev) => {
      const next = !prev;
      videoRefs.current.forEach((v) => { if (v) v.muted = next; });
      return next;
    });
  };

  const togglePlay = (e, index) => {
    e?.stopPropagation();
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

  // Keyboard navigation on PC (ArrowUp / ArrowDown / Space / M)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        scrollToVideo(currentIndexRef.current + 1);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        scrollToVideo(currentIndexRef.current - 1);
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlay(e, currentIndexRef.current);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute(e);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scrollToVideo]);

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

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = itemRefs.current.findIndex((el) => el === entry.target);
            if (index !== -1 && index !== currentIndexRef.current) {
              setCurrentVideoIndex(index);
            }
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [videos.length]);

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

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-full h-full min-h-[100dvh] md:min-h-0 flex flex-col md:flex-row items-center justify-center p-0 md:p-2 lg:p-4 gap-0 md:gap-4 lg:gap-6 overflow-hidden max-w-[1680px] mx-auto select-none"
      style={{ height: "100dvh", minHeight: "-webkit-fill-available" }}
    >
      {/* ======================================================================
          1. LEFT SECTION: Dynamic Aspect Video Box + Floating Controls + Action Rail
          ====================================================================== */}
      <div
        className="w-full h-full flex-1 flex items-center justify-center p-0 md:p-1 transition-all duration-300 min-w-0 relative overflow-hidden"
        style={{ height: "100dvh", minHeight: "-webkit-fill-available" }}
      >
        
        {/* Navigation Arrow Controls on Desktop (Left side) */}
        <div className="hidden md:flex flex-col gap-3 absolute left-1 lg:left-3 z-40">
          <button
            onClick={() => scrollToVideo(currentVideoIndex - 1)}
            disabled={currentVideoIndex === 0}
            className="w-10 h-10 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 backdrop-blur-md text-zinc-700 dark:text-zinc-200 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-md cursor-pointer"
            title="Video trước (Phím K hoặc Mũi tên lên)"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={() => scrollToVideo(currentVideoIndex + 1)}
            disabled={currentVideoIndex >= videos.length - 1}
            className="w-10 h-10 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 backdrop-blur-md text-zinc-700 dark:text-zinc-200 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-md cursor-pointer"
            title="Video tiếp theo (Phím J hoặc Mũi tên xuống)"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Outer Flex Container grouping Video and Desktop Action Rail */}
        <div className="flex items-end justify-center gap-3 lg:gap-4 w-full h-full md:w-auto md:h-auto max-w-full">
          
          {/* Shorts Video Box: Dynamic Sizing (16:9 Landscape widescreen vs 9:16 Portrait phone format) */}
          <div
            className={`relative bg-black rounded-none md:rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl md:border md:border-zinc-800/80 shrink-0 transition-all duration-300 w-full h-[100dvh] md:h-auto ${
              isLandscape
                ? "md:w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl md:h-[82vh] md:max-h-[85vh] md:aspect-video"
                : "md:w-auto md:aspect-[9/16] md:h-[85vh] md:max-h-[88vh] md:max-w-[420px]"
            }`}
            style={{ height: "100dvh", minHeight: "-webkit-fill-available" }}
          >
            {/* Ambient Background Blur for Desktop */}
            {currentVideo && (
              <div className="hidden md:block absolute inset-0 z-0 overflow-hidden rounded-3xl pointer-events-none">
                <img
                  src={currentVideo.url}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover scale-125 blur-3xl brightness-40 saturate-150 select-none"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </div>
            )}

            {/* Top Controls Overlay (Back, Mute/Unmute, Settings) with smooth fade-in */}
            <div
              className={`absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 pb-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none transition-opacity duration-300 ${
                isCurrentVideoReady ? "opacity-100" : "opacity-0"
              }`}
              style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
            >
              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={() => navigate("/")}
                  aria-label="Back to home"
                  className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl ring-1 ring-white/20 text-white flex items-center justify-center hover:bg-black/60 active:scale-90 transition shadow-md cursor-pointer"
                  title="Quay lại"
                >
                  <X className="w-5 h-5" />
                </button>

                <button
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute video" : "Mute video"}
                  className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl ring-1 ring-white/20 text-white flex items-center justify-center hover:bg-black/60 active:scale-90 transition shadow-md cursor-pointer"
                  title={isMuted ? "Bật âm thanh (Phím M)" : "Tắt âm thanh (Phím M)"}
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-white" />}
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSettingsMenu(!showSettingsMenu);
                    }}
                    aria-label="More options"
                    className={`w-10 h-10 rounded-full backdrop-blur-xl ring-1 transition active:scale-90 flex items-center justify-center shadow-md cursor-pointer ${
                      showSettingsMenu
                        ? "bg-white text-zinc-900 ring-white"
                        : "bg-black/40 ring-white/20 text-white hover:bg-black/60"
                    }`}
                    title="Tùy chọn video (...)"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  {/* Floating Popover Settings Menu */}
                  {showSettingsMenu && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-0 top-12 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-3 z-50 text-zinc-900 dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <div className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 px-1 pb-1.5 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800/80 mb-2">
                        Cài đặt player
                      </div>

                      {/* Auto play next */}
                      <div
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                        onClick={() => setAutoPlayNext(!autoPlayNext)}
                      >
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Tự động cuộn video tiếp</span>
                        <div className={`w-8 h-4.5 rounded-full transition-colors relative ${autoPlayNext ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`}>
                          <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${autoPlayNext ? "right-0.5" : "left-0.5"}`} />
                        </div>
                      </div>

                      {/* Playback speed */}
                      <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                        <div className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 px-1 mb-1.5">Tốc độ phát</div>
                        <div className="grid grid-cols-3 gap-1">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                            <button
                              key={speed}
                              onClick={() => setPlaybackSpeed(speed)}
                              className={`py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                playbackSpeed === speed
                                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                              }`}
                            >
                              {speed === 1 ? "1x" : `${speed}x`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quality */}
                      <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                        <div className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 px-1 mb-1.5">Chất lượng</div>
                        <div className="grid grid-cols-3 gap-1">
                          {["Auto", "360p", "480p", "720p", "1080p"].map((q) => (
                            <button
                              key={q}
                              onClick={() => setQualitySetting(q)}
                              className={`py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                                qualitySetting === q
                                  ? "bg-[#0866ff] text-white shadow-xs"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                              }`}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Report */}
                      <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                        <button
                          onClick={() => {
                            setShowSettingsMenu(false);
                            setShowReportModal(true);
                          }}
                          className="w-full text-left px-2 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition flex items-center gap-2 cursor-pointer"
                        >
                          <span>🚩</span>
                          <span>Báo cáo video</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Video Feed Scroll/Snap Container */}
            <div
              ref={containerRef}
              className="w-full flex-1 overflow-y-scroll snap-y snap-mandatory select-none custom-scrollbar relative z-10"
              style={{
                scrollSnapType: "y mandatory",
                WebkitOverflowScrolling: "touch",
                overscrollBehaviorY: "contain",
                height: "100dvh",
                minHeight: "-webkit-fill-available",
              }}
            >
              {loading ? (
                /* Full Shimmer Skeleton while loading initial list (Prevent CLS & overlap) */
                <div className="w-full h-full flex flex-col justify-between bg-zinc-950 p-4 relative overflow-hidden animate-pulse">
                  <div className="flex items-center justify-between w-full pt-2">
                    <div className="flex gap-2">
                      <div className="w-10 h-10 rounded-full bg-zinc-800/80" />
                      <div className="w-10 h-10 rounded-full bg-zinc-800/80" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-zinc-800/80" />
                  </div>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-9 h-9 text-[#0866ff] animate-spin" />
                    <span className="text-zinc-400 text-xs font-semibold tracking-wide">Đang tải video...</span>
                  </div>

                  <div className="flex items-end justify-between w-full pb-6">
                    <div className="flex flex-col gap-2.5 max-w-[70%]">
                      <div className="w-32 h-4 rounded-full bg-zinc-800/80" />
                      <div className="w-48 h-3 rounded-full bg-zinc-800/60" />
                      <div className="w-24 h-3 rounded-full bg-zinc-800/50" />
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800/80" />
                      <div className="w-10 h-10 rounded-full bg-zinc-800/80" />
                      <div className="w-10 h-10 rounded-full bg-zinc-800/80" />
                    </div>
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
                      className="px-8 py-3.5 bg-white text-black font-bold rounded-full text-sm hover:bg-white/90 active:scale-95 transition-all shadow-lg cursor-pointer"
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
                      className="px-8 py-3.5 bg-white text-black font-bold rounded-full text-sm hover:bg-white/90 active:scale-95 transition-all shadow-lg cursor-pointer"
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
                  const isReady = !!videoLoadedMap[index];

                  return (
                    <div
                      key={video.id}
                      ref={(el) => (itemRefs.current[index] = el)}
                      className="relative w-full h-[100dvh] md:h-full shrink-0 overflow-hidden bg-black flex items-center justify-center snap-start"
                      style={{
                        height: "100dvh",
                        minHeight: "-webkit-fill-available",
                        scrollSnapAlign: "start",
                        scrollSnapStop: "always",
                      }}
                    >
                      {/* Video Element: Dynamic aspect ratio & object-contain */}
                      <video
                        ref={(el) => (videoRefs.current[index] = el)}
                        src={video.url}
                        className={`w-full h-full object-contain object-center block transition-opacity duration-300 ${
                          isReady ? "opacity-100" : "opacity-0"
                        }`}
                        preload="metadata"
                        onLoadedMetadata={(e) => handleShortVideoMetadata(e, index)}
                        onLoadedData={() => setVideoLoadedMap((prev) => ({ ...prev, [index]: true }))}
                        onCanPlay={() => setVideoLoadedMap((prev) => ({ ...prev, [index]: true }))}
                        loop={!autoPlayNext}
                        playsInline
                        onClick={(e) => handleVideoClick(e, index)}
                        onTimeUpdate={(e) => handleTimeUpdate(e, index)}
                        onEnded={() => {
                          if (autoPlayNext && index < videos.length - 1) {
                            scrollToVideo(index + 1);
                          }
                        }}
                        onPlay={() => setPlayingMap((prev) => ({ ...prev, [index]: true }))}
                        onPause={() => setPlayingMap((prev) => ({ ...prev, [index]: false }))}
                      />

                      {/* Per-Slide Shimmer Skeleton Placeholder before Video is ready */}
                      {!isReady && (
                        <div className="absolute inset-0 z-20 flex flex-col justify-between bg-zinc-950 p-4 animate-pulse pointer-events-none">
                          {video.url && (
                            <img
                              src={video.url}
                              alt=""
                              aria-hidden="true"
                              className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20 pointer-events-none select-none"
                              onError={(e) => { e.currentTarget.style.display = "none"; }}
                            />
                          )}
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
                            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                              <Loader2 className="w-6 h-6 text-white/80 animate-spin" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Gradient overlays with smooth transition */}
                      <div className={`absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/65 to-transparent pointer-events-none z-[5] transition-opacity duration-300 ${isReady ? "opacity-100" : "opacity-0"}`} />
                      <div className={`absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none z-[5] transition-opacity duration-300 ${isReady ? "opacity-100" : "opacity-0"}`} />

                      {/* Pause indicator */}
                      {!isPlaying && index === currentVideoIndex && isReady && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[10]">
                          <div className="w-16 h-16 rounded-full bg-black/45 backdrop-blur-xl ring-1 ring-white/15 flex items-center justify-center">
                            <Play className="w-8 h-8 text-white fill-white ml-1 drop-shadow-lg" />
                          </div>
                        </div>
                      )}

                      {/* MOBILE-ONLY ACTION RAIL OVERLAY (< 768px) with Safe Area Offset */}
                      <div
                        className={`md:hidden absolute right-3 z-30 pointer-events-auto flex flex-col items-center gap-3 transition-opacity duration-300 ${
                          isReady ? "opacity-100" : "opacity-0 pointer-events-none"
                        }`}
                        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 52px)" }}
                      >
                        {/* Author Avatar with Follow Overlay */}
                        <div className="relative mb-0.5">
                          <button onClick={() => navigate(`/profile/${video.author.id}`)} className="block shrink-0 ring-2 ring-white/90 rounded-full shadow-md active:scale-95 transition cursor-pointer">
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
                              aria-label={isFollowing ? "Unfollow" : "Follow"}
                              className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold transition-all shadow-md active:scale-90 cursor-pointer ${isFollowing ? "bg-emerald-500" : "bg-rose-500 hover:bg-rose-600"}`}
                              title={isFollowing ? "Đang theo dõi" : "Theo dõi"}
                            >
                              {isFollowing ? "✓" : "+"}
                            </button>
                          )}
                        </div>

                        {/* Like Action */}
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleLike(video.id)}
                            aria-label="Like"
                            className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full backdrop-blur-md ring-1 transition-all active:scale-90 flex items-center justify-center shadow-md cursor-pointer ${video.isLiked ? "bg-rose-500/90 ring-rose-400/40 scale-105" : "bg-black/40 ring-white/20 hover:bg-black/60"}`}
                          >
                            <Heart className={`w-5 h-5 transition-all ${video.isLiked ? "text-white fill-white" : "text-white"}`} />
                          </button>
                          <span className="text-white text-[11px] font-bold drop-shadow">{formatCount(video.likes)}</span>
                        </div>

                        {/* Comment Action */}
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleToggleComments(video.id)}
                            aria-label="Comments"
                            className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full backdrop-blur-md ring-1 transition-all active:scale-90 flex items-center justify-center shadow-md cursor-pointer ${showComments && commentsFor === video.id ? "bg-[#0866ff] text-white ring-[#0866ff]/40 scale-105" : "bg-black/40 ring-white/20 hover:bg-black/60"}`}
                          >
                            <MessageCircle className="w-5 h-5 text-white" />
                          </button>
                          <span className="text-white text-[11px] font-bold drop-shadow">{formatCount(video.comments)}</span>
                        </div>

                        {/* Save / Bookmark Action */}
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleBookmark(video.id)}
                            aria-label="Save video"
                            className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full backdrop-blur-md ring-1 transition-all active:scale-90 flex items-center justify-center shadow-md cursor-pointer ${bookmarkMap[video.id] ? "bg-amber-500/90 ring-amber-400/40 scale-105" : "bg-black/40 ring-white/20 hover:bg-black/60"}`}
                          >
                            <Bookmark className={`w-5 h-5 transition-all ${bookmarkMap[video.id] ? "text-white fill-white" : "text-white"}`} />
                          </button>
                          <span className="text-white text-[11px] font-bold drop-shadow">Lưu</span>
                        </div>

                        {/* Share Action */}
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleShare(video)}
                            aria-label="Share video"
                            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-black/40 backdrop-blur-md ring-1 ring-white/20 flex items-center justify-center hover:bg-black/60 active:scale-90 transition-all shadow-md cursor-pointer"
                          >
                            <Share2 className="w-5 h-5 text-white" />
                          </button>
                          <span className="text-white text-[11px] font-bold drop-shadow">{formatCount(video.shares)}</span>
                        </div>
                      </div>

                      {/* Mobile Video Info Overlay (< 768px: Username, Caption, Audio) with Safe Area Offset */}
                      <div
                        className={`md:hidden absolute left-3.5 right-16 z-30 flex flex-col gap-1.5 pointer-events-auto transition-opacity duration-300 ${
                          isReady ? "opacity-100" : "opacity-0 pointer-events-none"
                        }`}
                        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => navigate(`/profile/${video.author.id}`)}
                            className="text-white font-bold text-sm tracking-tight hover:underline truncate max-w-[180px] drop-shadow cursor-pointer"
                          >
                            @{video.author.username}
                          </button>
                        </div>

                        {video.description && (
                          <div className="flex flex-col gap-0.5">
                            <p className={`text-white/95 text-[13px] leading-relaxed drop-shadow-sm ${expandedCaptions[index] ? "" : "line-clamp-2"}`}>
                              {video.description}
                            </p>
                            {video.description.length > 80 && (
                              <button onClick={() => toggleCaption(index)} className="text-white/70 text-xs font-semibold hover:text-white transition text-left cursor-pointer">
                                {expandedCaptions[index] ? "Thu gọn" : "Xem thêm"}
                              </button>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pr-1 text-white/85 text-xs font-medium drop-shadow-sm">
                          <div className="flex items-center gap-1.5 truncate">
                            <div className="w-3.5 h-3.5 shrink-0 rounded-full bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-indigo-500 shadow animate-spin" style={{ animationDuration: "3s" }} />
                            <span className="truncate">Âm thanh gốc — {video.author.fullName || video.author.username}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-white/75 text-[10px] font-semibold tabular-nums">
                              {prog?.duration ? `${formatTime(prog.current)} / ${formatTime(prog.duration)}` : "0:00"}
                            </span>
                            <button
                              onClick={toggleFullscreen}
                              className="w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center transition text-white/80 hover:text-white cursor-pointer"
                              title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                            >
                              {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Minimal Caption & Audio Info Overlay on Video Frame */}
                      <div className={`hidden md:flex absolute left-4 right-4 bottom-3 z-30 items-center justify-between text-white/90 text-xs font-medium drop-shadow-sm pointer-events-auto transition-opacity duration-300 ${
                        isReady ? "opacity-100" : "opacity-0 pointer-events-none"
                      }`}>
                        <div className="flex items-center gap-2 max-w-[70%] truncate">
                          <div className="w-3.5 h-3.5 shrink-0 rounded-full bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-indigo-500 shadow animate-spin" style={{ animationDuration: "3s" }} />
                          <span className="truncate font-semibold">@{video.author.username}</span>
                          <span className="text-white/60">•</span>
                          <span className="truncate text-white/80">Âm thanh gốc</span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-white/75 text-[11px] font-semibold tabular-nums">
                            {prog?.duration ? `${formatTime(prog.current)} / ${formatTime(prog.duration)}` : "0:00"}
                          </span>
                          <button
                            onClick={toggleFullscreen}
                            className="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center transition text-white/80 hover:text-white cursor-pointer"
                            title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                          >
                            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Edge-to-edge Seekbar Progress Bar with Safe Area Offset */}
                      <div
                        className={`absolute inset-x-0 z-40 w-full h-5 flex items-end cursor-pointer pointer-events-auto group/seekbar transition-opacity duration-300 ${
                          isReady ? "opacity-100" : "opacity-0 pointer-events-none"
                        }`}
                        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 2px)" }}
                        onClick={(e) => handleSeek(e, index)}
                        title="Tua video"
                      >
                        <div className="h-[3px] group-hover/seekbar:h-1.5 w-full bg-white/30 backdrop-blur-xs relative transition-all duration-150">
                          <div
                            className="h-full bg-white relative shadow-sm"
                            style={{ width: `${prog?.duration ? (prog.current / prog.duration) * 100 : 0}%` }}
                          >
                            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover/seekbar:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* DESKTOP VERTICAL ACTION RAIL (Sát cạnh phải video frame) with Fade-In */}
          {currentVideo && (
            <div
              className={`hidden md:flex flex-col items-center justify-end gap-4 pb-6 shrink-0 z-30 select-none self-end transition-opacity duration-300 ${
                isCurrentVideoReady ? "opacity-100" : "opacity-40"
              }`}
              style={{ height: "82vh", maxHeight: "85vh" }}
            >
              {/* Creator Avatar & Follow Button */}
              <div className="flex flex-col items-center gap-1">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${currentVideo.author.id}`)}
                    className="block shrink-0 ring-2 ring-zinc-300 dark:ring-zinc-700 rounded-full shadow-md hover:scale-105 transition cursor-pointer"
                  >
                    <Avatar
                      userId={currentVideo.author.id}
                      src={currentVideo.author.avatarUrl}
                      name={currentVideo.author.fullName}
                      username={currentVideo.author.username}
                      avatarColor={currentVideo.author.avatarColor}
                      size="md"
                    />
                  </button>
                  {Number(currentVideo.author.id) !== Number(currentUser?.id) && (
                    <button
                      type="button"
                      onClick={() => handleFollow(currentVideo.author.id)}
                      aria-label={followMap[currentVideo.author.id] ? "Unfollow" : "Follow"}
                      className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all shadow-md active:scale-90 cursor-pointer ${
                        followMap[currentVideo.author.id] ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600"
                      }`}
                      title={followMap[currentVideo.author.id] ? "Đang theo dõi" : "Theo dõi"}
                    >
                      {followMap[currentVideo.author.id] ? "✓" : "+"}
                    </button>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 truncate max-w-[64px] text-center">
                  @{currentVideo.author.username}
                </span>
              </div>

              {/* Like Action */}
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleLike(currentVideo.id)}
                  aria-label="Like"
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 cursor-pointer ${
                    currentVideo.isLiked
                      ? "bg-rose-500 text-white shadow-rose-500/30 scale-105"
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-rose-100 dark:hover:bg-zinc-700 hover:text-rose-500"
                  }`}
                  title="Thích"
                >
                  <Heart className={`w-6 h-6 ${currentVideo.isLiked ? "fill-white text-white" : ""}`} />
                </button>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {formatCount(currentVideo.likes)}
                </span>
              </div>

              {/* Comment Action */}
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleComments(currentVideo.id)}
                  aria-label="Comments"
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 cursor-pointer ${
                    showComments && commentsFor === currentVideo.id
                      ? "bg-[#0866ff] text-white shadow-blue-500/30 scale-105"
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-blue-100 dark:hover:bg-zinc-700 hover:text-[#0866ff]"
                  }`}
                  title={showComments ? "Đóng bình luận" : "Mở bình luận"}
                >
                  <MessageCircle className="w-6 h-6" />
                </button>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {formatCount(currentVideo.comments)}
                </span>
              </div>

              {/* Bookmark / Save Action */}
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleBookmark(currentVideo.id)}
                  aria-label="Save video"
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 cursor-pointer ${
                    bookmarkMap[currentVideo.id]
                      ? "bg-amber-500 text-white shadow-amber-500/30 scale-105"
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-amber-100 dark:hover:bg-zinc-700 hover:text-amber-500"
                  }`}
                  title="Lưu video"
                >
                  <Bookmark className={`w-6 h-6 ${bookmarkMap[currentVideo.id] ? "fill-white text-white" : ""}`} />
                </button>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Lưu</span>
              </div>

              {/* Share Action */}
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleShare(currentVideo)}
                  aria-label="Share video"
                  className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-emerald-100 dark:hover:bg-zinc-700 hover:text-emerald-500 flex items-center justify-center shadow-md transition-all active:scale-90 cursor-pointer"
                  title="Chia sẻ"
                >
                  <Share2 className="w-6 h-6" />
                </button>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {formatCount(currentVideo.shares)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================================
          2. RIGHT SECTION: TikTok PC Standard Comments & Creator Info Panel (Conditional Toggle)
          ====================================================================== */}
      {showComments && (
        <div className="hidden md:flex flex-col w-[350px] lg:w-[380px] xl:w-[400px] h-[82vh] max-h-[85vh] shrink-0 bg-white dark:bg-[#242526] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-right duration-250">
          
          {/* Creator Info & Caption Header */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => navigate(`/profile/${currentVideo?.author?.id}`)}
                className="flex items-center gap-3 text-left group min-w-0"
              >
                <Avatar
                  userId={currentVideo?.author?.id}
                  src={currentVideo?.author?.avatarUrl}
                  name={currentVideo?.author?.fullName}
                  username={currentVideo?.author?.username}
                  avatarColor={currentVideo?.author?.avatarColor}
                  size="md"
                />
                <div className="min-w-0">
                  <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:underline truncate">
                    {currentVideo?.author?.fullName || currentVideo?.author?.username}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    @{currentVideo?.author?.username}
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-2">
                {Number(currentVideo?.author?.id) !== Number(currentUser?.id) && (
                  <button
                    onClick={() => handleFollow(currentVideo?.author?.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      followMap[currentVideo?.author?.id]
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        : "bg-rose-500 text-white hover:bg-rose-600 shadow-sm"
                    }`}
                  >
                    {followMap[currentVideo?.author?.id] ? "Đang theo dõi" : "Theo dõi"}
                  </button>
                )}
                <button
                  onClick={() => setShowComments(false)}
                  className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                  title="Đóng bình luận"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Video Description */}
            {currentVideo?.description && (
              <div className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed max-h-20 overflow-y-auto custom-scrollbar">
                {currentVideo.description}
              </div>
            )}

            {/* Original Audio Banner */}
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 font-medium truncate">
              <div className="w-3.5 h-3.5 shrink-0 rounded-full bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-indigo-500 shadow animate-spin" style={{ animationDuration: "3s" }} />
              <span className="truncate">Âm thanh gốc — {currentVideo?.author?.fullName || currentVideo?.author?.username}</span>
            </div>

            {/* Interaction Counts & Copy Link Button */}
            <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-3 font-semibold">
                <span className="flex items-center gap-1">
                  <Heart className={`w-3.5 h-3.5 ${currentVideo?.isLiked ? "text-rose-500 fill-rose-500" : "text-zinc-400"}`} />
                  {formatCount(currentVideo?.likes)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5 text-[#0866ff]" />
                  {formatCount(currentVideo?.comments)}
                </span>
              </div>
              <button
                onClick={() => handleCopyLink(currentVideo?.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold transition text-[11px] cursor-pointer"
                title="Sao chép liên kết video"
              >
                <LinkIcon className="w-3 h-3" />
                <span>Sao chép link</span>
              </button>
            </div>
          </div>

          {/* Scrollable Comments List */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 space-y-2 custom-scrollbar">
            <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 px-1 pb-1">
              Bình luận ({currentVideo ? formatCount(currentVideo.comments) : 0})
            </div>

            {commentLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#0866ff]" />
                <span className="text-xs">Đang tải bình luận...</span>
              </div>
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
                  onUpdate={() => fetchComments(currentVideo?.id)}
                  onReplyCreated={() => fetchComments(currentVideo?.id)}
                />
              ))
            )}
          </div>

          {/* Comment Input Form at Bottom */}
          <form
            onSubmit={handleSubmitComment}
            className="shrink-0 p-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2 bg-white dark:bg-[#242526]"
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
                placeholder="Thêm bình luận (@bạn_bè)..."
                className="flex-1 bg-zinc-100 dark:bg-zinc-800/90 rounded-full px-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0866ff]/30"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmittingComment}
                className="shrink-0 w-8 h-8 rounded-full bg-[#0866ff] text-white hover:bg-[#0756d6] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center cursor-pointer shadow-xs"
              >
                {isSubmittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================================
          3. MOBILE COMMENTS BOTTOM DRAWER SHEET (< 768px)
          ====================================================================== */}
      {showComments && commentsFor !== null && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs md:hidden" onClick={closeComments} />
          <div className="fixed inset-x-0 bottom-0 z-50 h-[72dvh] bg-white dark:bg-zinc-900 rounded-t-3xl border-t border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col md:hidden animate-in slide-in-from-bottom duration-250">
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Bình luận ({currentVideo ? formatCount(currentVideo.comments) : 0})
              </h3>
              <button onClick={closeComments} className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition text-zinc-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3.5 custom-scrollbar">
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
                    onUpdate={() => fetchComments(commentsFor)}
                    onReplyCreated={() => fetchComments(commentsFor)}
                  />
                ))
              )}
            </div>

            <form
              onSubmit={handleSubmitComment}
              className="shrink-0 px-3 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 bg-white dark:bg-zinc-900"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
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
                placeholder="Thêm bình luận..."
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0866ff]/30"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmittingComment}
                className="shrink-0 w-9 h-9 rounded-full bg-[#0866ff] text-white hover:bg-[#0756d6] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center cursor-pointer shadow-xs"
              >
                {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </>,
        document.body
      )}

      {/* Upload Video Modal */}
      {showUpload && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowUpload(false); }}
        >
          <div className="w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-250">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Đăng video ngắn</h2>
              <button onClick={() => setShowUpload(false)} className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition text-zinc-400 cursor-pointer">
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

      {/* Report Modal */}
      {showReportModal && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowReportModal(false); }}
        >
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 text-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">Báo cáo vi phạm</h3>
              <button onClick={() => setShowReportModal(false)} className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 cursor-pointer">
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
              className="w-full py-2.5 rounded-xl bg-zinc-800 text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
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
