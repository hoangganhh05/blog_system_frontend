import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import bookmarkService from "../services/bookmarkService";
import PostCard from "../components/PostCard";

export default function SavedPosts() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    bookmarkService.getUserBookmarks(currentUserId)
      .then((res) => {
        const list = (res.data || []).map((bm) => bm.post).filter(Boolean);
        setSavedPosts(list.reverse());
      })
      .catch(() => setSavedPosts([]))
      .finally(() => setLoading(false));
  }, [currentUserId]);

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Unified Header */}
      <div className="flex flex-row items-center justify-between gap-3 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 -ml-1 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer shrink-0"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-amber-500 shrink-0 shadow-2xs">
            <Bookmark className="w-5 h-5 fill-amber-500/20" />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
              Bài viết đã lưu
            </h1>
            <p className="text-[11px] sm:text-xs text-zinc-500 truncate">
              Kho lưu trữ những bài viết và nội dung yêu thích của bạn.
            </p>
          </div>
        </div>
      </div>

      {/* Saved Posts List */}
      <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
        {loading ? (
          <div className="p-12 text-center flex justify-center text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : savedPosts.length === 0 ? (
          <div className="p-16 text-center text-zinc-400 flex flex-col items-center gap-3">
            <Bookmark className="w-10 h-10 stroke-[1.25] text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              Chưa có bài viết nào được lưu
            </p>
            <p className="text-xs text-zinc-500 max-w-xs">
              Bấm vào biểu tượng đánh dấu trên bất kỳ bài viết nào để lưu lại xem sau.
            </p>
          </div>
        ) : (
          savedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={(delId) => setSavedPosts((prev) => prev.filter((p) => p.id !== delId))}
              onEdit={(updated) =>
                setSavedPosts((prev) =>
                  prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
                )
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
