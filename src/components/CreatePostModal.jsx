import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import postService from "../services/postService";
import categoryService from "../services/categoryService";
import uploadService from "../services/uploadService";
import aiService from "../services/aiService";
import { AiPromptModal } from "./CustomModal";
import { isVideoUrl } from "../utils/mediaUtils";

// Facebook-style background presets
const BG_PRESETS = [
  { label: "Không có", value: null, preview: null },
  {
    label: "Đỏ cam",
    value: "linear-gradient(135deg,#f12711 0%,#f5af19 100%)",
    preview: "linear-gradient(135deg,#f12711,#f5af19)",
  },
  {
    label: "Tím hồng",
    value: "linear-gradient(135deg,#a18cd1 0%,#fbc2eb 100%)",
    preview: "linear-gradient(135deg,#a18cd1,#fbc2eb)",
  },
  {
    label: "Xanh đại dương",
    value: "linear-gradient(135deg,#2193b0 0%,#6dd5ed 100%)",
    preview: "linear-gradient(135deg,#2193b0,#6dd5ed)",
  },
  {
    label: "Xanh lá mát",
    value: "linear-gradient(135deg,#11998e 0%,#38ef7d 100%)",
    preview: "linear-gradient(135deg,#11998e,#38ef7d)",
  },
  {
    label: "Hoàng hôn",
    value: "linear-gradient(135deg,#f093fb 0%,#f5576c 100%)",
    preview: "linear-gradient(135deg,#f093fb,#f5576c)",
  },
  {
    label: "Vàng nắng",
    value: "linear-gradient(135deg,#f7971e 0%,#ffd200 100%)",
    preview: "linear-gradient(135deg,#f7971e,#ffd200)",
  },
  {
    label: "Đêm huyền bí",
    value: "linear-gradient(135deg,#232526 0%,#414345 100%)",
    preview: "linear-gradient(135deg,#232526,#414345)",
  },
  {
    label: "Đỏ đậm",
    value: "linear-gradient(135deg,#c0392b 0%,#8e44ad 100%)",
    preview: "linear-gradient(135deg,#c0392b,#8e44ad)",
  },
  {
    label: "Xanh navy",
    value: "linear-gradient(135deg,#1e3c72 0%,#2a5298 100%)",
    preview: "linear-gradient(135deg,#1e3c72,#2a5298)",
  },
  {
    label: "Hồng pastel",
    value: "linear-gradient(135deg,#ff9a9e 0%,#fecfef 50%,#fecfef 100%)",
    preview: "linear-gradient(135deg,#ff9a9e,#fecfef)",
  },
];

