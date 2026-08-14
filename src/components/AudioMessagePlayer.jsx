import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, Loader2 } from "lucide-react";

export default function AudioMessagePlayer({ src, isMe = false }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Clean audio URL
  const audioUrl = typeof src === "string" ? src.replace("🎙️ ", "").trim() : src;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [audioUrl]);

  const togglePlay = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error("Audio playback error:", err);
      });
    }
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatSeconds = (sec) => {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`flex items-center gap-3 p-2.5 rounded-2xl min-w-[210px] max-w-[260px] select-none ${
        isMe
          ? "bg-black text-white dark:bg-white dark:text-black"
          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/60"
      }`}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        disabled={isLoading && !duration}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs ${
          isMe
            ? "bg-white/20 hover:bg-white/30 text-white dark:bg-black/15 dark:hover:bg-black/25 dark:text-black"
            : "bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100"
        }`}
      >
        {isLoading && !duration ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-3.5 h-3.5 fill-current" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform / Scrubber Progress */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="relative flex items-center h-4 group">
          {/* Visual sound bars */}
          <div className="flex items-center gap-0.5 w-full h-full justify-between opacity-80 pointer-events-none">
            {[40, 70, 90, 60, 100, 50, 80, 60, 90, 45, 75, 55, 85, 65, 40].map((h, i) => {
              const active = (i / 15) * 100 <= progressPercent;
              return (
                <span
                  key={i}
                  className={`w-0.5 rounded-full transition-all ${
                    active
                      ? isMe
                        ? "bg-white dark:bg-black"
                        : "bg-black dark:bg-white"
                      : isMe
                      ? "bg-white/40 dark:bg-black/40"
                      : "bg-zinc-300 dark:bg-zinc-600"
                  } ${isPlaying && active ? "animate-pulse" : ""}`}
                  style={{ height: `${h}%` }}
                />
              );
            })}
          </div>

          {/* Invisible interactive range input */}
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Timers */}
        <div className="flex items-center justify-between text-[10px] opacity-70 font-mono">
          <span>{formatSeconds(currentTime)}</span>
          <span className="flex items-center gap-1">
            <Volume2 className="w-2.5 h-2.5" />
            <span>{formatSeconds(duration)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
