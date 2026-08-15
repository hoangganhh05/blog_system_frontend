import { useState, useRef } from "react";
import { Image, Smile, Tag, Globe, Lock, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import postService from "../services/postService";
import uploadService from "../services/uploadService";
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

export default function QuickComposer({ onPostCreated, categories = [] }) {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [privacy, setPrivacy] = useState("PUBLIC");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCategorySelect, setShowCategorySelect] = useState(false);

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
      toast.error("Lỗi tải ảnh lên. Vui lòng thử lại!");
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
      const categoryIdNum = selectedCategory ? Number(selectedCategory) : null;
      const trimmedContent = content.trim();
      const payload = {
        title: trimmedContent.slice(0, 100) || "Bài viết",
        content: trimmedContent,
        body: trimmedContent,
        thumbNail: images[0] || null,
        thumbnail: images[0] || null,
        mediaUrl: images[0] || null,
        mediaUrls: images.length > 0 ? images : null,
        status: "PUBLISHED",
        ...(categoryIdNum
          ? {
              categoryId: categoryIdNum,
              category: { id: categoryIdNum },
            }
          : {}),
      };

      const res = await postService.create(payload);
      setContent("");
      setImages([]);
      setSelectedCategory("");
      setShowCategorySelect(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      toast.success("Đã đăng bài viết mới thành công!");
      if (onPostCreated) {
        onPostCreated(res.data);
      }
    } catch (err) {
      console.error("Lỗi đăng bài nhanh:", err.response?.data || err);
      const serverMsg =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message || err.message;
      toast.error(serverMsg || "Không thể đăng bài viết. Vui lòng kiểm tra lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs flex gap-3">
      {/* Avatar */}
      <div className="shrink-0">
        <Avatar
          userId={currentUserId}
          src={currentUser.avatarUrl}
          name={currentUser.fullName || currentUser.username}
          username={currentUser.username}
          avatarColor={currentUser.avatarColor}
          size="md"
          isOnline={true}
          showActiveStatus={currentUser.showActiveStatus}
          className="border border-zinc-200 dark:border-zinc-700 shadow-xs"
        />
      </div>

      {/* Input */}
      <div className="flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          placeholder="Bạn đang nghĩ gì thế? Chia sẻ câu chuyện hoặc kiến thức..."
          rows={2}
          className="w-full bg-transparent border-none resize-none text-[15px] leading-relaxed text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none scrollbar-none"
        />

        {/* Attached Images */}
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
                className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 group aspect-video max-h-56 bg-zinc-100 dark:bg-zinc-800"
              >
                <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/70 hover:bg-black text-white transition cursor-pointer"
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
        <div className="border-t border-zinc-100 dark:border-zinc-800 my-2" />

        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 text-zinc-500 flex-wrap">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
              title="Đính kèm ảnh"
            >
              <Image className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />

            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs min-h-[38px] bg-zinc-100 dark:bg-zinc-800 border-none rounded-full px-3.5 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer font-medium"
              >
                <option value="">Chủ đề...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}

            <button
              type="button"
              onClick={() => setPrivacy(privacy === "PUBLIC" ? "FRIENDS" : "PUBLIC")}
              className="flex items-center gap-1.5 text-xs min-h-[38px] px-3 py-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition cursor-pointer font-medium"
              title="Quyền riêng tư"
            >
              {privacy === "PUBLIC" ? (<><Globe className="w-3.5 h-3.5" /><span>Công khai</span></>) : (<><Lock className="w-3.5 h-3.5" /><span>Bạn bè</span></>)}
            </button>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={(!content.trim() && images.length === 0) || isSubmitting || isUploading}
            className="px-5 py-2 min-h-[40px] rounded-full text-xs font-bold text-white dark:text-black bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs ml-auto"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Đăng"}
          </button>
        </div>
      </div>
    </div>
  );
}
