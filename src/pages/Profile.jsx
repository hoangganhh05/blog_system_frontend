import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Link as LinkIcon,
  MessageCircle,
  UserPlus,
  UserCheck,
  Edit3,
  X,
  Camera,
  Loader2,
  Bookmark,
  Grid,
  FileText
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";
import postService from "../services/postService";
import bookmarkService from "../services/bookmarkService";
import friendService from "../services/friendService";
import uploadService from "../services/uploadService";
import PostCard from "../components/PostCard";

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
  const { currentUser, updateUser } = useAuth();

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

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: "", bio: "", avatarUrl: "" });
  const [isUpdating, setIsUpdating] = useState(false);
  const avatarInputRef = useRef(null);

  // Load User Data
  useEffect(() => {
    if (!targetUserId) return;
    setLoading(true);

    userService.getUserById(targetUserId)
      .then((res) => {
        const userData = res.data;
        setUser(userData);
        setEditForm({
          fullName: userData.fullName || "",
          bio: userData.bio || "",
          avatarUrl: userData.avatarUrl || ""
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
    }

    friendService.getFriendCount(targetUserId)
      .then((res) => setFriendCount(res.data?.count || 0))
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

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadService.uploadFile(file);
      if (res.data?.url) {
        setEditForm((prev) => ({ ...prev, avatarUrl: res.data.url }));
      }
    } catch {
      alert("Lỗi tải ảnh lên. Vui lòng thử lại!");
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.fullName.trim() || isUpdating) return;

    setIsUpdating(true);
    try {
      const res = await userService.updateUser(currentUserId, editForm);
      setUser(res.data);
      if (updateUser) updateUser(res.data);
      setIsEditModalOpen(false);
    } catch {
      alert("Không thể lưu thông tin hồ sơ!");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleFriend = async () => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    setFriendLoading(true);
    try {
      if (friendshipStatus === "NONE") {
        await friendService.sendFriendRequest(currentUserId, targetUserId);
        setFriendshipStatus("PENDING");
      } else if (friendshipStatus === "PENDING" || friendshipStatus === "ACCEPTED") {
        await friendService.removeFriendship(currentUserId, targetUserId);
        setFriendshipStatus("NONE");
        if (friendshipStatus === "ACCEPTED") {
          setFriendCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch {
      alert("Thao tác thất bại. Vui lòng thử lại!");
    } finally {
      setFriendLoading(false);
    }
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
        <Link to="/" className="text-primary font-bold mt-2 inline-block">
          ← Về trang chủ
        </Link>
      </div>
    );
  }

  const mediaPosts = posts.filter((p) => Boolean(p.thumbNail));

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 h-13 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-6 px-4 shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition text-zinc-700 dark:text-zinc-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col min-w-0">
          <span className="font-extrabold text-base text-zinc-900 dark:text-white truncate">
            {user.fullName || user.username}
          </span>
          <span className="text-xs text-zinc-500">
            {posts.length} bài viết
          </span>
        </div>
      </header>

      {/* Profile Header (Threads / X Minimalist Style) */}
      <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <h1 className="font-extrabold text-2xl text-zinc-900 dark:text-white tracking-tight">
              {user.fullName || user.username}
            </h1>
            <span className="text-sm text-zinc-500 font-medium">
              @{user.username}
            </span>
          </div>

          {/* Large Avatar on Right */}
          <div className="shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="w-18 h-18 rounded-full object-cover border-2 border-zinc-100 dark:border-zinc-800 shadow-sm"
              />
            ) : (
              <div
                className="w-18 h-18 rounded-full flex items-center justify-center font-bold text-white text-2xl shrink-0"
                style={{ backgroundColor: user.avatarColor || "#4f46e5" }}
              >
                {getInitials(user.fullName || user.username)}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {user.bio ? (
          <p className="text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-line">
            {user.bio}
          </p>
        ) : isMe ? (
          <p className="text-xs text-zinc-400 italic">
            Chưa có tiểu sử. Bấm "Chỉnh sửa hồ sơ" để thêm giới thiệu về bạn!
          </p>
        ) : null}

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span>
            <strong className="text-zinc-900 dark:text-white font-bold">{friendCount}</strong> bạn bè
          </span>
          <span>·</span>
          <span>
            <strong className="text-zinc-900 dark:text-white font-bold">{posts.length}</strong> bài viết
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          {isMe ? (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="flex-1 py-2 px-4 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition text-center"
            >
              Chỉnh sửa hồ sơ
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleToggleFriend}
                disabled={friendLoading}
                className={`flex-1 py-2 px-4 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  friendshipStatus === "ACCEPTED"
                    ? "bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white"
                    : friendshipStatus === "PENDING"
                    ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    : "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90"
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
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Kết bạn</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("open_chat_user", { detail: { friend: user } })
                  );
                }}
                className="py-2 px-4 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Nhắn tin</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Flat Tab Bar Underline Style */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("posts")}
          className={`flex-1 py-3 text-xs font-bold tracking-tight text-center relative transition ${
            activeTab === "posts"
              ? "text-zinc-950 dark:text-white"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          }`}
        >
          Bài viết
          {activeTab === "posts" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950 dark:bg-white" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("media")}
          className={`flex-1 py-3 text-xs font-bold tracking-tight text-center relative transition ${
            activeTab === "media"
              ? "text-zinc-950 dark:text-white"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          }`}
        >
          Ảnh & Media
          {activeTab === "media" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950 dark:bg-white" />
          )}
        </button>

        {isMe && (
          <button
            type="button"
            onClick={() => setActiveTab("saved")}
            className={`flex-1 py-3 text-xs font-bold tracking-tight text-center relative transition ${
              activeTab === "saved"
                ? "text-zinc-950 dark:text-white"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            }`}
          >
            Đã lưu
            {activeTab === "saved" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950 dark:bg-white" />
            )}
          </button>
        )}
      </div>

      {/* Tab Content List */}
      <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
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
                  className="aspect-square relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 group"
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
        ) : (
          savedPosts.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 text-xs">
              Chưa có bài viết nào được lưu.
            </div>
          ) : (
            savedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )
        )}
      </div>

      {/* Minimalist Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveProfile}
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-base text-zinc-900 dark:text-white">
                Chỉnh sửa hồ sơ
              </span>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Avatar picker */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {editForm.avatarUrl ? (
                  <img
                    src={editForm.avatarUrl}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl"
                    style={{ backgroundColor: user.avatarColor || "#4f46e5" }}
                  >
                    {getInitials(editForm.fullName || user.username)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
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
                className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-white border-none focus:outline-none"
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
                className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-white border-none resize-none focus:outline-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-6 py-2 rounded-full text-xs font-bold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 transition"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
