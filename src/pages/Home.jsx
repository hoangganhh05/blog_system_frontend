import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import postService from "../services/postService";
import categoryService from "../services/categoryService";
import PostCard from "../components/PostCard";
import Sidebar, { SidebarRight } from "../components/Sidebar";
import CreatePostModal from "../components/CreatePostModal";

import StoryBar from "../components/StoryBar";

// Skeleton loader cho post
function PostSkeleton() {
  return (
    <div className="post-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%" }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 14, width: "40%", marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 12, width: "25%" }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 200, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 16, width: "70%", marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 14, width: "90%", marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 14, width: "80%" }} />
    </div>
  );
}

function Home({ searchValue = "" }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const search = searchValue;

  // Load categories
  useEffect(() => {
    categoryService.getAll()
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  // Load posts (reset khi đổi category hoặc tìm kiếm)
  const loadPosts = useCallback(async (pageNum = 0, categoryId = null, searchQuery = "", reset = false) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      let res;
      if (searchQuery.trim()) {
        res = await postService.search(searchQuery.trim(), pageNum, 6);
      } else if (categoryId) {
        res = await postService.getByCategory(categoryId, pageNum, 6);
      } else {
        res = await postService.getAll(pageNum, 6);
      }

      const data = res.data;
      const newPosts = data.content || [];

      if (reset || pageNum === 0) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }

      setHasMore(!data.last);
      setPage(pageNum);
    } catch {
      // Nếu backend chưa bật, hiển thị empty state
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(0, activeCategoryId, search, true);
  }, [activeCategoryId, search, loadPosts]);

  const handleSelectCategory = (catId) => {
    setActiveCategoryId(catId);
  };

  const handleDeletePost = async (postId) => {
    try {
      await postService.delete(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      alert("Không thể xóa bài viết!");
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  // Filter by search
  const filteredPosts = search.trim()
    ? posts.filter(
        (p) =>
          p.title?.toLowerCase().includes(search.toLowerCase()) ||
          p.content?.toLowerCase().includes(search.toLowerCase())
      )
    : posts;

  return (
    <div className="app-layout">
      <div className="page-container">
        {/* Left Sidebar */}
        <div className="sidebar-left">
          <Sidebar
            categories={categories}
            activeCategoryId={activeCategoryId}
            onSelectCategory={handleSelectCategory}
          />
        </div>

        {/* Feed */}
        <main className="feed-column">
          {/* Story Bar đầu trang */}
          <StoryBar />

          {/* Create post box */}
          {currentUser && (
            <div className="create-post-box">
              <div className="create-post-top">
                <Link to={`/profile/${currentUser.id || currentUser.userId}`} style={{ textDecoration: "none" }}>
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName || currentUser.username}
                      className="avatar avatar-md"
                      style={{ cursor: "pointer", objectFit: "cover" }}
                      title="Vào trang cá nhân"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <div
                      className="avatar avatar-md"
                      style={{
                        cursor: "pointer",
                        ...(currentUser.avatarColor ? {
                          background: `linear-gradient(135deg, ${currentUser.avatarColor}, ${currentUser.avatarColor}bb)`
                        } : {})
                      }}
                      title="Vào trang cá nhân"
                    >
                      {(currentUser.fullName || currentUser.username || "?")[0].toUpperCase()}
                    </div>
                  )}
                </Link>
                <button
                  className="create-post-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  {currentUser.fullName || currentUser.username}, bạn đang nghĩ gì thế?
                </button>
              </div>
              <div className="create-post-divider" />
              <div className="create-post-actions">
                <button
                  className="create-post-action"
                  onClick={() => setShowCreateModal(true)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#45bd62" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span>Ảnh/Video</span>
                </button>
                <button
                  className="create-post-action"
                  onClick={() => setShowCreateModal(true)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1877f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                  <span>Viết bài</span>
                </button>
                <button
                  className="create-post-action"
                  onClick={() => setShowCreateModal(true)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f7b928" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                  <span>Cảm xúc</span>
                </button>
              </div>
            </div>
          )}


          {/* Posts */}
          {loading ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : filteredPosts.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">
                {search ? "🔍" : "📝"}
              </div>
              <h3>
                {search
                  ? `Không tìm thấy kết quả cho "${search}"`
                  : activeCategoryId
                  ? "Danh mục này chưa có bài viết nào"
                  : "Chưa có bài viết nào"}
              </h3>
              <p>
                {currentUser
                  ? "Hãy là người đầu tiên đăng bài!"
                  : "Đăng nhập để bắt đầu chia sẻ bài viết"}
              </p>
              {currentUser && (
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={() => setShowCreateModal(true)}
                >
                  ✍️ Đăng bài đầu tiên
                </button>
              )}
            </div>
          ) : (
            <>
              {filteredPosts.map((post, i) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={handleDeletePost}
                  style={{ animationDelay: `${i * 0.05}s` }}
                />
              ))}

              {/* Load more */}
              {hasMore && !search && (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => loadPosts(page + 1, activeCategoryId, search)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "⏳ Đang tải..." : "Xem thêm bài viết"}
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {/* Right Sidebar */}
        <div className="sidebar-right">
          <SidebarRight trendingPosts={posts.slice(0, 5)} />
        </div>
      </div>

      {/* Create post modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handlePostCreated}
        />
      )}
    </div>
  );
}

// Export search handler for Navbar
export let homeSearchSetter = null;

export default Home;
