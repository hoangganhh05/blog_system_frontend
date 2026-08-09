import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import bookmarkService from "../services/bookmarkService";
import PostCard from "../components/PostCard";

function SavedPosts() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const fetchSavedPosts = async () => {
      setLoading(true);
      try {
        const res = await bookmarkService.getUserBookmarks(currentUserId);
        const list = (res.data || []).map((bm) => bm.post).filter(Boolean);
        setSavedPosts(list.reverse()); // Bài lưu mới nhất xếp trên đầu
      } catch {
        setSavedPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedPosts();
  }, [currentUserId]);

  if (!currentUser) {
    return (
      <div className="app-layout">
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 16px" }}>
          <div className="card empty-state">
            <div className="empty-state-icon">🔒</div>
            <h3>Vui lòng đăng nhập</h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>
              Bạn cần đăng nhập để xem danh sách bài viết đã lưu.
            </p>
            <Link to="/login" style={{ marginTop: 16 }}>
              <button className="btn btn-primary">Đăng nhập ngay</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px" }}>
        {/* Header Card */}
        <div
          className="card"
          style={{
            padding: 24,
            marginBottom: 20,
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-input) 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: "var(--primary-light)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
              }}
            >
              🔖
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                Bài viết đã lưu
              </h1>
              <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                Danh sách các bài viết bạn đã chọn lưu trữ để xem lại sau.
              </p>
            </div>
          </div>

          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/")}>
            ← Trang chủ
          </button>
        </div>

        {/* Saved Posts List */}
        {loading ? (
          <div className="card" style={{ padding: 32, textAlign: "center" }}>
            <div className="skeleton" style={{ height: 180, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 24, width: "60%" }} />
          </div>
        ) : savedPosts.length === 0 ? (
          <div className="card empty-state" style={{ padding: 48, borderRadius: 16 }}>
            <div className="empty-state-icon" style={{ fontSize: 48 }}>🔖</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 12 }}>Chưa có bài viết nào được lưu</h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 6, maxWidth: 400 }}>
              Bấm vào menu 3 chấm trên bất kỳ bài viết nào trên bảng Feed và chọn <strong>"Lưu bài viết"</strong> để lưu trữ tại đây.
            </p>
            <Link to="/" style={{ marginTop: 20 }}>
              <button className="btn btn-primary">Khám phá bài viết ngay</button>
            </Link>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12, paddingLeft: 4 }}>
              Hiển thị {savedPosts.length} bài viết đã lưu
            </div>
            {savedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SavedPosts;
