import { useMusic } from "../context/MusicContext";
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Disc3, Radio } from "lucide-react";

export default function MiniMusicPlayer() {
  const {
    playlist,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    currentTime,
    duration,
    isMuted,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    toggleMute,
  } = useMusic();

  const handleSeek = (e) => {
    seek(Number(e.target.value));
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* ======================================================================
          1. DESKTOP CARD VIEW (Visible on LG/XL in RightSidebar)
          ====================================================================== */}
      <div className="hidden lg:block w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
        {isPlaying && (
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        )}

        {/* Header Tag */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>Mini Music Player</span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {currentTrack.genre}
          </span>
        </div>

        {/* Track Info & Vinyl Animation */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md">
            <img
              src={currentTrack.cover}
              alt=""
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? "rotate-6 scale-105" : ""
              }`}
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <Disc3
                className={`w-6 h-6 text-white transition-transform ${
                  isPlaying ? "animate-spin" : ""
                }`}
                style={{ animationDuration: "3s" }}
              />
            </div>
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {currentTrack.title}
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              {currentTrack.artist}
            </span>
          </div>
        </div>

        {/* Progress Scrubber */}
        <div className="flex flex-col gap-1 mb-2">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
            title={isMuted ? "Bật âm thanh" : "Tắt tiếng"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevTrack}
              className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
              title="Bài trước"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
              title={isPlaying ? "Tạm dừng" : "Phát nhạc"}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={nextTrack}
              className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
              title="Bài tiếp theo"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-[10px] font-mono text-zinc-400">
            {currentTrackIndex + 1}/{playlist.length}
          </div>
        </div>
      </div>

      {/* ======================================================================
          2. MOBILE FLOATING MUSIC BAR (Fixed above Mobile Bottom Nav, lg:hidden)
          ====================================================================== */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-between shadow-md">
        {/* Top Progress Line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Left: Mini spinning art & title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow-xs">
            <img src={currentTrack.cover} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <Disc3
                className={`w-4 h-4 text-white ${isPlaying ? "animate-spin" : ""}`}
                style={{ animationDuration: "3s" }}
              />
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {currentTrack.title}
            </span>
            <span className="text-[10px] text-zinc-500 truncate">
              {currentTrack.artist} · <span className="font-mono">{formatTime(currentTime)}</span>
            </span>
          </div>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={togglePlay}
            className="w-7 h-7 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-xs active:scale-95 transition cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={nextTrack}
            className="p-1 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
