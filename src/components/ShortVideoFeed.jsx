import { useState, useRef, useEffect, useCallback } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Play, Pause, Volume2, VolumeX, Plus, X, Loader2, Video } from "lucide-react";
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

  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
        <h1 className="text-white font-bold text-xl">Shorts</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="text-white hover:bg-white/20 p-2 rounded-full transition"
            title="Tải video lên"
          >
            <Plus className="w-6 h-6" />
          </button>
          <button
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/20 p-2 rounded-full transition"
          >
            <X className="w-6 h-6" />
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
            />

            {/* Play/Pause Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {videoRefs.current[index]?.paused && (
                <div className="w-20 h-20 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-10 h-10 text-white fill-white ml-1" />
                </div>
              )}
            </div>

            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className="absolute right-4 top-24 p-3 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition z-10"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-10">
              {/* Like */}
              <button
                onClick={() => handleLike(video.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={`w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center transition ${video.isLiked ? 'bg-rose-500/50' : 'group-hover:bg-black/50'}`}>
                  <Heart className={`w-6 h-6 ${video.isLiked ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
                </div>
                <span className="text-white text-xs font-semibold">{video.likes.toLocaleString()}</span>
              </button>

              {/* Comment */}
              <button
                onClick={() => handleComment(video.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/50 transition">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">{video.comments}</span>
              </button>

              {/* Share */}
              <button
                onClick={() => handleShare(video.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/50 transition">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">{video.shares}</span>
              </button>

              {/* More */}
              <button className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/50 transition">
                  <MoreHorizontal className="w-6 h-6 text-white" />
                </div>
              </button>
            </div>

            {/* Bottom Info */}
            <div className="absolute left-4 right-20 bottom-24 z-10">
              {/* Author Info */}
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => handleAuthorClick(video.author.id)}
                  className="relative"
                >
                  <Avatar
                    userId={video.author.id}
                    src={video.author.avatarUrl}
                    name={video.author.fullName}
                    username={video.author.username}
                    avatarColor={video.author.avatarColor}
                    size="sm"
                    className="border-2 border-white"
                  />
                </button>
                <div>
                  <button
                    onClick={() => handleAuthorClick(video.author.id)}
                    className="text-white font-bold text-sm hover:underline"
                  >
                    @{video.author.username}
                  </button>
                  {Number(String(video.author.id)) !== Number(String(currentUser?.id)) && (
                    <button className="ml-2 px-3 py-1 bg-[#0866ff] text-white text-xs font-bold rounded-full hover:bg-[#0756d6] transition">
                      Follow
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-white text-sm mb-2 line-clamp-2">{video.description}</p>

              {/* Music/Track Info */}
              <div className="flex items-center gap-2 text-white/80 text-xs">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 animate-spin-slow" />
                <span>Original Audio - {video.author.fullName}</span>
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
