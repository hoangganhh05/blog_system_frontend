import { useState } from "react";

/**
 * Modern Custom AI Prompt Modal (Thay thế window.prompt)
 */
export function AiPromptModal({ isOpen, onClose, onSubmit, loading }) {
  const [promptText, setPromptText] = useState("");

  if (!isOpen) return null;

  const SUGGESTED_TOPICS = [
    "🏖️ Chuyến du lịch Đà Nẵng tuyệt vời",
    "💻 Bí quyết học lập trình Java hiệu quả",
    "🌟 Thói quen tích cực cho ngày mới",
    "🍔 Top 5 món ăn ngon nên thử",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    onSubmit(promptText.trim());
    setPromptText("");
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(8px)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          background: "var(--bg-card)",
          borderRadius: 20,
          padding: 24,
          boxShadow: "0 20px 50px rgba(0,0,0,0.3), 0 0 0 1px var(--border-light)",
          animation: "scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justify: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: 12,
                background: "linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, color: "#fff", boxShadow: "0 4px 12px rgba(124,58,237,0.3)"
              }}
            >
              ✨
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>
                Trợ Lý Gợi Ý Viết Bài
              </h3>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Nhập chủ đề để Trợ lý khơi nguồn ý tưởng viết bài cho bạn
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 20, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              className="form-input"
              placeholder="VD: Kinh nghiệm du lịch tự túc, Học lập trình..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              autoFocus
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 14,
                border: "1.5px solid var(--primary)",
                fontSize: 14.5,
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                outline: "none",
                boxShadow: "0 0 0 3px rgba(79,70,229,0.15)",
              }}
            />
          </div>

          {/* Tag gợi ý */}
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
              💡 Gợi ý ý tưởng hot:
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SUGGESTED_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setPromptText(topic.replace(/^[^\s]+\s/, ""))}
                  style={{
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border-light)",
                    borderRadius: 16,
                    padding: "4px 10px",
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary)"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-light)"}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ borderRadius: 12 }}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !promptText.trim()}
              style={{
                borderRadius: 12,
                background: "linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)",
                fontWeight: 700,
                padding: "10px 20px"
              }}
            >
              {loading ? "🤖 AI đang suy nghĩ..." : "✨ AI Tạo Bài Viết"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modern Custom Confirm Dialog (Thay thế window.confirm)
 */
export function ConfirmModal({ isOpen, title, message, confirmText = "Xác nhận", confirmVariant = "danger", onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(8px)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--bg-card)",
          borderRadius: 20,
          padding: 24,
          textAlign: "center",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3), 0 0 0 1px var(--border-light)",
          animation: "scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div
          style={{
            width: 52, height: 52, borderRadius: "50%",
            background: confirmVariant === "danger" ? "rgba(239, 68, 68, 0.12)" : "var(--primary-light)",
            color: confirmVariant === "danger" ? "#ef4444" : "var(--primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, margin: "0 auto 16px"
          }}
        >
          {confirmVariant === "danger" ? "🗑️" : "❓"}
        </div>

        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
          {title || "Xác nhận hành động"}
        </h3>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            className="btn btn-secondary btn-full"
            onClick={onClose}
            style={{ borderRadius: 12 }}
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            className={`btn btn-${confirmVariant === "danger" ? "danger" : "primary"} btn-full`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{ borderRadius: 12, fontWeight: 700 }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
