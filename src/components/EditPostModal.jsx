import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Globe, Lock, Users, Tag } from "lucide-react";
import { toast } from "sonner";
import postService from "../services/postService";
import categoryService from "../services/categoryService";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function EditPostModal({ isOpen = true, onClose, post, onUpdated }) {
  const { currentUser } = useAuth();
  const [content, setContent] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [privacy, setPrivacy] = useState("PUBLIC");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    categoryService.getAll()
      .then((res) => {
        setCategories(res.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (post) {
      setContent(post.content || post.body || post.text || "");
      setSelectedCategory(post.category?.id || post.categoryId || "");
      setPrivacy(post.status === "PRIVATE" ? "PRIVATE" : "PUBLIC");
    }
  }, [post, isOpen]);

  if (!isOpen || !post) return null;
  if (typeof document === "undefined") return null;

  const handleInput = (e) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const categoryIdNum = selectedCategory ? Number(selectedCategory) : null;
      const trimmed = content.trim();
      const payload = {
        title: trimmed.slice(0, 100) || "Bài viết",
        content: trimmed,
        body: trimmed,
        status: privacy === "PRIVATE" ? "PRIVATE" : "PUBLIC",
        ...(categoryIdNum ? { category: { id: categoryIdNum }, categoryId: categoryIdNum } : {}),
      };

      console.log("📝 [EditPostModal] Đang gửi payload cập nhật bài viết ID:", post.id, payload);
      const res = await postService.update(post.id, payload);
      console.log("✅ [EditPostModal] Cập nhật thành công ID:", post.id, res.data);

      toast.success("Cập nhật bài viết thành công!");
      const updatedData = res.data || {
        ...post,
        ...payload,
      };

      if (onUpdated) {
        onUpdated(updatedData);
      }
      onClose();
    } catch (err) {
      console.error("❌ [EditPostModal] Lỗi cập nhật bài viết:", err.response?.status, err.response?.data || err);
      const msg =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message || err.message;
      toast.error(msg || "Không thể cập nhật bài viết. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Chỉnh sửa bài viết
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info Bar */}
        <div className="flex items-center gap-3 px-5 py-3">
          <Avatar
            userId={currentUser?.id}
            src={currentUser?.avatarUrl}
            name={currentUser?.fullName || currentUser?.username}
            username={currentUser?.username}
            avatarColor={currentUser?.avatarColor}
            size="w-10 h-10"
            className="border border-zinc-200 dark:border-zinc-700 shrink-0"
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {currentUser?.fullName || currentUser?.username}
            </span>
            {/* Privacy Badge Selector */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                className="text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-none rounded-lg px-2 py-0.5 focus:ring-1 focus:ring-black dark:focus:ring-white outline-none cursor-pointer"
              >
                <option value="PUBLIC">🌍 Công khai</option>
                <option value="PRIVATE">🔒 Chỉ mình tôi</option>
              </select>

              {/* Category selector */}
              {categories.length > 0 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-none rounded-lg px-2 py-0.5 focus:ring-1 focus:ring-black dark:focus:ring-white outline-none cursor-pointer"
                >
                  <option value="">🏷️ Chọn chủ đề</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 overflow-y-auto px-5 py-2 custom-scrollbar">
          <textarea
            ref={textareaRef}
            rows={4}
            value={content}
            onChange={handleInput}
            placeholder="Bạn đang nghĩ gì thế?"
            className="w-full text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 bg-transparent border-none resize-none focus:outline-none leading-relaxed"
            autoFocus
          />

          {/* Hiển thị ảnh kèm theo nếu có (read only preview) */}
          {post.imageUrl && (
            <div className="mt-3 relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 max-h-60">
              <img
                src={post.imageUrl}
                alt="Post Media"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2 bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!content.trim() || isSubmitting}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
