import { useState, useEffect } from "react";
import { TrendingUp, Sparkles, Loader2 } from "lucide-react";
import postService from "../services/postService";
import PostCard from "../components/PostCard";

export default function TrendingPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("trending"); // "trending" | "recent"

  useEffect(() => {
    setLoading(true);
    postService.getAll(0, 30)
      .then((res) => {
        const list = res.data?.content || res.data || [];
        if (filter === "trending") {
          const sorted = [...list].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
          setPosts(sorted);
        } else {
          setPosts(list);
        }
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Page Header with Filters */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200 dark:border-stone-800 shrink-0">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: "#E8650A" }} />
          <span className="font-extrabold text-lg text-stone-900 dark:text-stone-100">
            Khám phá
          </span>
        </div>

        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-full text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter("trending")}
            className={`px-3 py-1 rounded-full transition cursor-pointer ${
              filter === "trending"
                ? "bg-white dark:bg-[#181818] text-stone-900 dark:text-stone-100 shadow-xs"
                : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
            }`}
            style={filter === "trending" ? { color: "#E8650A" } : {}}
          >
            Thịnh hành
          </button>
          <button
            type="button"
            onClick={() => setFilter("recent")}
            className={`px-3 py-1 rounded-full transition cursor-pointer ${
              filter === "recent"
                ? "bg-white dark:bg-[#181818] text-stone-900 dark:text-stone-100 shadow-xs"
                : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
            }`}
            style={filter === "recent" ? { color: "#E8650A" } : {}}
          >
            Mới nhất
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
            Chưa có bài viết thịnh hành.
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
