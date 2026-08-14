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
    <div className="w-full min-h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-3 mb-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-300 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">
          Đã lưu
        </span>
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
