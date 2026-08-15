import { useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, Trash2, HelpCircle, X } from "lucide-react";

/**
 * Modern Custom AI Prompt Modal
 */
export function AiPromptModal({ isOpen, onClose, onSubmit, loading }) {
  const [promptText, setPromptText] = useState("");

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

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

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 font-bold">
              AI
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Tạo bài viết với AI
              </h3>
              <p className="text-xs text-zinc-500">
                Gợi ý chủ đề hoặc nhập ý tưởng của bạn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Bạn muốn viết về điều gì?
            </label>
            <textarea
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Nhập chủ đề hoặc ý tưởng bài viết..."
              className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 resize-none transition"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-zinc-500">
              Gợi ý nhanh:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setPromptText(topic)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !promptText.trim()}
              className="px-4 py-2 rounded-full text-xs font-semibold text-white dark:text-black bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 transition active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              {loading ? "Đang suy nghĩ..." : "Tạo bài viết"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/**
 * Modern Custom Confirm Dialog
 */
export function ConfirmModal({ isOpen, title, message, confirmText = "Xác nhận", confirmVariant = "danger", onClose, onConfirm }) {
  if (!isOpen || typeof document === "undefined" || !document.body) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col items-center text-center gap-3 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-base ${
            confirmVariant === "danger"
              ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          {confirmVariant === "danger" ? <Trash2 className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {title || "Xác nhận hành động"}
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
            {message}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`w-full py-2 rounded-full text-xs font-semibold text-white transition active:scale-95 cursor-pointer ${
              confirmVariant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