function CreatePostModal({ onClose, onCreated, editPost }) {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: editPost?.title || "",
    content: editPost?.content || "",
    thumbNail: editPost?.thumbNail || "",
    status: editPost?.status || "public",
    categoryId: editPost?.category?.id || "",
    bgColor: editPost?.bgColor || null,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [showBgPicker, setShowBgPicker] = useState(!!editPost?.bgColor);

  const [aiLoading, setAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    categoryService.getAll().then((res) => {
      const list = res.data || [];
      setCategories(list);
      if (!editPost && list.length > 0) {
        setForm((f) => ({ ...f, categoryId: f.categoryId || list[0].id }));
      }
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleBgSelect = (bgValue) => {
    setForm((f) => ({ ...f, bgColor: bgValue }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setForm((f) => ({ ...f, thumbNail: localUrl }));
  };

  const handleClearMedia = () => {
    setSelectedFile(null);
    setForm((f) => ({ ...f, thumbNail: "" }));
  };

  const [showAiPromptModal, setShowAiPromptModal] = useState(false);

  // AI Content Generator
  const handleGenerateAI = () => {
    setShowAiPromptModal(true);
  };

  const handleConfirmAiGenerate = async (topicPrompt) => {
    setShowAiPromptModal(false);
    try {
      setAiLoading(true);
      setError("");
      const generated = await aiService.generatePost(topicPrompt);
      setForm((f) => ({
        ...f,
        title: generated.title,
        content: generated.content,
      }));
    } catch {
      setError("AI không thể tạo bài viết lúc này!");
    } finally {
      setAiLoading(false);
    }
  };

  // Voice Typing Speech-to-Text
  const handleVoiceTyping = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Trình duyệt của bạn chưa hỗ trợ Voice Speech Recognition!");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setForm((f) => ({
          ...f,
          content: f.content ? `${f.content} ${transcript}` : transcript,
        }));
      }
    };

    recognition.start();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return setError("Vui lòng đăng nhập!");

    const textContent = form.content.trim();
    const textTitle = form.title.trim();
    const media = (form.thumbNail || "").trim();

    // Nếu không có nội dung, không có tiêu đề, không có ảnh/video và không có nền màu -> Báo lỗi
    if (!textContent && !textTitle && !media && !form.bgColor) {
      return setError("Vui lòng nhập nội dung hoặc đính kèm ảnh/video!");
    }

    setLoading(true);
    setError("");

    // CHỈ UPLOAD CLOUDINARY KHI BẤM NÚT ĐĂNG BÀI
    let finalMediaUrl = media;
    if (selectedFile && !form.bgColor) {
      try {
        setUploading(true);
        setUploadProgress(0);
        const res = await uploadService.uploadFile(selectedFile, (percent) => {
          setUploadProgress(percent);
        });
        finalMediaUrl = res.data.url;
      } catch (err) {
        setLoading(false);
        setUploading(false);
        return setError("Không thể tải tệp lên Cloudinary! Vui lòng thử lại.");
      } finally {
        setUploading(false);
      }
    }

    // Xử lý tự động tiêu đề & nội dung linh hoạt
    let finalTitle = textTitle;
    let finalContent = textContent;

    if (form.bgColor) {
      finalTitle = textContent.slice(0, 80) || "Bài viết nền màu";
      finalContent = textContent;
    } else {
      if (!finalTitle && finalContent) {
        finalTitle = finalContent.slice(0, 80);
      } else if (finalTitle && !finalContent) {
        finalContent = finalTitle;
      } else if (!finalTitle && !finalContent && finalMediaUrl) {
        finalTitle = "Bài viết mới";
        finalContent = "";
      }
    }

    const postData = {
      title: finalTitle,
      content: finalContent,
      thumbNail: form.bgColor ? null : (finalMediaUrl || null),
      status: form.status,
      bgColor: form.bgColor || null,
      createdAt: editPost ? editPost.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: { id: currentUser.id || currentUser.userId },
      category: form.categoryId ? { id: parseInt(form.categoryId) } : null,
    };

    try {
      let res;
      if (editPost) {
        res = await postService.update(editPost.id, postData);
      } else {
        res = await postService.create(postData);
      }
      onCreated && onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // Determine text color for colored background preview
  const isDarkBg = form.bgColor && (
    form.bgColor.includes("232526") ||
    form.bgColor.includes("1e3c72") ||
    form.bgColor.includes("c0392b") ||
    form.bgColor.includes("2193b0") ||
    form.bgColor.includes("11998e")
  );
  const bgTextColor = form.bgColor ? (isDarkBg ? "#fff" : "#fff") : undefined;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editPost ? "Chỉnh sửa bài viết" : "Tạo bài viết"}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* User info */}
            {currentUser && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div className="avatar avatar-md">
                  {(currentUser.fullName || currentUser.username || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {currentUser.fullName || currentUser.username}
                  </div>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="form-input"
                    style={{ padding: "4px 8px", fontSize: 13, marginTop: 4, width: "auto" }}
                  >
                    <option value="public">Công khai</option>
                    <option value="private">Chỉ mình tôi</option>
                    <option value="draft">Nháp</option>
                  </select>
                </div>
              </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}

            {/* Title — ẩn khi dùng nền màu */}
            {!form.bgColor && (
              <div className="form-group">
                <input
                  className="form-input"
                  name="title"
                  placeholder="Tiêu đề bài viết (tùy chọn)..."
                  value={form.title}
                  onChange={handleChange}
                  style={{ fontSize: 18, fontWeight: 600 }}
                  maxLength={200}
                />
              </div>
            )}

            {/* Content with bg color preview */}
            <div className="form-group">
              <div
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  background: form.bgColor || "transparent",
                  minHeight: form.bgColor ? 180 : "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: form.bgColor ? "16px" : "0",
                }}
              >
                <textarea
                  className="form-input form-textarea"
                  name="content"
                  placeholder={form.bgColor ? "Bạn đang nghĩ gì?..." : "Bạn đang nghĩ gì? Hãy chia sẻ với mọi người..."}
                  value={form.content}
                  onChange={handleChange}
                  style={{
                    minHeight: form.bgColor ? 120 : 140,
                    background: "transparent",
                    border: form.bgColor ? "none" : undefined,
                    boxShadow: form.bgColor ? "none" : undefined,
                    color: bgTextColor,
                    fontSize: form.bgColor ? ((form.content?.length || 0) < 80 ? 22 : 16) : 15,
                    fontWeight: form.bgColor ? 700 : 400,
                    textAlign: form.bgColor ? "center" : "left",
                    resize: "none",
                    outline: "none",
                    caretColor: "#fff",
                    letterSpacing: form.bgColor ? 0.3 : 0,
                    textShadow: form.bgColor ? "0 1px 3px rgba(0,0,0,0.25)" : "none",
                    "::placeholder": { color: "rgba(255,255,255,0.75)" },
                  }}
                />
              </div>
            </div>

            {/* Action Bar: Nền màu, AI Assistant, Gõ giọng nói */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setShowBgPicker((v) => !v);
                  if (showBgPicker) handleBgSelect(null);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: "1.5px solid var(--border)",
                  background: showBgPicker ? "var(--primary)" : "transparent",
                  color: showBgPicker ? "#fff" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: 16 }}>🎨</span>
                {showBgPicker ? "Tắt nền màu" : "Thêm nền màu"}
              </button>

              {/* Nút Trợ lý Sáng tạo */}
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={aiLoading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: "1.5px solid var(--primary)",
                  background: "var(--primary-light)",
                  color: "var(--primary)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "all 0.2s",
                }}
              >
                <span>✨</span>
                {aiLoading ? "Trợ lý đang gợi ý..." : "Gợi ý viết bài"}
              </button>

              {/* Nút Voice Typing */}
              <button
                type="button"
                onClick={handleVoiceTyping}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: isListening ? "1.5px solid #ef4444" : "1.5px solid var(--border)",
                  background: isListening ? "rgba(239,68,68,0.1)" : "transparent",
                  color: isListening ? "#ef4444" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "all 0.2s",
                }}
              >
                <span>🎙️</span>
                {isListening ? "Đang lắng nghe..." : "Gõ bằng giọng nói"}
              </button>
            </div>

            {/* Background palette */}
            {showBgPicker && (
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 16,
                padding: 12,
                borderRadius: 12,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
              }}>
                {BG_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    title={preset.label}
                    onClick={() => handleBgSelect(preset.value)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      border: form.bgColor === preset.value
                        ? "3px solid var(--primary)"
                        : "2px solid var(--border)",
                      background: preset.preview || "var(--bg-primary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "transform 0.15s, box-shadow 0.15s",
                      boxShadow: form.bgColor === preset.value
                        ? "0 0 0 3px rgba(24,119,242,0.35)"
                        : "none",
                      transform: form.bgColor === preset.value ? "scale(1.15)" : "scale(1)",
                      fontSize: 16,
                    }}
                  >
                    {!preset.preview && "✕"}
                    {preset.preview && form.bgColor === preset.value && (
                      <span style={{ color: "#fff", fontSize: 14, fontWeight: 700, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Thumbnail / Media (URL hoặc Upload Cloudinary) — ẩn khi dùng nền màu */}
            {!form.bgColor && (
              <div className="form-group">
                <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>📷 / 🎥 Ảnh hoặc Video đính kèm</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>Cloudinary Free Storage</span>
                </label>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input
                    className="form-input"
                    name="thumbNail"
                    placeholder="Dán URL media hoặc chọn file từ máy..."
                    value={form.thumbNail}
                    onChange={handleChange}
                    style={{ flex: 1 }}
                  />
                  <label className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", whiteSpace: "nowrap" }}>
                    <span>📁 Chọn File từ máy</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                {uploading && (
                  <div style={{ marginBottom: 10, padding: 8, background: "var(--bg-secondary)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--primary)", fontWeight: 600, marginBottom: 4 }}>
                      <span>☁️ Đang tải lên Cloudinary...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div style={{ width: "100%", height: 6, background: "var(--bg-input)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${uploadProgress}%`, height: "100%", background: "var(--primary)", transition: "width 0.2s" }} />
                    </div>
                  </div>
                )}

                {form.thumbNail && (
                  <div style={{ position: "relative", marginTop: 8, borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border)" }}>
                    {isVideoUrl(form.thumbNail) ? (
                      <video
                        src={form.thumbNail}
                        controls
                        style={{
                          width: "100%",
                          maxHeight: 240,
                          background: "#000",
                          display: "block",
                        }}
                      />
                    ) : (
                      <img
                        src={form.thumbNail}
                        alt="preview"
                        style={{
                          width: "100%",
                          maxHeight: 220,
                          objectFit: "cover",
                          display: "block",
                        }}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleClearMedia}
                      title="Gỡ media"
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "rgba(0,0,0,0.65)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: 28,
                        height: 28,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Danh mục (Tùy chọn)</label>
              <select
                className="form-input"
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
              >
                <option value="">-- Mặc định (Tự động gán) --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Đang lưu..." : editPost ? "Cập nhật" : "Đăng bài"}
            </button>
          </div>
        </form>
      </div>

      {/* AI Custom Prompt Modal */}
      <AiPromptModal
        isOpen={showAiPromptModal}
        onClose={() => setShowAiPromptModal(false)}
        onSubmit={handleConfirmAiGenerate}
        loading={aiLoading}
      />
    </div>
  );
}

export default CreatePostModal;
