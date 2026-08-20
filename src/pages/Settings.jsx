import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { toast } from "sonner";
import userService from "../services/userService";
import uploadService from "../services/uploadService";
import Avatar from "../components/Avatar";
import {
  User,
  Lock,
  Shield,
  Bell,
  Palette,
  Camera,
  Loader2,
  Save,
  X,
} from "lucide-react";

// Inline SVG components for social media icons
const FacebookIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TikTokIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const InstagramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const YouTubeIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const GitHubIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const TwitterIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const tabs = [
  { id: "account", label: "Tài khoản & Hồ sơ", icon: User },
  { id: "security", label: "Bảo mật & Đăng nhập", icon: Lock },
  { id: "privacy", label: "Quyền riêng tư", icon: Shield },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "appearance", label: "Giao diện", icon: Palette },
];

export default function Settings() {
  const { currentUser } = useAuth();
  const { setTheme: setContextTheme, themeMode: contextThemeMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get active tab from URL query param or default to 'account'
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get("tab") || "account";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Account & Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    bio: "",
    avatarUrl: "",
    bannerUrl: "",
    facebookUrl: "",
    tiktokUrl: "",
    instagramUrl: "",
    youtubeUrl: "",
    githubUrl: "",
    twitterUrl: "",
  });

  // Security form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Privacy form state
  const [privacyForm, setPrivacyForm] = useState({
    friendListPrivacy: "PUBLIC",
    followerListPrivacy: "PUBLIC",
  });

  // Notifications form state
  const [notificationsForm, setNotificationsForm] = useState({
    likeNotifications: true,
    commentNotifications: true,
    mentionNotifications: true,
    friendRequestNotifications: true,
  });

  // Appearance form state — đồng bộ với ThemeContext
  const [theme, setTheme] = useState(() => contextThemeMode);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const avatarInputRef = useState(null)[0];
  const bannerInputRef = useState(null)[0];

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Load user data
    setLoading(true);
    userService.getById(currentUser.id || currentUser.userId)
      .then((res) => {
        const userData = res.data;
        setUser(userData);
        setProfileForm({
          fullName: userData.fullName || "",
          bio: userData.bio || "",
          avatarUrl: userData.avatarUrl || "",
          bannerUrl: userData.bannerUrl || "",
          facebookUrl: userData.facebookUrl || "",
          tiktokUrl: userData.tiktokUrl || "",
          instagramUrl: userData.instagramUrl || "",
          youtubeUrl: userData.youtubeUrl || "",
          githubUrl: userData.githubUrl || "",
          twitterUrl: userData.twitterUrl || "",
        });
        setPrivacyForm({
          friendListPrivacy: userData.friendListPrivacy || "PUBLIC",
          followerListPrivacy: userData.followerListPrivacy || "PUBLIC",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser, navigate]);

  // Update URL when tab changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("tab", activeTab);
    navigate(`/settings?${params.toString()}`, { replace: true });
  }, [activeTab, navigate]);

  // Giữ local theme state đồng bộ nếu ThemeContext thay đổi từ bên ngoài
  useEffect(() => {
    setTheme(contextThemeMode);
  }, [contextThemeMode]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadService.uploadImage(formData);
      setProfileForm({ ...profileForm, avatarUrl: res.data.url });
      toast.success("Đã tải lên ảnh đại diện");
    } catch (error) {
      toast.error("Không thể tải lên ảnh đại diện");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadService.uploadImage(formData);
      setProfileForm({ ...profileForm, bannerUrl: res.data.url });
      toast.success("Đã tải lên ảnh bìa");
    } catch (error) {
      toast.error("Không thể tải lên ảnh bìa");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userService.updateProfile(currentUser.id || currentUser.userId, profileForm);
      toast.success("Đã lưu hồ sơ");
      
      // Reload user data to sync with AuthContext
      const updatedUser = await userService.getById(currentUser.id || currentUser.userId);
      setUser(updatedUser.data);
      
      // Redirect to profile page to see updated data
      navigate(`/profile/${currentUser.username || currentUser.id}`);
    } catch (error) {
      toast.error("Không thể lưu hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacy = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userService.updateProfile(currentUser.id || currentUser.userId, privacyForm);
      toast.success("Đã lưu cài đặt quyền riêng tư");
    } catch (error) {
      toast.error("Không thể lưu cài đặt quyền riêng tư");
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    // Ủy quyền hoàn toàn cho ThemeContext — nó sẽ cập nhật DOM, localStorage, data-theme
    setContextTheme(newTheme);
    toast.success("Đã áp dụng chế độ giao diện");
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
            Cài đặt
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Quản lý cài đặt tài khoản và giao diện của bạn
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 shrink-0">
            <nav className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-2 sticky top-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                      activeTab === tab.id
                        ? "bg-black dark:bg-white text-white dark:text-black"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6">
              {activeTab === "account" && (
                <AccountTab
                  profileForm={profileForm}
                  setProfileForm={setProfileForm}
                  handleSaveProfile={handleSaveProfile}
                  handleAvatarUpload={handleAvatarUpload}
                  handleBannerUpload={handleBannerUpload}
                  isUploadingAvatar={isUploadingAvatar}
                  isUploadingBanner={isUploadingBanner}
                  avatarInputRef={avatarInputRef}
                  bannerInputRef={bannerInputRef}
                  loading={loading}
                  user={user}
                />
              )}

              {activeTab === "security" && (
                <SecurityTab
                  passwordForm={passwordForm}
                  setPasswordForm={setPasswordForm}
                />
              )}

              {activeTab === "privacy" && (
                <PrivacyTab
                  privacyForm={privacyForm}
                  setPrivacyForm={setPrivacyForm}
                  handleSavePrivacy={handleSavePrivacy}
                  loading={loading}
                />
              )}

              {activeTab === "notifications" && (
                <NotificationsTab
                  notificationsForm={notificationsForm}
                  setNotificationsForm={setNotificationsForm}
                />
              )}

              {activeTab === "appearance" && (
                <AppearanceTab
                  theme={theme}
                  handleThemeChange={handleThemeChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Account & Profile Tab Component
function AccountTab({
  profileForm,
  setProfileForm,
  handleSaveProfile,
  handleAvatarUpload,
  handleBannerUpload,
  isUploadingAvatar,
  isUploadingBanner,
  avatarInputRef,
  bannerInputRef,
  loading,
  user,
}) {
  return (
    <form onSubmit={handleSaveProfile} className="space-y-6">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
        Tài khoản & Hồ sơ
      </h2>

      {/* Avatar & Banner */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Ảnh bìa
          </label>
          <div className="relative h-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl overflow-hidden">
            {profileForm.bannerUrl ? (
              <img
                src={profileForm.bannerUrl}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                Chưa có ảnh bìa
              </div>
            )}
            <button
              type="button"
              onClick={() => bannerInputRef?.current?.click()}
              disabled={isUploadingBanner}
              className="absolute bottom-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition"
            >
              {isUploadingBanner ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              className="hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Ảnh đại diện
          </label>
          <div className="flex items-center gap-4">
            <div className="relative">
              {profileForm.avatarUrl ? (
                <img
                  src={profileForm.avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                  ?
                </div>
              )}
              <button
                type="button"
                onClick={() => avatarInputRef?.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 p-1.5 bg-black hover:bg-zinc-800 text-white rounded-full transition"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Camera className="w-3 h-3" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div className="text-sm text-zinc-500">
              Nhấn vào icon camera để đổi ảnh đại diện
            </div>
          </div>
        </div>
      </div>

      {/* Name & Bio */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Tên hiển thị
          </label>
          <input
            type="text"
            value={profileForm.fullName}
            onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Tiểu sử
          </label>
          <textarea
            value={profileForm.bio}
            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
            rows={3}
            placeholder="Viết một vài dòng giới thiệu về bạn..."
            className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
          />
        </div>
      </div>

      {/* Social Media Links */}
      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
          Liên kết mạng xã hội
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Facebook
            </label>
            <input
              type="url"
              value={profileForm.facebookUrl}
              onChange={(e) => setProfileForm({ ...profileForm, facebookUrl: e.target.value })}
              placeholder="facebook.com/username"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              TikTok
            </label>
            <input
              type="url"
              value={profileForm.tiktokUrl}
              onChange={(e) => setProfileForm({ ...profileForm, tiktokUrl: e.target.value })}
              placeholder="tiktok.com/@username"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Instagram
            </label>
            <input
              type="url"
              value={profileForm.instagramUrl}
              onChange={(e) => setProfileForm({ ...profileForm, instagramUrl: e.target.value })}
              placeholder="instagram.com/username"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              YouTube
            </label>
            <input
              type="url"
              value={profileForm.youtubeUrl}
              onChange={(e) => setProfileForm({ ...profileForm, youtubeUrl: e.target.value })}
              placeholder="youtube.com/@username"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              GitHub
            </label>
            <input
              type="url"
              value={profileForm.githubUrl}
              onChange={(e) => setProfileForm({ ...profileForm, githubUrl: e.target.value })}
              placeholder="github.com/username"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Twitter/X
            </label>
            <input
              type="url"
              value={profileForm.twitterUrl}
              onChange={(e) => setProfileForm({ ...profileForm, twitterUrl: e.target.value })}
              placeholder="x.com/username"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Lưu thay đổi
        </button>
      </div>
    </form>
  );
}

// Security Tab Component
function SecurityTab({ passwordForm, setPasswordForm }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("Mật khẩu mới phải có ít nhất 8 ký tự!");
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword(user.id, passwordForm.currentPassword, passwordForm.newPassword);
      
      toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại!");
      
      // Clear password fields
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      // Auto logout and redirect to login after 1.5s
      setTimeout(() => {
        logout();
        navigate("/login");
      }, 1500);
    } catch (error) {
      toast.error("Không thể đổi mật khẩu. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
        Bảo mật & Đăng nhập
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Mật khẩu hiện tại
          </label>
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Mật khẩu mới
          </label>
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Xác nhận mật khẩu mới
          </label>
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Đổi mật khẩu
        </button>
      </div>
    </form>
  );
}

// Privacy Tab Component
function PrivacyTab({ privacyForm, setPrivacyForm, handleSavePrivacy, loading }) {
  return (
    <form onSubmit={handleSavePrivacy} className="space-y-6">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
        Quyền riêng tư
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Ai có thể xem danh sách bạn bè của tôi?
          </label>
          <select
            value={privacyForm.friendListPrivacy}
            onChange={(e) => setPrivacyForm({ ...privacyForm, friendListPrivacy: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          >
            <option value="PUBLIC">🌐 Công khai (Mọi người đều có thể xem)</option>
            <option value="FRIENDS">👥 Bạn bè (Chỉ bạn bè có thể xem)</option>
            <option value="PRIVATE">🔒 Chỉ mình tôi (Ẩn danh sách bạn bè)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Ai có thể xem danh sách người theo dõi của tôi?
          </label>
          <select
            value={privacyForm.followerListPrivacy}
            onChange={(e) => setPrivacyForm({ ...privacyForm, followerListPrivacy: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          >
            <option value="PUBLIC">🌐 Công khai (Mọi người đều có thể xem)</option>
            <option value="FRIENDS">👥 Bạn bè (Chỉ bạn bè có thể xem)</option>
            <option value="PRIVATE">🔒 Chỉ mình tôi (Ẩn danh sách người theo dõi)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Lưu thay đổi
        </button>
      </div>
    </form>
  );
}

// Notifications Tab Component
function NotificationsTab({ notificationsForm, setNotificationsForm }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
        Thông báo
      </h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white">
              Thông báo khi có người thả tim bài viết
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Nhận thông báo khi ai đó thích bài viết của bạn
            </p>
          </div>
          <button
            onClick={() => setNotificationsForm({ ...notificationsForm, likeNotifications: !notificationsForm.likeNotifications })}
            className={`w-12 h-6 rounded-full transition ${
              notificationsForm.likeNotifications ? "bg-black dark:bg-white" : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transition transform ${
                notificationsForm.likeNotifications ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white">
              Thông báo khi có bình luận mới
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Nhận thông báo khi ai đó bình luận bài viết của bạn
            </p>
          </div>
          <button
            onClick={() => setNotificationsForm({ ...notificationsForm, commentNotifications: !notificationsForm.commentNotifications })}
            className={`w-12 h-6 rounded-full transition ${
              notificationsForm.commentNotifications ? "bg-black dark:bg-white" : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transition transform ${
                notificationsForm.commentNotifications ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white">
              Thông báo khi được nhắc đến (@mention)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Nhận thông báo khi ai đó nhắc đến bạn trong bình luận
            </p>
          </div>
          <button
            onClick={() => setNotificationsForm({ ...notificationsForm, mentionNotifications: !notificationsForm.mentionNotifications })}
            className={`w-12 h-6 rounded-full transition ${
              notificationsForm.mentionNotifications ? "bg-black dark:bg-white" : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transition transform ${
                notificationsForm.mentionNotifications ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white">
              Thông báo lời mời kết bạn
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Nhận thông báo khi có lời mời kết bạn mới
            </p>
          </div>
          <button
            onClick={() => setNotificationsForm({ ...notificationsForm, friendRequestNotifications: !notificationsForm.friendRequestNotifications })}
            className={`w-12 h-6 rounded-full transition ${
              notificationsForm.friendRequestNotifications ? "bg-black dark:bg-white" : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transition transform ${
                notificationsForm.friendRequestNotifications ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// Appearance Tab Component
function AppearanceTab({ theme, handleThemeChange }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
        Giao diện
      </h2>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Chế độ giao diện
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => handleThemeChange("light")}
            className={`p-4 rounded-xl border-2 transition ${
              theme === "light"
                ? "border-black dark:border-white bg-zinc-100 dark:bg-zinc-800"
                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-zinc-300 shadow-sm" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">Sáng</span>
            </div>
          </button>

          <button
            onClick={() => handleThemeChange("dark")}
            className={`p-4 rounded-xl border-2 transition ${
              theme === "dark"
                ? "border-black dark:border-white bg-zinc-100 dark:bg-zinc-800"
                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border-2 border-zinc-700 shadow-sm" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">Tối</span>
            </div>
          </button>

          <button
            onClick={() => handleThemeChange("system")}
            className={`p-4 rounded-xl border-2 transition ${
              theme === "system"
                ? "border-black dark:border-white bg-zinc-100 dark:bg-zinc-800"
                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-white to-zinc-900 border-2 border-zinc-300 shadow-sm" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">Theo hệ thống</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
