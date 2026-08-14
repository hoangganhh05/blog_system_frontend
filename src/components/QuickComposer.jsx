import { useState, useRef } from "react";
import { Image, Smile, Tag, Globe, Lock, X, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import postService from "../services/postService";
import uploadService from "../services/uploadService";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function QuickComposer({ onPostCreated, categories = [] }) {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [privacy, setPrivacy] = useState("PUBLIC");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleInput = (e) => {
    setContent(e.target.value);
    // Auto resize textarea
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

      const res = await postService.create(payload);
      setContent("");
      setImages([]);
      setSelectedCategory("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      if (onPostCreated) {
        onPostCreated(res.data);
      }
    } catch {
      alert("Không thể đăng bài viết. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1e1e1e] p-4 mb-4 shadow-sm flex gap-3">
      {/* Cột Avatar bên trái */}
      <div className="shrink-0">
        {currentUser.avatarUrl ? (
          <img src={currentUser.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover ring-2" style={{ outline: "2px solid #E8650A30" }} />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: currentUser.avatarColor || "#E8650A" }}>
            {getInitials(currentUser.fullName || currentUser.username)}
          </div>
        )}
      </div>

      {/* Cột Soạn Thảo bên phải */}
      <div className="flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          placeholder="Chia sẻ suy nghĩ hoặc câu chuyện của bạn..."
          rows={2}
          className="w-full bg-transparent border-none resize-none text-[15px] leading-relaxed text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none scrollbar-none"
        />

        {/* Preview ảnh đính kèm (Adaptive Grid) */}
        {images.length > 0 && (
          <div
            className={`mt-2 mb-3 grid gap-2 ${
              images.length === 1
                ? "grid-cols-1"
                : images.length === 2
                ? "grid-cols-2"
                : images.length === 3
                ? "grid-cols-3"
                : "grid-cols-2"
            }`}
          >
            {images.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 group aspect-video max-h-56 bg-zinc-100 dark:bg-zinc-900"
              >
                <img
                  src={imgUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/70 hover:bg-black text-white transition"
                  title="Xóa ảnh"
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
            <span>Đang tải ảnh lên...</span>
          </div>
        )}

          {/* Divider */}
          <div className="border-t border-stone-100 dark:border-stone-800 my-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-stone-500">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white transition" title="Đính kèm ảnh">
                <Image className="w-4 h-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />

              {categories.length > 0 && (
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs bg-stone-100 dark:bg-stone-800 border-none rounded-full px-3 py-1.5 text-stone-700 dark:text-stone-300 focus:outline-none">
                  <option value="">Chủ đề...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}

              <button type="button" onClick={() => setPrivacy(privacy === "PUBLIC" ? "FRIENDS" : "PUBLIC")}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition" title="Quyền riêng tư">
                {privacy === "PUBLIC" ? (<><Globe className="w-3.5 h-3.5" /><span>Công khai</span></>) : (<><Lock className="w-3.5 h-3.5" /><span>Bạn bè</span></>)}
              </button>
            </div>

            <button type="button" onClick={handleSubmit}
              disabled={(!content.trim() && images.length === 0) || isSubmitting || isUploading}
              className="px-5 py-1.5 rounded-full text-xs font-bold text-white transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: (content.trim() || images.length > 0) ? "#E8650A" : "#d1cdc9" }}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Đăng"}
            </button>
          </div>
        </div>
      </div>
  );
}
