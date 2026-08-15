import { useState, useEffect } from "react";
import { TrendingUp, Sparkles, Clock, Loader2 } from "lucide-react";
import postService from "../services/postService";
import PostCard from "../components/PostCard";

export default function TrendingPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("trending"); // "trending" | "recent"

  useEffect(() => {
    setLoading(true);
    postService.getAll(0, 50)
      .then((res) => {
        const list = res.data?.content || res.data || [];

        // Helper to extract timestamp reliably
        const getPostTimestamp = (p) => {
          const d = p.createdAt || p.createAt || p.publishedAt || p.updatedAt;
          if (!d) return Number(p.id) || 0;
          const t = new Date(d).getTime();
          return isNaN(t) ? (Number(p.id) || 0) : t;
        };

        if (filter === "trending") {
          // Sort by viewCount / engagement, then by latest date
          const sorted = [...list].sort((a, b) => {
            const viewsDiff = (b.viewCount || 0) - (a.viewCount || 0);
            if (viewsDiff !== 0) return viewsDiff;
            const likesDiff = (b.likeCount || b.likesCount || 0) - (a.likeCount || a.likesCount || 0);
            if (likesDiff !== 0) return likesDiff;
            return getPostTimestamp(b) - getPostTimestamp(a);
          });
          setPosts(sorted);
        } else {
          // Sort strictly by createdAt descending (Latest first)
          const sorted = [...list].sort((a, b) => getPostTimestamp(b) - getPostTimestamp(a));
          setPosts(sorted);
        }
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Page Header with Filters */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          {filter === "trending" ? (
            <TrendingUp className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
          ) : (
            <Clock className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
          )}
          <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">
            Khám phá
          </span>
        </div>

        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter("trending")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              filter === "trending"
                ? "bg-white dark:bg-zinc-900 text-black dark:text-white shadow-xs font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Thịnh hành</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("recent")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              filter === "recent"
                ? "bg-white dark:bg-zinc-900 text-black dark:text-white shadow-xs font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Mới nhất</span>
          </button>
        </div>
      </div>

      {/* Posts List */}
      <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
        {loading ? (
          <div className="p-12 text-center flex justify-center text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="p-16 text-center text-zinc-400 text-xs">
            {filter === "trending" ? "Chưa có bài viết thịnh hành." : "Chưa có bài viết mới nào."}
          </div>
        ) : (
          posts.map((post, idx) => (
            <div key={post.id} className="relative">
              {filter === "trending" && idx < 3 && (
                <div className="absolute top-3 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 flex items-center gap-1 z-10">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Top #{idx + 1}</span>
                </div>
              )}
              <PostCard
                post={post}
                onDelete={(delId) => setPosts((prev) => prev.filter((p) => p.id !== delId))}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
