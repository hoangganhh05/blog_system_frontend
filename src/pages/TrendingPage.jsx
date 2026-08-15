import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Sparkles, Clock, Loader2, ArrowLeft } from "lucide-react";
import postService from "../services/postService";
import PostCard from "../components/PostCard";

export default function TrendingPage() {
  const navigate = useNavigate();
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
    <div className="w-full flex flex-col gap-5">
      {/* Unified Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="hidden sm:flex p-2 -ml-1 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer shrink-0"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-rose-500 shrink-0 shadow-2xs">
            {filter === "trending" ? <TrendingUp className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Khám phá xu hướng
            </h1>
            <p className="text-[11px] sm:text-xs text-zinc-500">
              Các bài viết nổi bật, thảo luận sôi nổi và mới nhất.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-1 bg-zinc-100 dark:bg-zinc-800/90 p-1 rounded-2xl text-xs font-semibold self-start sm:self-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilter("trending")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
              filter === "trending"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Thịnh hành</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("recent")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
              filter === "recent"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs font-bold"
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
