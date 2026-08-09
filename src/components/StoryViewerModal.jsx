import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import storyService from "../services/storyService";
import chatService from "../services/chatService";
import { ConfirmModal } from "./CustomModal";
import { isVideoUrl } from "../utils/mediaUtils";

const STORY_REACTIONS = ["👍", "❤️", "😆", "😮", "😢", "😡"];

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

function StoryViewerModal({ groupedStories, initialUserIndex = 0, onClose, onStoryDeleted }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const currentUserId = currentUser ? Number(currentUser.id || currentUser.userId) : null;

  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [viewers, setViewers] = useState([]);
  const [showViewers, setShowViewers] = useState(false);

  // States cho thả cảm xúc & rep cmt
  const [replyText, setReplyText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [toastMsg, setToastMsg] = useState("");

  const [isHoveringControls, setIsHoveringControls] = useState(false);

  const progressIntervalRef = useRef(null);

  const currentUserGroup = groupedStories[userIndex];
  const activeStories = currentUserGroup ? currentUserGroup.stories : [];
  const activeStory = activeStories[storyIndex];

  const author = currentUserGroup?.user;
  const authorName = author?.fullName || author?.username || "Ẩn danh";
  const isMyStory = currentUser && Number(author?.id) === currentUserId;

  // Chuyển sang Story tiếp theo
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

  // Quay lại Story trước đó
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

  // 1. Ghi nhận lượt xem khi người khác xem tin
  useEffect(() => {
    if (activeStory && currentUserId && !isMyStory) {
      storyService.view(activeStory.id, currentUserId).catch(() => {});
    }
  }, [activeStory, currentUserId, isMyStory]);

  // 2. Lấy danh sách người xem nếu là story của chính mình
  useEffect(() => {
    if (activeStory && currentUserId && isMyStory) {
      storyService.getViewers(activeStory.id)
        .then((res) => {
          setViewers(res.data || []);
        })
        .catch(() => {});
    } else {
      setViewers([]);
    }
    setShowViewers(false);
    setReplyText("");
  }, [activeStory, currentUserId, isMyStory]);

  const videoRef = useRef(null);

  // 3. Quản lý tự động chuyển Story (Tạm dừng khi tương tác/rơ chuột/gõ tin/xem người xem)
  useEffect(() => {
    if (!activeStory || showViewers || isTyping || replyText.trim().length > 0 || isHoveringControls) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (videoRef.current) videoRef.current.pause();
      return;
    }

    if (videoRef.current) videoRef.current.play().catch(() => {});

    // NẾU LÀ VIDEO: Tiến trình được đồng bộ theo thời lượng thực tế của Video (onTimeUpdate)
    if (isVideoUrl(activeStory.mediaUrl)) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    const step = 1.25; // Ảnh / Tin chữ: 8 giây tự động chuyển
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
  }, [userIndex, storyIndex, activeStory, showViewers, isTyping, replyText, isHoveringControls]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!activeStory) return null;

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteStory = async () => {
    setShowDeleteConfirm(false);
    try {
      await storyService.delete(activeStory.id);
      onStoryDeleted && onStoryDeleted(activeStory.id);

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
      setToastMsg("Không thể xóa Story!");
      setTimeout(() => setToastMsg(""), 2000);
    }
  };

  // Thả cảm xúc cho Story (Lưu vào DB + gửi qua Chat + Bong bóng emoji bay)
  const handleSendReaction = async (e, emoji) => {
    e && e.stopPropagation();
    setProgress(0);

    if (!currentUser || !author?.id) return;

    // Hiệu ứng bong bóng emoji bay lên
    const newEmoji = { id: Date.now() + Math.random(), emoji, left: 20 + Math.random() * 60 };
    setFloatingEmojis((prev) => [...prev, newEmoji]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id));
    }, 1200);

    try {
      // 1. Lưu cảm xúc vào DB
      await storyService.react(activeStory.id, currentUserId, emoji);

      // 2. Gửi tin nhắn qua Chat
      await chatService.sendMessage(currentUserId, author.id, `Đã bày tỏ cảm xúc ${emoji} về tin của bạn`);
      
      setToastMsg(`Đã gửi ${emoji}`);
      setTimeout(() => setToastMsg(""), 2000);
    } catch {
      setToastMsg("Không thể gửi cảm xúc!");
      setTimeout(() => setToastMsg(""), 2000);
    }
  };

  // Trả lời tin nhắn từ Story
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUser || !author?.id) return;
    const text = replyText.trim();
    setReplyText("");
    setIsTyping(false);

    try {
      await chatService.sendMessage(currentUserId, author.id, `Đã trả lời tin của bạn: "${text}"`);
      setToastMsg("Đã gửi tin nhắn!");
      setTimeout(() => setToastMsg(""), 2000);
    } catch {
      setToastMsg("Không thể gửi tin nhắn!");
      setTimeout(() => setToastMsg(""), 2000);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0, 0, 0, 0.94)",
        zIndex: 99999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <style>{`
        @keyframes floatUpAndFade {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          50% { opacity: 0.9; transform: translateY(-140px) scale(1.4); }
          100% { opacity: 0; transform: translateY(-260px) scale(1.8); }
        }
      `}</style>

      {/* Nút lùi (Bên ngoài Story Card) */}
      {(userIndex > 0 || storyIndex > 0) && (
        <button
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          style={{
            position: "absolute", left: "calc(50% - 240px)",
            zIndex: 16000, background: "rgba(255,255,255,0.15)",
            border: "none", width: 44, height: 44, borderRadius: "50%",
            color: "#fff", fontSize: 20, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
        >
          ‹
        </button>
      )}

      {/* Story Card Container */}
      <div
        style={{
          width: 380,
          height: 640,
          background: activeStory.bgColor ? activeStory.bgColor : "#1c1e21",
          borderRadius: 16,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 12px 48px rgba(0,0,0,0.6)",
          userSelect: "none"
        }}
      >
        {/* VÙNG NHẬN CLICK TRÁI / PHẢI ĐỂ CHUYỂN STORY */}
        <div
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          style={{
            position: "absolute", left: 0, top: 80, bottom: 90, width: "35%",
            zIndex: 9, cursor: "pointer"
          }}
        />
        <div
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          style={{
            position: "absolute", right: 0, top: 80, bottom: 90, width: "65%",
            zIndex: 9, cursor: "pointer"
          }}
        />

        {/* Progress Bar ở đỉnh */}
        <div style={{
          position: "absolute", top: 12, left: 12, right: 12,
          display: "flex", gap: 6, zIndex: 10
        }}>
          {activeStories.map((s, idx) => {
            let widthPct = 0;
            if (idx < storyIndex) widthPct = 100;
            else if (idx === storyIndex) widthPct = progress;
            return (
              <div
                key={s.id || idx}
                style={{
                  flex: 1, height: 3.5, background: "rgba(255,255,255,0.35)",
                  borderRadius: 2, overflow: "hidden"
                }}
              >
                <div style={{
                  height: "100%", width: `${widthPct}%`,
                  background: "#ffffff", borderRadius: 2,
                  transition: idx === storyIndex ? "width 0.1s linear" : "none"
                }} />
              </div>
            );
          })}
        </div>

        {/* Header thông tin tác giả */}
        <div
          style={{
            position: "absolute", top: 24, left: 12, right: 12,
            display: "flex", alignItems: "center",
            zIndex: 10, justifyContent: "space-between"
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              author?.id && navigate(`/profile/${author.id}`);
            }}
            title={`Xem trang cá nhân của ${authorName}`}
          >
            {author?.avatarUrl ? (
              <img src={author.avatarUrl} alt={authorName} className="avatar avatar-sm" style={{ objectFit: "cover", border: "2px solid #fff" }} />
            ) : (
              <div className="avatar avatar-sm" style={{ background: author?.avatarColor ? `linear-gradient(135deg, ${author.avatarColor}, ${author.avatarColor}bb)` : undefined, border: "2px solid #fff" }}>
                {getInitials(authorName)}
              </div>
            )}
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{authorName}</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{timeAgo(activeStory.createdAt)}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, zIndex: 12 }}>
            {isMyStory && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                style={{
                  background: "rgba(255,59,48,0.25)", color: "#ff453a",
                  border: "none", padding: "4px 10px", borderRadius: 6,
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                  backdropFilter: "blur(4px)"
                }}
              >
                Xóa
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              style={{
                background: "rgba(0,0,0,0.3)", color: "#fff",
                border: "none", width: 24, height: 24, borderRadius: "50%",
                fontSize: 12, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center"
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Nội dung Story chính */}
        {activeStory.bgColor ? (
          <div style={{ padding: 24, width: "100%", textAlign: "center" }}>
            <p style={{
              color: "#ffffff",
              fontSize: activeStory.textContent?.length < 80 ? 22 : 16,
              fontWeight: 700,
              lineHeight: 1.5,
              textShadow: "0 2px 8px rgba(0,0,0,0.35)",
              margin: 0,
              wordBreak: "break-word"
            }}>
              {activeStory.textContent}
            </p>
          </div>
        ) : (
          isVideoUrl(activeStory.mediaUrl) ? (
            <video
              ref={videoRef}
              src={activeStory.mediaUrl}
              autoPlay
              playsInline
              onTimeUpdate={(e) => {
                const v = e.target;
                if (v.duration && !showViewers && !isTyping && !isHoveringControls) {
                  const pct = (v.currentTime / v.duration) * 100;
                  setProgress(pct);
                }
              }}
              onEnded={() => {
                handleNext();
              }}
              style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
            />
          ) : (
            <img
              src={activeStory.mediaUrl}
              alt="Story content"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )
        )}

        {/* Hiệu ứng Emoji bay lên */}
        {floatingEmojis.map((e) => (
          <span
            key={e.id}
            style={{
              position: "absolute",
              bottom: 80,
              left: `${e.left}%`,
              fontSize: 32,
              zIndex: 99,
              pointerEvents: "none",
              animation: "floatUpAndFade 1.2s ease-out forwards"
            }}
          >
            {e.emoji}
          </span>
        ))}

        {/* Toast thông báo nhanh trong Story */}
        {toastMsg && (
          <div
            style={{
              position: "absolute",
              top: 70,
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(6px)",
              color: "#fff",
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 600,
              zIndex: 100,
              animation: "fadeIn 0.2s ease"
            }}
          >
            ✓ {toastMsg}
          </div>
        )}

        {/* BOTTOM BAR: THẢ ICON VÀ REP MESSENGER (KHI XEM TIN NGƯỜI KHÁC) */}
        {!isMyStory && (
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={() => setIsHoveringControls(true)}
            onMouseLeave={() => setIsHoveringControls(false)}
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              right: 12,
              zIndex: 15,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {/* Hàng nút thả icon cảm xúc */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "4px 8px",
                background: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(12px)",
                borderRadius: 24,
                border: "1px solid rgba(255, 255, 255, 0.2)"
              }}
            >
              {STORY_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={(e) => handleSendReaction(e, emoji)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 22,
                    cursor: "pointer",
                    padding: "4px 6px",
                    transition: "transform 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.3) translateY(-4px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1) translateY(0)")}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Form nhập tin nhắn rep Story */}
            <form onSubmit={handleSendReply} style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder={`Gửi tin nhắn cho ${authorName}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                style={{
                  flex: 1,
                  background: "rgba(0, 0, 0, 0.5)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: 20,
                  padding: "10px 16px",
                  color: "#fff",
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                style={{
                  background: replyText.trim() ? "#1877f2" : "rgba(255, 255, 255, 0.2)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 20,
                  padding: "0 16px",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: replyText.trim() ? "pointer" : "default",
                  transition: "background 0.2s",
                }}
              >
                Gửi
              </button>
            </form>
          </div>
        )}

        {/* BOTTOM BAR: NÚT XEM NGƯỜI XEM (VỚI STORY CỦA TÔI) */}
        {isMyStory && (
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 15,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowViewers((v) => !v);
              }}
              style={{
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                color: "#fff",
                padding: "8px 20px",
                borderRadius: 24,
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                transition: "transform 0.15s, background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(-50%) scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(-50%) scale(1)"}
            >
              <span style={{ fontSize: 16 }}>👁️</span>
              <span>{viewers.length} người xem</span>
            </button>
          </div>
        )}

        {/* DRAWER DANH SÁCH NGƯỜI XEM STORY (SLIDE-UP DRAWER) */}
        {isMyStory && showViewers && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "55%",
              background: "var(--bg-card)",
              borderRadius: "16px 16px 0 0",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
              zIndex: 25,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "slideUp 0.25s ease",
            }}
          >
            {/* Header Drawer */}
            <div style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--border-light)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--bg-card)"
            }}>
              <strong style={{ fontSize: 14.5, color: "var(--text-primary)" }}>
                👁️ Chi tiết lượt xem ({viewers.length})
              </strong>
              <button
                onClick={() => setShowViewers(false)}
                style={{
                  background: "none", border: "none", color: "var(--text-muted)",
                  fontSize: 18, cursor: "pointer", padding: "2px 6px"
                }}
              >
                ✕
              </button>
            </div>

            {/* Body Drawer List */}
            <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
              {viewers.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: "30px 0" }}>
                  Chưa có ai xem tin này.
                </div>
              ) : (
                viewers.map((vItem, idx) => {
                  const u = vItem.user || vItem;
                  const vName = u.fullName || u.username || "Ẩn danh";
                  const reactionEmoji = vItem.reaction;
                  const time = vItem.viewedAt ? timeAgo(vItem.viewedAt) : "";

                  return (
                    <div
                      key={vItem.id || u.id || idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 8px",
                        borderBottom: "1px solid var(--border-light)"
                      }}
                    >
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                        onClick={() => u.id && navigate(`/profile/${u.id}`)}
                        title={`Xem trang cá nhân của ${vName}`}
                      >
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={vName} className="avatar avatar-md" style={{ width: 36, height: 36, objectFit: "cover" }} />
                        ) : (
                          <div className="avatar avatar-md" style={{ width: 36, height: 36, fontSize: 13, background: u.avatarColor ? `linear-gradient(135deg, ${u.avatarColor}, ${u.avatarColor}bb)` : undefined }}>
                            {getInitials(vName)}
                          </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>{vName}</span>
                          </div>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {reactionEmoji ? `Đã thả ${reactionEmoji} • ${time || "Vừa xong"}` : `Đã xem • ${time || "Vừa xong"}`}
                          </span>
                        </div>
                      </div>
                      {reactionEmoji && (
                        <div style={{
                          background: "var(--bg-input)",
                          padding: "4px 10px",
                          borderRadius: 16,
                          fontSize: 18,
                          display: "flex",
                          alignItems: "center",
                          border: "1px solid var(--border-light)",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
                        }}>
                          {reactionEmoji}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Nút tiến (Bên ngoài Story Card) */}
      {(userIndex < groupedStories.length - 1 || storyIndex < activeStories.length - 1) && (
        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          style={{
            position: "absolute", right: "calc(50% - 240px)",
            zIndex: 16000, background: "rgba(255,255,255,0.15)",
            border: "none", width: 44, height: 44, borderRadius: "50%",
            color: "#fff", fontSize: 20, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
        >
          ›
        </button>
      )}

      {/* Modern Confirm Modal khi xóa Story */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Xóa tin này khỏi Story 24h?"
        message="Tin này sẽ bị gỡ vĩnh viễn khỏi danh sách Story 24h của bạn."
        confirmText="Xóa tin"
        confirmVariant="danger"
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDeleteStory}
      />
    </div>
  );
}

export default StoryViewerModal;
