import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import postService from "../services/postService";
import { isVideoUrl } from "../utils/mediaUtils";
import PostCard from "../components/PostCard";
import CreatePostModal from "../components/CreatePostModal";

function VideosPage() {
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
      // Lọc động bài viết có đính kèm Video thực tế từ người dùng
      const videoPosts = allPosts.filter((p) => p.thumbNail && isVideoUrl(p.thumbNail));
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
    <div className="app-layout videos-page">
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 80px 16px" }}>
        
        {/* Header Banner Video */}
        <div
          className="card"
          style={{
            padding: "24px 28px",
            borderRadius: 24,
            marginBottom: 24,
            background: "linear-gradient(135deg, #1877f2 0%, #0052d4 100%)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            boxShadow: "0 12px 30px rgba(24, 119, 242, 0.25)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#fff" }}>
                BlogViet Video Feeds
              </h1>
            </div>
            <p style={{ fontSize: 14.5, margin: 0, opacity: 0.9, lineHeight: 1.4 }}>
              Không gian đăng tải và thưởng thức các thước phim Video trực tiếp từ cộng đồng người dùng.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn"
            style={{
              background: "#ffffff",
              color: "#1877f2",
              fontWeight: 700,
              fontSize: 14,
              padding: "12px 22px",
              borderRadius: 14,
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
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 20,
            overflowX: "auto",
            paddingBottom: 4,
            scrollbarWidth: "none",
          }}
        >
          {[
            { id: "ALL", label: `Tất cả Video (${allVideoPosts.length})` },
            { id: "POPULAR", label: "Video phổ biến nhất" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              style={{
                padding: "10px 18px",
                borderRadius: 20,
                border: "none",
                fontSize: 14,
                fontWeight: activeCategory === cat.id ? 700 : 600,
                background: activeCategory === cat.id ? "var(--primary)" : "var(--bg-card)",
                color: activeCategory === cat.id ? "#fff" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: activeCategory === cat.id ? "0 4px 12px rgba(24,119,242,0.3)" : "none",
                whiteSpace: "nowrap",
              }}
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
