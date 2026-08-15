import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Send,
  Loader2,
  Smile,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import storyService from "../services/storyService";
import chatService from "../services/chatService";
import ConfirmModal from "./ConfirmModal";
import { isVideoUrl } from "../utils/mediaUtils";
import Avatar from "./Avatar";

const STORY_REACTIONS = ["👍", "❤️", "😆", "😮", "😢", "😡"];

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  let formatted = dateStr;
  if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.includes("+")) {
    formatted = dateStr + "Z";
  }
  const diff = Date.now() - new Date(formatted).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

export default function StoryViewerModal({
  groupedStories = [],
  initialUserIndex = 0,
  onClose,
  onStoryDeleted,
}) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const currentUserId = currentUser ? Number(currentUser.id || currentUser.userId) : null;

  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [viewers, setViewers] = useState([]);
  const [showViewers, setShowViewers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reaction & Reply States
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);

  const progressIntervalRef = useRef(null);
  const videoRef = useRef(null);

  const currentUserGroup = groupedStories[userIndex];
  const activeStories = currentUserGroup ? currentUserGroup.stories : [];
  const activeStory = activeStories[storyIndex];

  const author = currentUserGroup?.user;
  const authorName = author?.fullName || author?.username || "Người dùng";
  const isOwner = Boolean(currentUser && Number(author?.id) === currentUserId);

  // Next Story Handler
  const handleNext = () => {
    if (storyIndex < activeStories.length - 1) {
      setStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else if (userIndex < groupedStories.length - 1) {
      setUserIndex((prev) => prev + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  // Prev Story Handler
  const handlePrev = () => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else if (userIndex > 0) {
      const prevUserGroup = groupedStories[userIndex - 1];
      setUserIndex((prev) => prev - 1);
      setStoryIndex(prevUserGroup.stories.length - 1);
      setProgress(0);
    }
  };

  // 1. Record view
  useEffect(() => {
    if (activeStory && currentUserId && !isOwner) {
      storyService.view(activeStory.id, currentUserId).catch(() => {});
    }
  }, [activeStory, currentUserId, isOwner]);

  // 2. Fetch Viewers for owner
  useEffect(() => {
    if (activeStory && currentUserId && isOwner) {
      storyService
        .getViewers(activeStory.id)
        .then((res) => {
          setViewers(res.data || []);
        })
        .catch(() => {});
    } else {
      setViewers([]);
    }
    setShowViewers(false);
    setReplyText("");
  }, [activeStory, currentUserId, isOwner]);

  // 3. Auto-progress timer
  useEffect(() => {
    if (!activeStory || showViewers || showDeleteConfirm || replyText.trim().length > 0) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (videoRef.current) videoRef.current.pause();
      return;
    }

    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    const step = 1.6; // ~6 seconds per story
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, 100);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [userIndex, storyIndex, activeStory, showViewers, showDeleteConfirm, replyText]);

  if (!activeStory) return null;
  if (typeof document === "undefined") return null;

  // Confirm delete story
  const confirmDeleteStory = async () => {
    setShowDeleteConfirm(false);
    try {
      await storyService.delete(activeStory.id);
      toast.success("Đã xóa tin 24h thành công!");
      if (onStoryDeleted) onStoryDeleted(activeStory.id);

      if (activeStories.length === 1) {
        if (groupedStories.length === 1) {
          onClose();
        } else {
          handleNext();
        }
      } else {
        handleNext();
      }
    } catch {
      toast.error("Không thể xóa tin. Vui lòng thử lại!");
    }
  };

  // Send reaction
  const handleSendReaction = async (e, emoji) => {
    e?.stopPropagation();
    if (!currentUser || !author?.id) return;

    // Floating emoji effect
    const newEmoji = {
      id: Date.now() + Math.random(),
      emoji,
      left: 25 + Math.random() * 50,
    };
    setFloatingEmojis((prev) => [...prev, newEmoji]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== newEmoji.id));
    }, 1200);

    try {
      await storyService.react(activeStory.id, currentUserId, emoji);
      await chatService.sendMessage(
        currentUserId,
        author.id,
        `Đã bày tỏ cảm xúc ${emoji} về tin của bạn`
      );
      toast.success(`Đã gửi ${emoji}`);
    } catch {
      toast.error("Không thể gửi cảm xúc!");
    }
  };

  // Send reply message
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUser || !author?.id) return;
    const text = replyText.trim();
    setReplyText("");
    setIsSendingReply(true);

    try {
      await chatService.sendMessage(
        currentUserId,
        author.id,
        `Đã trả lời tin của bạn: "${text}"`
      );
      toast.success("Đã gửi tin nhắn phản hồi!");
    } catch {
      toast.error("Không thể gửi tin nhắn!");
    } finally {
      setIsSendingReply(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black flex items-center justify-center select-none overflow-hidden animate-in fade-in duration-150">
      {/* Floating Emojis Animation */}
      {floatingEmojis.map((item) => (
        <div
          key={item.id}
          className="absolute z-50 text-4xl pointer-events-none transition-all"
          style={{
            left: `${item.left}%`,
            bottom: "100px",
            animation: "floatUpAndFade 1.2s ease-out forwards",
          }}
        >
          {item.emoji}
        </div>
      ))}

      {/* Desktop Prev Button */}
      {(userIndex > 0 || storyIndex > 0) && (
        <button
          type="button"
          onClick={handlePrev}
          className="hidden md:flex absolute left-8 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Desktop Next Button */}
      {(userIndex < groupedStories.length - 1 || storyIndex < activeStories.length - 1) && (
        <button
          type="button"
          onClick={handleNext}
          className="hidden md:flex absolute right-8 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Container Story Tỉ lệ Chuẩn Fullscreen Mobile / 9:16 Desktop */}
      <div className="relative w-full h-full md:max-w-md md:h-[92vh] md:rounded-3xl overflow-hidden bg-zinc-950 flex flex-col justify-between shadow-2xl">
        {/* 1. THANH TIẾN TRÌNH (Progress Bars) */}
        <div className="absolute top-0 inset-x-0 z-30 p-3 pt-4 flex gap-1.5 bg-gradient-to-b from-black/80 to-transparent">
          {activeStories.map((_, i) => (
            <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                style={{
                  width:
                    i < storyIndex
                      ? "100%"
                      : i === storyIndex
                      ? `${progress}%`
                      : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* 2. HEADER STORY: Avatar, Tên, Thời gian, Nút Xóa, Nút X đóng */}
        <div className="absolute top-6 inset-x-0 z-30 px-4 py-2 flex items-center justify-between text-white bg-gradient-to-b from-black/60 to-transparent">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => {
              onClose();
              if (author?.id) navigate(`/profile/${author.id}`);
            }}
          >
                        <Avatar
              userId={author?.id}
              src={author?.avatarUrl}
              name={authorName}
              username={author?.username}
              avatarColor={author?.avatarColor}
              size="w-8 h-8"
              onClick={() => onClose()}
              className="border-2 border-white/60"
            />
            <div className="flex flex-col drop-shadow">
              <span className="text-xs font-bold leading-tight truncate max-w-[160px]">
                {authorName}
              </span>
              <span className="text-[10px] text-zinc-300">
                {formatTimeAgo(activeStory.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-full bg-black/40 hover:bg-rose-600/80 text-white transition text-xs cursor-pointer"
                title="Xóa tin"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-black/40 hover:bg-white/20 text-white transition text-sm cursor-pointer"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TAP ZONES TRÁI / PHẢI ĐỂ CHUYỂN STORY */}
        <div
          onClick={handlePrev}
          className="absolute left-0 top-16 bottom-24 w-1/3 z-20 cursor-pointer"
        />
        <div
          onClick={handleNext}
          className="absolute right-0 top-16 bottom-24 w-2/3 z-20 cursor-pointer"
        />

        {/* 3. NỘI DUNG MEDIA (ẢNH / VIDEO / CHỮ) */}
        <div className="w-full h-full flex items-center justify-center bg-zinc-900 overflow-hidden">
          {activeStory.mediaUrl ? (
            isVideoUrl(activeStory.mediaUrl) ? (
              <video
                ref={videoRef}
                src={activeStory.mediaUrl}
                autoPlay
                playsInline
                loop
                onTimeUpdate={(e) => {
                  if (e.target.duration) {
                    setProgress((e.target.currentTime / e.target.duration) * 100);
                  }
                }}
                onEnded={handleNext}
                className="w-full h-full object-cover md:object-contain"
              />
            ) : (
              <img
                src={activeStory.mediaUrl}
                alt=""
                className="w-full h-full object-cover md:object-contain sharp-img"
                loading="eager"
              />
            )
          ) : (
            <div
              className="w-full h-full flex items-center justify-center p-8 text-center text-white font-bold text-lg leading-relaxed break-words"
              style={{
                background: activeStory.bgColor || "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
              }}
            >
              <p className="max-w-xs drop-shadow-md">
                {activeStory.textContent || activeStory.content}
              </p>
            </div>
          )}
        </div>

        {/* 4. FOOTER: OWNER (XEM LƯỢT XEM) HOẶC VIEWER (REACTION & REPLY) */}
        <div className="absolute bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-3">
          {isOwner ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowViewers(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white text-xs font-semibold hover:bg-black/90 transition shadow-lg cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>{viewers.length} người xem</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {/* Emojis Reaction Bar */}
              <div className="flex items-center justify-around bg-black/50 backdrop-blur-md py-1.5 px-3 rounded-full border border-white/10">
                {STORY_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={(e) => handleSendReaction(e, emoji)}
                    className="text-xl hover:scale-125 active:scale-95 transition-transform cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Reply Input Form */}
              <form onSubmit={handleSendReply} className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Gửi tin nhắn cho ${authorName}...`}
                  className="flex-1 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-white/60 focus:outline-none focus:ring-1 focus:ring-white"
                />
                {replyText.trim() && (
                  <button
                    type="submit"
                    disabled={isSendingReply}
                    className="p-2 rounded-full bg-white text-black hover:bg-zinc-200 transition cursor-pointer"
                  >
                    {isSendingReply ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </form>
            </div>
          )}
        </div>

        {/* POPUP CHI TIẾT NGƯỜI XEM (BOTTOM SHEET CÓ NỀN TRẮNG/TỐI ĐẶC 100%) */}
        {showViewers && (
          <div className="absolute inset-x-0 bottom-0 z-40 max-h-[65%] bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl p-5 flex flex-col animate-in slide-in-from-bottom duration-200 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Chi tiết lượt xem ({viewers.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowViewers(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50 py-2 flex-1 min-h-[160px]">
              {viewers.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 text-xs">
                  Chưa có ai xem tin này.
                </div>
              ) : (
                viewers.map((v) => {
                  const userObj = v.user || v;
                  return (
                    <div
                      key={v.id || userObj.id}
                      className="flex items-center justify-between py-2.5"
                    >
                      <div className="flex items-center gap-3">
                                                <Avatar
                          userId={userObj.id}
                          src={userObj.avatarUrl}
                          name={userObj.fullName || userObj.username}
                          username={userObj.username}
                          avatarColor={userObj.avatarColor}
                          size="w-8 h-8"
                          className="border border-zinc-200 dark:border-zinc-700"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            {userObj.fullName || userObj.username}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            @{userObj.username}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs drop-shadow-sm">
                        {v.reaction || v.reactionIcon || "👁️"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Story Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Xóa tin 24h"
        message="Bạn có chắc chắn muốn xóa tin này không? Tin sẽ bị xóa vĩnh viễn và không thể khôi phục."
        confirmText="Xóa tin"
        isDanger={true}
        onConfirm={confirmDeleteStory}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>,
    document.body
  );
}
