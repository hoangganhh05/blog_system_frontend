import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Share2,
  MessageCircle,
  Copy,
  Check,
  Send,
  Loader2,
  Repeat,
  Sparkles,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import friendService from "../services/friendService";
import chatService from "../services/chatService";
import postService from "../services/postService";
import Avatar from "../components/Avatar";

export default function ShareModal({
  post,
  isOpen = true,
  onClose,
  onPostShared,
}) {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  const [activeTab, setActiveTab] = useState("quote"); // "quote" | "message" | "link"
  const [caption, setCaption] = useState("");
  const [friends, setFriends] = useState([]);
  const [searchFriend, setSearchFriend] = useState("");
  const [sentFriendIds, setSentFriendIds] = useState(new Set());
  const [isSharing, setIsSharing] = useState(false);
  const [isSendingMsg, setIsSendingMsg] = useState(null);
  const [copied, setCopied] = useState(false);

  const postUrl = typeof window !== "undefined" ? `${window.location.origin}/posts/${post?.id}` : "";

  // Load friends when message tab is active
  useEffect(() => {
    if (isOpen && currentUserId) {
      friendService
        .getFriendsList(currentUserId)
        .then((res) => setFriends(res.data || []))
        .catch(() => {});
    }
  }, [isOpen, currentUserId]);

  if (!isOpen || !post) return null;
  if (typeof document === "undefined") return null;

  const author = post.user || {};
  const authorName = author.fullName || author.username || "Người dùng";
  const postSnippet = (post.content || post.body || post.title || "").slice(0, 150);

  // 1. Chia sẻ lại bài viết kèm Caption (Quote Post)
  const handleQuoteShare = async () => {
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập để chia sẻ bài viết!");
      return;
    }

    setIsSharing(true);
    try {
      const payload = {
        title: caption.trim().slice(0, 100) || `${currentUser.fullName || "Người dùng"} đã chia sẻ bài viết`,
        content: caption.trim(),
        body: caption.trim(),
        status: "PUBLISHED",
        sharedPost: { id: post.sharedPost?.id || post.id },
        originalPost: { id: post.sharedPost?.id || post.id },
        parentPostId: post.sharedPost?.id || post.id,
      };

      const res = await postService.create(payload);
      toast.success("Đã chia sẻ bài viết lên trang cá nhân!");
      if (onPostShared) onPostShared(res.data);
      onClose();
    } catch (err) {
      console.error("Lỗi chia sẻ bài viết:", err);
      toast.error("Không thể chia sẻ bài viết. Vui lòng thử lại!");
    } finally {
      setIsSharing(false);
    }
  };

  // 2. Gửi cho bạn bè qua Chat
  const handleSendMessage = async (friend) => {
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập để gửi tin nhắn!");
      return;
    }

    setIsSendingMsg(friend.id);
    try {
      const msgContent = `Đã chia sẻ bài viết của @${author.username || authorName}:\n${postUrl}`;
      await chatService.sendMessage(currentUserId, friend.id, msgContent);
      setSentFriendIds((prev) => new Set(prev).add(friend.id));
      toast.success(`Đã gửi tin nhắn đến ${friend.fullName || friend.username}!`);
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
      toast.error("Không thể gửi tin nhắn!");
    } finally {
      setIsSendingMsg(null);
    }
  };

  // 3. Sao chép liên kết bài viết
  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    toast.success("Đã sao chép liên kết bài viết vào bộ nhớ tạm!");
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredFriends = friends.filter((f) => {
    const q = searchFriend.toLowerCase();
    return (
      (f.fullName && f.fullName.toLowerCase().includes(q)) ||
      (f.username && f.username.toLowerCase().includes(q))
    );
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Chia sẻ bài viết
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Tabs Options */}
        <div className="grid grid-cols-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={() => setActiveTab("quote")}
            className={`py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border-b-2 ${
              activeTab === "quote"
                ? "border-black dark:border-white text-zinc-900 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Chia sẻ lại</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("message")}
            className={`py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border-b-2 ${
              activeTab === "message"
                ? "border-black dark:border-white text-zinc-900 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Gửi bạn bè</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("link")}
            className={`py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border-b-2 ${
              activeTab === "link"
                ? "border-black dark:border-white text-zinc-900 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Sao chép link</span>
          </button>
        </div>

        {/* Tab 1: Chia sẻ lại kèm Caption (Quote Post) */}
        {activeTab === "quote" && (
          <div className="p-6 flex flex-col gap-4 overflow-y-auto">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 block">
                Cảm nghĩ của bạn về bài viết này
              </label>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Viết thêm suy nghĩ hoặc chia sẻ bài viết này..."
                className="w-full p-3.5 text-sm rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none transition"
                autoFocus
              />
            </div>

            {/* Embedded Post Preview */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <Avatar
                  userId={author.id}
                  src={author.avatarUrl}
                  name={authorName}
                  username={author.username}
                  avatarColor={author.avatarColor}
                  size="xs"
                  className="shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {authorName}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    @{author.username || "user"}
                  </span>
                </div>
              </div>

              {postSnippet && (
                <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                  {postSnippet}
                </p>
              )}

              {post.thumbNail && (
                <div className="rounded-xl overflow-hidden max-h-48 border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                  <img
                    src={post.thumbNail}
                    alt=""
                    className="w-full h-auto max-h-48 object-cover object-center block"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleQuoteShare}
                disabled={isSharing}
                className="px-5 py-2 text-xs font-bold text-white bg-black dark:bg-white dark:text-black rounded-xl hover:opacity-90 transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang đăng...</span>
                  </>
                ) : (
                  "Đăng chia sẻ"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Gửi cho bạn bè qua Chat */}
        {activeTab === "message" && (
          <div className="p-5 flex flex-col gap-3 overflow-y-auto flex-1 min-h-[300px]">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm bạn bè để gửi bài viết..."
                value={searchFriend}
                onChange={(e) => setSearchFriend(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 outline-none"
              />
            </div>

            {/* Friends List */}
            <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-y-auto max-h-60 pr-1">
              {filteredFriends.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-xs">
                  {friends.length === 0
                    ? "Bạn chưa có bạn bè nào để gửi bài viết."
                    : "Không tìm thấy bạn bè phù hợp."}
                </div>
              ) : (
                filteredFriends.map((friend) => {
                  const isSent = sentFriendIds.has(friend.id);
                  const isSendingThis = isSendingMsg === friend.id;

                  return (
                    <div
                      key={friend.id}
                      className="py-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          userId={friend.id}
                          src={friend.avatarUrl}
                          name={friend.fullName || friend.username}
                          username={friend.username}
                          avatarColor={friend.avatarColor}
                          size="sm"
                          className="shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {friend.fullName || friend.username}
                          </span>
                          <span className="text-[11px] text-zinc-400 truncate">
                            @{friend.username}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendMessage(friend)}
                        disabled={isSent || isSendingThis}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                          isSent
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default"
                            : "bg-black dark:bg-white text-white dark:text-black hover:opacity-90"
                        }`}
                      >
                        {isSendingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isSent ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Đã gửi</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            <span>Gửi</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Sao chép liên kết */}
        {activeTab === "link" && (
          <div className="p-6 flex flex-col gap-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
              <Copy className="w-6 h-6" />
            </div>

            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Liên kết bài viết
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Chia sẻ liên kết này qua các nền tảng mạng xã hội hoặc tin nhắn.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <input
                type="text"
                readOnly
                value={postUrl}
                className="bg-transparent border-none text-xs text-zinc-800 dark:text-zinc-200 px-3 flex-1 outline-none font-mono truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
