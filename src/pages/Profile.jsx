import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MessageCircle,
  UserPlus,
  UserCheck,
  X,
  Camera,
  Loader2,
  Archive,
  MoreHorizontal,
  Image as ImageIcon,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import userService from "../services/userService";
import postService from "../services/postService";
import bookmarkService from "../services/bookmarkService";
import friendService from "../services/friendService";
import followService from "../services/followService";
import uploadService from "../services/uploadService";
import PostCard from "../components/PostCard";
import StoryArchiveModal from "../components/StoryArchiveModal";
import ConfirmModal from "../components/ConfirmModal";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser, updateUser, login, logout } = useAuth();

  const currentUserId = currentUser ? Number(currentUser.id || currentUser.userId) : null;
  const targetUserId = userId ? Number(userId) : currentUserId;
  const isMe = Boolean(currentUserId && targetUserId && currentUserId === targetUserId);

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts"); // "posts" | "media" | "saved"
  const [loading, setLoading] = useState(true);

  // Friendship
  const [friendshipStatus, setFriendshipStatus] = useState("NONE");
  const [friendCount, setFriendCount] = useState(0);
  const [friendLoading, setFriendLoading] = useState(false);

  // Follow System
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStoryArchiveOpen, setIsStoryArchiveOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: "", bio: "", avatarUrl: "", bannerUrl: "" });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const modalAvatarInputRef = useRef(null);

  // Load User Data
  useEffect(() => {
    if (!targetUserId) return;
    setLoading(true);

    userService.getById(targetUserId)
      .then((res) => {
        const userData = res.data;
        setUser(userData);
        setEditForm({
          fullName: userData.fullName || "",
          bio: userData.bio || "",
          avatarUrl: userData.avatarUrl || "",
          bannerUrl: userData.bannerUrl || ""
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Load Posts
    postService.getAll(0, 50)
      .then((res) => {
        const list = res.data?.content || res.data || [];
        const userPosts = list.filter((p) => Number(p.user?.id) === Number(targetUserId));
        setPosts(userPosts);
      })
      .catch(() => {});

    // Load Friendship status & Friend count
    if (!isMe && currentUserId) {
      friendService.getStatus(currentUserId, targetUserId)
        .then((res) => setFriendshipStatus(res.data?.status || "NONE"))
        .catch(() => {});

      followService.checkFollowStatus(targetUserId)
        .then((res) => setIsFollowing(res.data?.isFollowing || false))
        .catch(() => {});
    }

    friendService.getFriendCount(targetUserId)
      .then((res) => setFriendCount(res.data?.count || 0))
      .catch(() => {});

    followService.getFollowCounts(targetUserId)
      .then((res) => setFollowerCount(res.data?.followerCount || 0))
      .catch(() => {});

    // Load Saved posts if viewing own profile
    if (isMe) {
      bookmarkService.getUserBookmarks(currentUserId)
        .then((res) => {
          const bList = (res.data || []).map((b) => b.post).filter(Boolean);
          setSavedPosts(bList);
        })
        .catch(() => {});
    }
  }, [targetUserId, currentUserId, isMe]);

  // Handle direct Avatar upload
  const handleDirectAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !isMe || !currentUserId) return;

    setIsUploadingAvatar(true);
    try {
      const res = await uploadService.uploadFile(file);
      if (res.data?.url) {
        const newAvatarUrl = res.data.url;
        const updated = await userService.update(currentUserId, { avatarUrl: newAvatarUrl });
        setUser((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
        setEditForm((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
        if (updateUser) updateUser(updated.data || { ...user, avatarUrl: newAvatarUrl });
        toast.success("Đã cập nhật ảnh đại diện thành công!");
      }
    } catch {
      toast.error("Lỗi tải ảnh đại diện lên. Vui lòng thử lại!");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      if (modalAvatarInputRef.current) modalAvatarInputRef.current.value = "";
    }
  };

  // Handle direct Banner/Cover upload
  const handleDirectBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !isMe || !currentUserId) return;

    setIsUploadingBanner(true);
    try {
      const res = await uploadService.uploadFile(file);
      if (res.data?.url) {
        const newBannerUrl = res.data.url;
        const updated = await userService.update(currentUserId, { bannerUrl: newBannerUrl });
        setUser((prev) => ({ ...prev, bannerUrl: newBannerUrl }));
        setEditForm((prev) => ({ ...prev, bannerUrl: newBannerUrl }));
        if (updateUser) updateUser(updated.data || { ...user, bannerUrl: newBannerUrl });
        toast.success("Đã cập nhật ảnh bìa thành công!");
      }
    } catch {
      toast.error("Lỗi tải ảnh bìa lên. Vui lòng thử lại!");
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.fullName.trim() || isUpdating) return;

    setIsUpdating(true);
    try {
      const res = await userService.update(currentUserId, editForm);
      setUser(res.data);
      if (updateUser) updateUser(res.data);
      setIsEditModalOpen(false);
      toast.success("Đã lưu thông tin hồ sơ thành công!");
    } catch {
      toast.error("Không thể lưu thông tin hồ sơ!");
    } finally {
      setIsUpdating(false);
    }
  };

  // Optimistic Friend / Follow Toggle
  const handleToggleFriend = async () => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    if (friendLoading) return;

    const prevStatus = friendshipStatus;
    const prevCount = friendCount;

    // Optimistic UI state update
    if (prevStatus === "NONE") {
      setFriendshipStatus("PENDING");
      toast.success("Đã gửi lời mời kết bạn");
    } else if (prevStatus === "PENDING" || prevStatus === "ACCEPTED") {
      setFriendshipStatus("NONE");
      if (prevStatus === "ACCEPTED") {
        setFriendCount((prev) => Math.max(0, prev - 1));
        toast.info("Đã hủy kết bạn");
      } else {
        toast.info("Đã hủy lời mời kết bạn");
      }
    }

    setFriendLoading(true);
    try {
      if (prevStatus === "NONE") {
        await friendService.sendFriendRequest(currentUserId, targetUserId);
      } else {
        await friendService.removeFriendship(currentUserId, targetUserId);
      }
    } catch {
      // Revert state on error
      setFriendshipStatus(prevStatus);
      setFriendCount(prevCount);
      toast.error("Thao tác thất bại. Vui lòng thử lại!");
    } finally {
      setFriendLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUserId || !targetUserId) {
      toast.error("Vui lòng đăng nhập để thực hiện thao tác!");
      return;
    }

    const prevFollowing = isFollowing;
    const prevCount = followerCount;

    setIsFollowing(!prevFollowing);
    setFollowerCount(prevFollowing ? Math.max(0, prevCount - 1) : prevCount + 1);
    setFollowLoading(true);

    try {
      if (prevFollowing) {
        await followService.unfollowUser(targetUserId);
        toast.info(`Đã hủy theo dõi ${user?.fullName || user?.username}`);
      } else {
        await followService.followUser(targetUserId);
        toast.success(`Đang theo dõi ${user?.fullName || user?.username}`);
      }
    } catch {
      setIsFollowing(prevFollowing);
      setFollowerCount(prevCount);
      toast.error("Không thể thay đổi trạng thái theo dõi lúc này!");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleEditPost = (updatedPost) => {
    if (!updatedPost?.id) return;
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
    );
  };

  const handleLogout = () => {
    setIsLogoutConfirmOpen(false);
    logout();
    navigate("/login");
    toast.info("Đã đăng xuất tài khoản");
  };

  if (loading) {
    return (
      <div className="p-12 text-center flex justify-center text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-12 text-center text-zinc-500">
        <p>Không tìm thấy người dùng này.</p>
        <Link to="/" className="text-black dark:text-white font-bold mt-2 inline-block">
          ← Về trang chủ
        </Link>
      </div>
    );
  }

  const mediaPosts = posts.filter((p) => Boolean(p.thumbNail));

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-300 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-base text-zinc-900 dark:text-zinc-100 truncate">
            {user.fullName || user.username}
          </span>
          <span className="text-xs text-zinc-500">
            {posts.length} bài viết
          </span>
        </div>
      </div>

      {/* 1. Cover Banner với nút đổi ảnh bìa */}
      <div className="h-32 md:h-40 w-full rounded-2xl relative overflow-hidden bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-800 group">
        {user.bannerUrl ? (
          <img
            src={user.bannerUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : null}

        {/* Nút Đổi ảnh bìa (chính chủ) */}
        {isMe && (
          <>
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={isUploadingBanner}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              {isUploadingBanner ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
              <span>{isUploadingBanner ? "Đang tải..." : "Đổi ảnh bìa"}</span>
            </button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleDirectBannerUpload}
              className="hidden"
            />
          </>
        )}
      </div>

      {/* 2. Header Info (Avatar + Action Buttons) */}
      <div className="px-3 -mt-10 md:-mt-12 mb-2 flex flex-col">
        <div className="flex justify-between items-end gap-3 mb-2">
          {/* Avatar với nút camera tải ảnh */}
          <div className="relative shrink-0 group">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white dark:border-zinc-900 shadow-md object-cover"
              />
            ) : (
              <div
                className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white dark:border-zinc-900 shadow-md flex items-center justify-center font-bold text-white text-xl md:text-2xl bg-zinc-800 dark:bg-zinc-700"
              >
                {getInitials(user.fullName || user.username)}
              </div>
            )}

            {/* Nút Camera trên avatar chính chủ */}
            {isMe && (
              <>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black border-2 border-white dark:border-zinc-900 shadow-md hover:scale-110 transition cursor-pointer"
                  title="Đổi ảnh đại diện"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleDirectAvatarUpload}
                  className="hidden"
                />
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 pb-1 justify-end max-w-[240px] sm:max-w-none">
            {isMe ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition cursor-pointer"
                >
                  Chỉnh sửa hồ sơ
                </button>

                {/* Nút Kho lưu trữ tin */}
                <button
                  type="button"
                  onClick={() => setIsStoryArchiveOpen(true)}
                  className="px-3.5 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition flex items-center gap-1.5 cursor-pointer"
                  title="Kho lưu trữ tin 24h"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kho lưu trữ</span>
                </button>
              </>
            ) : (
              <>
                {/* Nút Theo dõi / Hủy theo dõi (Độc lập, lưu vào Database) */}
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isFollowing
                      ? "bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600"
                      : "bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-xs active:scale-95"
                  }`}
                >
                  {followLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isFollowing ? (
                    <span>Đang theo dõi</span>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Theo dõi</span>
                    </>
                  )}
                </button>

                {/* Nút Kết bạn / Bạn bè */}
                <button
                  type="button"
                  onClick={handleToggleFriend}
                  disabled={friendLoading}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    friendshipStatus === "ACCEPTED"
                      ? "bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                      : friendshipStatus === "PENDING"
                      ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      : "border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  {friendLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : friendshipStatus === "ACCEPTED" ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Bạn bè</span>
                    </>
                  ) : friendshipStatus === "PENDING" ? (
                    <span>Đã gửi lời mời</span>
                  ) : (
                    <span>+ Kết bạn</span>
                  )}
                </button>

                {/* Nút Nhắn tin */}
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("open_chat_user", { detail: { friend: user } })
                    );
                  }}
                  className="p-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                  title="Nhắn tin"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Typography */}
        <div className="flex flex-col">
          <h1 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 tracking-tight">
            {user.fullName || user.username}
          </h1>
          <span className="text-xs text-zinc-500 font-medium">
            @{user.username}
          </span>
        </div>

        {user.bio ? (
          <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 mt-2 whitespace-pre-line">
            {user.bio}
          </p>
        ) : isMe ? (
          <p className="text-xs text-zinc-400 italic mt-2">
            Chưa có tiểu sử. Bấm "Chỉnh sửa hồ sơ" để thêm giới thiệu về bạn!
          </p>
        ) : null}

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-2 pb-2">
          <span>
            <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{followerCount}</strong> người theo dõi
          </span>
          <span>·</span>
          <span>
            <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{friendCount}</strong> bạn bè
          </span>
          <span>·</span>
          <span>
            <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{posts.length}</strong> bài viết
          </span>
        </div>
      </div>

      {/* Tabs: Chia đều 3 cột với thanh active tối giản */}
      <div className="grid grid-cols-3 text-center border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("posts")}
          className={`py-3 text-xs font-semibold transition cursor-pointer relative ${
            activeTab === "posts"
              ? "text-black dark:text-white"
              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Bài viết
          {activeTab === "posts" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-black dark:bg-white rounded-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("media")}
          className={`py-3 text-xs font-semibold transition cursor-pointer relative ${
            activeTab === "media"
              ? "text-black dark:text-white"
              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Ảnh &amp; Media
          {activeTab === "media" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-black dark:bg-white rounded-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("saved")}
          className={`py-3 text-xs font-semibold transition cursor-pointer relative ${
            activeTab === "saved"
              ? "text-black dark:text-white"
              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Đã lưu
          {activeTab === "saved" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-black dark:bg-white rounded-full" />
          )}
        </button>
      </div>

      {/* Tab Content List */}
      <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-900 mt-2">
        {activeTab === "posts" ? (
          posts.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 text-xs">
              Chưa có bài viết nào.
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={(delId) => setPosts((prev) => prev.filter((p) => p.id !== delId))}
                onEdit={handleEditPost}
              />
            ))
          )
        ) : activeTab === "media" ? (
          mediaPosts.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 text-xs">
              Chưa có hình ảnh nào.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 p-1">
              {mediaPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/posts/${post.id}`}
                  className="aspect-square relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 group rounded-xl"
                >
                  <img
                    src={post.thumbNail}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                  />
                </Link>
              ))}
            </div>
          )
        ) : savedPosts.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 text-xs">
            Chưa có bài viết nào được lưu.
          </div>
        ) : (
          savedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={(delId) => setSavedPosts((prev) => prev.filter((p) => p.id !== delId))}
              onEdit={handleEditPost}
            />
          ))
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150" onClick={() => setIsEditModalOpen(false)}>
          <div
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveProfile} className="p-5 flex flex-col gap-4">
              {/* Header with centered title and close button */}
              <div className="relative flex items-center justify-center pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <span className="font-bold text-base text-zinc-900 dark:text-white">
                  Chỉnh sửa hồ sơ
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar picker in modal */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {editForm.avatarUrl ? (
                    <img
                      src={editForm.avatarUrl}
                      alt=""
                      className="w-16 h-16 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl bg-zinc-800 dark:bg-zinc-700"
                    >
                      {getInitials(editForm.fullName || user.username)}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => modalAvatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black shadow-xs cursor-pointer hover:scale-110 transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input
                    ref={modalAvatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleDirectAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    Ảnh đại diện
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Nhấn vào máy ảnh để đổi ảnh mới
                  </span>
                </div>
              </div>

              {/* Full name input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-white border border-transparent focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none"
                />
              </div>

              {/* Bio input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Tiểu sử
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  placeholder="Viết một vài dòng giới thiệu về bạn..."
                  className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-white border border-transparent focus:border-zinc-400 dark:focus:border-zinc-600 resize-none focus:outline-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition cursor-pointer"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Story Archive Modal */}
      {isStoryArchiveOpen && (
        <StoryArchiveModal
          isOpen={isStoryArchiveOpen}
          onClose={() => setIsStoryArchiveOpen(false)}
          userId={currentUserId}
        />
      )}
    </div>
  );
}
