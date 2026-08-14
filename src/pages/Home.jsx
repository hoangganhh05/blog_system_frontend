import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, RefreshCw, Loader2, MessageSquare } from "lucide-react";
import postService from "../services/postService";
import categoryService from "../services/categoryService";
import PostCard from "../components/PostCard";
import QuickComposer from "../components/QuickComposer";

function PostSkeleton() {
  return (
    <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 flex gap-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-900 rounded" />
        </div>
        <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-900 rounded" />
        <div className="h-4 w-3/4 bg-zinc-100 dark:bg-zinc-900 rounded" />
        <div className="h-44 w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl mt-1" />
      </div>
    </div>
  );
}

export default function Home({ searchValue = "" }) {
  const [activeTab, setActiveTab] = useState("forYou"); // "forYou" | "following"
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const isFetchingRef = useRef(false);

  const PAGE_SIZE = 10;

  // Load categories
  useEffect(() => {
    categoryService.getAll()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(async (pageNum = 0, isReset = false) => {
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
      const newItems = Array.isArray(data) ? data : (data.content || []);
      const moreAvailable = Array.isArray(data)
        ? newItems.length >= PAGE_SIZE
        : !data.last && (data.number + 1 < data.totalPages);

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
  }, [searchValue]);

  // Initial load
  useEffect(() => {
    fetchPosts(0, true);
  }, [fetchPosts, searchValue]);

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

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Sticky Top Header with 2 Tabs (Threads / X Style) */}
      <header className="sticky top-0 z-30 h-13 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 px-2">
        <div className="flex flex-1 h-full">
          <button
            type="button"
            onClick={() => setActiveTab("forYou")}
            className="flex-1 flex flex-col items-center justify-center relative hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition cursor-pointer"
          >
            <span
              className={`text-sm font-bold tracking-tight transition ${
                activeTab === "forYou"
                  ? "text-zinc-950 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Dành cho bạn
            </span>
            {activeTab === "forYou" && (
              <div className="absolute bottom-0 w-16 h-1 bg-zinc-950 dark:bg-white rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("following")}
            className="flex-1 flex flex-col items-center justify-center relative hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition cursor-pointer"
          >
            <span
              className={`text-sm font-bold tracking-tight transition ${
                activeTab === "following"
                  ? "text-zinc-950 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Đang theo dõi
            </span>
            {activeTab === "following" && (
              <div className="absolute bottom-0 w-16 h-1 bg-zinc-950 dark:bg-white rounded-full" />
            )}
          </button>
        </div>
      </header>

      {/* Quick Composer ở đầu bảng tin */}
      <QuickComposer onPostCreated={handlePostCreated} categories={categories} />

      {/* Feed Posts List */}
      <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
        {loading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3 text-zinc-400">
            <MessageSquare className="w-12 h-12 stroke-[1.25] text-zinc-300 dark:text-zinc-700" />
            <p className="font-semibold text-sm text-zinc-600 dark:text-zinc-400">
              Chưa có bài viết nào
            </p>
            <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
              Hãy là người đầu tiên chia sẻ suy nghĩ, kinh nghiệm hoặc bắt đầu một chủ đề thảo luận!
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handleDeletePost}
            />
          ))
        )}
      </div>

      {/* Load More Trigger */}
      {hasMore && !loading && (
        <div className="p-6 text-center">
          <button
            type="button"
            onClick={() => fetchPosts(page + 1)}
            disabled={loadingMore}
            className="px-6 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition disabled:opacity-50 inline-flex items-center gap-2"
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
