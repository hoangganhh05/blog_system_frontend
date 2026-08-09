import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import uploadService from "../services/uploadService";
import storyService from "../services/storyService";
import { isVideoUrl } from "../utils/mediaUtils";

const STORY_BG_PRESETS = [
  "linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)",
  "linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)",
  "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  "linear-gradient(135deg, #f80759 0%, #bc4e9c 100%)",
  "linear-gradient(135deg, #1877f2 0%, #00c6ff 100%)",
  "linear-gradient(135deg, #f12711 0%, #f5af19 100%)",
];

const STORY_MUSIC_PRESETS = [
  { id: "lofi", name: "🎶 Lofi Chill Beat" },
  { id: "acoustic", name: "🎸 Acoustic Sunset" },
  { id: "piano", name: "🎹 Piano Dreams" },
];

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function CreateStoryModal({ onClose, onCreated }) {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  const [selectedFile, setSelectedFile] = useState(null);
  const [mode, setMode] = useState(null); // 'text' or 'image'
  const [textContent, setTextContent] = useState("");
  const [bgColor, setBgColor] = useState(STORY_BG_PRESETS[0]);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setMediaUrl(localUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUserId) return;
    setErrorMsg("");

    if (mode === "text" && !textContent.trim()) {
      setErrorMsg("Vui lòng nhập nội dung chữ!");
      return;
    }
    if (mode === "image" && !mediaUrl) {
      setErrorMsg("Vui lòng chọn ảnh hoặc video!");
      return;
    }

    setSubmitting(true);
    let finalUrl = mediaUrl;

    try {
      if (mode === "image" && selectedFile) {
        setUploading(true);
        const res = await uploadService.uploadFile(selectedFile);
        finalUrl = res.data.url;
      }

      let contentText = mode === "text" ? textContent : null;
      if (selectedMusic) {
        contentText = contentText ? `${contentText} • ${selectedMusic.name}` : selectedMusic.name;
      }

      const payload = {
        mediaUrl: mode === "image" ? finalUrl : null,
        textContent: contentText,
        bgColor: mode === "text" ? bgColor : null,
      };
      const res = await storyService.create(currentUserId, payload);
      onCreated && onCreated(res.data);
      onClose();
    } catch {
      setErrorMsg("Đăng Story thất bại! Vui lòng thử lại.");
    } finally {
      setUploading(false);
      setSubmitting(false);
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
        zIndex: 99999,
        background: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 600,
          width: "90%",
          padding: 24,
          borderRadius: 16,
          background: "var(--bg-card)",
          animation: "slideUp 0.25s ease",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
            Tạo tin (Story 24h)
          </h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ fontSize: 18, padding: 4 }}>✕</button>
        </div>

        {errorMsg && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {!mode ? (
          /* Hộp chọn chế độ ban đầu */
          <div style={{ display: "flex", gap: 16, justifyContent: "center", padding: "20px 0" }}>
            <button
              onClick={() => setMode("image")}
              style={{
                flex: 1,
                maxWidth: 180,
                height: 180,
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "linear-gradient(135deg, #1877f2 0%, #00c6ff 100%)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                transition: "transform 0.2s",
                boxShadow: "0 4px 12px rgba(24,119,242,0.2)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.04)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              Tạo tin ảnh
            </button>

            <button
              onClick={() => setMode("text")}
              style={{
                flex: 1,
                maxWidth: 180,
                height: 180,
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                transition: "transform 0.2s",
                boxShadow: "0 4px 12px rgba(142,45,226,0.2)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.04)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <span style={{ fontSize: 32, fontWeight: 800 }}>Aa</span>
              Tạo tin chữ
            </button>
          </div>
        ) : (
          /* Form điền nội dung & preview */
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {/* Cột chỉnh sửa */}
            <div style={{ flex: 1, minWidth: 260 }}>
              {mode === "text" && (
                <>
                  <div className="form-group">
                    <label className="form-label">Nội dung văn bản</label>
                    <textarea
                      className="form-input"
                      rows={4}
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Nhập nội dung story..."
                      maxLength={150}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Chọn phông màu nền</label>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                      {STORY_BG_PRESETS.map((color) => (
                        <div
                          key={color}
                          onClick={() => setBgColor(color)}
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: "50%",
                            background: color,
                            cursor: "pointer",
                            border: bgColor === color ? "3px solid var(--text-primary)" : "2px solid transparent",
                            transition: "all 0.15s",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {mode === "image" && (
                <>
                  <div className="form-group">
                    <label className="form-label">Dán link media hoặc tải tệp lên</label>
                    <input
                      className="form-input"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="Dán link ảnh/video (https://...)"
                      style={{ marginBottom: 10 }}
                    />
                    <label className="btn btn-secondary btn-full" style={{ cursor: "pointer", textAlign: "center", display: "block" }}>
                      {uploading ? "⏳ Đang tải tệp lên Cloudinary..." : "📸🎥 Chọn Ảnh hoặc Video từ máy"}
                      <input
                        type="file"
                        accept="image/*,video/*"
                        style={{ display: "none" }}
                        onChange={handleImageSelect}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </>
              )}

              {/* Selector Nhạc Nền Story */}
              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="form-label">🎵 Chọn Nhạc Nền Cho Story</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                  {STORY_MUSIC_PRESETS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMusic(selectedMusic?.id === m.id ? null : m)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        border: selectedMusic?.id === m.id ? "2px solid var(--primary)" : "1px solid var(--border)",
                        background: selectedMusic?.id === m.id ? "var(--primary-light)" : "var(--bg-input)",
                        color: selectedMusic?.id === m.id ? "var(--primary)" : "var(--text-primary)",
                        cursor: "pointer",
                        fontSize: 12.5,
                        fontWeight: 600,
                      }}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setMode(null)}>
                  Quay lại
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting || uploading}>
                  {submitting ? "Đang chia sẻ..." : "Chia sẻ lên Tin"}
                </button>
              </div>
            </div>

            {/* Cột Xem trước (Preview) */}
            <div style={{ flex: "0 0 160px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>Xem trước</div>
              <div
                style={{
                  width: 150,
                  height: 240,
                  borderRadius: 12,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  overflow: "hidden",
                  position: "relative",
                  background: mode === "text" ? bgColor : "#f0f2f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 12,
                }}
              >
                {/* Avatar Badge trong Preview */}
                <div style={{
                  position: "absolute", top: 8, left: 8,
                  width: 32, height: 32, borderRadius: "50%",
                  border: "2px solid #1877f2",
                  background: currentUser?.avatarColor || "#1877f2",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, zIndex: 2
                }}>
                  {currentUser?.fullName ? getInitials(currentUser.fullName) : "?"}
                </div>

                {/* Nội dung Preview */}
                {mode === "text" ? (
                  <span style={{
                    color: "#fff",
                    textAlign: "center",
                    fontSize: textContent.length < 50 ? 14 : 11,
                    fontWeight: 700,
                    lineHeight: 1.4,
                    wordBreak: "break-word",
                  }}>
                    {textContent || "Văn bản xem trước"}
                  </span>
                ) : (
                  mediaUrl ? (
                    isVideoUrl(mediaUrl) ? (
                      <video src={mediaUrl} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <img src={mediaUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )
                  ) : (
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Chưa chọn tệp</span>
                  )
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CreateStoryModal;
