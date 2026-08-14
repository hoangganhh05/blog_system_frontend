import { useState, useEffect, useRef } from "react";
import { X, Image, Globe, Lock, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import postService from "../services/postService";
import categoryService from "../services/categoryService";
import uploadService from "../services/uploadService";
import aiService from "../services/aiService";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function CreatePostModal({ isOpen, onClose, onPostCreated, onCreated, editPost }) {
  const { currentUser } = useAuth();
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [privacy, setPrivacy] = useState("PUBLIC");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    categoryService.getAll().then((res) => {
      setCategories(res.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (editPost) {
      setContent(editPost.content || "");
      if (editPost.thumbNail) {
        setImages([editPost.thumbNail]);
      }
      setSelectedCategory(editPost.category?.id || "");
    } else {
      setContent("");
      setImages([]);
      setSelectedCategory("");
    }
  }, [editPost, isOpen]);

  if (!isOpen) return null;

  const handleInput = (e) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        if (images.length >= 4) break;
        const res = await uploadService.uploadFile(file);
        if (res.data?.url) {
          setImages((prev) => [...prev, res.data.url]);
        }
      }
    } catch {
      alert("Lỗi tải ảnh lên. Vui lòng thử lại!");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAiRefine = async () => {
    if (!content.trim() || isAiGenerating) return;
    setIsAiGenerating(true);
    try {
      const refined = await aiService.generatePostContent(`Hãy viết lại nội dung sau đây cho hay hơn, cuốn hút hơn, kèm emoji hợp lý trên mạng xã hội:\n\n${content}`);
      if (refined) {
        setContent(refined);
      }
    } catch {
      alert("AI đang bận. Vui lòng thử lại sau!");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if ((!content.trim() && images.length === 0) || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: content.trim().slice(0, 60) || "Bài viết mới",
        content: content.trim(),
        thumbNail: images[0] || null,
        status: "PUBLISHED",
        category: selectedCategory ? { id: Number(selectedCategory) } : null
      };

      let result;
      if (editPost?.id) {
        result = await postService.update(editPost.id, payload);
      } else {
        result = await postService.create(payload);
      }

      if (onPostCreated) onPostCreated(result.data);
      if (onCreated) onCreated(result.data);
      onClose();
    } catch {
      alert("Lỗi đăng bài viết. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="font-bold text-base text-zinc-900 dark:text-white">
            {editPost ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
          </span>
          <div className="w-7" />
        </div>

        {/* Body Modal */}
        <div className="p-5 overflow-y-auto flex-1 flex gap-3.5">
          {/* Avatar Cột Trái */}
          <div className="shrink-0">
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                style={{ backgroundColor: currentUser?.avatarColor || "#4f46e5" }}
              >
                {getInitials(currentUser?.fullName || currentUser?.username)}
              </div>
            )}
          </div>

          {/* Cột Soạn Thảo */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm text-zinc-900 dark:text-white">
                {currentUser?.fullName || currentUser?.username}
              </span>
              <button
                type="button"
                onClick={() => setPrivacy(privacy === "PUBLIC" ? "FRIENDS" : "PUBLIC")}
                className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              >
                {privacy === "PUBLIC" ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                <span>{privacy === "PUBLIC" ? "Công khai" : "Bạn bè"}</span>
              </button>
            </div>

            <textarea
              ref={textareaRef}
              autoFocus
              value={content}
              onChange={handleInput}
              placeholder="Có gì mới hôm nay?..."
              rows={4}
              className="w-full bg-transparent border-none resize-none text-[16px] leading-relaxed text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none scrollbar-none my-1"
            />

            {/* Preview hình ảnh */}
            {images.length > 0 && (
              <div className={`mt-2 mb-3 grid gap-2 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {images.map((imgUrl, idx) => (
                  <div key={idx} className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 group aspect-video max-h-56 bg-zinc-100 dark:bg-zinc-900">
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/70 hover:bg-black text-white transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isUploading && (
              <div className="flex items-center gap-2 text-xs text-zinc-400 my-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tải ảnh...</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Toolbar */}
        <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition"
              title="Đính kèm ảnh"
            >
              <Image className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-zinc-200/60 dark:bg-zinc-800 border-none rounded-full px-3 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none"
              >
                <option value="">Chủ đề...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleAiRefine}
              disabled={!content.trim() || isAiGenerating}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:opacity-80 transition font-medium"
              title="Nhờ AI viết hay hơn"
            >
              {isAiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>AI Viết lại</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={(!content.trim() && images.length === 0) || isSubmitting || isUploading}
            className={`px-6 py-2 rounded-full text-sm font-bold transition ${
              content.trim() || images.length > 0
                ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 active:scale-95"
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editPost ? "Lưu" : "Đăng"}
          </button>
        </div>
      </div>
    </div>
  );
}
