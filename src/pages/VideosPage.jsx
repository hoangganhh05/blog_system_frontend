import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import postService from "../services/postService";
import { isVideoUrl } from "../utils/mediaUtils";
import PostCard from "../components/PostCard";
import CreatePostModal from "../components/CreatePostModal";

const SAMPLE_VIDEOS = [
  {
    id: 9901,
    title: "🚀 Hướng dẫn lập trình React & Spring Boot từ A-Z cho người mới",
    content: "Video chia sẻ kiến thức xây dựng ứng dụng Web chuẩn Docker, Microservices và thiết kế UI hiện đại.",
    thumbNail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    viewCount: 1420,
    createdAt: new Date().toISOString(),
    user: {
      id: 1,
      fullName: "Đội ngũ Kỹ thuật BlogViet",
      username: "admin_blogviet",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
    },
  },
  {
    id: 9902,
    title: "🎧 Giai điệu Lo-fi Chillout thư giãn làm việc và học tập cực phiêu",
    content: "Âm nhạc không lời nhẹ nhàng giúp tập trung tối đa hiệu suất làm việc cả ngày dài.",
    thumbNail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    viewCount: 2890,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    user: {
      id: 2,
      fullName: "Chill Vibration Studio",
      username: "chillvibe",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Music",
    },
  },
  {
    id: 9903,
    title: "📱 Đánh giá công nghệ mới nhất 2026: Đột phá thiết kế & AI",
    content: "Cùng soi chi tiết siêu phẩm công nghệ bùng nổ năm nay với các tính năng vượt trội.",
    thumbNail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    viewCount: 3510,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    user: {
      id: 3,
      fullName: "Tech Reviewer VN",
      username: "tech_review",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tech",
    },
  },
];

function VideosPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchVideoPosts();
  }, []);

  const fetchVideoPosts = async () => {
    setLoading(true);
    try {
      const res = await postService.getAll(0, 50);
      const allPosts = res.data?.content || res.data || [];
      // Lọc các bài viết có video thumbnail
      const videoPosts = allPosts.filter((p) => isVideoUrl(p.thumbNail));

      // Kết hợp bài viết video thực tế với sample video để giao diện sống động 100%
      const combined = [...videoPosts, ...SAMPLE_VIDEOS];
      setPosts(combined);
    } catch {
      setPosts(SAMPLE_VIDEOS);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await postService.delete(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      // Ignored
    }
  };

  return (
    <div className="app-layout">
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 80px 16px" }}>
        
        {/* Header Baner Video Center */}
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
              <span style={{ fontSize: 28 }}>🎥</span>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#fff" }}>
                BlogViet Video Feeds
              </h1>
            </div>
            <p style={{ fontSize: 14.5, margin: 0, opacity: 0.9, lineHeight: 1.4 }}>
              Khám phá không gian video clips, vlogs và thước phim giải trí sắc nét nhất từ cộng đồng.
            </p>
          </div>

          {currentUser && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn"
              style={{
                background: "#ffffff",
                color: "#1877f2",
                fontWeight: 700,
                fontSize: 14,
                padding: "12px 20px",
                borderRadius: 14,
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                whiteSpace: "nowrap",
                cursor: "pointer",
                border: "none",
              }}
            >
              📹 Đăng Video Mới
            </button>
          )}
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
            { id: "ALL", label: "🔥 Tất cả Video" },
            { id: "POPULAR", label: "⚡ Xu hướng nhiều lượt xem" },
            { id: "CREATOR", label: "🎬 Tác giả nổi bật" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
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
            ⏳ Đang tải danh sách video...
          </div>
        ) : posts.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">📹</div>
            <h3>Chưa có video nào</h3>
            <p>Hãy là người đầu tiên đăng tải video tuyệt vời lên BlogViet!</p>
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
