import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  MapPin,
  Clock,
  Repeat,
  Headphones,
  SlidersHorizontal,
  X,
  Minus,
  ExternalLink,
} from "lucide-react";
import { useSoundscape } from "../context/SoundscapeContext";

export default function MiniSoundscapePlayer({ isMobileFloating = false }) {
  const {
    currentSoundscape,
    isPlaying,
    togglePlay,
    handleNext,
    volume,
    setVolume,
    isLooping,
    setIsLooping,
    sleepTimer,
    setTimer,
    sleepTimeRemaining,
    isMiniPlayerVisible,
  } = useSoundscape();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const location = useLocation();

  // Ẩn khi đang ở trang Soundscapes chính để tránh trùng 2 player
  if (location.pathname === "/soundscapes" || !isMiniPlayerVisible || !currentSoundscape) {
    return null;
  }

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // --- Dạng thu gọn: Chỉ hiện bong bóng nhỏ ở góc màn hình ---
  if (isMinimized) {
    return (
      <button
        type="button"
        onClick={() => setIsMinimized(false)}
        title="Mở lại player âm thanh"
        className={`fixed z-50 flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl border-2 border-white/30 transition-all active:scale-95 cursor-pointer ${
          isMobileFloating
            ? "bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+12px)] right-4"
            : "bottom-4 right-4 sm:bottom-6 sm:right-6"
        }`}
      >
        {/* Equalizer animation khi đang phát */}
        {isPlaying ? (
          <span className="flex items-end gap-[2px] h-4">
            <span className="w-[3px] bg-white rounded-full animate-bounce [animation-delay:-0.3s]" style={{ height: "60%" }} />
            <span className="w-[3px] bg-white rounded-full animate-bounce [animation-delay:-0.15s]" style={{ height: "100%" }} />
            <span className="w-[3px] bg-white rounded-full animate-bounce" style={{ height: "45%" }} />
          </span>
        ) : (
          <Headphones className="w-5 h-5" />
        )}
      </button>
    );
  }

  return (
    <>
      <div
        className={`w-full max-w-[calc(100%-1.5rem)] sm:max-w-md mx-auto backdrop-blur-md bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 ${
          isMobileFloating ? "p-2 gap-1.5" : "p-2.5 sm:p-3 gap-2"
        } flex flex-col`}
      >
        {/* Top Header Label */}
        <div className="flex items-center justify-between px-0.5">
          <Link
            to="/soundscapes"
            className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <Headphones className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="truncate">Trạm Âm Thanh Môi Trường</span>
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            {sleepTimeRemaining > 0 && (
              <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50/90 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-full border border-amber-200/60">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>{formatTimer(sleepTimeRemaining)}</span>
              </span>
            )}
            {/* Nút thu nhỏ / ẩn player */}
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              title="Thu nhỏ player"
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              aria-label="Thu nhỏ"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Track Display & Controls */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Artwork Image & Sound Wave Graphic */}
          <Link
            to="/soundscapes"
            className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden shrink-0 group/cover border border-zinc-200 dark:border-zinc-700/60 shadow-xs"
          >
            <img
              src={currentSoundscape.imageUrl || "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=400"}
              alt={currentSoundscape.title}
              className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-300"
            />

            {/* Playing Equalizer Animation Indicator */}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center gap-0.5">
                <span className="w-0.5 sm:w-1 h-2.5 sm:h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-0.5 sm:w-1 h-4 sm:h-5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-0.5 sm:w-1 h-2 sm:h-2.5 bg-white rounded-full animate-bounce" />
              </div>
            )}
          </Link>

          {/* Title, Location & Field Recorder Name */}
          <div className="flex flex-col min-w-0 flex-1">
            <Link
              to="/soundscapes"
              className="text-[11px] sm:text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {currentSoundscape.title}
            </Link>

            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              {currentSoundscape.location && (
                <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium truncate">
                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{currentSoundscape.location}</span>
                </span>
              )}
              {currentSoundscape.location && <span>•</span>}
              <span className="truncate">{currentSoundscape.creatorName || "Thực địa"}</span>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Desktop Loop Button */}
            <button
              type="button"
              onClick={() => setIsLooping(!isLooping)}
              className={`hidden sm:flex p-1.5 rounded-lg transition cursor-pointer ${
                isLooping
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                  : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
              title={isLooping ? "Đang lặp lại vô tận" : "Tắt lặp lại"}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>

            {/* Desktop Volume Button & Hover Slider */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
                onMouseEnter={() => setShowVolumeSlider(true)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
                title="Âm lượng"
              >
                {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {showVolumeSlider && (
                <div
                  onMouseLeave={() => setShowVolumeSlider(false)}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl flex items-center z-50 animate-in fade-in zoom-in-95"
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-20 accent-indigo-600 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Mobile Settings / More Options Button */}
            <button
              type="button"
              onClick={() => setShowMobileSettings(true)}
              className="sm:hidden p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Tùy chọn nâng cao"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              className="p-1 sm:p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Chuyển không gian tiếp theo"
            >
              <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Play / Pause Main Button */}
            <button
              type="button"
              onClick={togglePlay}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition active:scale-95 shadow-md cursor-pointer"
              title={isPlaying ? "Tạm dừng" : "Phát âm thanh"}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
              ) : (
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Settings BottomSheet / Modal */}
      {showMobileSettings && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in"
          onClick={() => setShowMobileSettings(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Cài đặt Âm thanh
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileSettings(false)}
                className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between font-semibold text-zinc-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Âm lượng</span>
                </span>
                <span className="text-zinc-400">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full cursor-pointer"
              />
            </div>

            {/* Sleep Timer */}
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between font-semibold text-zinc-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Hẹn giờ tắt (Sleep Timer)</span>
                </span>
                {sleepTimeRemaining > 0 && (
                  <span className="text-amber-500 font-bold">{formatTimer(sleepTimeRemaining)}</span>
                )}
              </div>
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {[0, 15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setTimer(mins)}
                    className={`py-1.5 rounded-xl text-[11px] font-bold border transition ${
                      sleepTimer === mins
                        ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                        : "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    {mins === 0 ? "Tắt" : `${mins}m`}
                  </button>
                ))}
              </div>
            </div>

            {/* Loop Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                <Repeat className="w-3.5 h-3.5 text-indigo-500" />
                <span>Lặp lại vô tận</span>
              </span>
              <button
                type="button"
                onClick={() => setIsLooping(!isLooping)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition ${
                  isLooping
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {isLooping ? "Bật" : "Tắt"}
              </button>
            </div>

            {/* Direct Link to /soundscapes */}
            <Link
              to="/soundscapes"
              onClick={() => setShowMobileSettings(false)}
              className="mt-1 w-full py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <span>Xem toàn bộ không gian âm thanh</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
