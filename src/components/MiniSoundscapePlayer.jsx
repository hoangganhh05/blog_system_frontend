import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Radio,
  MapPin,
  Clock,
  Sparkles,
  Repeat,
  Headphones,
} from "lucide-react";
import { useSoundscape } from "../context/SoundscapeContext";

export default function MiniSoundscapePlayer() {
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

  return (
    <div className="w-full bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xl backdrop-blur-xl p-3 flex flex-col gap-2.5 transition-all animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Top Header Label */}
      <div className="flex items-center justify-between px-0.5">
        <Link
          to="/soundscapes"
          className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>Trạm Âm Thanh Môi Trường</span>
        </Link>

        {sleepTimeRemaining > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/60">
            <Clock className="w-3 h-3" />
            <span>Tắt sau: {formatTimer(sleepTimeRemaining)}</span>
          </span>
        )}
      </div>

      {/* Main Track Display & Controls */}
      <div className="flex items-center justify-between gap-3">
        {/* Artwork Image & Sound Wave Graphic */}
        <Link
          to="/soundscapes"
          className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 group/cover border border-zinc-200 dark:border-zinc-700/60 shadow-xs"
        >
          <img
            src={currentSoundscape.imageUrl || "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=400"}
            alt={currentSoundscape.title}
            className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-300"
          />

          {/* Playing Equalizer Animation Indicator */}
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center gap-0.5">
              <span className="w-1 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-2.5 bg-white rounded-full animate-bounce" />
            </div>
          )}
        </Link>

        {/* Title, Location & Field Recorder Name */}
        <div className="flex flex-col min-w-0 flex-1">
          <Link
            to="/soundscapes"
            className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            {currentSoundscape.title}
          </Link>

          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
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
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Loop Button */}
          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isLooping
                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
            title={isLooping ? "Đang lặp lại vô tận" : "Tắt lặp lại"}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          {/* Volume Button & Slider Hover */}
          <div className="relative">
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

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNext}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="Chuyển không gian tiếp theo"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Play / Pause Main Button */}
          <button
            type="button"
            onClick={togglePlay}
            className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition active:scale-95 shadow-md cursor-pointer"
            title={isPlaying ? "Tạm dừng" : "Phát âm thanh"}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
