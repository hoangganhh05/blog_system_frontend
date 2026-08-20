import { useState, useRef, useEffect } from "react";
import { Upload, X, Play, Pause, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const MAX_DURATION = 120; // 2 minutes in seconds
const MAX_SIZE = 30 * 1024 * 1024; // 30MB
const ACCEPTED_FORMATS = ["video/mp4", "video/webm", "video/quicktime"];

export default function ShortVideoUpload({ onUploadSuccess, onCancel }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState(null);
  
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

    // Validate size
    if (file.size > MAX_SIZE) {
      setValidationError(`Dung lượng tối đa là 30MB. File hiện tại: ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
      toast.error("Dung lượng file quá lớn");
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
      // Simulate upload progress (replace with actual Cloudflare R2 upload)
      const uploadInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(uploadInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      clearInterval(uploadInterval);
      setUploadProgress(100);

      toast.success("Đăng video thành công!");
      
      if (onUploadSuccess) {
        onUploadSuccess(selectedFile);
      }

      // Cleanup after successful upload
      handleRemoveVideo();

    } catch (error) {
      toast.error("Lỗi khi tải lên video");
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
      <div className="w-full max-w-sm mx-auto">
        <div className="relative aspect-[9/16] bg-slate-100 dark:bg-zinc-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:border-[#0866ff] hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-all group">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileSelect}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center group-hover:bg-[#0866ff]/10 group-hover:scale-110 transition-all">
              <Upload className="w-8 h-8 text-slate-400 dark:text-zinc-500 group-hover:text-[#0866ff]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Tải lên video ngắn
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                MP4, WebM, MOV • Tối đa 2 phút • 30MB
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="relative aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-lg">
        {/* Video Preview */}
        <video
          ref={videoRef}
          src={previewUrl}
          className="w-full h-full object-cover"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Overlay Controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Top Actions */}
        <div className="absolute top-3 right-3 flex gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={handleRemoveVideo}
            className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition cursor-pointer"
            title="Xóa video"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlayPause}
          className="absolute inset-0 flex items-center justify-center pointer-events-auto group"
        >
          <div className={`w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all group-hover:scale-110 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-1" />
            )}
          </div>
        </button>

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
          {validationError ? (
            <div className="flex items-center gap-2 text-red-400 text-xs mb-2">
              <AlertCircle className="w-4 h-4" />
              <span>{validationError}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-white text-xs mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{formatDuration(duration)}</span>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-white text-xs mb-1">
                <span>Đang tải lên...</span>
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

          {/* Action Buttons */}
          <div className="flex gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={handleRemoveVideo}
              disabled={isUploading}
              className="flex-1 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm text-white text-xs font-semibold hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Chọn video khác
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || !!validationError}
              className="flex-1 py-2.5 rounded-xl bg-[#0866ff] text-white text-xs font-semibold hover:bg-[#0756d6] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tải...
                </>
              ) : (
                "Đăng video"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* File Info */}
      <div className="mt-3 px-2">
        <p className="text-xs text-slate-600 dark:text-zinc-400 truncate">
          {selectedFile.name}
        </p>
        <p className="text-[10px] text-slate-500 dark:text-zinc-500">
          {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
        </p>
      </div>
    </div>
  );
}
