import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Film, Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import postService from "../services/postService";
import { isVideoUrl } from "../utils/mediaUtils";

/**
 * ReelCard: Từng thẻ video ngắn với logic Preview thông minh tối giản:
 * - Không chứa bất kỳ overlay chữ/avatar/số liệu nào, chỉ hiển thị video/thumbnail tràn viền.
 * - PC / Desktop: Di chuột (Hover) để tự động phát xem trước, di chuột ra ngoài sẽ tạm dừng và quay về đầu.
 * - Mobile / Cảm ứng: Tự động phát lặp lại 5 giây đầu tiên khi thẻ lọt vào tầm nhìn màn hình (IntersectionObserver).
 * - Chính giữa thẻ có nút Play icon mờ (tự động ẩn đi khi đang phát).
 */
function ReelCard({ reel, index, onReelClick }) {
  const videoRef = useRef(null);
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const isTouchDevice =
    typeof window !== "undefined" &&
    (window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window);

  // IntersectionObserver cho thiết bị di động (Chỉ phát khi thẻ cuộn vào khung hình)
  useEffect(() => {
    if (!isTouchDevice || !cardRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.6 }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [isTouchDevice]);

  // Tự động phát 5s trên Mobile khi thẻ đang nằm trong viewport
  useEffect(() => {
    if (!isTouchDevice || !videoRef.current) return;
    if (isVisible) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isVisible, isTouchDevice]);

  // Sự kiện Hover trên Desktop / PC
  const handleMouseEnter = () => {
    if (isTouchDevice) return;
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (isTouchDevice) return;
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  // Giới hạn xem trước 5 giây đầu dạng vòng lặp
  const handleTimeUpdate = (e) => {
    if (e.currentTarget.currentTime >= 5) {
      e.currentTarget.currentTime = 0;
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onReelClick(reel, index)}
      className="group/card relative w-32 sm:w-40 aspect-[9/16] shrink-0 rounded-2xl overflow-hidden border border-zinc-200/90 dark:border-zinc-800/90 bg-zinc-950 shadow-sm hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer select-none"
    >
      {/* Video Preview tràn khung 100% */}
      <video
        ref={videoRef}
        src={reel.url}
        muted
        playsInline
        loop
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        className="w-full h-full object-cover object-center block"
      />

      {/* Center Play Button Overlay (Tự ẩn khi Hover phát trên PC hoặc đang phát trên Mobile) */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div
          className={`w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all duration-200 shadow-md ${
            isHovered || isVisible
              ? "opacity-0 scale-75"
              : "opacity-80 group-hover/card:opacity-100 group-hover/card:scale-110"
          }`}
        >
          <Play className="w-4 h-4 fill-white ml-0.5" />
        </div>
      </div>
    </div>
  );
}

export default function ReelsCarousel() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const navigate = useNavigate();

  // Trạng thái hiển thị — đọc từ localStorage để nhớ qua phiên
  const [isCarouselVisible, setIsCarouselVisible] = useState(
    () => localStorage.getItem("hideReelsCarousel") !== "true"
  );

  const handleDismiss = () => {
    localStorage.setItem("hideReelsCarousel", "true");
    setIsCarouselVisible(false);
  };

  useEffect(() => {
    let mounted = true;
    const fetchReels = async () => {
      setLoading(true);
      try {
        const res = await postService.getReelsCarousel(12);
        const list = Array.isArray(res.data) ? res.data : res.data?.content || [];

        // Filter and format video posts
        const videoList = list
          .filter(
            (p) =>
              p.mediaType === "video" ||
              p.videoUrl ||
              (p.thumbNail && isVideoUrl(p.thumbNail)) ||
              (Array.isArray(p.imageUrls) && p.imageUrls.some(isVideoUrl))
          )
          .map((post) => ({
            id: post.id,
            url: post.videoUrl || post.thumbNail || post.imageUrls?.[0] || "",
            title: post.title || post.content || "Video ngắn",
            author: {
              id: post.user?.id || post.userId,
              username: post.user?.username || "user",
              fullName: post.user?.fullName || post.user?.username || "Người dùng",
              avatarUrl: post.user?.avatarUrl,
              avatarColor: post.user?.avatarColor,
            },
            likes: post.likesCount || 0,
            views: post.viewCount || 0,
            comments: post.commentsCount || 0,
            shares: post.sharesCount || 0,
            isLiked: post.likedByMe || false,
          }));

        if (mounted) {
          setReels(videoList);
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách reels carousel:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchReels();
    return () => {
      mounted = false;
    };
  }, []);

  // Check scroll position to toggle left/right arrows
  const checkScrollability = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const handleScroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const offset = direction === "left" ? -340 : 340;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  const handleReelClick = (reel, index) => {
    navigate("/shorts", {
      state: {
        initialVideoId: reel.id,
        initialVideos: reels,
        startIndex: index,
      },
    });
  };

  if (!loading && reels.length === 0) {
    return null; // Không hiển thị nếu không có video
  }

  if (!isCarouselVisible) {
    return null; // Đã bị ẩn theo lựa chọn của người dùng
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs p-3.5 flex flex-col gap-3 relative group/carousel overflow-hidden my-1">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 text-white flex items-center justify-center shadow-xs">
            <Film className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              Reels
            </span>
            <span className="text-[11px] text-zinc-400">Xem thước phim ngắn đề xuất cho bạn</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/shorts"
            className="text-xs font-semibold text-[#0866ff] hover:underline flex items-center gap-1"
          >
            <span>Xem tất cả</span>
            <span>→</span>
          </Link>
          {/* Nút đóng / ẩn Carousel */}
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
            title="Ẩn Reels"
            aria-label="Đóng Reels Carousel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop Navigation Arrows */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll("left")}
          className="hidden md:flex absolute left-2 top-[56%] -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 dark:bg-zinc-800/95 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-xl items-center justify-center hover:scale-110 active:scale-95 transition cursor-pointer backdrop-blur-md"
          title="Cuộn sang trái"
          aria-label="Previous reels"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll("right")}
          className="hidden md:flex absolute right-2 top-[56%] -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 dark:bg-zinc-800/95 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-xl items-center justify-center hover:scale-110 active:scale-95 transition cursor-pointer backdrop-blur-md"
          title="Cuộn sang phải"
          aria-label="Next reels"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Horizontal Scroll Cards Feed */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollability}
        className="flex gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 touch-pan-x overscroll-x-contain"
      >
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-32 sm:w-40 aspect-[9/16] shrink-0 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse border border-zinc-200 dark:border-zinc-800 flex items-center justify-center"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              </div>
            ))
          : reels.map((reel, index) => (
              <ReelCard
                key={reel.id}
                reel={reel}
                index={index}
                onReelClick={handleReelClick}
              />
            ))}
      </div>
    </div>
  );
}
