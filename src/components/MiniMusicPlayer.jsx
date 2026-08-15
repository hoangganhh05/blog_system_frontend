import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Disc3, Radio } from "lucide-react";

const PLAYLIST = [
  {
    id: 1,
    title: "Vinahouse Night Fever 2026",
    artist: "BlogViet DJ Team",
    genre: "Vinahouse / EDM",
    duration: "03:45",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80",
    src: "https://actions.google.com/sounds/v1/science_fiction/space_ambience.ogg", // Public audio stream
  },
  {
    id: 2,
    title: "Deep Coding & Focus Chill",
    artist: "Lofi Developer Beats",
    genre: "Lofi Chill",
    duration: "02:30",
    cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80",
    src: "https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg",
  },
  {
    id: 3,
    title: "Cyber Sunset Synthwave",
    artist: "Retro Wave Studio",
    genre: "Synthwave",
    duration: "04:12",
    cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80",
    src: "https://actions.google.com/sounds/v1/science_fiction/laser_room_hum.ogg",
  },
];

export default function MiniMusicPlayer() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef(null);
  const currentTrack = PLAYLIST[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const seekTime = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
      {/* Background Glow when playing */}
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
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.muted = !isMuted;
              setIsMuted(!isMuted);
            }
          }}
          className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
          title={isMuted ? "Bật âm thanh" : "Tắt tiếng"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
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
            onClick={handleNext}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
            title="Bài tiếp theo"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-[10px] font-mono text-zinc-400">
          {currentTrackIndex + 1}/{PLAYLIST.length}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={currentTrack.src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
      />
    </div>
  );
}
