import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  Users,
  User,
  PenSquare,
  Lock,
  Settings,
  Bookmark,
  Copy,
  Shield,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import Avatar from "../components/Avatar";
import userService from "../services/userService";
import postService from "../services/postService";
import bookmarkService from "../services/bookmarkService";
import friendService from "../services/friendService";
import followService from "../services/followService";
import uploadService from "../services/uploadService";
import PostCard from "../components/PostCard";
import StoryArchiveModal from "../components/StoryArchiveModal";
import ConfirmModal from "../components/ConfirmModal";
import { isUserOnline, formatLastActive, isUserActiveStatusEnabled, setUserActiveStatusEnabled } from "../utils/statusUtils";

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
  const [activeTab, setActiveTab] = useState("posts"); // "posts" | "media" | "friends" | "saved"
  const [loading, setLoading] = useState(true);

  // Public Friends List
  const [profileFriends, setProfileFriends] = useState([]);
  const [isFriendsPrivate, setIsFriendsPrivate] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);

  // Public Followers List
  const [profileFollowers, setProfileFollowers] = useState([]);
  const [isFollowersPrivate, setIsFollowersPrivate] = useState(false);
  const [followersLoading, setFollowersLoading] = useState(false);

  // Friendship
  const [friendshipStatus, setFriendshipStatus] = useState("NONE");
  const [friendCount, setFriendCount] = useState(0);
  const [friendLoading, setFriendLoading] = useState(false);

  // Follow System
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStoryArchiveOpen, setIsStoryArchiveOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    bio: "",
    avatarUrl: "",
    bannerUrl: "",
    friendListPrivacy: "PUBLIC",
    followerListPrivacy: "PUBLIC",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const modalAvatarInputRef = useRef(null);
  const moreMenuRef = useRef(null);

  // Close more menu on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isMoreMenuOpen]);

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
          bannerUrl: userData.bannerUrl || "",
          friendListPrivacy: userData.friendListPrivacy || (userData.showFriendsList === false ? "PRIVATE" : "PUBLIC"),
          followerListPrivacy: userData.followerListPrivacy || (userData.showFollowingList === false ? "PRIVATE" : "PUBLIC"),
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
        .then((res) => {
          const s = res.data?.status || "NONE";
          if (s === "FRIENDS" || s === "ACCEPTED") setFriendshipStatus("ACCEPTED");
          else if (s === "PENDING_SENT") setFriendshipStatus("PENDING_SENT");
          else if (s === "PENDING_RECEIVED") setFriendshipStatus("PENDING_RECEIVED");
          else if (s === "PENDING") setFriendshipStatus("PENDING_SENT");
          else setFriendshipStatus("NONE");
        })
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

  // Load Friends List when viewing the Friends Tab
  useEffect(() => {
    if (activeTab === "friends" && targetUserId) {
      setFriendsLoading(true);
      setIsFriendsPrivate(false);
      friendService.getFriendsList(targetUserId)
        .then((res) => {
          if (res.data?.isPrivate) {
            setIsFriendsPrivate(true);
            setProfileFriends([]);
          } else {
            const list = Array.isArray(res.data) ? res.data : (res.data?.content || []);
            setProfileFriends(list);
          }
        })
        .catch(() => {
          setProfileFriends([]);
        })
        .finally(() => setFriendsLoading(false));
    }
  }, [activeTab, targetUserId]);

  // Load Followers List when viewing the Followers Tab
  useEffect(() => {
    if (activeTab === "followers" && targetUserId) {
      setFollowersLoading(true);
      setIsFollowersPrivate(false);
      followService.getFollowers(targetUserId)
        .then((res) => {
          if (res.data?.isPrivate) {
            setIsFollowersPrivate(true);
            setProfileFollowers([]);
          } else {
            const list = Array.isArray(res.data) ? res.data : (res.data?.content || []);
            setProfileFollowers(list);
          }
        })
        .catch(() => {
          setProfileFollowers([]);
        })
        .finally(() => setFollowersLoading(false));
    }
  }, [activeTab, targetUserId]);

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
      const payload = {
        ...editForm,
        showFriendsList: editForm.friendListPrivacy === "PUBLIC",
        showFollowingList: editForm.followerListPrivacy === "PUBLIC",
      };
      const res = await userService.update(currentUserId, payload);
      setUser(res.data);
      if (updateUser) updateUser(res.data);
      setIsEditModalOpen(false);
      toast.success("Đã lưu thông tin hồ sơ và quyền riêng tư thành công!");
    } catch {
      toast.error("Không thể lưu thông tin hồ sơ!");
    } finally {
      setIsUpdating(false);
    }
  };

  // Accept incoming friend request
  const handleAcceptFriendRequest = async () => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    if (friendLoading) return;

    setFriendLoading(true);
    setFriendshipStatus("ACCEPTED");
    setFriendCount((prev) => prev + 1);
    setIsFollowing(true);

    try {
      await friendService.acceptRequest(currentUserId, targetUserId);
      toast.success(`Đã chấp nhận lời mời kết bạn của ${user?.fullName || user?.username}!`);
    } catch {
      setFriendshipStatus("PENDING_RECEIVED");
      setFriendCount((prev) => Math.max(0, prev - 1));
      toast.error("Không thể chấp nhận lời mời lúc này!");
    } finally {
      setFriendLoading(false);
    }
  };

  // Decline incoming friend request
  const handleDeclineFriendRequest = async () => {
    if (!currentUserId) return;
    if (friendLoading) return;

    setFriendLoading(true);
    setFriendshipStatus("NONE");

    try {
      await friendService.removeFriendship(currentUserId, targetUserId);
      toast.info("Đã từ chối lời mời kết bạn");
    } catch {
      setFriendshipStatus("PENDING_RECEIVED");
      toast.error("Không thể từ chối lời mời lúc này!");
    } finally {
      setFriendLoading(false);
    }
  };

  // Send friend request
  const handleSendFriendRequest = async () => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    if (friendLoading) return;

    setFriendLoading(true);
    setFriendshipStatus("PENDING_SENT");

    try {
      await friendService.sendFriendRequest(currentUserId, targetUserId);
      toast.success("Đã gửi lời mời kết bạn!");
    } catch {
      setFriendshipStatus("NONE");
      toast.error("Không thể gửi lời mời kết bạn lúc này!");
    } finally {
      setFriendLoading(false);
    }
  };

  // Cancel sent friend request
  const handleCancelFriendRequest = async () => {
    if (!currentUserId) return;
    if (friendLoading) return;

    setFriendLoading(true);
    setFriendshipStatus("NONE");

    try {
      await friendService.removeFriendship(currentUserId, targetUserId);
      toast.info("Đã hủy lời mời kết bạn");
    } catch {
      setFriendshipStatus("PENDING_SENT");
      toast.error("Không thể hủy lời mời lúc này!");
    } finally {
      setFriendLoading(false);
    }
  };

  // Unfriend
  const handleUnfriend = async () => {
    if (!currentUserId) return;
    if (friendLoading) return;

    setFriendLoading(true);
    setFriendshipStatus("NONE");
    setFriendCount((prev) => Math.max(0, prev - 1));

    try {
      await friendService.removeFriendship(currentUserId, targetUserId);
      toast.info("Đã hủy kết bạn");
    } catch {
      setFriendshipStatus("ACCEPTED");
      setFriendCount((prev) => prev + 1);
      toast.error("Không thể hủy kết bạn lúc này!");
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
    const nextFollowing = !prevFollowing;

    setIsFollowing(nextFollowing);
    setFollowerCount(prevFollowing ? Math.max(0, prevCount - 1) : prevCount + 1);
    setFollowLoading(true);

    window.dispatchEvent(
      new CustomEvent("follow_state_changed", {
        detail: { targetUserId: Number(targetUserId), isFollowing: nextFollowing },
      })
    );

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
      window.dispatchEvent(
        new CustomEvent("follow_state_changed", {
          detail: { targetUserId: Number(targetUserId), isFollowing: prevFollowing },
        })
      );
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
    <div className="w-full min-h-full flex flex-col touch-pan-y">
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
      <div className="h-44 sm:h-56 md:h-64 w-full rounded-2xl md:rounded-3xl relative overflow-hidden bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-800 group shadow-xs">
        {user.bannerUrl ? (
          <img
            src={user.bannerUrl}
            alt="Ảnh bìa"
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setLightboxUrl(user.bannerUrl)}
            title="Nhấp để xem ảnh bìa"
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

      {/* 2. Header Info (Avatar + Name + Bio + Stats + Action Buttons centered) */}
      <div className="px-3 sm:px-6 -mt-14 sm:-mt-16 md:-mt-20 mb-4 flex flex-col items-center justify-center text-center relative">
        {/* Nút 3 chấm tùy chọn góc phải (Gọn gàng trên Mobile & Desktop) */}
        {isMe && (
          <div className="absolute right-2 sm:right-6 top-16 sm:top-18 z-20" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen((v) => !v)}
              className={`w-10 h-10 rounded-full border border-zinc-200/90 dark:border-zinc-700/90 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-all duration-150 cursor-pointer shadow-xs active:scale-95 flex items-center justify-center ${
                isMoreMenuOpen ? "bg-zinc-200 dark:bg-zinc-700 ring-2 ring-[#0866ff]/30" : ""
              }`}
              title="Tùy chọn trang cá nhân"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute right-0 top-12 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150 text-left">
                {/* 1. Chỉnh sửa hồ sơ */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsEditModalOpen(true);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition w-full text-left cursor-pointer"
                >
                  <PenSquare className="w-4 h-4 text-[#0866ff]" />
                  <span>Chỉnh sửa hồ sơ</span>
                </button>

                {/* 2. Kho lưu trữ tin */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsStoryArchiveOpen(true);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition w-full text-left cursor-pointer"
                >
                  <Archive className="w-4 h-4 text-indigo-500" />
                  <span>Kho lưu trữ tin 24h</span>
                </button>

                {/* 3. Bài viết đã lưu */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    navigate("/saved");
                  }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition w-full text-left cursor-pointer"
                >
                  <Bookmark className="w-4 h-4 text-amber-500" />
                  <span>Bài viết đã lưu</span>
                </button>

                {/* 4. Cài đặt & Quyền riêng tư */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    navigate("/security");
                  }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition w-full text-left cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-zinc-500" />
                  <span>Cài đặt & Quyền riêng tư</span>
                </button>

                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-0.5" />

                {/* 5. Sao chép liên kết trang cá nhân */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Đã sao chép liên kết trang cá nhân!");
                  }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition w-full text-left cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-emerald-500" />
                  <span>Sao chép liên kết</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Avatar với nút camera tải ảnh ở chính giữa */}
        <div className="relative shrink-0 group mb-3">
          <Avatar
            userId={user.id}
            src={user.avatarUrl}
            name={user.fullName || user.username}
            username={user.username}
            avatarColor={user.avatarColor}
            size="3xl"
            isOnline={user.isOnline}
            lastActiveAt={user.lastActiveAt}
            showActiveStatus={!isMe && user.showActiveStatus !== false}
            hideStatus={isMe}
            disableLink={true}
            onClick={() => {
              if (isMe) {
                avatarInputRef.current?.click();
              } else if (user.avatarUrl) {
                setLightboxUrl(user.avatarUrl);
              }
            }}
            className="cursor-pointer transition ring-4 ring-white dark:ring-zinc-900 bg-white dark:bg-zinc-900 shadow-lg rounded-full overflow-hidden"
          />

          {/* Nút Camera ở chính giữa avatar chính chủ */}
          {isMe && (
            <>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 m-auto rounded-full bg-black/40 hover:bg-black/60 text-white flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer backdrop-blur-[1px] opacity-90 hover:opacity-100 z-10 select-none"
                title="Thay đổi ảnh đại diện"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 stroke-[2] drop-shadow-md text-white" />
                    <span className="text-[10px] font-bold text-white drop-shadow-md hidden sm:inline">
                      Đổi ảnh
                    </span>
                  </>
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

        {/* Name & Handle & Active Status (Căn giữa) */}
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="font-extrabold text-xl sm:text-2xl text-zinc-900 dark:text-zinc-100 tracking-tight">
            {user.fullName || user.username}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-0.5">
            <span className="text-xs text-zinc-500 font-medium">
              @{user.username}
            </span>
            {user.showActiveStatus !== false && (
              <div className="flex items-center gap-1.5" title={formatLastActive(user)}>
                <span className="text-zinc-400 text-xs">·</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${isUserOnline(user) ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {formatLastActive(user) || "Ngoại tuyến"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bio (Căn giữa) */}
        {user.bio ? (
          <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 mt-2 max-w-lg text-center whitespace-pre-line">
            {user.bio}
          </p>
        ) : isMe ? (
          <p className="text-xs text-zinc-400 italic mt-2 text-center max-w-lg">
            Chưa có tiểu sử. Bấm "Chỉnh sửa hồ sơ" để thêm giới thiệu về bạn!
          </p>
        ) : null}

        {/* Stats (Căn giữa) */}
        <div className="flex items-center justify-center gap-3 text-xs text-zinc-500 mt-2.5 pb-2">
          <span
            onClick={() => setActiveTab("followers")}
            className="cursor-pointer hover:underline"
            title="Xem danh sách người theo dõi"
          >
            <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{followerCount}</strong> người theo dõi
          </span>
          <span>·</span>
          <span
            onClick={() => setActiveTab("friends")}
            className="cursor-pointer hover:underline"
            title="Xem danh sách bạn bè"
          >
            <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{friendCount}</strong> bạn bè
          </span>
          <span>·</span>
          <span
            onClick={() => setActiveTab("posts")}
            className="cursor-pointer hover:underline"
            title="Xem bài viết"
          >
            <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{posts.length}</strong> bài viết
          </span>
        </div>

        {/* Action Buttons cho người khác xem trang (Căn giữa) */}
        {!isMe && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2 w-full max-w-md">
            <>
              {/* Nút Theo dõi / Hủy theo dõi (Độc lập, lưu vào Database) */}
              <button
                type="button"
                onClick={handleToggleFollow}
                disabled={followLoading}
                className={`px-5 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
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

              {/* Nút Kết bạn / Lời mời kết bạn */}
              {friendshipStatus === "PENDING_RECEIVED" ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAcceptFriendRequest}
                    disabled={friendLoading}
                    className="px-4 py-2 rounded-full bg-[#0866ff] hover:bg-[#0756d6] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                    title="Chấp nhận lời mời kết bạn"
                  >
                    {friendLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Chấp nhận</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDeclineFriendRequest}
                    disabled={friendLoading}
                    className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition active:scale-95 cursor-pointer disabled:opacity-50"
                    title="Xóa/Từ chối lời mời"
                  >
                    <span>Từ chối</span>
                  </button>
                </div>
              ) : friendshipStatus === "PENDING_SENT" ? (
                <button
                  type="button"
                  onClick={handleCancelFriendRequest}
                  disabled={friendLoading}
                  className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-semibold hover:border-rose-300 hover:text-rose-600 transition cursor-pointer"
                  title="Nhấp để hủy lời mời đã gửi"
                >
                  {friendLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Đã gửi lời mời</span>
                  )}
                </button>
              ) : friendshipStatus === "ACCEPTED" ? (
                <button
                  type="button"
                  onClick={handleUnfriend}
                  disabled={friendLoading}
                  className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold hover:border-rose-300 hover:text-rose-600 transition flex items-center gap-1.5 cursor-pointer"
                  title="Bạn bè (Nhấp để hủy kết bạn)"
                >
                  {friendLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Bạn bè</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSendFriendRequest}
                  disabled={friendLoading}
                  className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  title="Gửi lời mời kết bạn"
                >
                  {friendLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Kết bạn</span>
                    </>
                  )}
                </button>
              )}

              {/* Nút Nhắn tin */}
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("open_chat_user", { detail: { friend: user } })
                  );
                }}
                className="p-2.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer shadow-2xs"
                title="Nhắn tin"
              >
                <MessageCircle className="w-4 h-4" />
              </button>

              {/* Nút Ba chấm cho trang người khác */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen((v) => !v)}
                  className={`p-2.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center ${
                    isMoreMenuOpen ? "bg-zinc-100 dark:bg-zinc-800 ring-2 ring-[#0866ff]/30" : ""
                  }`}
                  title="Tùy chọn khác"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-11 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150 text-left">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Đã sao chép liên kết trang cá nhân!");
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition w-full text-left cursor-pointer"
                    >
                      <Copy className="w-4 h-4 text-emerald-500" />
                      <span>Sao chép liên kết</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        toast.info("Đã gửi báo cáo tài khoản tới đội ngũ kiểm duyệt.");
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition w-full text-left cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-red-500" />
                      <span>Báo cáo trang cá nhân</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          </div>
        )}

        {/* Banner thông báo lời mời kết bạn nếu đang chờ phản hồi */}
        {!isMe && friendshipStatus === "PENDING_RECEIVED" && (
          <div className="mt-3 p-3 bg-blue-50/90 dark:bg-[#0866ff]/15 border border-[#0866ff]/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-in fade-in duration-200 w-full max-w-md">
            <div className="flex items-center gap-2 text-xs text-zinc-900 dark:text-zinc-100">
              <UserPlus className="w-4 h-4 text-[#0866ff] shrink-0" />
              <span>
                <strong>{user.fullName || user.username}</strong> đã gửi lời mời kết bạn cho bạn.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={friendLoading}
                onClick={handleAcceptFriendRequest}
                className="px-3.5 py-1.5 rounded-xl bg-[#0866ff] hover:bg-[#0756d6] text-white text-xs font-bold transition active:scale-95 shadow-xs cursor-pointer disabled:opacity-50"
              >
                Chấp nhận
              </button>
              <button
                type="button"
                disabled={friendLoading}
                onClick={handleDeclineFriendRequest}
                className="px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                Từ chối
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs: Chia đều các cột với thanh active tối giản */}
      <div className={`grid ${isMe ? "grid-cols-5" : "grid-cols-4"} text-center border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-xs`}>
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
          onClick={() => setActiveTab("friends")}
          className={`py-3 text-xs font-semibold transition cursor-pointer relative ${
            activeTab === "friends"
              ? "text-black dark:text-white"
              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Bạn bè ({friendCount})
          {activeTab === "friends" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-black dark:bg-white rounded-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("followers")}
          className={`py-3 text-xs font-semibold transition cursor-pointer relative ${
            activeTab === "followers"
              ? "text-black dark:text-white"
              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Theo dõi ({followerCount})
          {activeTab === "followers" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-black dark:bg-white rounded-full" />
          )}
        </button>
        {isMe && (
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
        )}
      </div>

      {/* Tab Content List */}
      <div key={activeTab} className="animate-tab-fade flex flex-col divide-y divide-zinc-100 dark:divide-zinc-900 mt-2">
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
        ) : activeTab === "friends" ? (
          friendsLoading ? (
            <div className="p-12 text-center flex justify-center text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : isFriendsPrivate ? (
            <div className="p-12 text-center text-zinc-400 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Danh sách bạn bè đang ở chế độ riêng tư
              </span>
              <span className="text-[11px] text-zinc-500 max-w-xs text-center">
                Người dùng này đã thiết lập ẩn danh sách bạn bè theo quyền riêng tư.
              </span>
            </div>
          ) : profileFriends.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 text-xs">
              Chưa có bạn bè nào được hiển thị.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-900">
              {profileFriends.map((f) => (
                <div
                  key={f.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition"
                >
                  <Link
                    to={`/profile/${f.id}`}
                    className="flex items-center gap-3 min-w-0 flex-1 group"
                  >
                    <Avatar
                      userId={f.id}
                      src={f.avatarUrl}
                      name={f.fullName || f.username}
                      username={f.username}
                      avatarColor={f.avatarColor}
                      size="md"
                      isOnline={f.isOnline}
                      lastActiveAt={f.lastActiveAt}
                      showActiveStatus={f.showActiveStatus}
                      className="shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm text-zinc-900 dark:text-white group-hover:underline truncate">
                        {f.fullName || f.username}
                      </span>
                      <span className="text-xs text-zinc-400 truncate">
                        {formatLastActive(f) || `@${f.username}`}
                      </span>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 shrink-0">
                    {currentUserId && Number(currentUserId) !== Number(f.id) && (
                      <button
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent("open_chat_user", { detail: { friend: f } })
                          );
                        }}
                        className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                        title="Nhắn tin"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                    <Link
                      to={`/profile/${f.id}`}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                    >
                      Xem trang
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === "followers" ? (
          followersLoading ? (
            <div className="p-12 text-center flex justify-center text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : isFollowersPrivate ? (
            <div className="p-12 text-center text-zinc-400 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Danh sách người theo dõi đang ở chế độ riêng tư
              </span>
              <span className="text-[11px] text-zinc-500 max-w-xs text-center">
                Người dùng này đã thiết lập ẩn danh sách người theo dõi theo quyền riêng tư.
              </span>
            </div>
          ) : profileFollowers.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 text-xs">
              Chưa có người theo dõi nào được hiển thị.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-900">
              {profileFollowers.map((fl) => (
                <div
                  key={fl.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition"
                >
                  <Link
                    to={`/profile/${fl.id}`}
                    className="flex items-center gap-3 min-w-0 flex-1 group"
                  >
                    <Avatar
                      userId={fl.id}
                      src={fl.avatarUrl}
                      name={fl.fullName || fl.username}
                      username={fl.username}
                      avatarColor={fl.avatarColor}
                      size="md"
                      isOnline={fl.isOnline}
                      lastActiveAt={fl.lastActiveAt}
                      showActiveStatus={fl.showActiveStatus}
                      className="shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm text-zinc-900 dark:text-white group-hover:underline truncate">
                        {fl.fullName || fl.username}
                      </span>
                      <span className="text-xs text-zinc-400 truncate">
                        {formatLastActive(fl) || `@${fl.username}`}
                      </span>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 shrink-0">
                    {currentUserId && Number(currentUserId) !== Number(fl.id) && (
                      <button
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent("open_chat_user", { detail: { friend: fl } })
                          );
                        }}
                        className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                        title="Nhắn tin"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                    <Link
                      to={`/profile/${fl.id}`}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                    >
                      Xem trang
                    </Link>
                  </div>
                </div>
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

              {/* Privacy Settings Section */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-3">
                <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-bold text-xs">
                  <Lock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Quyền riêng tư danh sách</span>
                </div>

                {/* Friend List Privacy */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Ai có thể xem danh sách bạn bè của tôi?
                  </label>
                  <select
                    value={editForm.friendListPrivacy}
                    onChange={(e) => setEditForm({ ...editForm, friendListPrivacy: e.target.value })}
                    className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none cursor-pointer"
                  >
                    <option value="PUBLIC">🌐 Công khai (Mọi người đều có thể xem)</option>
                    <option value="PRIVATE">🔒 Chỉ mình tôi (Ẩn danh sách bạn bè)</option>
                  </select>
                </div>

                {/* Follower List Privacy */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Ai có thể xem danh sách người theo dõi của tôi?
                  </label>
                  <select
                    value={editForm.followerListPrivacy}
                    onChange={(e) => setEditForm({ ...editForm, followerListPrivacy: e.target.value })}
                    className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none cursor-pointer"
                  >
                    <option value="PUBLIC">🌐 Công khai (Mọi người đều có thể xem)</option>
                    <option value="PRIVATE">🔒 Chỉ mình tôi (Ẩn danh sách người theo dõi)</option>
                  </select>
                </div>
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

      {/* Image Lightbox Modal (Avatar / Cover Photo) */}
      {lightboxUrl && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 cursor-zoom-out"
          onClick={() => setLightboxUrl(null)}
          onKeyDown={(e) => e.key === "Escape" && setLightboxUrl(null)}
          tabIndex={-1}
          ref={(el) => el?.focus()}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightboxUrl(null); }}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition cursor-pointer z-10"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Full-size Image */}
          <img
            src={lightboxUrl}
            alt="Xem ảnh chi tiết"
            className="max-w-[92vw] max-h-[88vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-90 duration-200 cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
