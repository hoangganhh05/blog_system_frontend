import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Image, Type, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import uploadService from "../services/uploadService";
import storyService from "../services/storyService";
import Avatar from "./Avatar";

const COLOR_PRESETS = [
  "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
  "linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)",
  "linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)",
  "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  "linear-gradient(135deg, #f80759 0%, #bc4e9c 100%)",
  "linear-gradient(135deg, #1877f2 0%, #00c6ff 100%)",
  "linear-gradient(135deg, #f12711 0%, #f5af19 100%)",
  "linear-gradient(135deg, #434343 0%, #000000 100%)",
];

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function CreateStoryModal({ isOpen = true, onClose, onCreated, onSuccess }) {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  const [storyContent, setStoryContent] = useState("");
  const [selectedBg, setSelectedBg] = useState(COLOR_PRESETS[0]);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePublish = async () => {
    if (!storyContent.trim() && !mediaFile && !mediaPreview) {
      toast.error("Vui lòng nhập nội dung chữ hoặc chọn hình ảnh!");
      return;
    }

    setSubmitting(true);
    let finalMediaUrl = mediaPreview;

    try {
      if (mediaFile) {
        setUploading(true);
        const uploadRes = await uploadService.uploadFile(mediaFile);
        finalMediaUrl = uploadRes.data?.url || uploadRes.data;
      }

      const payload = {
        mediaUrl: finalMediaUrl || null,
        textContent: storyContent.trim() || null,
        bgColor: mediaFile || finalMediaUrl ? null : selectedBg,
      };

      const res = await storyService.create(currentUserId, payload);
      toast.success("Đã chia sẻ tin 24h mới thành công!");
      if (onCreated) onCreated(res.data);
      if (onSuccess) onSuccess(res.data);
      onClose();
    } catch (err) {
      console.error("Lỗi tạo tin:", err);
      toast.error("Đăng tin thất bại. Vui lòng thử lại sau!");
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  if (!isOpen || typeof document === "undefined" || !document.body) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Khung Modal Nền Đặc 100% */}
      <div
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Tạo tin (Story 24h)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nội dung chia 2 cột */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto bg-white dark:bg-zinc-900">
          {/* Cột trái: Form nhập văn bản / media / phông màu */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 block">
                Nội dung tin
              </label>
              <textarea
                rows={4}
                value={storyContent}
                onChange={(e) => setStoryContent(e.target.value)}
                placeholder="Bạn đang nghĩ gì? Nhập nội dung..."
                maxLength={200}
                className="w-full p-3.5 text-sm rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none transition"
              />
              <div className="flex justify-end text-[11px] text-zinc-400 mt-1">
                {storyContent.length}/200
              </div>
            </div>

            {/* Media Upload */}
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 block">
                Hình ảnh (Tùy chọn)
              </label>
              {mediaPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 max-h-36">
                  <img src={mediaPreview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveMedia}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 transition cursor-pointer"
                >
                  <Image className="w-4 h-4" />
                  <span>Chọn ảnh từ thiết bị</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Màu phông nền (Khi không có ảnh) */}
            {!mediaPreview && (
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                  Màu phông nền
                </label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {COLOR_PRESETS.map((bg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedBg(bg)}
                      className={`w-7 h-7 rounded-full transition-transform active:scale-95 cursor-pointer ${
                        selectedBg === bg
                          ? "ring-2 ring-offset-2 ring-black dark:ring-white scale-110"
                          : ""
                      }`}
                      style={{ background: bg }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cột phải: Xem trước (9:16) */}
          <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] text-zinc-400 mb-2 font-medium">
              Xem trước Story
            </span>
            <div
              className="w-48 h-80 rounded-3xl p-4 flex flex-col justify-between shadow-2xl text-white relative overflow-hidden transition-all"
              style={{
                background: mediaPreview ? `url(${mediaPreview}) center/cover no-repeat` : selectedBg,
              }}
            >
              {/* Overlay tối khi có ảnh */}
              {mediaPreview && <div className="absolute inset-0 bg-black/40" />}

              {/* Author Info */}
              <div className="relative z-10 flex items-center gap-2">
                                <Avatar
                  userId={currentUser?.id}
                  src={currentUser?.avatarUrl}
                  name={currentUser?.fullName || currentUser?.username}
                  username={currentUser?.username}
                  avatarColor={currentUser?.avatarColor}
                  size="sm"
                  className="border border-white/60 object-cover"
                />
                <span className="text-xs font-bold drop-shadow">
                  {currentUser?.fullName || currentUser?.username || "Bạn"}
                </span>
              </div>

              {/* Content Text */}
              <div className="relative z-10 my-auto text-center px-1">
                <p className="text-xs font-medium leading-relaxed drop-shadow-md break-words">
                  {storyContent || "Nội dung tin của bạn..."}
                </p>
              </div>

              {/* Footer text */}
              <div className="relative z-10 text-center">
                <span className="text-[10px] text-white/80 font-medium drop-shadow">
                  BlogViet Story
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting || uploading}
            className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={submitting || uploading}
            className="px-5 py-2 text-xs font-semibold text-white bg-black dark:bg-white dark:text-black rounded-xl hover:opacity-90 transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {submitting || uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang đăng tin...</span>
              </>
            ) : (
              "Chia sẻ lên Tin"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
