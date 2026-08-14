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

    userService.getById(targetUserId)
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
      const res = await userService.update(currentUserId, editForm);
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
        <Link to="/" className="text-black dark:text-white font-bold mt-2 inline-block">
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
          <span className="font-bold text-base text-zinc-900 dark:text-white truncate">
            {user.fullName || user.username}
          </span>
          <span className="text-xs text-zinc-500">
            {posts.length} bài viết
          </span>
        </div>
      </header>

      {/* 1. Cover Banner — warm amber/stone gradient */}
      <div className="h-32 md:h-36 w-full shrink-0" style={{ background: "linear-gradient(135deg, #E8650A22 0%, #f5f0eb 50%, #e5e2dd 100%)" }} />

      {/* 2. Header Thông Tin (Avatar + Nút Hành Động Ngang Hàng) */}
      <div className="px-4 -mt-10 md:-mt-12 mb-3 flex flex-col">
        <div className="flex justify-between items-end gap-3 mb-2">
          {/* Avatar vừa vặn w-20 h-20 md:w-24 md:h-24 */}
          <div className="shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white dark:border-[#181818] shadow-md object-cover ring-2 ring-[#E8650A]/30"
              />
            ) : (
              <div
                className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white dark:border-[#181818] shadow-md flex items-center justify-center font-bold text-white text-xl md:text-2xl"
                style={{ backgroundColor: user.avatarColor || "#E8650A" }}
              >
                {getInitials(user.fullName || user.username)}
              </div>
            )}
          </div>

          {/* Action Buttons: Nằm bên phải ngang hàng avatar, không rớt dòng */}
          <div className="flex items-center gap-2 shrink-0 pb-1">
            {isMe ? (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white transition"
              >
                Chỉnh sửa hồ sơ
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleToggleFriend}
                  disabled={friendLoading}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition flex items-center gap-1.5 ${
                    friendshipStatus === "ACCEPTED"
                      ? "bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
                      : friendshipStatus === "PENDING"
                      ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      : "bg-black dark:bg-white text-white dark:text-black hover:opacity-90"
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
                  className="p-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  title="Nhắn tin"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 3. Typography: Họ tên, @username, Bio & Thống kê */}
        <div className="flex flex-col">
          <h1 className="font-bold text-xl text-zinc-900 dark:text-white tracking-tight">
            {user.fullName || user.username}
          </h1>
          <span className="text-sm text-zinc-500 font-medium">
            @{user.username}
          </span>
        </div>

        {user.bio ? (
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 mt-2 whitespace-pre-line">
            {user.bio}
          </p>
        ) : isMe ? (
          <p className="text-xs text-zinc-400 italic mt-2">
            Chưa có tiểu sử. Bấm "Chỉnh sửa hồ sơ" để thêm giới thiệu về bạn!
          </p>
        ) : null}

        {/* Thống kê bạn bè / bài viết */}
        <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400 mt-2.5 pb-2">
          <span>
            <strong className="text-zinc-900 dark:text-white font-semibold">{friendCount}</strong> bạn bè
          </span>
          <span>·</span>
          <span>
            <strong className="text-zinc-900 dark:text-white font-semibold">{posts.length}</strong> bài viết
          </span>
        </div>
      </div>

      {/* 4. Tabs — amber underline indicator */}
      <div className="grid grid-cols-3 text-center border-b border-stone-200 dark:border-stone-800 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("posts")}
          className={`py-3 text-sm font-medium transition cursor-pointer ${
            activeTab === "posts"
              ? "font-semibold text-stone-900 dark:text-stone-100 border-b-2"
              : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
          }`}
          style={activeTab === "posts" ? { borderBottomColor: "#E8650A", color: "#E8650A" } : {}}
        >
          Bài viết
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("media")}
          className={`py-3 text-sm font-medium transition cursor-pointer ${
            activeTab === "media"
              ? "font-semibold border-b-2"
              : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
          }`}
          style={activeTab === "media" ? { borderBottomColor: "#E8650A", color: "#E8650A" } : {}}
        >
          Ảnh &amp; Media
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("saved")}
          className={`py-3 text-sm font-medium transition cursor-pointer ${
            activeTab === "saved"
              ? "font-semibold border-b-2"
              : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
          }`}
          style={activeTab === "saved" ? { borderBottomColor: "#E8650A", color: "#E8650A" } : {}}
        >
          Đã lưu
        </button>
      </div>

      {/* Tab Content List */}
      <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-900">
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
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black shadow"
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
                className="px-6 py-2 rounded-full text-xs font-bold bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition"
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
