import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import userService from "../services/userService";
import postService from "../services/postService";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function MobileSearchOverlay({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [recentItems, setRecentItems] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      loadSearchData();
      loadRecentHistory();
    }
  }, [isOpen]);

  const loadRecentHistory = () => {
    try {
      const saved = localStorage.getItem("blog_recent_searches");
      if (saved) {
        setRecentItems(JSON.parse(saved));
      } else {
        setRecentItems([]);
      }
    } catch {
      setRecentItems([]);
    }
  };

  const saveRecentItem = (newItem) => {
    try {
      const existing = JSON.parse(localStorage.getItem("blog_recent_searches") || "[]");
      const filtered = existing.filter((item) => item.text !== newItem.text && item.id !== newItem.id);
      const updated = [newItem, ...filtered].slice(0, 10);
      localStorage.setItem("blog_recent_searches", JSON.stringify(updated));
      setRecentItems(updated);
    } catch {
      // Ignore
    }
  };

  const removeRecentItem = (itemId) => {
    try {
      const updated = recentItems.filter((item) => item.id !== itemId);
      localStorage.setItem("blog_recent_searches", JSON.stringify(updated));
      setRecentItems(updated);
    } catch {
      // Ignore
    }
  };

  const clearAllRecent = () => {
    localStorage.removeItem("blog_recent_searches");
    setRecentItems([]);
  };

  const loadSearchData = async () => {
    try {
      const [uRes, pRes] = await Promise.all([
        userService.getAllUsers(),
        postService.getAll(0, 50),
      ]);
      setAllUsers(uRes.data || []);
      setAllPosts(pRes.data?.content || pRes.data || []);
    } catch {
      // Fallback
    }
  };

  const removeVietnameseTones = (str) => {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  };

  const matchesQuery = (text, query) => {
    if (!text || !query) return false;
    return removeVietnameseTones(text).includes(removeVietnameseTones(query.trim()));
  };

  if (!isOpen) return null;

  const query = searchTerm.trim();

  const matchingUsers = query
    ? allUsers.filter((u) => matchesQuery(u.fullName, query) || matchesQuery(u.username, query))
    : [];

  const matchingPosts = query
    ? allPosts.filter(
        (p) =>
          matchesQuery(p.title, query) ||
          matchesQuery(p.content, query) ||
          matchesQuery(p.category?.name, query)
      )
    : [];

  const handleExecuteSearch = (qStr) => {
    const q = qStr || searchTerm;
    if (q && q.trim()) {
      saveRecentItem({
        id: `query_${Date.now()}`,
        text: q.trim(),
        type: "query",
      });
      onClose();
      navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  const handleSelectUser = (user) => {
    saveRecentItem({
      id: `user_${user.id}`,
      text: user.fullName || user.username,
      userId: user.id,
      avatarUrl: user.avatarUrl,
      type: "user",
    });
    onClose();
    navigate(`/profile/${user.id}`);
  };

  const handleSelectPost = (post) => {
    saveRecentItem({
      id: `post_${post.id}`,
      text: post.title || post.content?.slice(0, 30) || "Bài viết",
      postId: post.id,
      type: "post",
    });
    onClose();
    navigate(`/posts/${post.id}`);
  };

  const handleRecentClick = (item) => {
    if (item.userId) {
      onClose();
      navigate(`/profile/${item.userId}`);
    } else if (item.postId) {
      onClose();
      navigate(`/posts/${item.postId}`);
    } else {
      handleExecuteSearch(item.text);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--bg-card)",
        zIndex: 999999,
        display: "flex",
        flexDirection: "column",
        animation: "fadeIn 0.15s ease",
      }}
    >
      {/* Top Mobile Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        {/* Back Arrow Button */}
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-primary)",
            fontSize: 20,
            fontWeight: 700,
            cursor: "pointer",
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
          }}
        >
          ❮
        </button>

        {/* Input Box */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            background: "var(--bg-input)",
            borderRadius: 20,
            padding: "8px 14px",
            border: "1px solid var(--border-light)",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm kiếm trên BlogViet"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleExecuteSearch(searchTerm);
              }
            }}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: 15,
              fontWeight: 500,
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Search Content Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        
        {/* 1. Khi chưa gõ từ khóa: Hiển thị Mới đây (Lịch sử thực tế) & Những người bạn có thể biết */}
        {!query ? (
          <>
            {/* Mới đây Section */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                  Mới đây
                </h3>
                {recentItems.length > 0 && (
                  <span
                    onClick={clearAllRecent}
                    style={{ fontSize: 13.5, fontWeight: 600, color: "var(--primary)", cursor: "pointer" }}
                  >
                    Xóa tất cả
                  </span>
                )}
              </div>

              {recentItems.length === 0 ? (
                <div style={{ fontSize: 13.5, color: "var(--text-muted)", padding: "8px 0" }}>
                  Chưa có lịch sử tìm kiếm gần đây.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {recentItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleRecentClick(item)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {item.avatarUrl ? (
                          <img
                            src={item.avatarUrl}
                            alt=""
                            style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            className="avatar avatar-sm"
                            style={{
                              width: 40,
                              height: 40,
                              background: "var(--bg-input)",
                              color: "var(--text-primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                            }}
                          >
                            {getInitials(item.text)}
                          </div>
                        )}
                        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                          {item.text}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentItem(item.id);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          fontSize: 16,
                          fontWeight: 700,
                          cursor: "pointer",
                          padding: 6,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Những người bạn có thể biết Section */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                  Những người bạn có thể biết
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {allUsers.slice(0, 5).map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt=""
                          style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          className="avatar"
                          style={{
                            width: 44,
                            height: 44,
                            fontSize: 16,
                            background: u.avatarColor
                              ? `linear-gradient(135deg, ${u.avatarColor}, ${u.avatarColor}bb)`
                              : undefined,
                          }}
                        >
                          {getInitials(u.fullName || u.username)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                          {u.fullName || u.username}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          @{u.username}
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ borderRadius: 10, fontWeight: 700, padding: "6px 14px", fontSize: 13 }}
                    >
                      Trang cá nhân
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* 2. Khi đang gõ tìm kiếm: Hiển thị kết quả thực tế */
          <div>
            {/* Người dùng tìm thấy */}
            {matchingUsers.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase" }}>
                  Người dùng ({matchingUsers.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {matchingUsers.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px",
                        borderRadius: 12,
                        cursor: "pointer",
                        background: "var(--bg-secondary)",
                      }}
                    >
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt=""
                          style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          className="avatar avatar-sm"
                          style={{
                            background: u.avatarColor
                              ? `linear-gradient(135deg, ${u.avatarColor}, ${u.avatarColor}bb)`
                              : undefined,
                          }}
                        >
                          {getInitials(u.fullName || u.username)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)" }}>
                          {u.fullName || u.username}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          @{u.username}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bài viết tìm thấy */}
            {matchingPosts.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase" }}>
                  Bài viết ({matchingPosts.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {matchingPosts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPost(p)}
                      style={{
                        padding: "12px",
                        borderRadius: 12,
                        cursor: "pointer",
                        background: "var(--bg-secondary)",
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                        {p.title || p.content?.slice(0, 60)}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>
                        Đăng bởi {p.user?.fullName || p.user?.username || "Ẩn danh"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matchingUsers.length === 0 && matchingPosts.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                Không tìm thấy kết quả phù hợp cho <strong>"{searchTerm}"</strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileSearchOverlay;
