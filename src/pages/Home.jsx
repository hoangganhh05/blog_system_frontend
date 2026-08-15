import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import postService from "../services/postService";
import categoryService from "../services/categoryService";
import friendService from "../services/friendService";
import userService from "../services/userService";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import StoryBar from "../components/StoryBar";
import QuickComposer from "../components/QuickComposer";
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
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function PostSkeleton() {
  return (
    <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="w-32 h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="w-20 h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="w-3/4 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" />
      </div>
    </div>
  );
}

export default function Home() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  const [searchParams] = useSearchParams();
  const searchValue = searchParams.get("q") || "";

  const [activeTab, setActiveTab] = useState("forYou"); // "forYou" | "following"
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [friendIds, setFriendIds] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const isFetchingRef = useRef(false);

  // Fetch categories
  useEffect(() => {
    categoryService
      .getAll()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  // Fetch suggested friends
  useEffect(() => {
    userService
      .getAll("", 0, 8)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
        const filtered = list.filter((u) => Number(u.id) !== Number(currentUserId)).slice(0, 6);
        setSuggestedUsers(filtered);
      })
      .catch(() => {});
  }, [currentUserId]);

  const handleFollowSuggested = async (targetUser) => {
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập để theo dõi!");
      return;
    }
    try {
      await friendService.sendFriendRequest(currentUserId, targetUser.id);
      setSentRequests((prev) => new Set(prev).add(targetUser.id));
      toast.success(`Đã gửi lời mời kết nối tới ${targetUser.fullName || targetUser.username}!`);
    } catch {
      setSentRequests((prev) => new Set(prev).add(targetUser.id));
    }
  };

  // Load friends / followed IDs from backend
  const loadFriendsList = useCallback(() => {
    if (currentUserId) {
      friendService
        .getFriendsList(currentUserId)
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : [];
          const ids = list
            .map((u) => Number(u.id || u.friendId || u.userId))
            .filter((id) => !isNaN(id) && id > 0);
          setFriendIds(ids);
        })
        .catch(() => {
          setFriendIds([]);
        });
    } else {
      setFriendIds([]);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadFriendsList();
  }, [loadFriendsList]);

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
          res = await postService.search(searchValue.trim(), pageNum, PAGE_SIZE);
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
    [searchValue]
  );

  // Initial load
  useEffect(() => {
    fetchPosts(0, true);
  }, [fetchPosts, searchValue]);

  // Tab switching handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "following") {
      loadFriendsList();
      // Load more posts to ensure following authors are included
      if (posts.length < 40 && hasMore) {
        fetchPosts(page + 1);
      }
    }
  };

  // Listen for refresh feed event
  useEffect(() => {
    const handleRefresh = () => fetchPosts(0, true);
    window.addEventListener("refresh_feed_posts", handleRefresh);
    return () => window.removeEventListener("refresh_feed_posts", handleRefresh);
  }, [fetchPosts]);

  const handlePostCreated = (newPost) => {
    if (newPost) {
      setPosts((prev) => [newPost, ...prev]);
    }
  };

  const handleDeletePost = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  const handleEditPost = (updatedPost) => {
    if (!updatedPost?.id) return;
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
    );
  };

  // Filter posts based on activeTab
  const displayedPosts = useMemo(() => {
    if (activeTab === "following") {
      if (!currentUserId) return [];
      const friendIdSet = new Set(friendIds);
      // Hiển thị bài viết của chính mình và những người bạn/tác giả đã follow
      return posts.filter((p) => {
        const authorId = Number(p.user?.id || p.author?.id);
        return authorId === currentUserId || friendIdSet.has(authorId);
      });
    }
    return posts;
  }, [posts, activeTab, friendIds, currentUserId]);

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Sticky Top Header with 2 Tabs (Threads / X Style - Full Mobile & Desktop Interactive) */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-3 shrink-0 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => handleTabChange("forYou")}
          className={`flex-1 py-3 text-center text-xs transition-all relative cursor-pointer select-none ${
            activeTab === "forYou"
              ? "text-zinc-950 dark:text-white font-extrabold"
              : "text-zinc-400 dark:text-zinc-500 font-medium hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <span>Dành cho bạn</span>
          {activeTab === "forYou" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-zinc-950 dark:bg-white animate-in fade-in duration-150" />
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("following")}
          className={`flex-1 py-3 text-center text-xs transition-all relative cursor-pointer select-none ${
            activeTab === "following"
              ? "text-zinc-950 dark:text-white font-extrabold"
              : "text-zinc-400 dark:text-zinc-500 font-medium hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <span>Đang theo dõi</span>
          {activeTab === "following" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-zinc-950 dark:bg-white animate-in fade-in duration-150" />
          )}
        </button>
      </div>

      {/* Story Bar ở đầu Bảng tin */}
      <StoryBar />

      {/* Quick Composer ở đầu bảng tin */}
      <QuickComposer onPostCreated={handlePostCreated} categories={categories} />

      {/* Mobile Suggested Friends Carousel (Đồng bộ 100% tính năng gợi ý bạn bè lên Mobile) */}
      {suggestedUsers.length > 0 && activeTab === "forYou" && (
        <div className="lg:hidden p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs my-3 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Gợi ý kết bạn cho bạn
            </span>
            <Link
              to="/friends"
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
            {suggestedUsers.map((user) => {
              const isSent = sentRequests.has(user.id);
              const name = user.fullName || user.username;
              return (
                <div
                  key={user.id}
                  className="w-36 shrink-0 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 flex flex-col items-center text-center gap-2"
                >
                  <Link to={`/profile/${user.id}`} className="flex flex-col items-center gap-1.5">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover shadow-xs"
                      />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs"
                        style={{ backgroundColor: user.avatarColor || "#3f3f46" }}
                      >
                        {getInitials(name)}
                      </div>
                    )}
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[110px]">
                      {name}
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleFollowSuggested(user)}
                    disabled={isSent}
                    className={`w-full py-1 rounded-full text-[11px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                      isSent
                        ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                        : "bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95 shadow-xs"
                    }`}
                  >
                    {isSent ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Đã gửi</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" />
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

      {/* Feed Posts List */}
      <div className="flex flex-col gap-3.5 mt-1">
        {loading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : displayedPosts.length === 0 ? (
          activeTab === "following" ? (
            /* Empty State chuyên biệt cho Tab Đang Theo Dõi */
            <div className="p-8 sm:p-10 text-center flex flex-col items-center justify-center gap-3.5 text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shadow-xs">
                <UserPlus className="w-7 h-7 stroke-[1.5]" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  {!currentUserId
                    ? "Đăng nhập để xem bảng tin theo dõi"
                    : friendIds.length === 0
                    ? "Bạn chưa theo dõi ai"
                    : "Chưa có bài viết nào từ người bạn theo dõi"}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed mx-auto">
                  {!currentUserId
                    ? "Đăng nhập vào BlogViet để theo dõi các tác giả yêu thích và cập nhật bài viết mới nhất từ bạn bè của bạn."
                    : friendIds.length === 0
                    ? "Hãy khám phá và theo dõi thêm bạn bè hoặc tác giả yêu thích để không bỏ lỡ các tin tức, bài viết hấp dẫn!"
                    : "Những người bạn đang theo dõi chưa đăng bài viết nào gần đây. Hãy kết nối thêm bạn bè hoặc quay lại bảng tin chung."}
                </p>
              </div>

              {!currentUserId ? (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold transition active:scale-95 shadow-sm mt-1"
                >
                  <span>Đăng nhập ngay</span>
                </Link>
              ) : friendIds.length === 0 ? (
                <Link
                  to="/friends"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold transition active:scale-95 shadow-sm mt-1"
                >
                  <Users className="w-4 h-4" />
                  <span>Khám phá bạn bè ngay</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("forYou")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold transition active:scale-95 shadow-sm cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Xem Dành Cho Bạn</span>
                  </button>
                  <Link
                    to="/friends"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition active:scale-95"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Tìm thêm bạn</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            /* Empty State cho Tab Dành Cho Bạn */
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3 text-zinc-400 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <MessageSquare className="w-12 h-12 stroke-[1.25] text-zinc-300 dark:text-zinc-700" />
              <p className="font-semibold text-sm text-zinc-600 dark:text-zinc-400">
                Chưa có bài viết nào
              </p>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                Hãy là người đầu tiên chia sẻ suy nghĩ, kinh nghiệm hoặc bắt đầu một chủ đề thảo luận!
              </p>
            </div>
          )
        ) : (
          displayedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handleDeletePost}
              onEdit={handleEditPost}
            />
          ))
        )}
      </div>

      {/* Load More Trigger */}
      {hasMore && !loading && activeTab === "forYou" && (
        <div className="p-6 text-center">
          <button
            type="button"
            onClick={() => fetchPosts(page + 1)}
            disabled={loadingMore}
            className="px-6 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tải thêm...</span>
              </>
            ) : (
              <span>Xem thêm bài viết</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
