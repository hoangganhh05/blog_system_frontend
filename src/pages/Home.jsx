import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
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
import SpotlightCard from "../components/SpotlightCard";
import {
  Loader2,
  MessageSquare,
  Users,
  UserPlus,
  Sparkles,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

function calculatePostScore(post, followingSet, currentUserId) {
  const now = Date.now();
  const createdTime = post.createdAt ? new Date(post.createdAt).getTime() : now;
  const hoursAgo = Math.max(0, (now - createdTime) / (1000 * 60 * 60));

  // 1. Bài viết mới đăng (dưới 2 giờ) luôn được ưu tiên 100% lên đầu tiên
  if (hoursAgo <= 2) {
    return 100000 - hoursAgo * 10;
  }

  // 2. Điểm phân rã thời gian (Recency Decay Score)
  const recencyScore = 100 / (1 + hoursAgo * 0.25);

  // 3. Điểm tương tác (Engagement Score: Likes, Comments, Views)
  const likes = Number(post.likesCount || post.likeCount || 0);
  const comments = Number(post.commentsCount || post.commentCount || 0);
  const views = Number(post.viewCount || post.viewsCount || 0);
  const engagementScore = likes * 3 + comments * 5 + views * 1;

  // 4. Điểm cá nhân hóa (Ưu tiên tác giả đang theo dõi +25đ)
  const authorId = Number(post.user?.id || post.author?.id);
  const isFollowing = authorId && followingSet.has(authorId);
  const followBonus = isFollowing ? 25 : 0;

  // 5. Thưởng bài viết có hình ảnh / video hấp dẫn (+15đ)
  const hasMedia = Boolean(
    post.imageUrl || post.videoUrl || post.thumbNail || (post.images && post.images.length > 0)
  );
  const mediaBonus = hasMedia ? 15 : 0;

  return recencyScore + engagementScore + followBonus + mediaBonus;
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
  }, [hasMore, loading, loadingMore, page, fetchPosts]);

  // Initial load
  useEffect(() => {
    fetchPosts(0, true);
  }, [fetchPosts, searchValue]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "following") {
      loadFollowingList();
      if (hasMore && !isFetchingRef.current) {
        fetchPosts(page + 1);
      }
    }
  };

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
        const postWithDate = {
          ...newPost,
          createdAt: newPost.createdAt || new Date().toISOString(),
        };
        setPosts((prev) => [
          postWithDate,
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
      const postWithDate = {
        ...newPost,
        createdAt: newPost.createdAt || new Date().toISOString(),
      };
      setPosts((prev) => [
        postWithDate,
        ...prev.filter((p) => Number(p.id) !== Number(newPost.id)),
      ]);
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

  const displayedPosts = useMemo(() => {
    let list = posts;

    if (activeTab === "following") {
      if (!currentUserId) return [];
      const followingSet = new Set(followingIds);
      list = posts.filter((p) => {
        const authorId = Number(p.user?.id || p.author?.id);
        return authorId === Number(currentUserId) || followingSet.has(authorId);
      });
    }

    // Thuật toán Đề xuất Thông minh: Xếp bài mới đăng (dưới 2h) lên đầu, bài viết tương tác cao xếp tiếp theo
    const followingSet = new Set(followingIds);
    return [...list].sort((a, b) => {
      const scoreA = calculatePostScore(a, followingSet, currentUserId);
      const scoreB = calculatePostScore(b, followingSet, currentUserId);
      return scoreB - scoreA;
    });
  }, [posts, activeTab, followingIds, currentUserId]);

  const filteredDisplayedPosts = useMemo(() => {
    if (selectedCategory === null) return displayedPosts;
    return displayedPosts.filter((p) => {
      const catId = Number(p.category?.id || p.categoryId);
      return catId === Number(selectedCategory);
    });
  }, [displayedPosts, selectedCategory]);

  return (
    <div className="w-full flex flex-col gap-4 selection:bg-rose-500/30">
      {/* 1. DUAL-THEME SEGMENTED TAB SWITCHER */}
      <div className="relative flex p-1.5 rounded-2xl bg-slate-200/70 dark:bg-neutral-900/70 border border-slate-300/60 dark:border-white/10 backdrop-blur-xl shadow-xs shrink-0 gap-1 overflow-hidden">
        <button
          type="button"
          onClick={() => handleTabChange("forYou")}
          className={`relative flex-1 py-3 text-center text-xs font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 select-none rounded-xl z-10 ${
            activeTab === "forYou"
              ? "text-slate-900 dark:text-white font-extrabold"
              : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 hover:bg-white/50 dark:hover:bg-white/5"
          }`}
        >
          {activeTab === "forYou" && (
            <motion.div
              layoutId="homeTabPill"
              className="absolute inset-0 rounded-xl bg-white dark:bg-white/10 border border-slate-300/80 dark:border-white/20 shadow-md dark:shadow-[0_0_20px_rgba(255,255,255,0.08)]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <Sparkles className={`w-4 h-4 relative z-10 ${activeTab === "forYou" ? "text-blue-600 dark:text-cyan-400" : ""}`} />
          <span className="relative z-10 tracking-wide">Dành cho bạn</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("following")}
          className={`relative flex-1 py-3 text-center text-xs font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 select-none rounded-xl z-10 ${
            activeTab === "following"
              ? "text-slate-900 dark:text-white font-extrabold"
              : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 hover:bg-white/50 dark:hover:bg-white/5"
          }`}
        >
          {activeTab === "following" && (
            <motion.div
              layoutId="homeTabPill"
              className="absolute inset-0 rounded-xl bg-white dark:bg-white/10 border border-slate-300/80 dark:border-white/20 shadow-md dark:shadow-[0_0_20px_rgba(255,255,255,0.08)]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <Users className={`w-4 h-4 relative z-10 ${activeTab === "following" ? "text-rose-600 dark:text-rose-400" : ""}`} />
          <span className="relative z-10 tracking-wide">Đang theo dõi</span>
        </button>
      </div>

      {/* 2. CATEGORY FILTER BAR - DUAL THEME PILLS */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 touch-pan-x">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 cursor-pointer flex-shrink-0 border ${
              selectedCategory === null
                ? "bg-slate-900 text-white dark:bg-white dark:text-black border-slate-900 dark:border-white shadow-sm"
                : "bg-white dark:bg-neutral-900/60 backdrop-blur-md border-slate-200 dark:border-white/10 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20"
            }`}
          >
            ✦ Tất cả danh mục
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 cursor-pointer flex-shrink-0 border ${
                selectedCategory === cat.id
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-cyan-500 dark:to-rose-500 text-white border-transparent shadow-md"
                  : "bg-white dark:bg-neutral-900/60 backdrop-blur-md border-slate-200 dark:border-white/10 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* 3. STORY HIGHLIGHTS BAR */}
      <StoryBar />

      {/* 4. QUICK COMPOSER BOX */}
      <QuickComposer
        onPostCreated={handlePostCreated}
        categories={categories}
      />

      {/* 5. MOBILE SUGGESTED AUTHORS CAROUSEL */}
      {suggestedUsers.length > 0 && activeTab === "forYou" && (
        <div className="lg:hidden p-4 bg-white dark:bg-neutral-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-xs flex flex-col gap-3 overflow-hidden">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              Gợi ý tác giả nổi bật
            </span>
            <Link
              to="/friends"
              className="text-[11px] font-semibold text-blue-600 dark:text-cyan-400 hover:underline"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth touch-pan-x">
            {suggestedUsers.map((user) => {
              const isFollowing = followingIds.includes(Number(user.id));
              const name = user.fullName || user.username;
              return (
                <div
                  key={user.id}
                  className="w-36 min-w-[140px] shrink-0 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col items-center text-center gap-2.5 shadow-2xs"
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
                      className="shrink-0 border border-slate-200 dark:border-white/10"
                    />
                    <div className="flex flex-col items-center w-full px-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate w-full text-center">
                        {name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-neutral-400 truncate w-full text-center">
                        @{user.username}
                      </span>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleToggleFollow(user)}
                    className={`w-full py-2 rounded-full text-[11px] font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                      isFollowing
                        ? "bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-neutral-300 border border-slate-300 dark:border-white/10"
                        : "bg-blue-600 text-white dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600 shadow-xs"
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
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

      {/* 6. POSTS FEED LIST */}
      <div key={activeTab} className="flex flex-col gap-3">
        {loading && posts.length === 0 ? (
          <>
            <PostSkeleton index={0} />
            <PostSkeleton index={1} />
            <PostSkeleton index={2} />
          </>
        ) : displayedPosts.length === 0 ? (
          activeTab === "following" ? (
            <SpotlightCard className="p-8 text-center flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-neutral-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center shadow-xs">
                <UserPlus className="w-7 h-7 stroke-[1.5]" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  {!currentUserId
                    ? "Đăng nhập để xem bảng tin theo dõi"
                    : followingIds.length === 0
                      ? "Bạn chưa theo dõi ai"
                      : "Chưa có bài viết nào từ người bạn theo dõi"}
                </p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm leading-relaxed mx-auto">
                  {!currentUserId
                    ? "Đăng nhập vào BlogViet để theo dõi các tác giả yêu thích."
                    : "Bấm 'Theo dõi' các tác giả để cập nhật tin tức mới nhất!"}
                </p>
              </div>
            </SpotlightCard>
          ) : (
            <EmptyState
              icon={MessageSquare}
              onAction={() => {
                const composer = document.getElementById("quick-composer-input");
                if (composer) {
                  composer.focus();
                  composer.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
            />
          )
        ) : (
          filteredDisplayedPosts.map((post, idx) => (
            <div key={post.id} className="flex flex-col gap-3">
              <PostCard
                post={post}
                onDelete={handleDeletePost}
                onEdit={handleEditPost}
                onPostCreated={handlePostCreated}
              />

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

      {/* INFINITE SCROLL OBSERVER TARGET */}
      {hasMore && !loading && (
        <div
          ref={bottomObserverRef}
          className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-neutral-400"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-neutral-400">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-cyan-400" />
            <span>Đang tự động tải thêm bài viết...</span>
          </div>
        </div>
      )}

      {/* FEED END MARKER */}
      {!hasMore && !loading && displayedPosts.length > 0 && (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-neutral-500">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-cyan-400 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-neutral-200">
            Bạn đã xem hết bài viết trên Bảng tin ✨
          </span>
        </div>
      )}
    </div>
  );
}
