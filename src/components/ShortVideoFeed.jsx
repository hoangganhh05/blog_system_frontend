import { useState, useRef, useEffect, useCallback } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Plus, X, Loader2, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import ShortVideoUpload from "./ShortVideoUpload";
import postService from "../services/postService";
import { isVideoUrl } from "../utils/mediaUtils";

export default function ShortVideoFeed() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [progressMap, setProgressMap] = useState({}); // index -> { current, duration }
  const [expandedCaptions, setExpandedCaptions] = useState({}); // index -> bool
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRefs = useRef([]);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Fetch real video posts from the API — no mock/fixed data
  const fetchVideoPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await postService.getAll(0, 50);
      const allPosts = res.data?.content || res.data || [];
      // Filter and transform video posts
      const videoPosts = allPosts
        .filter((post) => 
          post.mediaType === 'video' || 
          post.videoUrl || 
          (post.thumbNail && isVideoUrl(post.thumbNail))
        )
        .map((post) => ({
          id: post.id,
          url: post.videoUrl || post.imageUrls?.[0] || post.thumbNail,
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
          isLiked: false
        }));
      setVideos(videoPosts);
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideoPosts();
  }, [fetchVideoPosts]);

  // Intersection Observer for auto-play/pause
  useEffect(() => {
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
          }
        });
      },
      {
        threshold: 0.7,
        root: containerRef.current
      }
    );

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => {
      videoRefs.current.forEach((video) => {
        if (video) observer.unobserve(video);
      });
    };
  }, [videos]);

  const handleLike = (videoId) => {
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
  };

  const handleShare = (videoId) => {
    const video = videos.find((v) => v.id === videoId);
    if (navigator.share && video) {
      navigator.share({
        title: video.description,
        text: `Xem video ngắn từ ${video.author.fullName}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleComment = (videoId) => {
    setShowComments(true);
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted((prev) => !prev);
    videoRefs.current.forEach((video) => {
      if (video) video.muted = !isMuted;
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

  // Track playback progress for the seekable progress bar
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

  // Seek the video to a percentage of playback
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

  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      {/* Header — glass pill with safe-area top inset */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
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
        className="h-full overflow-y-scroll scroll-smooth snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {loading ? (
          <div className="w-full h-screen flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
              <span className="text-white text-sm">Đang tải video...</span>
            </div>
          </div>
        ) : videos.length === 0 ? (
          <div className="w-full h-screen flex items-center justify-center bg-black">
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
            className="relative w-full h-screen snap-start overflow-hidden bg-black"
            style={{ scrollSnapAlign: "start" }}
          >
            {/* Video Element — absolute-fill + object-cover keeps the 9:16/16:9 ratio without distortion */}
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              src={video.url}
              className="absolute inset-0 w-full h-full object-cover object-center"
              loop
              muted={isMuted}
              playsInline
              onClick={(e) => togglePlay(e, index)}
              onTimeUpdate={(e) => handleTimeUpdate(e, index)}
            />

            {/* Cinematic scrims for readability on any frame */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 via-black/10 to-transparent pointer-events-none z-[5]" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none z-[5]" />

            {/* Play/Pause Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[10]">
              {videoRefs.current[index]?.paused && (
                <div className="w-24 h-24 rounded-full bg-black/40 backdrop-blur-xl ring-2 ring-white/20 flex items-center justify-center shadow-2xl animate-scale-in">
                  <Play className="w-12 h-12 text-white fill-white ml-1 drop-shadow-lg" />
                </div>
              )}
            </div>

            {/* Mute Button — part of top-right control cluster */}
            <div className="absolute right-4 top-20 z-20 flex flex-col items-center gap-3">
              <button
                onClick={toggleMute}
                className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-xl ring-1 ring-white/20 text-white flex items-center justify-center hover:bg-black/60 active:scale-90 transition-all shadow-lg"
                title={isMuted ? "Bật tiếng" : "Tắt tiếng"}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            {/* Right Side Actions — glass action rail */}
            <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-20">
              {/* Like */}
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

              {/* Comment */}
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

              {/* Share */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={() => handleShare(video.id)}
                  className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl ring-1 ring-white/20 flex items-center justify-center hover:bg-black/60 active:scale-90 transition-all shadow-lg"
                  title="Chia sẻ"
                >
                  <Share2 className="w-6 h-6 text-white" />
                </button>
                <span className="text-white text-[11px] font-bold drop-shadow">{formatCount(video.shares)}</span>
              </div>

              {/* More */}
              <button className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-xl ring-1 ring-white/20 flex items-center justify-center hover:bg-black/60 active:scale-90 transition-all shadow-lg" title="Xem thêm">
                <MoreHorizontal className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Bottom Info — refined typography & spacing */}
            <div className="absolute left-4 right-[4.25rem] bottom-24 z-20 flex flex-col gap-3">
              {/* Author Info */}
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

              {/* Description — collapsible */}
              <div className="flex flex-col items-start gap-1">
                <p className={`text-white/95 text-[13px] leading-relaxed drop-shadow-sm ${expandedCaptions[index] ? "" : "line-clamp-2"}`}>
                  {video.description || "Video ngắn"}
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

              {/* Music/Track Info */}
              <div className="flex items-center gap-2.5 text-white/85 text-xs font-medium">
                <div className="relative w-6 h-6 shrink-0 rounded-full bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-indigo-500 animate-spin-slow shadow-lg" style={{ animationDuration: "5s" }} />
                <span className="truncate">Original Audio — {video.author.fullName}</span>
              </div>
            </div>

            {/* Bottom progress + fullscreen bar — seekable progress with timestamp */}
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
        )))}
      </div>

      {/* Comments Modal (placeholder) */}
      {showComments && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end justify-center">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-t-3xl p-4 animate-in slide-in-from-bottom-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Bình luận</h3>
              <button onClick={() => setShowComments(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                ✕
              </button>
            </div>
            <div className="text-center text-zinc-500 py-8">
              Tính năng bình luận đang phát triển...
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
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
                  // Refetch the real post list from the API so the new video shows real data
                  fetchVideoPosts();
                }}
                onCancel={() => setShowUploadModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
