import { useState, useRef, useEffect } from "react";
import { Upload, X, Play, Pause, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import uploadService from "../services/uploadService";
import postService from "../services/postService";

const MAX_DURATION = 120; // 2 minutes in seconds
const ACCEPTED_FORMATS = ["video/mp4", "video/webm", "video/quicktime"];

export default function ShortVideoUpload({ onUploadSuccess, onCancel }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState(null);
  const [caption, setCaption] = useState("");
  
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Cleanup preview URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate format
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      setValidationError("Chỉ chấp nhận định dạng MP4, WebM, MOV");
      toast.error("Định dạng file không được hỗ trợ");
      return;
    }

    // Create preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
    setValidationError(null);
    setDuration(0);

    // Load video to get duration
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    
    video.onloadedmetadata = () => {
      if (video.duration > MAX_DURATION) {
        setValidationError(`Thời lượng tối đa là 2 phút. Video hiện tại: ${Math.floor(video.duration / 60)}:${Math.floor(video.duration % 60).toString().padStart(2, '0')}`);
        toast.error("Video quá dài");
        URL.revokeObjectURL(url);
        setPreviewUrl(null);
        setSelectedFile(null);
        video.remove();
        return;
      }
      
      setDuration(video.duration);
      video.remove();
    };

    video.onerror = () => {
      setValidationError("Không thể đọc file video");
      toast.error("File video không hợp lệ");
      URL.revokeObjectURL(url);
      setPreviewUrl(null);
      setSelectedFile(null);
      video.remove();
    };

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveVideo = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setDuration(0);
    setValidationError(null);
    setIsPlaying(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || validationError) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1) Upload the actual video file to the API
      const result = await uploadService.uploadMedia(
        selectedFile,
        (progress) => {
          setUploadProgress(progress);
        },
        "shorts"
      );

      const uploadedUrl = result?.data?.url || result?.url;

      if (!uploadedUrl) {
        throw new Error("Không nhận được URL từ server");
      }

      setUploadProgress(100);

      // 2) Create a real Post record via the API
      const payload = {
        title: caption.trim().slice(0, 300) || "",
        content: caption.trim(),
        body: caption.trim(),
        thumbNail: uploadedUrl,
        thumbnail: uploadedUrl,
        videoUrl: uploadedUrl,
        mediaType: "video",
        images: [],
        imageUrls: [uploadedUrl],
        mediaUrls: [uploadedUrl],
        status: "PUBLISHED",
      };

      const created = await postService.create(payload);
      const createdPost = created?.data;

      toast.success("Đăng video thành công!");

      if (onUploadSuccess && createdPost) {
        onUploadSuccess(createdPost);
      }

      // Cleanup after successful upload
      handleRemoveVideo();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Lỗi khi tải lên video: " + (error.message || "Vui lòng thử lại"));
      setValidationError("Không thể tải lên video. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!selectedFile) {
    return (
      <div className="w-full flex flex-col gap-3 sm:gap-4">
        {/* Caption Textarea */}
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Thêm mô tả video ngắn (tùy chọn)..."
          rows={2}
          maxLength={300}
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 p-2.5 sm:p-3 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0866ff]/40 resize-none transition"
        />

        {/* Upload Box Dropzone */}
        <div className="relative w-full h-[250px] xs:h-[280px] sm:h-[360px] md:h-[400px] bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:border-[#0866ff] hover:bg-slate-100/80 dark:hover:bg-zinc-800/80 transition-all group overflow-hidden shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileSelect}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />

          <div className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 text-center z-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-200/80 dark:bg-zinc-700 flex items-center justify-center group-hover:bg-[#0866ff]/10 group-hover:scale-110 transition-all">
              <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 dark:text-zinc-500 group-hover:text-[#0866ff]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                Tải lên video ngắn
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-1">
                MP4, WebM, MOV • Tối đa 2 phút
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3 sm:gap-4 pb-[env(safe-area-inset-bottom,0px)]">
      {/* Caption Textarea */}
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Thêm mô tả video ngắn (tùy chọn)..."
        rows={2}
        maxLength={300}
        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 p-2.5 sm:p-3 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0866ff]/40 resize-none transition"
      />

      {/* Video Preview Card */}
      <div className="relative w-full h-[260px] xs:h-[300px] sm:h-[380px] md:h-[420px] bg-black rounded-2xl overflow-hidden shadow-lg shrink-0 flex items-center justify-center">
        {/* Video Preview */}
        <video
          ref={videoRef}
          src={previewUrl}
          className="w-full h-full object-contain"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

        {/* Top Actions */}
        <div className="absolute top-3 right-3 flex gap-2 pointer-events-auto z-20">
          <button
            type="button"
            onClick={handleRemoveVideo}
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition cursor-pointer"
            title="Xóa video"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlayPause}
          className="absolute inset-0 flex items-center justify-center pointer-events-auto group z-10"
        >
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center transition-all group-hover:scale-110 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
            {isPlaying ? (
              <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            ) : (
              <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5" />
            )}
          </div>
        </button>

        {/* Bottom Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 pointer-events-none z-20 flex flex-col gap-1.5">
          {validationError ? (
            <div className="flex items-center gap-1.5 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">{validationError}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-white text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{formatDuration(duration)}</span>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="w-full">
              <div className="flex items-center justify-between text-white text-[11px] mb-1 font-medium">
                <span>Đang tải lên server...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0866ff] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File Info */}
      <div className="px-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span className="truncate max-w-[70%]">{selectedFile.name}</span>
        <span className="shrink-0 font-medium">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</span>
      </div>

      {/* Footer Action Buttons */}
      <div className="flex gap-2 pt-1 min-h-[44px]">
        <button
          type="button"
          onClick={handleRemoveVideo}
          disabled={isUploading}
          className="flex-1 py-2.5 sm:py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Chọn video khác
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading || !!validationError}
          className="flex-1 py-2.5 sm:py-3 rounded-xl bg-[#0866ff] hover:bg-[#0756d6] text-white text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang tải...</span>
            </>
          ) : (
            <span>Đăng video</span>
          )}
        </button>
      </div>
    </div>
  );
}

