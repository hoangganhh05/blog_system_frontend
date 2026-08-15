import { useState, useEffect, useRef } from "react";
import { X, Loader2, Globe, Lock, Users, Tag } from "lucide-react";
import { toast } from "sonner";
import postService from "../services/postService";
import categoryService from "../services/categoryService";
import { useAuth } from "../context/AuthContext";

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
        status: privacy === "PRIVATE" ? "PRIVATE" : "PUBLISHED",
        thumbNail: post.thumbNail || null,
        thumbnail: post.thumbNail || null,
        ...(categoryIdNum
          ? {
              categoryId: categoryIdNum,
              category: { id: categoryIdNum },
            }
          : {}),
      };

      const res = await postService.update(post.id, payload);
      const updatedData = res.data || { ...post, ...payload };
      toast.success("Đã cập nhật bài viết thành công!");
      if (onUpdated) {
        onUpdated(updatedData);
      }
      onClose();
    } catch (err) {
      console.error("Lỗi cập nhật bài viết:", err.response?.data || err);
      const msg =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message || err.message;
      toast.error(msg || "Không thể cập nhật bài viết. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
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
        <div className="flex items-center gap-3 px-5 pt-4 pb-2">
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt=""
              className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs bg-zinc-800 dark:bg-zinc-700">
              {getInitials(currentUser?.fullName || currentUser?.username)}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              {currentUser?.fullName || currentUser?.username}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium px-2 py-0.5 rounded-md border-none focus:outline-none cursor-pointer"
              >
                <option value="PUBLIC">🌍 Công khai</option>
                <option value="FRIENDS">👥 Bạn bè</option>
                <option value="PRIVATE">🔒 Chỉ mình tôi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 px-5 py-2 overflow-y-auto">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            placeholder="Chỉnh sửa nội dung bài viết..."
            rows={4}
            className="w-full bg-transparent border-none resize-none text-[15px] leading-relaxed text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none scrollbar-none min-h-[120px]"
            autoFocus
          />

          {/* Tagged Category Selector */}
          <div className="mt-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-zinc-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer flex-1"
            >
              <option value="">-- Chọn chủ đề / danh mục (không bắt buộc) --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Current Thumbnail preview */}
          {post.thumbNail && (
            <div className="mt-3 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 max-h-56 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <img src={post.thumbNail} alt="" className="w-full h-auto max-h-56 object-cover object-center block" />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2 bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
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
    </div>
  );
}
