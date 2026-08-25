import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import {
  Home,
  Compass,
  Film,
  Headphones,
  Bookmark,
  User,
  Plus,
  Sparkles,
  TrendingUp,
  UserPlus,
  Heart,
  MessageCircle,
  Share2,
  Image,
  Video,
  Smile,
  MoreHorizontal,
  Flame,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import postService from "../services/postService";
import categoryService from "../services/categoryService";
import userService from "../services/userService";
import followService from "../services/followService";
import CreatePostModal from "../components/CreatePostModal";
import Avatar from "../components/Avatar";
import { toast } from "sonner";

const PAGE_SIZE = 15;

// ==========================================
// 1. LEFT SIDEBAR COMPONENT (NAVIGATION)
// ==========================================
export function LuxuryLeftSidebar({
  activeNav,
  setActiveNav,
  onOpenCreateModal,
}) {
  const { currentUser } = useAuth();
  const currentUserId = currentUser
    ? currentUser.id || currentUser.userId
    : null;

  const navItems = [
    { id: "home", label: "Trang chủ", icon: Home, path: "/" },
    { id: "explore", label: "Khám phá", icon: Compass, path: "/trending" },
    { id: "shorts", label: "Shorts Video", icon: Film, path: "/shorts" },
    {
      id: "soundscapes",
      label: "Trạm Âm Thanh",
      icon: Headphones,
      path: "/soundscapes",
    },
    { id: "saved", label: "Đã lưu trữ", icon: Bookmark, path: "/saved" },
    {
      id: "profile",
      label: "Trang cá nhân",
      icon: User,
      path: currentUserId ? `/profile/${currentUserId}` : "/login",
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16 p-2 z-20 select-none">
      <div className="flex flex-col h-full bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-3 shadow-2xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Nút Tạo bài viết mới với Viền Laser (BorderBeam) */}
        <div className="mb-6 relative group">
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-cyan-500 opacity-75 blur-sm group-hover:opacity-100 transition duration-500 animate-pulse" />
          <button
            onClick={onOpenCreateModal}
            className="relative w-full py-3.5 px-4 rounded-2xl bg-neutral-950 border border-white/20 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all duration-300 active:scale-95 group-hover:bg-neutral-900 cursor-pointer"
          >
            <div className="p-1 rounded-lg bg-gradient-to-tr from-rose-500 to-amber-400 text-white">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="tracking-wide bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              Đăng bài mới
            </span>
            <Sparkles className="w-4 h-4 text-amber-400 animate-bounce ml-auto" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1.5 flex-1 relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;

            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setActiveNav(item.id)}
                className={`relative flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? "text-white font-bold"
                    : "text-neutral-400 hover:text-neutral-100 hover:bg-white/5"
                }`}
              >
                {/* Slided Active Pill Glow Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 border border-white/15 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                <div
                  className={`relative z-10 p-2 rounded-xl transition-colors ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                      : "text-neutral-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <span className="relative z-10 tracking-wide text-sm">
                  {item.label}
                </span>

                {isActive && (
                  <div className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile preview */}
        {currentUser && (
          <div className="pt-3 border-t border-white/10 mt-auto">
            <Link
              to={`/profile/${currentUserId}`}
              className="flex items-center gap-3 p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-300"
            >
              <div className="relative p-[1px] rounded-full bg-gradient-to-r from-rose-500 to-cyan-400">
                <Avatar
                  userId={currentUserId}
                  src={currentUser.avatarUrl}
                  name={currentUser.fullName || currentUser.username}
                  size="sm"
                  className="w-8 h-8 rounded-full"
                />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-white truncate">
                  {currentUser.fullName || currentUser.username}
                </span>
                <span className="text-[10px] text-neutral-400 truncate">
                  @{currentUser.username || "web3user"}
                </span>
              </div>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}

// ==========================================
// 2. STORY HIGHLIGHTS BAR
// ==========================================
export function LuxuryStoryBar() {
  const stories = [
    {
      id: 0,
      isUser: true,
      name: "Tạo tin",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    },
    {
      id: 1,
      name: "Elena Vance",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    },
    {
      id: 2,
      name: "Cyberpunk",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
    {
      id: 3,
      name: "Aria Thorne",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    },
    {
      id: 4,
      name: "Lucas Vance",
      avatar:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
    },
    {
      id: 5,
      name: "Sophia Li",
      avatar:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150",
    },
  ];

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 mb-4">
      <div className="flex items-center gap-3.5 px-1">
        {stories.map((story) => (
          <motion.div
            key={story.id}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
          >
            {story.isUser ? (
              <div className="relative w-14 h-14 rounded-full p-[2px] border-2 border-dashed border-cyan-500/50 flex items-center justify-center bg-neutral-900 group-hover:border-cyan-400 transition-colors">
                <Avatar
                  src={story.avatar}
                  size="md"
                  className="w-full h-full rounded-full object-cover"
                />
                <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-cyan-500 border-2 border-neutral-950 flex items-center justify-center text-black">
                  <Plus className="w-3 h-3 stroke-[3]" />
                </div>
              </div>
            ) : (
              <div className="relative w-14 h-14 rounded-full p-[2.5px] bg-gradient-to-tr from-cyan-400 via-rose-500 to-amber-400 shadow-[0_0_12px_rgba(34,211,238,0.3)]">
                <div className="w-full h-full rounded-full p-[1.5px] bg-neutral-950">
                  <img
                    src={story.avatar}
                    alt={story.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
            )}
            <span className="text-[11px] font-medium text-neutral-300 group-hover:text-white transition-colors truncate max-w-[64px] text-center">
              {story.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 3. QUICK COMPOSER BOX
// ==========================================
export function LuxuryQuickComposer({ onOpenModal }) {
  const { currentUser } = useAuth();
  const currentUserId = currentUser
    ? currentUser.id || currentUser.userId
    : null;

  return (
    <div
      onClick={onOpenModal}
      className="w-full mb-6 p-4 rounded-3xl bg-neutral-900/60 backdrop-blur-xl border border-white/10 shadow-2xl cursor-pointer transition-all duration-300 hover:border-white/20 group"
    >
      <div className="flex items-center gap-3">
        <Avatar
          userId={currentUserId}
          src={currentUser?.avatarUrl}
          name={currentUser?.fullName || currentUser?.username}
          size="sm"
          className="w-10 h-10 rounded-full border border-white/10"
        />
        <div className="flex-1 py-2.5 px-4 rounded-2xl bg-neutral-950/80 border border-white/5 text-neutral-400 text-xs font-medium group-hover:text-neutral-200 transition-colors flex items-center justify-between">
          <span>Bạn đang nghĩ gì về Web3 / Social hôm nay...?</span>
          <Sparkles className="w-4 h-4 text-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 text-xs transition"
          >
            <Image className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hình ảnh</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 text-xs transition"
          >
            <Video className="w-3.5 h-3.5 text-rose-400" />
            <span>Video</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 text-xs transition"
          >
            <Smile className="w-3.5 h-3.5 text-amber-400" />
            <span>Cảm xúc</span>
          </button>
        </div>

        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          Đăng nhanh ✦
        </span>
      </div>
    </div>
  );
}

// ==========================================
// 4. 3D TILT LUXURY POST CARD
// ==========================================
export function Luxury3DPostCard({ post }) {
  const cardRef = useRef(null);
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(
    post.likesCount || post.likeCount || 0,
  );
  const [bookmarked, setBookmarked] = useState(post.isBookmarked || false);
  const [particles, setParticles] = useState([]);

  // 3D Tilt Coordinates
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-150, 150], [5, -5]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-150, 150], [-5, 5]), {
    stiffness: 300,
    damping: 30,
  });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleLike = (e) => {
    e.stopPropagation();
    const nextState = !liked;
    setLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    if (nextState) {
      const newParticles = Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        x: Math.cos((i / 8) * Math.PI * 2) * 28,
        y: Math.sin((i / 8) * Math.PI * 2) * 28,
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }

    if (post.id) {
      postService.likePost(post.id).catch(() => {});
    }
  };

  const authorName =
    post.user?.fullName ||
    post.user?.username ||
    post.author?.name ||
    "Tác giả";
  const authorAvatar = post.user?.avatarUrl || post.author?.avatar;
  const createdAtStr = post.createdAt
    ? new Date(post.createdAt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Vừa xong";

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="relative w-full mb-6 rounded-3xl bg-neutral-900/60 backdrop-blur-xl border border-white/10 p-5 shadow-2xl transition-all duration-200 hover:border-white/20 overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative p-[1.5px] rounded-full bg-gradient-to-tr from-cyan-400 via-rose-500 to-amber-400">
            <Avatar
              src={authorAvatar}
              name={authorName}
              size="md"
              className="w-10 h-10 rounded-full object-cover border border-neutral-950"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white tracking-wide">
                {authorName}
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                VIP
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              {createdAtStr} • 🌐 Public
            </p>
          </div>
        </div>

        <button
          type="button"
          className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Post Text Content */}
      <p className="text-sm text-neutral-200 leading-relaxed mb-4 relative z-10 whitespace-pre-line">
        {post.content || post.title}
      </p>

      {/* Media Attachment */}
      {post.imageUrl && (
        <div className="relative rounded-2xl overflow-hidden mb-4 border border-white/10 relative z-10 group/img">
          <img
            src={post.imageUrl}
            alt="Media"
            className="w-full max-h-[440px] object-cover transition-transform duration-700 group-hover/img:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
        </div>
      )}

      {/* Interaction Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            type="button"
            className={`relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all duration-300 cursor-pointer ${
              liked
                ? "border-rose-500/40 bg-rose-500/15 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                : "border-white/10 bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={liked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
              >
                <Heart
                  className={`w-4 h-4 ${liked ? "fill-rose-500 stroke-rose-500" : "fill-none stroke-current"}`}
                />
              </motion.div>

              <AnimatePresence>
                {liked &&
                  particles.map((p) => (
                    <motion.span
                      key={p.id}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute w-1.5 h-1.5 rounded-full bg-rose-400 pointer-events-none"
                    />
                  ))}
              </AnimatePresence>
            </div>
            <span className="text-xs font-semibold">{likesCount}</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs font-semibold">
              {post.commentCount || post.commentsCount || 0}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setBookmarked(!bookmarked)}
            type="button"
            className={`p-2 rounded-full border transition-all cursor-pointer ${
              bookmarked
                ? "border-amber-500/40 bg-amber-500/15 text-amber-400"
                : "border-white/10 bg-white/5 text-neutral-400 hover:text-white"
            }`}
          >
            <Bookmark
              className={`w-4 h-4 ${bookmarked ? "fill-amber-400" : ""}`}
            />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            className="p-2 rounded-full border border-white/10 bg-white/5 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ==========================================
// 5. RIGHT SIDEBAR (TRENDING & SUGGESTIONS)
// ==========================================
export function LuxuryRightSidebar({
  suggestedUsers,
  followingIds,
  onToggleFollow,
}) {
  const trendingTopics = [
    { rank: "01", tag: "#Web3Social", posts: "12.8k bài viết", isHot: true },
    { rank: "02", tag: "#AwwwardsUI", posts: "8.4k bài viết", isHot: true },
    { rank: "03", tag: "#React19", posts: "5.1k bài viết", isHot: false },
    { rank: "04", tag: "#TailwindCSS", posts: "4.2k bài viết", isHot: false },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-80 shrink-0 h-[calc(100vh-4rem)] sticky top-16 p-2 z-20 select-none">
      <div className="flex flex-col gap-5 overflow-y-auto no-scrollbar">
        {/* Bento Mini Trending Topics */}
        <div className="p-4 rounded-3xl bg-neutral-900/60 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Xu hướng nổi bật
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Bento Mini
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {trendingTopics.map((topic) => (
              <div
                key={topic.rank}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-300 flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-neutral-500 group-hover:text-cyan-400 transition-colors">
                    {topic.rank}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-200 group-hover:text-white transition-colors">
                      {topic.tag}
                    </h4>
                    <p className="text-[10px] text-neutral-400">
                      {topic.posts}
                    </p>
                  </div>
                </div>

                {topic.isHot && (
                  <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Suggested Followers List */}
        <div className="p-4 rounded-3xl bg-neutral-900/60 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-rose-400" />
              Gợi ý kết nối
            </h3>
            <Link
              to="/friends"
              className="text-[11px] text-cyan-400 hover:underline"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {suggestedUsers.map((user) => {
              const isFollowing = followingIds.includes(Number(user.id));
              const name = user.fullName || user.username;

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-2xl hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      userId={user.id}
                      src={user.avatarUrl}
                      name={name}
                      size="sm"
                      className="w-8 h-8 rounded-full border border-white/10"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">
                        {name}
                      </span>
                      <span className="text-[10px] text-neutral-400 truncate">
                        @{user.username}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleFollow(user)}
                    type="button"
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 shrink-0 cursor-pointer ${
                      isFollowing
                        ? "bg-white/10 text-neutral-300 border border-white/10"
                        : "border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                    }`}
                  >
                    {isFollowing ? "Đang theo dõi" : "+ Theo dõi"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

// ==========================================
// MAIN FEED PAGE COMPONENT
// ==========================================
export default function Feed() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser
    ? currentUser.id || currentUser.userId
    : null;

  const [activeNav, setActiveNav] = useState("home");
  const [activeTab, setActiveTab] = useState("forYou");
  const [posts, setPosts] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const bottomObserverRef = useRef(null);

  // Fetch Following IDs
  const loadFollowing = useCallback(() => {
    if (currentUserId) {
      followService
        .getFollowingIds(currentUserId)
        .then((res) => {
          const ids = Array.isArray(res.data) ? res.data.map(Number) : [];
          setFollowingIds(ids);
        })
        .catch(() => {});
    }
  }, [currentUserId]);

  useEffect(() => {
    loadFollowing();
  }, [loadFollowing]);

  // Fetch Suggested Users
  useEffect(() => {
    userService
      .getAll("", 0, 6)
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.content || [];
        setSuggestedUsers(
          list.filter((u) => Number(u.id) !== Number(currentUserId)),
        );
      })
      .catch(() => {});
  }, [currentUserId]);

  // Fetch Posts
  const fetchPosts = useCallback(async (pageNum = 0) => {
    if (pageNum === 0) setLoading(true);

    try {
      const res = await postService.getAll(pageNum, PAGE_SIZE);
      const data = res.data;
      const newItems = Array.isArray(data) ? data : data.content || [];

      if (pageNum === 0) setPosts(newItems);
      else setPosts((prev) => [...prev, ...newItems]);

      setHasMore(newItems.length >= PAGE_SIZE);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(0);
  }, [fetchPosts]);

  // Toggle Follow Handler
  const handleToggleFollow = async (targetUser) => {
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập!");
      return;
    }

    const idNum = Number(targetUser.id);
    const isFollowing = followingIds.includes(idNum);

    if (isFollowing) {
      setFollowingIds((prev) => prev.filter((id) => id !== idNum));
      await followService.unfollowUser(targetUser.id).catch(() => {});
    } else {
      setFollowingIds((prev) => [...prev, idNum]);
      await followService.followUser(targetUser.id).catch(() => {});
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#09090b] text-white font-sans selection:bg-rose-500/30">
      <div className="max-w-[1380px] mx-auto flex gap-6 px-4 py-4 justify-center">
        {/* 1. LEFT SIDEBAR */}
        <LuxuryLeftSidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
        />

        {/* 2. CENTER FEED */}
        <main className="flex-1 max-w-[640px] min-w-0 flex flex-col">
          <LuxuryStoryBar />
          <LuxuryQuickComposer onOpenModal={() => setIsCreateModalOpen(true)} />

          {/* Tab Switcher */}
          <div className="flex p-1 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-xl mb-6">
            <button
              onClick={() => setActiveTab("forYou")}
              type="button"
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "forYou"
                  ? "bg-white/10 text-white shadow-lg"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              ✨ Dành cho bạn
            </button>
            <button
              onClick={() => setActiveTab("following")}
              type="button"
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "following"
                  ? "bg-white/10 text-white shadow-lg"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              👥 Đang theo dõi
            </button>
          </div>

          {/* Posts Feed List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span className="text-xs">
                Đang tải dữ liệu Bảng tin Luxury...
              </span>
            </div>
          ) : (
            <div className="flex flex-col w-full">
              {posts.map((post) => (
                <Luxury3DPostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {hasMore && (
            <div
              ref={bottomObserverRef}
              className="py-8 flex justify-center text-neutral-500"
            >
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            </div>
          )}
        </main>

        {/* 3. RIGHT SIDEBAR */}
        <LuxuryRightSidebar
          suggestedUsers={suggestedUsers}
          followingIds={followingIds}
          onToggleFollow={handleToggleFollow}
        />
      </div>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={(newPost) => {
          setIsCreateModalOpen(false);
          if (newPost) setPosts((prev) => [newPost, ...prev]);
        }}
      />
    </div>
  );
}
