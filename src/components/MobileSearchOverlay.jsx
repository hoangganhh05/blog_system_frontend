import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import userService from "../services/userService";
import postService from "../services/postService";

const SAMPLE_RECENTS = [
  { id: 1, name: "eFootball", sub: "• 2 thông tin mới", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=eFootball", isPage: true },
  { id: 2, name: "Phòng Trọ Thái Nguyên", sub: "• 9+ thông tin mới", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=PhongTro", isPage: true },
  { id: 3, name: "Võ Ngọc Hiếu", sub: "• 1 thông tin mới", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hieu" },
  { id: 4, name: "Hoàng Anh", sub: "", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=HoangAnh" },
  { id: 5, name: "Trần Quang Linh", sub: "• 3 thông tin mới", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Linh" },
];

function MobileSearchOverlay({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [recentItems, setRecentItems] = useState(SAMPLE_RECENTS);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      loadSearchData();
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  const query = searchTerm.trim().toLowerCase();

  const matchingUsers = query
    ? allUsers.filter((u) => (u.fullName || u.username || "").toLowerCase().includes(query))
    : [];

  const matchingPosts = query
    ? allPosts.filter((p) => (p.title || p.content || "").toLowerCase().includes(query))
    : [];

  const removeRecent = (id) => {
    setRecentItems((prev) => prev.filter((item) => item.id !== id));
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
            fontSize: 22,
            cursor: "pointer",
            padding: 4,
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
                fontSize: 16,
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
        
        {/* 1. Khi chưa gõ từ khóa: Hiển thị Mới đây & Những người bạn có thể biết */}
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
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--primary)", cursor: "pointer" }}>
                  Xem tất cả
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {recentItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSearchTerm(item.name);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <img
                        src={item.avatar}
                        alt=""
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: item.isPage ? 14 : "50%",
                          objectFit: "cover",
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                          {item.name}
                        </div>
                        {item.sub && (
                          <div style={{ fontSize: 12.5, color: "var(--primary)", fontWeight: 600, marginTop: 1 }}>
                            {item.sub}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecent(item.id);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        fontSize: 18,
                        cursor: "pointer",
                        padding: 6,
                      }}
                    >
                      •••
                    </button>
                  </div>
                ))}
              </div>
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
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--primary)", cursor: "pointer" }}>
                  Xem tất cả
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {allUsers.slice(0, 4).map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      onClose();
                      navigate(`/profile/${u.id}`);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <img
                        src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                        alt=""
                        style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
                      />
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                          {u.fullName || u.username}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          @{u.username} • Bạn chung
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ borderRadius: 10, fontWeight: 700, padding: "6px 14px" }}
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
                  👤 Người dùng ({matchingUsers.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {matchingUsers.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        onClose();
                        navigate(`/profile/${u.id}`);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "8px",
                        borderRadius: 12,
                        cursor: "pointer",
                        background: "var(--bg-secondary)",
                      }}
                    >
                      <img
                        src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                        alt=""
                        style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                      />
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
                  📝 Bài viết ({matchingPosts.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {matchingPosts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onClose();
                        navigate(`/posts/${p.id}`);
                      }}
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
