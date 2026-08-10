import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";
import postService from "../services/postService";
import bookmarkService from "../services/bookmarkService";
import uploadService from "../services/uploadService";
import friendService from "../services/friendService";
import PostCard from "../components/PostCard";

const AVATAR_COLORS = [
  "#1877f2", "#e74c3c", "#2ecc71", "#9b59b6",
  "#f39c12", "#1abc9c", "#e91e63", "#ff5722",
  "#607d8b", "#795548", "#34495e", "#8e44ad",
];

const BANNER_PRESETS = [
  "linear-gradient(135deg, #1877f2 0%, #00c6ff 100%)",
  "linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)",
  "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  "linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)",
  "linear-gradient(135deg, #f80759 0%, #bc4e9c 100%)",
  "linear-gradient(135deg, #232526 0%, #414345 100%)",
];

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, updateUser } = useAuth();

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab") || location.state?.tab;
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // State menu 3 chấm tùy chọn khác & Kho tin lưu trữ (Archived Stories)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [showStoryArchiveModal, setShowStoryArchiveModal] = useState(false);
  const [archivedStories, setArchivedStories] = useState([
    {
      id: 101,
      mediaUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
      createdAt: "2026-08-01T10:00:00Z",
      views: 12,
      caption: "Khoảnh khắc tuyệt vời ✨",
    },
    {
      id: 102,
      mediaUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80",
      createdAt: "2026-07-28T15:30:00Z",
      views: 24,
      caption: "Chuyến đi đáng nhớ 🏔️",
    },
    {
      id: 103,
      mediaUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80",
      createdAt: "2026-07-20T08:15:00Z",
      views: 18,
      caption: "Bình minh rực rỡ 🌅",
    },
  ]);
  const moreMenuRef = useRef(null);

  // States hệ thống bạn bè
  const [friendshipStatus, setFriendshipStatus] = useState("NONE");
  const [friendCount, setFriendCount] = useState(0);
  const [friendLoading, setFriendLoading] = useState(false);

  // Form chỉnh sửa thông tin cá nhân
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    bio: "",
    avatarColor: "#1877f2",
    avatarUrl: "",
    bannerUrl: "",
    emailPrivacy: "private",
  });
  const [bannerPreset, setBannerPreset] = useState(BANNER_PRESETS[0]);
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState({ text: "", type: "" });

  // Form đổi mật khẩu
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState({ text: "", type: "" });

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const currentUserId = currentUser ? Number(currentUser.id || currentUser.userId) : null;
  const targetUserId = userId ? Number(userId) : null;
  const isMe = Boolean(currentUserId && targetUserId && currentUserId === targetUserId);

  // Upload ảnh đại diện trực tiếp
  const handleQuickAvatarUpload = async (file) => {
    if (!file || !isMe) return;
    setUploadingAvatar(true);
    try {
      const res = await uploadService.uploadFile(file);
      const newAvatarUrl = res.data.url;
      const payload = {
        fullName: user.fullName || "",
        email: user.email || "",
        bio: user.bio || "",
        avatarColor: user.avatarColor || "#1877f2",
        avatarUrl: newAvatarUrl,
        bannerUrl: user.bannerUrl || "",
        emailPrivacy: user.emailPrivacy || "private",
      };
      const saved = await userService.update(userId, payload);
      setUser(saved.data);
      setEditForm(payload);
      updateUser({ ...currentUser, avatarUrl: newAvatarUrl });
      showToast("Đã cập nhật ảnh đại diện!", "success");
    } catch {
      showToast("Không thể tải ảnh đại diện lên!", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Upload ảnh bìa trực tiếp
  const handleQuickBannerUpload = async (file) => {
    if (!file || !isMe) return;
    setUploadingBanner(true);
    try {
      const res = await uploadService.uploadFile(file);
      const newBannerUrl = res.data.url;
      const payload = {
        fullName: user.fullName || "",
        email: user.email || "",
        bio: user.bio || "",
        avatarColor: user.avatarColor || "#1877f2",
        avatarUrl: user.avatarUrl || "",
        bannerUrl: newBannerUrl,
        emailPrivacy: user.emailPrivacy || "private",
      };
      const saved = await userService.update(userId, payload);
      setUser(saved.data);
      setEditForm(payload);
      updateUser({ ...currentUser, bannerUrl: newBannerUrl });
      showToast("Đã cập nhật ảnh bìa mới!", "success");
    } catch {
      showToast("Không thể tải ảnh bìa lên!", "error");
    } finally {
      setUploadingBanner(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userRes = await userService.getById(userId);
        setUser(userRes.data);
        setEditForm({
          fullName: userRes.data.fullName || "",
          email: userRes.data.email || "",
          bio: userRes.data.bio || "",
          avatarColor: userRes.data.avatarColor || "#1877f2",
          avatarUrl: userRes.data.avatarUrl || "",
          bannerUrl: userRes.data.bannerUrl || "",
          emailPrivacy: userRes.data.emailPrivacy || "private",
        });

        // Lấy bài viết của người dùng
        const postsRes = await postService.getAll(0, 100);
        const allPosts = postsRes.data.content || [];
        const userPosts = allPosts.filter(
          (p) => p.user?.id === Number(userId) && p.status === "public"
        );
        setPosts(userPosts);

        // Lấy danh sách bạn bè
        friendService.getFriendsList(userId).then((res) => {
          setFriendsList(res.data || []);
          setFriendCount((res.data || []).length);
        }).catch(() => {});

        // Lấy bài viết đã lưu nếu là chính mình
        if (Number(userId) === currentUserId) {
          try {
            const bRes = await bookmarkService.getUserBookmarks(userId);
            const bList = (bRes.data || []).map((bm) => bm.post).filter(Boolean);
            setBookmarkedPosts(bList);
          } catch {
            setBookmarkedPosts([]);
          }
        }

        // Lấy trạng thái kết bạn nếu xem profile người khác
        if (currentUserId && targetUserId && !isMe) {
          friendService.getStatus(currentUserId, targetUserId).then((res) => {
            setFriendshipStatus(res.data.status);
          }).catch(() => {});
        }

      } catch {
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, currentUserId, targetUserId, isMe, navigate]);

  // Click outside cho menu 3 chấm
  useEffect(() => {
    function handleClickOutside(e) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setMoreMenuOpen(false);
      }
    }
    if (moreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [moreMenuOpen]);

  // Handlers Kết Bạn
  const handleSendFriendRequest = () => {
    if (!currentUser) return showToast("Vui lòng đăng nhập để kết bạn!", "error");
    setFriendLoading(true);
    friendService.sendRequest(currentUserId, targetUserId)
      .then((res) => {
        setFriendshipStatus(res.data.status);
        showToast("Đã gửi lời mời kết bạn!", "success");
      })
      .catch((err) => showToast(err.response?.data?.error || "Không thể gửi lời mời!", "error"))
      .finally(() => setFriendLoading(false));
  };

  const handleAcceptFriendRequest = () => {
    if (!currentUser) return;
    setFriendLoading(true);
    friendService.acceptRequest(currentUserId, targetUserId)
      .then((res) => {
        setFriendshipStatus(res.data.status);
        setFriendCount((c) => c + 1);
        showToast("Đã chấp nhận lời mời kết bạn!", "success");
      })
      .catch((err) => showToast(err.response?.data?.error || "Không thể chấp nhận lời mời!", "error"))
      .finally(() => setFriendLoading(false));
  };

  const handleRemoveFriendship = () => {
    if (!currentUser) return;
    if (friendshipStatus === "FRIENDS" && !window.confirm("Bạn có chắc chắn muốn hủy kết bạn?")) return;
    setFriendLoading(true);
    friendService.removeFriendship(currentUserId, targetUserId)
      .then(() => {
        setFriendshipStatus("NONE");
        if (friendshipStatus === "FRIENDS") setFriendCount((c) => Math.max(0, c - 1));
        showToast("Đã hủy kết bạn!", "info");
      })
      .catch(() => showToast("Không thể thực hiện!", "error"))
      .finally(() => setFriendLoading(false));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditMsg({ text: "", type: "" });
    try {
      const res = await userService.update(userId, editForm);
      setUser(res.data);
      if (isMe) {
        updateUser({
          ...currentUser,
          fullName: res.data.fullName,
          avatarColor: res.data.avatarColor,
          avatarUrl: res.data.avatarUrl,
          bannerUrl: res.data.bannerUrl,
          emailPrivacy: res.data.emailPrivacy,
        });
      }
      showToast("Cập nhật hồ sơ thành công!", "success");
      setEditMsg({ text: "Cập nhật thành công!", type: "success" });
    } catch {
      showToast("Cập nhật thất bại!", "error");
      setEditMsg({ text: "Cập nhật thất bại!", type: "error" });
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return setPwMsg({ text: "Mật khẩu mới không khớp!", type: "error" });
    }
    if (pwForm.newPassword.length < 6) {
      return setPwMsg({ text: "Mật khẩu mới phải có ít nhất 6 ký tự!", type: "error" });
    }
    setPwLoading(true);
    setPwMsg({ text: "", type: "" });
    try {
      await userService.changePassword(userId, pwForm.oldPassword, pwForm.newPassword);
      showToast("Đổi mật khẩu thành công!", "success");
      setPwMsg({ text: "Đổi mật khẩu thành công!", type: "success" });
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwMsg({ text: err.response?.data || "Đổi mật khẩu thất bại!", type: "error" });
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <div style={{ maxWidth: 840, margin: "0 auto", padding: "24px 16px" }}>
          <div className="card" style={{ padding: 32, marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div className="skeleton" style={{ width: 100, height: 100, borderRadius: "50%" }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 28, width: "40%", marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 16, width: "60%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const avatarColor = user.avatarColor || "#1877f2";
  const bannerBackground = user.bannerUrl
    ? `url(${user.bannerUrl}) center/cover no-repeat`
    : bannerPreset;

  const displayName = user.fullName || user.username;

  return (
    <div className="app-layout">
      <div style={{ maxWidth: 840, margin: "0 auto", padding: "16px" }}>

        {/* Profile Header Card */}
        <div className="card" style={{ padding: 0, marginBottom: 20, borderRadius: 16, position: "relative" }}>

          {/* Header Cover Banner */}
          <div style={{ position: "relative", zIndex: 1, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: "hidden" }}>
            <div
              className="profile-cover"
              onClick={() => isMe && bannerInputRef.current?.click()}
              title={isMe ? "Bấm để đổi ảnh bìa" : undefined}
              style={{
                background: bannerBackground,
                height: 280,
                transition: "all 0.3s ease",
                cursor: isMe ? "pointer" : "default",
              }}
            />
            {isMe && (
              <>
                <button
                  type="button"
                  title="Đổi ảnh bìa"
                  onClick={(e) => { e.stopPropagation(); bannerInputRef.current?.click(); }}
                  style={{
                    position: "absolute", bottom: 14, right: 16,
                    zIndex: 50,
                    background: "rgba(0, 0, 0, 0.6)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    display: "flex", alignItems: "center", gap: 8,
                    fontSize: 13, fontWeight: 600,
                    cursor: "pointer",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.85)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.6)"}
                >
                  {uploadingBanner ? (
                    <span>Đang tải ảnh...</span>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      Đổi ảnh bìa
                    </>
                  )}
                </button>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleQuickBannerUpload(e.target.files?.[0])}
                />
              </>
            )}
          </div>

          {/* User Info Header Block */}
          <div style={{ padding: "0 28px 16px", position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", gap: 24, alignItems: "flex-end", flexWrap: "wrap", marginTop: -70, marginBottom: 16 }}>

              {/* Large Avatar */}
              <div
                style={{ position: "relative", display: "inline-block", cursor: isMe ? "pointer" : "default" }}
                onClick={() => isMe && avatarInputRef.current?.click()}
                title={isMe ? "Bấm để đổi ảnh đại diện" : undefined}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    className="avatar avatar-xl"
                    style={{
                      width: 140, height: 140,
                      border: "4px solid var(--bg-card)",
                      objectFit: "cover",
                      boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
                      display: "block",
                    }}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <div
                    className="avatar avatar-xl"
                    style={{
                      fontSize: 44, width: 140, height: 140,
                      border: "4px solid var(--bg-card)",
                      background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}bb)`,
                      boxShadow: `0 6px 24px ${avatarColor}44`,
                    }}
                  >
                    {getInitials(displayName)}
                  </div>
                )}

                {isMe && (
                  <>
                    <button
                      type="button"
                      title="Đổi ảnh đại diện"
                      onClick={(e) => { e.stopPropagation(); avatarInputRef.current?.click(); }}
                      style={{
                        position: "absolute", bottom: 6, right: 6,
                        zIndex: 50,
                        width: 36, height: 36,
                        borderRadius: "50%",
                        background: uploadingAvatar ? "var(--primary)" : "var(--bg-input)",
                        border: "2px solid var(--bg-card)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
                        transition: "all 0.2s",
                        color: uploadingAvatar ? "#fff" : "var(--text-primary)",
                      }}
                      onMouseEnter={(e) => { if (!uploadingAvatar) { e.currentTarget.style.background = "var(--primary)"; e.currentTarget.style.color = "#fff"; }}}
                      onMouseLeave={(e) => { if (!uploadingAvatar) { e.currentTarget.style.background = "var(--bg-input)"; e.currentTarget.style.color = "var(--text-primary)"; }}}
                    >
                      {uploadingAvatar ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                      )}
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleQuickAvatarUpload(e.target.files?.[0])}
                    />
                  </>
                )}
              </div>

              {/* Name & Metadata */}
              <div style={{ flex: 1, minWidth: 220, paddingBottom: 6 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4, letterSpacing: "-0.5px" }}>
                  {displayName}
                </h1>
                <div style={{ color: "var(--text-muted)", fontSize: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-muted)" }}>@{user.username}</span>
                  <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>• 👥 {friendCount} người bạn</span>
                </div>
              </div>

              {/* Action Buttons */}
              {isMe ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingBottom: 6, position: "relative", zIndex: 100 }} ref={moreMenuRef}>
                  <button
                    className="btn btn-primary"
                    onClick={() => setActiveTab("edit")}
                    style={{
                      gap: 8,
                      padding: "9px 18px",
                      borderRadius: 10,
                      fontWeight: 700,
                      boxShadow: "0 4px 14px rgba(24, 119, 242, 0.35)",
                    }}
                  >
                    ✏️ Chỉnh sửa trang cá nhân
                  </button>

                  {/* Nút menu 3 chấm tùy chọn */}
                  <button
                    className="btn btn-secondary"
                    onClick={() => setMoreMenuOpen((v) => !v)}
                    title="Tùy chọn khác"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      fontWeight: 800,
                    }}
                  >
                    ···
                  </button>

                  {/* Dropdown Menu 3 chấm */}
                  {moreMenuOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        right: 0,
                        width: 220,
                        background: "var(--bg-card)",
                        borderRadius: 14,
                        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.25), 0 2px 6px rgba(0, 0, 0, 0.15)",
                        border: "1px solid var(--border-light)",
                        zIndex: 99999,
                        padding: "6px 0",
                        animation: "dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    >
                      <Link
                        to="/dashboard"
                        onClick={() => setMoreMenuOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 16px",
                          color: "var(--text-primary)",
                          textDecoration: "none",
                          fontSize: 14,
                          fontWeight: 600,
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <span>📊 Quản lý bài viết</span>
                      </Link>

                      <div style={{ height: 1, background: "var(--border-light)", margin: "4px 0" }} />

                      <div
                        onClick={() => {
                          setActiveTab("edit");
                          setMoreMenuOpen(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 16px",
                          color: "var(--text-primary)",
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: 600,
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <span>⚙️ Chỉnh sửa hồ sơ</span>
                      </div>

                      <Link
                        to="/security"
                        onClick={() => setMoreMenuOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 16px",
                          color: "var(--text-primary)",
                          textDecoration: "none",
                          fontSize: 14,
                          fontWeight: 600,
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <span>🔒 Cài đặt bảo mật</span>
                      </Link>

                      <div
                        onClick={() => {
                          navigate("/saved");
                          setMoreMenuOpen(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 16px",
                          color: "var(--text-primary)",
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: 600,
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <span>🔖 Bài viết đã lưu</span>
                      </div>

                      {/* Tùy chọn Kho tin lưu trữ (Archived Stories) */}
                      <div
                        onClick={() => {
                          setShowStoryArchiveModal(true);
                          setMoreMenuOpen(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 16px",
                          color: "var(--text-primary)",
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: 600,
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <span>🗂️ Kho tin lưu trữ</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : currentUser && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingBottom: 6 }}>
                  {(!friendshipStatus || friendshipStatus === "NONE" || friendshipStatus === "NOT_FRIENDS") && (
                    <button className="btn btn-primary" onClick={handleSendFriendRequest} disabled={friendLoading} style={{ padding: "9px 18px", borderRadius: 10, fontWeight: 700 }}>
                      ➕ Thêm bạn bè
                    </button>
                  )}
                  {friendshipStatus === "PENDING_SENT" && (
                    <button className="btn btn-secondary" onClick={handleRemoveFriendship} disabled={friendLoading} title="Bấm để hủy lời mời" style={{ padding: "9px 18px", borderRadius: 10 }}>
                      ⏳ Đã gửi lời mời (Hủy)
                    </button>
                  )}
                  {friendshipStatus === "PENDING_RECEIVED" && (
                    <>
                      <button className="btn btn-primary" onClick={handleAcceptFriendRequest} disabled={friendLoading} style={{ padding: "9px 18px", borderRadius: 10, fontWeight: 700 }}>
                        ✅ Chấp nhận lời mời
                      </button>
                      <button className="btn btn-secondary" onClick={handleRemoveFriendship} disabled={friendLoading} style={{ padding: "9px 18px", borderRadius: 10 }}>
                        ❌ Từ chối
                      </button>
                    </>
                  )}
                  {friendshipStatus === "FRIENDS" && (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("open_chat_user", { detail: { friend: user } }));
                        }}
                        style={{ padding: "9px 18px", borderRadius: 10, fontWeight: 700 }}
                      >
                        💬 Nhắn tin
                      </button>
                      <button className="btn btn-secondary" onClick={handleRemoveFriendship} disabled={friendLoading} style={{ padding: "9px 18px", borderRadius: 10 }}>
                        👥 Bạn bè (Hủy kết bạn)
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Bio section */}
            {user.bio && (
              <div style={{
                fontSize: 14.5,
                color: "var(--text-secondary)",
                marginBottom: 12,
                fontWeight: 500,
                lineHeight: 1.4,
              }}>
                {user.bio}
              </div>
            )}

            {/* Navigation Tabs Bar */}
            <div
              style={{
                display: "flex",
                gap: 6,
                borderTop: "1px solid var(--border-light)",
                paddingTop: 6,
                marginTop: 12,
                overflowX: "auto",
                whiteSpace: "nowrap",
                scrollbarWidth: "none",
              }}
            >
              {[
                { key: "posts", label: "Bài viết", count: posts.length, icon: "📝" },
                { key: "friends", label: "Bạn bè", count: friendsList.length, icon: "👥" },
                ...(isMe ? [
                  { key: "bookmarks", label: "Đã lưu", count: bookmarkedPosts.length, icon: "🔖" },
                  { key: "edit", label: "Chỉnh sửa hồ sơ", icon: "⚙️" },
                ] : []),
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    background: activeTab === tab.key ? "var(--primary-light)" : "none",
                    border: "none",
                    borderBottom: activeTab === tab.key ? "3px solid var(--primary)" : "3px solid transparent",
                    color: activeTab === tab.key ? "var(--primary)" : "var(--text-secondary)",
                    fontWeight: activeTab === tab.key ? 700 : 600,
                    fontSize: 14,
                    padding: "10px 16px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    borderRadius: "8px 8px 0 0",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span style={{ fontSize: 12, opacity: 0.85 }}>({tab.count})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab: Bài viết */}
        {activeTab === "posts" && (
          posts.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">📝</div>
              <h3>Chưa có bài viết nào</h3>
              {isMe && (
                <Link to="/dashboard">
                  <button className="btn btn-primary" style={{ marginTop: 12 }}>Viết bài ngay</button>
                </Link>
              )}
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )
        )}

        {/* Tab: Danh Sách Bạn Bè (Friends Grid) */}
        {activeTab === "friends" && (
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
              Danh sách bạn bè ({friendsList.length})
            </h3>
            {friendsList.length === 0 ? (
              <div className="empty-state" style={{ padding: "30px 0" }}>
                <div className="empty-state-icon">👥</div>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Chưa có người bạn nào trong danh sách.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                {friendsList.map((friend) => {
                  const fName = friend.fullName || friend.username;
                  return (
                    <div
                      key={friend.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid var(--border-light)",
                        background: "var(--bg-input)",
                      }}
                    >
                      {friend.avatarUrl ? (
                        <img
                          src={friend.avatarUrl}
                          alt={fName}
                          className="avatar avatar-md"
                          style={{ objectFit: "cover", cursor: "pointer" }}
                          onClick={() => navigate(`/profile/${friend.id}`)}
                        />
                      ) : (
                        <div
                          className="avatar avatar-md"
                          onClick={() => navigate(`/profile/${friend.id}`)}
                          style={{
                            cursor: "pointer",
                            background: friend.avatarColor
                              ? `linear-gradient(135deg, ${friend.avatarColor}, ${friend.avatarColor}bb)`
                              : undefined,
                          }}
                        >
                          {getInitials(fName)}
                        </div>
                      )}
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div
                          onClick={() => navigate(`/profile/${friend.id}`)}
                          style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text-primary)", cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                        >
                          {fName}
                        </div>
                        <button
                          type="button"
                          onClick={() => window.dispatchEvent(new CustomEvent("open_chat_user", { detail: { friend } }))}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--primary)",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: 0,
                            marginTop: 2,
                          }}
                        >
                          💬 Nhắn tin
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Đã lưu */}
        {activeTab === "bookmarks" && isMe && (
          bookmarkedPosts.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">🔖</div>
              <h3>Chưa có bài viết nào được lưu</h3>
              <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>
                Bấm vào biểu tượng lưu trên bất kỳ bài viết nào để xem lại sau.
              </p>
            </div>
          ) : (
            bookmarkedPosts.map((post) => <PostCard key={post.id} post={post} />)
          )
        )}

        {/* Tab: Chỉnh sửa hồ sơ */}
        {activeTab === "edit" && isMe && (
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "var(--text-primary)" }}>
              Chỉnh sửa hồ sơ cá nhân
            </h2>
            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label className="form-label">Họ và tên</label>
                <input
                  className="form-input"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email & Quyền riêng tư</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    className="form-input"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="Nhập email"
                    style={{ flex: 1, minWidth: 200 }}
                  />
                  <select
                    className="form-input"
                    value={editForm.emailPrivacy}
                    onChange={(e) => setEditForm({ ...editForm, emailPrivacy: e.target.value })}
                    style={{ width: "auto", minWidth: 200 }}
                  >
                    <option value="private">🔒 Chỉ mình tôi (Mặc định)</option>
                    <option value="public">🌐 Công khai cho mọi người</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Giới thiệu bản thân (Bio)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Viết vài dòng giới thiệu bản thân..."
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Link / Upload Ảnh đại diện */}
              <div className="form-group">
                <label className="form-label">Ảnh đại diện (Avatar)</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="form-input"
                    value={editForm.avatarUrl}
                    onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                    placeholder="Dán link ảnh hoặc tải ảnh lên..."
                  />
                  <label className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                    <span>Tải ảnh lên</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const res = await uploadService.uploadFile(file);
                          setEditForm((f) => ({ ...f, avatarUrl: res.data.url }));
                          showToast("Đã tải ảnh đại diện lên!", "success");
                        } catch {
                          showToast("Không thể tải ảnh đại diện lên!", "error");
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Link / Upload Ảnh bìa */}
              <div className="form-group">
                <label className="form-label">Ảnh bìa trang cá nhân (Cover Banner)</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="form-input"
                    value={editForm.bannerUrl}
                    onChange={(e) => setEditForm({ ...editForm, bannerUrl: e.target.value })}
                    placeholder="Dán link ảnh bìa hoặc tải ảnh lên..."
                  />
                  <label className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                    <span>Tải ảnh lên</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const res = await uploadService.uploadFile(file);
                          setEditForm((f) => ({ ...f, bannerUrl: res.data.url }));
                          showToast("Đã tải ảnh bìa lên!", "success");
                        } catch {
                          showToast("Không thể tải ảnh bìa lên!", "error");
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {editMsg.text && (
                <div className={`alert ${editMsg.type === "success" ? "alert-success" : "alert-error"}`}>
                  {editMsg.text}
                </div>
              )}

              <button className="btn btn-primary" type="submit" disabled={editLoading} style={{ marginTop: 12 }}>
                {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </form>
          </div>
        )}


      </div>

      {/* Modal Kho tin lưu trữ (Archived Stories Modal) */}
      {showStoryArchiveModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(6px)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-light)",
              borderRadius: 20,
              maxWidth: 580,
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: 24,
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              animation: "slideUp 0.2s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid var(--border-light)", paddingBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>🗂️</span>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                    Kho tin lưu trữ (Archived Stories)
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                    Chỉ bạn mới có thể xem các tin đã hết hạn sau 24h này
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStoryArchiveModal(false)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>

            {/* Grid danh sách tin lưu trữ */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {archivedStories.map((story) => (
                <div
                  key={story.id}
                  style={{
                    position: "relative",
                    borderRadius: 14,
                    overflow: "hidden",
                    aspectRatio: "9 / 16",
                    background: "#000",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  <img src={story.mediaUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent 60%)", padding: 10, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>
                      📅 {new Date(story.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                    <div>
                      {story.caption && (
                        <p style={{ fontSize: 12, color: "#fff", margin: "0 0 4px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {story.caption}
                        </p>
                      )}
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>
                        👁️ {story.views} lượt xem
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`custom-toast ${toast.type}`}>
          <span>{toast.type === "success" ? "✓" : toast.type === "error" ? "❌" : "ℹ️"}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default Profile;
