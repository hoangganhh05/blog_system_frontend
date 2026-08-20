import { useState, useEffect, useRef } from "react";
import { X, Image, Globe, Lock, Sparkles, Loader2, Video, Play, Pause, Volume2, VolumeX, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import postService from "../services/postService";
import categoryService from "../services/categoryService";
import uploadService from "../services/uploadService";
import aiService from "../services/aiService";
import Avatar from "./Avatar";
import { isVideoUrl } from "../utils/mediaUtils";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const MAX_VIDEO_DURATION = 120; // 2 minutes in seconds
// Không giới hạn dung lượng file — chỉ giới hạn thời lượng tối đa 2 phút.
const ACCEPTED_VIDEO_FORMATS = ["video/mp4", "video/webm", "video/quicktime"];

export default function CreatePostModal({ isOpen = true, onClose, onPostCreated, onCreated, editPost }) {
  const { currentUser } = useAuth();
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [privacy, setPrivacy] = useState("PUBLIC");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [videoValidationError, setVideoValidationError] = useState(null);
  const [mediaType, setMediaType] = useState("text"); // 'text' | 'image' | 'video'

  const fileInputRef = useRef(null);
  const videoFileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    categoryService.getAll().then((res) => {
      setCategories(res.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (editPost) {
      setContent(editPost.content || "");
      const existingImgs = [];
      if (Array.isArray(editPost.images) && editPost.images.length > 0) {
        existingImgs.push(...editPost.images);
      } else if (Array.isArray(editPost.imageUrls) && editPost.imageUrls.length > 0) {
        existingImgs.push(...editPost.imageUrls);
      } else if (editPost.thumbNail) {
        existingImgs.push(editPost.thumbNail);
      }
      setImages(existingImgs);
      setSelectedCategory(editPost.category?.id || "");
      // Determine media type from existing post
      if (editPost.videoUrl || (editPost.thumbNail && isVideoUrl(editPost.thumbNail))) {
        setMediaType("video");
      } else if (existingImgs.length > 0) {
        setMediaType("image");
      } else {
        setMediaType("text");
      }
    } else {
      setContent("");
      setImages([]);
      setSelectedCategory("");
      setMediaType("text");
      setVideoFile(null);
      setVideoPreviewUrl(null);
      setVideoDuration(0);
      setVideoValidationError(null);
    }
  }, [editPost, isOpen]);

  // Cleanup video preview URL
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

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
      const uploadedUrls = await uploadService.uploadMultipleFiles(files.slice(0, 10));
      if (uploadedUrls && uploadedUrls.length > 0) {
        setImages((prev) => [...prev, ...uploadedUrls].slice(0, 10));
        setMediaType("image");
      }
    } catch {
      toast.error("Lỗi tải ảnh lên. Vui lòng thử lại!");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate format
    if (!ACCEPTED_VIDEO_FORMATS.includes(file.type)) {
      setVideoValidationError("Chỉ chấp nhận định dạng MP4, WebM, MOV");
      toast.error("Định dạng file không được hỗ trợ");
      return;
    }

    // Create preview URL
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }

    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
    setVideoFile(file);
    setVideoValidationError(null);
    setVideoDuration(0);
    setMediaType("video");

    // Load video to get duration
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;

    video.onloadedmetadata = () => {
      if (video.duration > MAX_VIDEO_DURATION) {
        setVideoValidationError(`Thời lượng tối đa là 2 phút. Video hiện tại: ${Math.floor(video.duration / 60)}:${Math.floor(video.duration % 60).toString().padStart(2, '0')}`);
        toast.error("Video quá dài");
        URL.revokeObjectURL(url);
        setVideoPreviewUrl(null);
        setVideoFile(null);
        setMediaType("text");
        video.remove();
        return;
      }

      setVideoDuration(video.duration);
      video.remove();
    };

    video.onerror = () => {
      setVideoValidationError("Không thể đọc file video");
      toast.error("File video không hợp lệ");
      URL.revokeObjectURL(url);
      setVideoPreviewUrl(null);
      setVideoFile(null);
      setMediaType("text");
      video.remove();
    };

    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = "";
    }
  };

  const handleRemoveVideo = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoPreviewUrl(null);
    setVideoFile(null);
    setVideoDuration(0);
    setVideoValidationError(null);
    setIsVideoPlaying(false);
    setMediaType(images.length > 0 ? "image" : "text");
    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = "";
    }
  };

  const toggleVideoPlayPause = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const toggleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        toast.success("AI đã tối ưu nội dung bài viết!");
      }
    } catch {
      toast.error("AI đang bận. Vui lòng thử lại sau!");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSubmit = async () => {
    const hasContent = content.trim();
    const hasImages = images.length > 0;
    const hasVideo = videoFile !== null;

    if ((!hasContent && !hasImages && !hasVideo) || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const categoryIdNum = selectedCategory ? Number(selectedCategory) : null;
      const trimmedContent = content.trim();
      
      let videoUrl = null;
      let thumbnailUrl = images[0] || null;

      // Upload video if present
      if (hasVideo && videoFile) {
        setIsUploading(true);
        try {
          const uploadedVideoUrls = await uploadService.uploadMultipleFiles([videoFile]);
          if (uploadedVideoUrls && uploadedVideoUrls.length > 0) {
            videoUrl = uploadedVideoUrls[0];
            thumbnailUrl = videoUrl; // Use video URL as thumbnail for video posts
          }
        } catch {
          toast.error("Lỗi tải video lên. Vui lòng thử lại!");
          setIsUploading(false);
          setIsSubmitting(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      const payload = {
        title: trimmedContent.slice(0, 100) || "Bài viết",
        content: trimmedContent,
        body: trimmedContent,
        thumbNail: thumbnailUrl,
        thumbnail: thumbnailUrl,
        videoUrl: videoUrl,
        mediaType: hasVideo ? "video" : hasImages ? "image" : "text",
        images: hasVideo ? [] : images,
        imageUrls: hasVideo ? [] : images,
        mediaUrls: hasVideo ? [videoUrl] : (images.length > 0 ? images : null),
        status: "PUBLISHED",
        ...(categoryIdNum
          ? {
              categoryId: categoryIdNum,
              category: { id: categoryIdNum },
            }
          : {}),
      };

      let result;
      if (editPost?.id) {
        result = await postService.update(editPost.id, payload);
        toast.success("Đã cập nhật bài viết thành công!");
      } else {
        result = await postService.create(payload);
        toast.success("Đã đăng bài viết mới thành công!");
        // Đóng Modal + cuộn nhẹ lên đầu trang để thấy bài viết mới trên Feed (không cần F5)
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      if (onPostCreated) onPostCreated(result.data);
      if (onCreated) onCreated(result.data);
      onClose();
    } catch (err) {
      console.error("Lỗi đăng bài:", err.response?.data || err);
      const serverMsg =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message || err.message;
      toast.error(serverMsg || "Lỗi đăng bài viết. Vui lòng kiểm tra lại thông tin!");
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
        {/* Header Modal - Centered title with circular close button */}
        <div className="relative flex items-center justify-center px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
          <span className="font-bold text-base text-zinc-900 dark:text-white">
            {editPost ? "Chỉnh sửa bài viết" : "Tạo bài viết"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3">
          {/* User Meta Row */}
          <div className="flex items-center gap-3">
                        <Avatar
              userId={currentUser?.id}
              src={currentUser?.avatarUrl}
              name={currentUser?.fullName || currentUser?.username}
              username={currentUser?.username}
              avatarColor={currentUser?.avatarColor}
              size="md"
              className="border border-zinc-200 dark:border-zinc-700 shadow-xs"
            />

            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                {currentUser?.fullName || currentUser?.username}
              </span>
              <button
                type="button"
                onClick={() => setPrivacy(privacy === "PUBLIC" ? "FRIENDS" : "PUBLIC")}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 w-fit mt-0.5 cursor-pointer"
              >
                {privacy === "PUBLIC" ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                <span>{privacy === "PUBLIC" ? "Công khai" : "Bạn bè"}</span>
              </button>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            autoFocus
            value={content}
            onChange={handleInput}
            placeholder="Bạn đang nghĩ gì thế? Chia sẻ câu chuyện của bạn..."
            rows={4}
            className="w-full bg-transparent border-none resize-none text-[15px] leading-relaxed text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none scrollbar-none my-1"
          />

          {/* Preview Images */}
          {images.length > 0 && mediaType !== "video" && (
            <div className={`mt-2 grid gap-2 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {images.map((imgUrl, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 group aspect-video max-h-56 bg-zinc-100 dark:bg-zinc-800">
                  <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/70 hover:bg-black text-white transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Video Preview */}
          {videoPreviewUrl && mediaType === "video" && (
            <div className="mt-2 relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-black aspect-video max-h-80">
              <video
                ref={videoRef}
                src={videoPreviewUrl}
                className="w-full h-full object-cover"
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                onEnded={() => setIsVideoPlaying(false)}
              />
              
              {/* Overlay Controls */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              
              {/* Play/Pause Button */}
              <button
                type="button"
                onClick={toggleVideoPlayPause}
                className="absolute inset-0 flex items-center justify-center pointer-events-auto group"
              >
                <div className={`w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all group-hover:scale-110 ${isVideoPlaying ? 'opacity-0' : 'opacity-100'}`}>
                  {isVideoPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-1" />
                  )}
                </div>
              </button>

              {/* Top Actions */}
              <div className="absolute top-2 right-2 flex gap-2 pointer-events-auto">
                <button
                  type="button"
                  onClick={toggleVideoMute}
                  className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition cursor-pointer"
                  title={isVideoMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                >
                  {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleRemoveVideo}
                  className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition cursor-pointer"
                  title="Xóa video"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Info */}
              <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
                {videoValidationError ? (
                  <div className="flex items-center gap-2 text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>{videoValidationError}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-white text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>{formatDuration(videoDuration)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {isUploading && (
            <div className="flex items-center gap-2 text-xs text-zinc-400 my-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang tải ảnh...</span>
            </div>
          )}
        </div>

        {/* Footer Toolbar & Submit Button */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Đính kèm ảnh"
                disabled={mediaType === "video"}
              >
                <Image className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={mediaType === "video"}
              />

              <button
                type="button"
                onClick={() => videoFileInputRef.current?.click()}
                className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Đính kèm video"
                disabled={mediaType === "image"}
              >
                <Video className="w-4 h-4" />
              </button>
              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleVideoFileChange}
                className="hidden"
                disabled={mediaType === "image"}
              />

              {categories.length > 0 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs min-h-[38px] bg-zinc-200/70 dark:bg-zinc-800 border-none rounded-full px-3.5 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer font-medium"
                >
                  <option value="">Chủ đề...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              type="button"
              onClick={handleAiRefine}
              disabled={!content.trim() || isAiGenerating}
              className="flex items-center gap-1.5 text-xs min-h-[38px] px-3.5 py-1.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition font-medium cursor-pointer"
              title="Nhờ AI viết hay hơn"
            >
              {isAiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
              <span>AI Tối ưu</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={(!content.trim() && images.length === 0 && !videoFile) || isSubmitting || isUploading}
            className="w-full py-3 min-h-[44px] rounded-full text-xs font-bold text-white dark:text-black bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editPost ? "Lưu thay đổi" : "Đăng bài"}
          </button>
        </div>
      </div>
    </div>
  );
}
