import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import postService from "../services/postService";
import categoryService from "../services/categoryService";
import friendService from "../services/friendService";
import userService from "../services/userService";
import followService from "../services/followService";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import PostSkeleton from "../components/PostSkeleton";
import EmptyState from "../components/EmptyState";
import StoryBar from "../components/StoryBar";
import QuickComposer from "../components/QuickComposer";
import ReelsCarousel from "../components/ReelsCarousel";
import Avatar from "../components/Avatar";
import {
  Loader2,
  MessageSquare,
  Users,
  UserPlus,
  Compass,
  Sparkles,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Home() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser
    ? currentUser.id || currentUser.userId
    : null;

  const [searchParams] = useSearchParams();
  const searchValue = searchParams.get("q") || "";

  const [activeTab, setActiveTab] = useState("forYou"); // "forYou" | "following"
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const isFetchingRef = useRef(false);

  // Fetch categories
  useEffect(() => {
    categoryService
      .getAll()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  // Fetch following IDs directly from Database via Backend API
  const loadFollowingList = useCallback(() => {
    if (currentUserId) {
      followService
        .getFollowingIds(currentUserId)
        .then((res) => {
          const ids = Array.isArray(res.data) ? res.data.map(Number) : [];
          setFollowingIds(ids);
        })
        .catch(() => {
          // Fallback to friend list if follows table is newly created
          friendService
            .getFriendsList(currentUserId)
            .then((res) => {
              const list = Array.isArray(res.data) ? res.data : [];
              const ids = list
                .map((u) => Number(u.id || u.friendId || u.userId))
                .filter(Boolean);
              setFollowingIds(ids);
            })
            .catch(() => setFollowingIds([]));
        });
    } else {
      setFollowingIds([]);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadFollowingList();
  }, [loadFollowingList]);

  // Sync follow state across components
  useEffect(() => {
    const handleFollowChange = (e) => {
      const { targetUserId, isFollowing } = e.detail || {};
      if (!targetUserId) return;
      setFollowingIds((prev) => {
        const idNum = Number(targetUserId);
        if (isFollowing) {
          return prev.includes(idNum) ? prev : [...prev, idNum];
        } else {
          return prev.filter((id) => id !== idNum);
        }
      });
    };

    window.addEventListener("follow_state_changed", handleFollowChange);
    return () =>
      window.removeEventListener("follow_state_changed", handleFollowChange);
  }, []);

  // Fetch suggested friends
  useEffect(() => {
    userService
      .getAll("", 0, 8)
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.content || [];
        const filtered = list
          .filter((u) => Number(u.id) !== Number(currentUserId))
          .slice(0, 6);
        setSuggestedUsers(filtered);
      })
      .catch(() => {});
  }, [currentUserId]);

  // Toggle follow/unfollow with Optimistic UI
  const handleToggleFollow = async (targetUser) => {
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập để theo dõi tác giả này!");
      return;
    }

    const targetIdNum = Number(targetUser.id);
    const isCurrentlyFollowing = followingIds.includes(targetIdNum);
    const targetName = targetUser.fullName || targetUser.username;

    // 1. Optimistic Update (Immediate UI response)
    if (isCurrentlyFollowing) {
      setFollowingIds((prev) => prev.filter((id) => id !== targetIdNum));
      toast.info(`Đã hủy theo dõi ${targetName}`);
      window.dispatchEvent(
        new CustomEvent("follow_state_changed", {
          detail: { targetUserId: targetIdNum, isFollowing: false },
        }),
      );
      try {
        await followService.unfollowUser(targetUser.id);
      } catch {
        // Rollback
        setFollowingIds((prev) => [...prev, targetIdNum]);
        toast.error("Không thể hủy theo dõi lúc này!");
        window.dispatchEvent(
          new CustomEvent("follow_state_changed", {
            detail: { targetUserId: targetIdNum, isFollowing: true },
          }),
        );
      }
    } else {
      setFollowingIds((prev) => [...prev, targetIdNum]);
      toast.success(`Đang theo dõi ${targetName}!`);
      window.dispatchEvent(
        new CustomEvent("follow_state_changed", {
          detail: { targetUserId: targetIdNum, isFollowing: true },
        }),
      );
      try {
        await followService.followUser(targetUser.id);
      } catch {
        // Rollback
        setFollowingIds((prev) => prev.filter((id) => id !== targetIdNum));
        toast.error("Không thể theo dõi lúc này!");
        window.dispatchEvent(
          new CustomEvent("follow_state_changed", {
            detail: { targetUserId: targetIdNum, isFollowing: false },
          }),
        );
      }
    }
  };

  // Fetch posts
  const fetchPosts = useCallback(
    async (pageNum = 0, isReset = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);

      try {
        let res;
        if (searchValue && searchValue.trim()) {
          res = await postService.search(
            searchValue.trim(),
            pageNum,
            PAGE_SIZE,
          );
        } else {
          res = await postService.getAll(pageNum, PAGE_SIZE);
        }

        const data = res.data;
        const newItems = Array.isArray(data) ? data : data.content || [];
        const moreAvailable = Array.isArray(data)
          ? newItems.length >= PAGE_SIZE
          : !data.last && data.number + 1 < data.totalPages;

        if (isReset || pageNum === 0) {
          setPosts(newItems);
        } else {
          setPosts((prev) => {
            const map = new Map();
            prev.forEach((p) => map.set(p.id, p));
            newItems.forEach((p) => map.set(p.id, p));
            return Array.from(map.values());
          });
        }

        setHasMore(moreAvailable);
        setPage(pageNum);
      } catch {
        // Error handling
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [searchValue],
  );

  // Infinite scroll bottom observer ref
  const bottomObserverRef = useRef(null);

  // Setup IntersectionObserver for smooth Infinite Scroll
  useEffect(() => {
    if (!bottomObserverRef.current || !hasMore || loading || loadingMore)
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingRef.current) {
          fetchPosts(page + 1);
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(bottomObserverRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page]);

  // Initial load
  useEffect(() => {
    fetchPosts(0, true);
  }, [fetchPosts, searchValue]);

  // Tab switching handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "following") {
      loadFollowingList();
      if (hasMore && !isFetchingRef.current) {
        fetchPosts(page + 1);
      }
    }
  };

  // Listen for refresh feed and global post events
  useEffect(() => {
    const handleRefresh = () => {
      loadFollowingList();
      fetchPosts(0, true);
    };

    const handleGlobalDelete = (e) => {
      const { postId } = e.detail || {};
      if (postId) {
        setPosts((prev) => prev.filter((p) => Number(p.id) !== Number(postId)));
      }
    };

    const handleGlobalUpdate = (e) => {
      const { post: updated } = e.detail || {};
      if (updated?.id) {
        setPosts((prev) =>
          prev.map((p) =>
            Number(p.id) === Number(updated.id) ? { ...p, ...updated } : p,
          ),
        );
      }
    };

    const handleGlobalCreated = (e) => {
      const { post: newPost } = e.detail || {};
      if (newPost?.id) {
        setPosts((prev) => [
          newPost,
          ...prev.filter((p) => Number(p.id) !== Number(newPost.id)),
        ]);
      }
    };

    window.addEventListener("refresh_feed_posts", handleRefresh);
    window.addEventListener("post_created", handleGlobalCreated);
    window.addEventListener("post_deleted", handleGlobalDelete);
    window.addEventListener("post_updated", handleGlobalUpdate);
    return () => {
      window.removeEventListener("refresh_feed_posts", handleRefresh);
      window.removeEventListener("post_created", handleGlobalCreated);
      window.removeEventListener("post_deleted", handleGlobalDelete);
      window.removeEventListener("post_updated", handleGlobalUpdate);
    };
  }, [fetchPosts, loadFollowingList]);

  const handlePostCreated = (newPost) => {
    if (newPost) {
      setPosts((prev) => [newPost, ...prev]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDeletePost = (deletedId) => {
    setPosts((prev) => prev.filter((p) => Number(p.id) !== Number(deletedId)));
  };

  const handleEditPost = (updatedPost) => {
    if (!updatedPost?.id) return;
    setPosts((prev) =>
      prev.map((p) =>
        Number(p.id) === Number(updatedPost.id) ? { ...p, ...updatedPost } : p,
      ),
    );
  };

  // Filter posts based on following state directly from Database
  const displayedPosts = useMemo(() => {
    if (activeTab === "following") {
      if (!currentUserId) return [];
      const followingSet = new Set(followingIds);
      return posts.filter((p) => {
        const authorId = Number(p.user?.id || p.author?.id);
        return authorId === Number(currentUserId) || followingSet.has(authorId);
      });
    }
    return posts;
  }, [posts, activeTab, followingIds, currentUserId]);

  const filteredDisplayedPosts = useMemo(() => {
    if (selectedCategory === null) return displayedPosts;
    return displayedPosts.filter((p) => {
      const catId = Number(p.category?.id || p.categoryId);
      return catId === Number(selectedCategory);
    });
  }, [displayedPosts, selectedCategory]);

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Top Header with 2 Tabs (Segmented Pill Style) */}
      <div className="flex bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-1 rounded-2xl shrink-0 shadow-xs gap-1">
        <button
          type="button"
          onClick={() => handleTabChange("forYou")}
          className={`flex-1 py-2.5 text-center text-xs rounded-xl font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 select-none ${
            activeTab === "forYou"
              ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm font-extrabold"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-800/40"
          }`}
        >
          <span>✨</span>
          <span>Dành cho bạn</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("following")}
          className={`flex-1 py-2.5 text-center text-xs rounded-xl font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 select-none ${
            activeTab === "following"
              ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm font-extrabold"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-800/40"
          }`}
        >
          <span>👥</span>
          <span>Đang theo dõi</span>
        </button>
      </div>

      {/* Category Filter Bar - Horizontal Scroll Pills (Mobile & Desktop) */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1 touch-pan-x">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
              selectedCategory === null
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-sm"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-sm"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Story Bar ở đầu Bảng tin */}
      <StoryBar />

      {/* Quick Composer ở đầu bảng tin */}
      <QuickComposer
        onPostCreated={handlePostCreated}
        categories={categories}
      />

      {/* Mobile Suggested Friends Carousel (Đồng bộ 100% tính năng gợi ý theo dõi lên Mobile) */}
      {suggestedUsers.length > 0 && activeTab === "forYou" && (
        <div className="lg:hidden p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs flex flex-col gap-2.5 overflow-hidden">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Gợi ý tác giả cho bạn
            </span>
            <Link
              to="/friends"
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth touch-pan-x overscroll-x-contain">
            {suggestedUsers.map((user) => {
              const isFollowing = followingIds.includes(Number(user.id));
              const name = user.fullName || user.username;
              return (
                <div
                  key={user.id}
                  className="w-36 min-w-[140px] shrink-0 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 flex flex-col items-center text-center gap-2.5 shadow-2xs"
                >
                  <Link
                    to={`/profile/${user.id}`}
                    className="flex flex-col items-center gap-1.5 w-full"
                  >
                    <Avatar
                      userId={user.id}
                      src={user.avatarUrl}
                      name={name}
                      username={user.username}
                      avatarColor={user.avatarColor}
                      size="md"
                      className="shrink-0 shadow-xs"
                    />
                    <div className="flex flex-col items-center w-full px-0.5">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate w-full text-center">
                        {name}
                      </span>
                      <span className="text-[10px] text-zinc-400 truncate w-full text-center">
                        @{user.username}
                      </span>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleToggleFollow(user)}
                    className={`w-full py-2 min-h-[36px] rounded-full text-[11px] font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs ${
                      isFollowing
                        ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-rose-600"
                        : "bg-black text-white dark:bg-white dark:text-black hover:opacity-90"
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Đang theo dõi</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Theo dõi</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. POSTS FEED LIST WITH SMOOTH STAGGERED TRANSITION */}
      <div key={activeTab} className="flex flex-col gap-2 animate-tab-fade">
        {loading && posts.length === 0 ? (
          <>
            <PostSkeleton index={0} />
            <PostSkeleton index={1} />
            <PostSkeleton index={2} />
            <PostSkeleton index={3} />
          </>
        ) : displayedPosts.length === 0 ? (
          activeTab === "following" ? (
            /* Empty State chuyên biệt cho Tab Đang Theo Dõi */
            <div className="p-8 sm:p-10 text-center flex flex-col items-center justify-center gap-3.5 text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs animate-scale-in">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shadow-xs">
                <UserPlus className="w-7 h-7 stroke-[1.5]" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  {!currentUserId
                    ? "Đăng nhập để xem bảng tin theo dõi"
                    : followingIds.length === 0
                      ? "Bạn chưa theo dõi ai"
                      : "Chưa có bài viết nào từ người bạn theo dõi"}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed mx-auto">
                  {!currentUserId
                    ? "Đăng nhập vào BlogViet để theo dõi các tác giả yêu thích và cập nhật bài viết mới nhất từ những người bạn quan tâm."
                    : followingIds.length === 0
                      ? "Hãy khám phá và bấm 'Theo dõi' các tác giả yêu thích để không bỏ lỡ những bài viết thú vị!"
                      : "Những tác giả bạn đang theo dõi chưa đăng bài viết nào gần đây. Hãy kết nối thêm bạn bè hoặc quay lại bảng tin chung."}
                </p>
              </div>

              {!currentUserId ? (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold transition-transform active:scale-95 shadow-sm mt-1"
                >
                  <span>Đăng nhập ngay</span>
                </Link>
              ) : followingIds.length === 0 ? (
                <Link
                  to="/friends"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold transition-transform active:scale-95 shadow-sm mt-1"
                >
                  <Users className="w-4 h-4" />
                  <span>Khám phá tác giả ngay</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("forYou")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold transition-transform active:scale-95 shadow-sm cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Xem Dành Cho Bạn</span>
                  </button>
                  <Link
                    to="/friends"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-transform active:scale-95"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Tìm thêm tác giả</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            /* Empty State cho Tab Dành Cho Bạn */
            <EmptyState
              icon={MessageSquare}
              onAction={() => {
                const composer = document.getElementById(
                  "quick-composer-input",
                );
                if (composer) {
                  composer.focus();
                  composer.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }
              }}
            />
          )
        ) : (
          filteredDisplayedPosts.map((post, idx) => (
            <div key={post.id} className="flex flex-col gap-2">
              <div
                className="animate-fade-in-up"
                style={{ animationDelay: `${Math.min(idx * 40, 240)}ms` }}
              >
                <PostCard
                  post={post}
                  onDelete={handleDeletePost}
                  onEdit={handleEditPost}
                  onPostCreated={handlePostCreated}
                />
              </div>

              {/* Chèn Reels Carousel ngẫu nhiên/tối ưu giữa các bài viết trong Newsfeed (ví dụ: sau bài viết thứ 3 hoặc sau bài cuối nếu < 3 bài) */}
              {(idx === 2 ||
                (filteredDisplayedPosts.length < 3 &&
                  idx === filteredDisplayedPosts.length - 1) ||
                (idx === 14 && filteredDisplayedPosts.length >= 18)) && (
                <div className="py-1">
                  <ReelsCarousel />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Infinite Scroll Observer Target & Smooth Loading Spinner */}
      {hasMore && !loading && (
        <div
          ref={bottomObserverRef}
          className="py-6 flex flex-col items-center justify-center gap-2 text-zinc-400"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin text-[#0866ff]" />
            <span>Đang tự động tải thêm bài viết...</span>
          </div>
        </div>
      )}

      {/* Feed End Marker (Khi đã cuộn tải hết toàn bộ bài viết trong Database) */}
      {!hasMore && !loading && displayedPosts.length > 0 && (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-zinc-400 dark:text-zinc-500 animate-in fade-in duration-300">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#0866ff] shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Bạn đã xem hết toàn bộ bài viết trong hệ thống ✨
          </span>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center max-w-xs leading-relaxed">
            Hãy khám phá thêm bài viết mới hoặc tạo bài viết đầu tiên của bạn!
          </span>
        </div>
      )}
    </div>
  );
}
