import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  Eye, Heart, MessageSquare, Users, FileText, Plus,
  Search, Edit3, Trash2, TrendingUp, CheckCircle,
  BarChart3, Sparkles, Filter, Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import postService from "../services/postService";
import CreatePostModal from "../components/CreatePostModal";
import { ConfirmModal } from "../components/CustomModal";
import AnalyticsChart from "../components/AnalyticsChart";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [postToDelete, setPostToDelete] = useState(null);

  const editId = searchParams.get("edit");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const postsRes = await postService.getAll(0, 100);
      const allPosts = postsRes.data?.content || postsRes.data || [];
      const myPosts = allPosts.filter((p) => p.user?.id === currentUser?.id);
      setPosts(myPosts);

      if (editId) {
        const toEdit = allPosts.find((p) => p.id === parseInt(editId));
        if (toEdit) {
          setEditPost(toEdit);
          setShowCreateModal(true);
        }
      }
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, editId]);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    loadData();
  }, [currentUser, loadData, navigate]);

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    try {
      await postService.delete(postToDelete);
      setPosts((prev) => prev.filter((p) => p.id !== postToDelete));
    } catch {
      // Fail silently
    } finally {
      setPostToDelete(null);
    }
  };

  // 100% Real dynamic stats from Backend data
  const realTotalPosts = posts.length;
  const realTotalViews = posts.reduce((sum, p) => sum + (parseInt(p.viewCount) || 0), 0);
  const realTotalLikes = posts.reduce((sum, p) => sum + (parseInt(p.likeCount) || 0), 0);
  const realTotalComments = posts.reduce((sum, p) => sum + (parseInt(p.commentCount) || 0), 0);
  const realFollowersCount = currentUser?.followersCount || (currentUser?.followers ? currentUser.followers.length : 0);

  const filteredPosts = posts.filter((p) => {
    const matchStatus = filterStatus === "all" || p.status?.toLowerCase() === filterStatus.toLowerCase();
    const matchSearch =
      !searchText ||
      (p.title || p.content || "").toLowerCase().includes(searchText.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (!currentUser) return null;

  return (
    <div className="w-full flex flex-col gap-5">
      {/* 1. Header with Page Title & Create Post Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Bảng điều khiển
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Theo dõi hiệu quả thực tế và quản lý bài viết của bạn.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditPost(null);
            setShowCreateModal(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo bài viết mới</span>
        </button>
      </div>

      {/* 2. Grid Thống Kê 2 Cột / 4 Cột */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Views */}
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Lượt xem</span>
            <Eye className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {realTotalViews.toLocaleString()}
            </span>
            <span className="text-[11px] text-zinc-400 block mt-0.5">Tổng lượt đọc</span>
          </div>
        </div>

        {/* Total Posts */}
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Bài viết</span>
            <FileText className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {realTotalPosts}
            </span>
            <span className="text-[11px] text-zinc-400 block mt-0.5">Đã tạo</span>
          </div>
        </div>

        {/* Total Likes */}
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Lượt thích</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {realTotalLikes.toLocaleString()}
            </span>
            <span className="text-[11px] text-zinc-400 block mt-0.5">Tương tác</span>
          </div>
        </div>

        {/* Total Followers */}
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Người theo dõi</span>
            <Users className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {realFollowersCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-zinc-400 block mt-0.5">Bạn đọc</span>
          </div>
        </div>
      </div>

      {/* 2.5. Analytics Line Chart (Interactive Trend Over Time) */}
      <AnalyticsChart
        totalViews={realTotalViews}
        totalLikes={realTotalLikes}
        totalComments={realTotalComments}
        followersCount={realFollowersCount}
        posts={posts}
      />

      {/* 3. Post Management Table / List */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs p-4 flex flex-col gap-3">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm bài viết của bạn..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 rounded-full py-1.5 pl-9 pr-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-zinc-400 mr-1">Trạng thái:</span>
            {["all", "PUBLISHED", "DRAFT"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                  filterStatus === st
                    ? "bg-black dark:bg-white text-white dark:text-black font-semibold shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800"
                }`}
              >
                {st === "all" ? "Tất cả" : st === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}
              </button>
            ))}
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="p-12 text-center flex justify-center text-stone-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center text-stone-400 flex flex-col items-center gap-2">
            <FileText className="w-10 h-10 stroke-[1.25] text-stone-300 dark:text-stone-700" />
            <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">
              Không có bài viết nào
            </p>
            <p className="text-xs text-stone-400">
              {searchText ? "Không tìm thấy kết quả phù hợp với từ khóa." : "Bạn chưa tạo bài viết nào."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-stone-100 dark:divide-stone-800">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="py-3.5 flex items-center justify-between gap-3 group hover:bg-stone-50/50 dark:hover:bg-stone-900/30 transition px-2 rounded-xl"
              >
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <Link
                    to={`/posts/${post.id}`}
                    className="text-sm font-bold text-stone-900 dark:text-stone-100 hover:underline truncate"
                  >
                    {post.title || post.content?.slice(0, 60) || "Bài viết không tiêu đề"}
                  </Link>

                  <div className="flex items-center gap-3 text-xs text-stone-400">
                    <span>{new Date(post.createdAt || Date.now()).toLocaleDateString("vi-VN")}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {post.viewCount || 0}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-500" /> {post.likeCount || 0}
                    </span>
                    <span>·</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        post.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                      }`}
                    >
                      {post.status === "PUBLISHED" ? "Công khai" : "Nháp"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditPost(post);
                      setShowCreateModal(true);
                    }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                    title="Chỉnh sửa"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPostToDelete(post.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                    title="Xóa bài viết"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditPost(null);
          }}
          editPost={editPost}
          onPostCreated={() => {
            setShowCreateModal(false);
            setEditPost(null);
            loadData();
          }}
        />
      )}

      {postToDelete && (
        <ConfirmModal
          isOpen={Boolean(postToDelete)}
          title="Xác nhận xóa bài viết"
          message="Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác."
          onConfirm={handleConfirmDelete}
          onClose={() => setPostToDelete(null)}
        />
      )}
    </div>
  );
}
