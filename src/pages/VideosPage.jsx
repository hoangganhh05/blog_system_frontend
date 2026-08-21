import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import postService from "../services/postService";
import { isVideoUrl } from "../utils/mediaUtils";
import PostCard from "../components/PostCard";
import CreatePostModal from "../components/CreatePostModal";

function VideosPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [allVideoPosts, setAllVideoPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchVideoPosts();
  }, []);

  const fetchVideoPosts = async () => {
    setLoading(true);
    try {
      const res = await postService.getAll(0, 100);
      const allPosts = res.data?.content || res.data || [];
      // Filter posts that have mediaType === 'video' OR have videoUrl OR have thumbNail that is a video URL
      const videoPosts = allPosts.filter((p) => 
        p.mediaType === 'video' || 
        p.videoUrl || 
        (p.thumbNail && isVideoUrl(p.thumbNail))
      );
      setAllVideoPosts(videoPosts);
      filterPosts(videoPosts, activeCategory);
    } catch {
      setAllVideoPosts([]);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = (videoList, category) => {
    if (category === "POPULAR") {
      const sorted = [...videoList].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
      setPosts(sorted);
    } else {
      setPosts(videoList);
    }
  };

  const handleSelectCategory = (catId) => {
    setActiveCategory(catId);
    filterPosts(allVideoPosts, catId);
  };

  const handleDeletePost = async (postId) => {
    try {
      await postService.delete(postId);
      const updated = allVideoPosts.filter((p) => p.id !== postId);
      setAllVideoPosts(updated);
      filterPosts(updated, activeCategory);
    } catch {
      // Ignored
    }
  };

  return (
    <div className="app-layout videos-page w-full min-h-screen">
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 pt-2 sm:pt-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] md:pb-16">
        
        {/* Header Banner Video */}
        <div
          className="card"
          style={{
            padding: "20px 20px",
            borderRadius: 20,
            marginBottom: 20,
            background: "linear-gradient(135deg, #1877f2 0%, #0052d4 100%)",
            color: "#fff",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            boxShadow: "0 12px 30px rgba(24, 119, 242, 0.25)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0, flex: "1 1 280px" }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                borderRadius: "50%",
                padding: "8px",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "2px",
                flexShrink: 0,
              }}
              title="Quay lại"
            >
              <ArrowLeft style={{ width: 20, height: 20 }} />
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <h1 style={{ fontSize: "clamp(18px, 4vw, 24px)", fontWeight: 800, margin: 0, color: "#fff" }}>
                  BlogViet Video Feeds
                </h1>
              </div>
              <p style={{ fontSize: 13.5, margin: 0, opacity: 0.9, lineHeight: 1.4 }}>
                Không gian đăng tải và thưởng thức các thước phim Video trực tiếp từ cộng đồng người dùng.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn"
            style={{
              background: "#ffffff",
              color: "#1877f2",
              fontWeight: 700,
              fontSize: 14,
              padding: "10px 18px",
              borderRadius: 12,
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              whiteSpace: "nowrap",
              cursor: "pointer",
              border: "none",
            }}
          >
            Đăng Video Mới
          </button>
        </div>

        {/* Filter Categories Bar */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth py-2 touch-pan-x">
          {[
            { id: "ALL", label: `Tất cả Video (${allVideoPosts.length})` },
            { id: "POPULAR", label: "Video phổ biến nhất" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                activeCategory === cat.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Create Post Modal */}
        {showCreateModal && (
          <CreatePostModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false);
              fetchVideoPosts();
            }}
          />
        )}

        {/* Video Posts Feed */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
            ⏳ Đang tải danh sách Video...
          </div>
        ) : posts.length === 0 ? (
          <div className="card empty-state" style={{ padding: "50px 24px", textAlign: "center" }}>
            <div className="empty-state-icon" style={{ fontSize: 48, marginBottom: 16 }}>📹</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
              Chưa có Video nào được đăng tải
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
              Hãy là người đầu tiên tải lên Video từ máy tính hoặc điện thoại của bạn!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
              style={{ padding: "12px 24px", borderRadius: 14, fontSize: 15, fontWeight: 700 }}
            >
              📹 Chọn & Tải Video Lên Ngay
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={handleDeletePost}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default VideosPage;
