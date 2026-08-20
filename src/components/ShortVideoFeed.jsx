import { useState, useRef, useEffect, useCallback } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Plus, X, Loader2, Video, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import Avatar from "./Avatar";
import ShortVideoUpload from "./ShortVideoUpload";
import ShareModal from "./ShareModal";
import postService from "../services/postService";
import likeService from "../services/likeService";
import commentService from "../services/commentService";
import { isVideoUrl } from "../utils/mediaUtils";

export default function ShortVideoFeed() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [shareVideo, setShareVideo] = useState(null);
  const [commentsFor, setCommentsFor] = useState(null);
  const [commentList, setCommentList] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [progressMap, setProgressMap] = useState({});
  const [expandedCaptions, setExpandedCaptions] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRefs = useRef([]);
  const containerRef = useRef(null);
  const lastTapRef = useRef(0);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const fetchVideoPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await postService.getAll(0, 50);
      const allPosts = res.data?.content || res.data || [];
      const videoPosts = allPosts
        .filter((post) => 
          post.mediaType === "video" || 
          post.videoUrl || 
          (post.thumbNail && isVideoUrl(post.thumbNail))
        )
        .map((post) => ({
          id: post.id,
          url: post.videoUrl || post.imageUrls?.[0] || post.thumbNail,
          user: post.user || null,
          author: {
            id: post.user?.id || post.userId,
            username: post.user?.username,
            fullName: post.user?.fullName || post.user?.username,
            avatarUrl: post.user?.avatarUrl,
            avatarColor: post.user?.avatarColor
          },
          description: post.content || post.body || post.title || "",
          likes: post.likesCount || 0,
          comments: post.commentsCount || 0,
          shares: post.sharesCount || 0,
          isLiked: post.likedByMe || false
        }));
      setVideos(videoPosts);

      if (videoPosts.length > 0) {
        videoPosts.forEach((v) => {
          likeService.checkLiked(v.id)
            .then((res) => {
              setVideos((prev) =>
                prev.map((item) =>
                  item.id === v.id
                    ? {
                        ...item,
                        isLiked: !!res.data?.liked,
                        likes: typeof res.data?.count === "number" ? res.data.count : item.likes
                      }
                    : item
                )
              );
            })
            .catch(() => {});
        });
      }
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideoPosts();
  }, [fetchVideoPosts]);

  useEffect(() => {
    const videosElements = videoRefs.current.filter(Boolean);
    if (videosElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          const index = videoRefs.current.indexOf(video);
          
          if (entry.isIntersecting) {
            setCurrentVideoIndex(index);
            video.play().catch(() => {});
          } else {
            video.pause();
            video.currentTime = 0;
          }
        });
      },
      {
        threshold: 0.75,
        root: containerRef.current
      }
    );

    videosElements.forEach((video) => observer.observe(video));

    return () => {
      videosElements.forEach((video) => observer.unobserve(video));
    };
  }, [videos]);

  const handleLike = async (videoId) => {
    setVideos((prev) =>
      prev.map((video) =>
        video.id === videoId
          ? {
              ...video,
              likes: video.isLiked ? video.likes - 1 : video.likes + 1,
              isLiked: !video.isLiked
            }
          : video
      )
    );

    try {
      const res = await likeService.toggleLike(videoId);
      const liked = !!res.data?.liked;
      const count = typeof res.data?.count === "number" ? res.data.count : null;
      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId
            ? { ...video, isLiked: liked, likes: count != null ? count : video.likes }
            : video
        )
      );
    } catch {
      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId
            ? {
                ...video,
                likes: video.isLiked ? video.likes - 1 : video.likes + 1,
                isLiked: !video.isLiked
              }
            : video
        )
      );
      toast.error("Không thể thích video. Vui lòng thử lại!");
    }
  };

  const handleDoubleTap = (videoId) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleLike(videoId);
    }
    lastTapRef.current = now;
  };

  const handleShare = (video) => {
    if (!video?.id) return;
    const postForShare = {
      id: video.id,
      user: video.author || {},
      content: video.description || "",
      body: video.description || "",
      title: video.description || "",
      thumbNail: video.url,
      sharedPost: null,
    };
    setShareVideo(postForShare);
  };

  const handleComment = (videoId) => {
    setShowComments(true);
    setCommentsFor(videoId);
    setCommentLoading(true);
    setCommentList([]);
    setCommentText("");
    commentService
      .getByPostId(videoId)
      .then((res) => {
        const list = res.data || [];
        setCommentList(Array.isArray(list) ? list : []);
      })
      .catch(() => setCommentList([]))
      .finally(() => setCommentLoading(false));
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !commentsFor || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await commentService.create({
        content: commentText.trim(),
        post: { id: commentsFor }
      });
      setCommentList((prev) => [...prev, res.data]);
      setCommentText("");
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

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted((prev) => {
      const next = !prev;
      videoRefs.current.forEach((video) => {
        if (video) video.muted = next;
      });
      return next;
    });
  };

  const togglePlay = (e, index) => {
    e.stopPropagation();
    const video = videoRefs.current[index];
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
  };

  const handleAuthorClick = (authorId) => {
    navigate(`/profile/${authorId}`);
  };

  const handleTimeUpdate = (e, index) => {
    const v = e.currentTarget;
    if (!v) return;
    setProgressMap((prev) => ({
      ...prev,
      [index]: {
        current: v.currentTime || 0,
        duration: v.duration || 0,
      },
    }));
  };

  const handleSeek = (e, index) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const video = videoRefs.current[index];
    if (video && video.duration) {
      video.currentTime = ratio * video.duration;
    }
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    }
  };

  const formatCount = (n) => {
    if (n == null) return "0";
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
  };

  const formatTime = (sec) => {
    if (!sec || !isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const toggleCaption = (index) =>
    setExpandedCaptions((prev) => ({ ...prev, [index]: !prev[index] }));

  const handleVideoClick = (e, index) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleDoubleTap(videos[index].id);
    } else {
      togglePlay(e, index);
    }
    lastTapRef.current = now;
  };

  return (
    <div className="w-full h-[100dvh] bg-black overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2 backdrop-blur-2xl rounded-full py-1.5 pl-3.5 pr-3 ring-1 ring-white/15 bg-black/35 shadow-lg">
          <div className="relative w-6 h-6 rounded-full bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-indigo-500 animate-spin-slow shadow-lg" style={{ animationDuration: "4s" }} />
          <h1 className="text-white font-bold text-lg tracking-tight drop-shadow">Shorts</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowUploadModal(true)}
            className="rounded-full bg-black/40 backdrop-blur-xl ring-1 ring-white/20 text-white p-2.5 flex items-center justify-center hover:bg-black/60 active:scale-90 transition-all shadow-lg"
            title="Tải video lên"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate("/")}
            className="rounded-full bg-black/40 backdrop-blur-xl ring-1 ring-white/20 text-white p-2.5 flex items-center justify-center hover:bg-black/60 active:scale-90 transition-all shadow-lg"
            title="Thoát"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Video Feed Container */}
      <div
        ref={containerRef}
        className="h-[100dvh] overflow-y-scroll scroll-smooth snap-y snap-mandatory no-scrollbar overscroll-y-contain touch-pan-y"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {loading ? (
          <div className="w-full h-[100dvh] flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
              <span className="text-white text-sm">Đang tải video...</span>
            </div>
          </div>
        ) : videos.length === 0 ? (
          <div className="w-full h-[100dvh] flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-4 text-center px-8">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <Video className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Chưa có video nào</h3>
                <p className="text-white/70 text-sm">Hãy là người đầu tiên đăng tải video ngắn!</p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-white/90 transition"
              >
                Đăng video ngay
              </button>
            </div>
          </div>
        ) : (
          videos.map((video, index) => (
            <div
              key={video.id}
              className="relative w-full h-[100dvh] snap-start overflow-hidden bg-black flex items-center justify-center"
              style={{ scrollSnapAlign: "start" }}
            >
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={video.url}
                className="absolute inset-0 w-full h-full object-cover object-center"
                loop
                autoPlay
                muted={isMuted}
                playsInline
                onClick={(e) => handleVideoClick(e, index)}
                onTimeUpdate={(e) => handleTimeUpdate(e, index)}
              />

              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 via-black/10 to-transparent pointer-events-none z-[5]" />
              <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none z-[5]" />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[10]">
                {videoRefs.current[index]?.paused && (
                  <div className="w-24 h-24 rounded-full bg-black/40 backdrop-blur-xl ring-2 ring-white/20 flex items-center justify-center shadow-2xl animate-scale-in">
                    <Play className="w-12 h-12 text-white fill-white ml-1 drop-shadow-lg" />
                  </div>
                )}
              </div>

              <div className="absolute right-4 top-20 z-20 flex flex-col items-center gap-3">
                <button
                  onClick={toggleMute}
                  className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-xl ring-1 ring-white/20 text-white flex items-center justify-center hover:bg-black/60 active:scale-90 transition-all shadow-lg"
                  title={isMuted ? "Bật tiếng" : "Tắt tiếng"}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>

              <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-20">
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => handleLike(video.id)}
                    className={`w-12 h-12 rounded-full backdrop-blur-xl ring-1 transition-all active:scale-90 flex items-center justify-center shadow-lg ${video.isLiked ? 'bg-rose-500/80 ring-rose-300/40 scale-110' : 'bg-black/40 ring-white/20 hover:bg-black/60'}`}
                    title="Thích"
                  >
                    <Heart className={`w-6 h-6 transition-all ${video.isLiked ? 'text-white fill-white animate-scale-in' : 'text-white'}`} />
                  </button>
                  <span className="text-white text-[11px] font-bold drop-shadow">{formatCount(video.likes)}</span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => handleComment(video.id)}
                    className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl ring-1 ring-white/20 flex items-center justify-center hover:bg-black/60 active:scale-90 transition-all shadow-lg"
                    title="Bình luận"
                  >
                    <MessageCircle className="w-6 h-6 text-white" />
                  </button>
                  <span className="text-white text-[11px] font-bold drop-shadow">{formatCount(video.comments)}</span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => handleShare(video)}
                    className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl ring-1 ring-white/20 flex items-center justify-center hover:bg-black/60 active:scale-90 transition-all shadow-lg"
                    title="Chia sẻ"
                  >
                    <Share2 className="w-6 h-6 text-white" />
                  </button>
                  <span className="text-white text-[11px] font-bold drop-shadow">{formatCount(video.shares)}</span>
                </div>

                <button className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-xl ring-1 ring-white/20 flex items-center justify-center hover:bg-black/60 active:scale-90 transition-all shadow-lg" title="Xem thêm">
                  <MoreHorizontal className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="absolute left-4 right-[4.25rem] bottom-24 z-20 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAuthorClick(video.author.id)}
                    className="relative shrink-0"
                  >
                    <Avatar
                      userId={video.author.id}
                      src={video.author.avatarUrl}
                      name={video.author.fullName}
                      username={video.author.username}
                      avatarColor={video.author.avatarColor}
                      size="sm"
                      className="border-2 border-white/90 shadow-lg ring-2 ring-black/20"
                    />
                  </button>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => handleAuthorClick(video.author.id)}
                      className="text-white font-bold text-sm tracking-tight hover:underline truncate"
                    >
                      @{video.author.username}
                    </button>
                    {Number(String(video.author.id)) !== Number(String(currentUser?.id)) && (
                      <button className="px-4 py-1.5 bg-white/95 backdrop-blur-md text-black text-xs font-bold rounded-full hover:bg-white active:scale-95 transition-all shadow-lg">
                        Theo dõi
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-start gap-1">
                <p className={`text-white/95 text-[13px] leading-relaxed drop-shadow-sm ${expandedCaptions[index] ? "" : "line-clamp-2"}`}>
                  {video.description || ""}
                </p>
                {video.description && video.description.length > 90 && (
                    <button
                      onClick={() => toggleCaption(index)}
                      className="text-white/60 text-xs font-semibold hover:text-white transition"
                    >
                      {expandedCaptions[index] ? "Thu gọn" : "Xem thêm"}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5 text-white/85 text-xs font-medium">
                  <div className="relative w-6 h-6 shrink-0 rounded-full bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-indigo-500 animate-spin-slow shadow-lg" style={{ animationDuration: "5s" }} />
                  <span className="truncate">Original Audio — {video.author.fullName}</span>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 z-30 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleFullscreen}
                    className="shrink-0 w-9 h-9 rounded-full bg-black/40 backdrop-blur-xl ring-1 ring-white/20 flex items-center justify-center hover:bg-black/60 active:scale-90 transition-all"
                    title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4 text-white" /> : <Maximize2 className="w-4 h-4 text-white" />}
                  </button>
                  <div
                    className="flex-1 h-1.5 rounded-full bg-white/25 overflow-hidden cursor-pointer group"
                    onClick={(e) => handleSeek(e, index)}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0866ff] to-fuchsia-500 transition-[width] duration-150 group-hover:bg-gradient-to-r group-hover:from-lime-400 group-hover:to-fuchsia-400"
                      style={{ width: `${progressMap[index]?.duration ? (progressMap[index].current / progressMap[index].duration) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-white/85 text-[11px] font-semibold tabular-nums drop-shadow">
                    {progressMap[index]?.duration
                      ? `${formatTime(progressMap[index].current)} / ${formatTime(progressMap[index].duration)}`
                      : "0:00"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showComments && commentsFor !== null && (
        <>
          {/* Backdrop — click to close */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={closeComments}
          />

          {/* Comments Bottom Sheet / Right Sidebar */}
          <div
            className="fixed inset-x-0 bottom-0 z-50 h-[65dvh] w-full bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200 sm:right-0 sm:top-0 sm:bottom-0 sm:h-auto sm:w-[400px] sm:rounded-l-3xl sm:animate-in sm:slide-in-from-right sm:duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Bình luận</h3>
              <button
                onClick={closeComments}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition text-zinc-500 dark:text-zinc-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto overscroll-y-contain p-4 space-y-4">
              {commentLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-7 h-7 animate-spin text-zinc-400" />
                </div>
              ) : commentList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                    <MessageCircle className="w-6 h-6 text-zinc-400" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Chưa có bình luận nào</p>
                  <p className="text-xs text-zinc-400 mt-1">Hãy là người đầu tiên bình luận!</p>
                </div>
              ) : (
                commentList.map((comment) => {
                  const author = comment.user || {};
                  const authorName = author.fullName || author.username || "Người dùng";
                  const timeStr = comment.createdAt
                    ? (() => {
                        const diff = Date.now() - new Date(comment.createdAt).getTime();
                        const m = Math.floor(diff / 60000);
                        if (m < 1) return "vừa xong";
                        if (m < 60) return `${m}p`;
                        const h = Math.floor(m / 60);
                        if (h < 24) return `${h}h`;
                        const d = Math.floor(h / 24);
                        return `${d}d`;
                      })()
                    : "";
                  return (
                    <div key={comment.id} className="flex gap-3">
                      <div className="shrink-0">
                        <Avatar
                          userId={author.id}
                          src={author.avatarUrl}
                          name={authorName}
                          username={author.username}
                          avatarColor={author.avatarColor}
                          size="sm"
                          className="border border-zinc-200 dark:border-zinc-700 shadow-xs"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl rounded-tl-sm px-3.5 py-2.5 border border-zinc-200/60 dark:border-zinc-700/40">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{authorName}</span>
                            {author.username && (
                              <span className="text-[10px] text-zinc-400 truncate">@{author.username}</span>
                            )}
                            {timeStr && (
                              <>
                                <span className="text-zinc-400 text-[10px]">·</span>
                                <span className="text-[10px] text-zinc-400">{timeStr}</span>
                              </>
                            )}
                          </div>
                          <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed break-words whitespace-pre-wrap">{comment.content}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-1 pl-1">
                          <span className="text-[11px] text-zinc-400 font-medium">{comment.likesCount || 0} thích</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Input — fixed at bottom of sheet */}
            <form
              onSubmit={handleSubmitComment}
              className="shrink-0 p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 bg-white dark:bg-zinc-900"
            >
              <Avatar
                userId={currentUser?.id}
                src={currentUser?.avatarUrl}
                name={currentUser?.fullName || currentUser?.username}
                username={currentUser?.username}
                avatarColor={currentUser?.avatarColor}
                size="sm"
                className="border border-zinc-200 dark:border-zinc-700 shadow-xs shrink-0"
              />
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Viết bình luận công khai..."
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0866ff]/40"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmittingComment}
                className="p-2.5 rounded-full bg-[#0866ff] text-white hover:bg-[#0756d6] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center shrink-0"
              >
                {isSubmittingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-lg">Tải video lên</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <ShortVideoUpload
                onUploadSuccess={() => {
                  setShowUploadModal(false);
                  fetchVideoPosts();
                }}
                onCancel={() => setShowUploadModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {shareVideo && (
        <ShareModal
          post={shareVideo}
          onClose={() => setShareVideo(null)}
        />
      )}
    </div>
  );
}
