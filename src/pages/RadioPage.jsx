import { useState, useMemo } from "react";
import { useMusic } from "../context/MusicContext";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Disc3,
  Radio,
  Search,
  Music2,
  Sparkles,
  Heart,
  Clock,
} from "lucide-react";

// Helper remove Vietnamese tones
function removeVietnameseTones(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export default function RadioPage() {
  const {
    playlist,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    changeVolume,
    toggleMute,
    playTrack,
  } = useMusic();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("ALL");
  const [sleepTimer, setSleepTimer] = useState(null);
  const [timerLeft, setTimerLeft] = useState(0);

  // Extract all unique genres dynamically from Database playlist
  const genres = useMemo(() => {
    const set = new Set(playlist.map((s) => s.genre).filter(Boolean));
    return ["ALL", ...Array.from(set)];
  }, [playlist]);

  // Filter songs
  const filteredSongs = useMemo(() => {
    return playlist.filter((song) => {
      const matchesGenre = selectedGenre === "ALL" || song.genre === selectedGenre;
      if (!matchesGenre) return false;

      if (!searchQuery.trim()) return true;
      const rawQ = searchQuery.toLowerCase().trim();
      const normQ = removeVietnameseTones(searchQuery);

      const titleNorm = removeVietnameseTones(song.title);
      const artistNorm = removeVietnameseTones(song.artist);

      return (
        song.title?.toLowerCase().includes(rawQ) ||
        song.artist?.toLowerCase().includes(rawQ) ||
        titleNorm.includes(normQ) ||
        artistNorm.includes(normQ)
      );
    });
  }, [playlist, selectedGenre, searchQuery]);

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
    <div className="w-full min-h-screen py-6 px-3 sm:px-6 max-w-5xl mx-auto flex flex-col gap-6">
      {/* ======================================================================
          1. HERO FEATURED PLAYER (Deep Glassmorphism Banner)
          ====================================================================== */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-[#0b0f19] text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Left: Spinning Vinyl Cover + Info */}
        <div className="flex flex-col sm:flex-row items-center gap-6 z-10 text-center sm:text-left">
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 group">
            {currentTrack.cover ? (
              <img
                src={currentTrack.cover}
                alt={currentTrack.title}
                className={`w-full h-full rounded-2xl object-cover shadow-2xl border border-white/10 ${
                  isPlaying ? "animate-pulse" : ""
                }`}
              />
            ) : (
              <div className="w-full h-full rounded-2xl bg-slate-800 flex items-center justify-center border border-white/10">
                <Music2 className="w-12 h-12 text-slate-500" />
              </div>
            )}

            {/* Vinyl Overlay effect */}
            <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-rose-400 border border-white/10">
              <Disc3 className={`w-5 h-5 ${isPlaying ? "animate-spin" : ""}`} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/10 backdrop-blur border border-white/15 text-indigo-300 w-fit mx-auto sm:mx-0">
              <Sparkles className="w-3 h-3 text-amber-400" />
              {currentTrack.genre || "Radio Trực Tuyến"}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight line-clamp-1">
              {currentTrack.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              {currentTrack.artist || "BlogViet Streaming"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm leading-relaxed hidden sm:block">
              Nguồn nhạc trực tuyến bản quyền chất lượng cao kết nối từ cơ sở dữ liệu BlogViet.
            </p>
          </div>
        </div>

        {/* Right: Modern Playback Controls */}
        <div className="flex flex-col items-center gap-4 z-10 w-full sm:w-auto min-w-[240px]">
          {/* Main Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prevTrack}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer"
              title="Bài trước"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer"
              title={isPlaying ? "Tạm dừng" : "Phát nhạc"}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-black" />
              ) : (
                <Play className="w-6 h-6 fill-black translate-x-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={nextTrack}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer"
              title="Bài tiếp theo"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Scrubber */}
          <div className="w-full flex flex-col gap-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{duration > 0 ? formatTime(duration) : "LIVE"}</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 w-full px-2">
            <button
              type="button"
              onClick={toggleMute}
              className="text-slate-300 hover:text-white transition cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
            />
          </div>
        </div>
      </div>

      {/* ======================================================================
          2. PLAYLIST HEADER & SEARCH BAR
          ====================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Kho nhạc &amp; Radio Trực Tuyến
            </h2>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {filteredSongs.length} bài hát lấy trực tiếp từ Database
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tên bài, ca sĩ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl py-1.5 pl-8 pr-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition"
          />
        </div>
      </div>

      {/* ======================================================================
          3. GENRE PILLS FILTER
          ====================================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {genres.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setSelectedGenre(g)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedGenre === g
                ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                : "bg-white dark:bg-[#111827] text-zinc-600 dark:text-zinc-300 border border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {g === "ALL" ? "Tất cả thể loại" : g}
          </button>
        ))}
      </div>

      {/* ======================================================================
          4. GRID DANH SÁCH BÀI HÁT TRỰC TUYẾN
          ====================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filteredSongs.map((song, index) => {
          const isSelected = currentTrack.src === song.src;
          return (
            <div
              key={song.id || index}
              onClick={() => playTrack(song)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 group relative overflow-hidden ${
                isSelected
                  ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800/80 shadow-sm"
                  : "bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
              }`}
            >
              {/* Cover */}
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                {song.cover ? (
                  <img
                    src={song.cover}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Music2 className="w-5 h-5 text-slate-400" />
                  </div>
                )}

                {/* Play icon overlay */}
                <div
                  className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center transition-opacity ${
                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {isSelected && isPlaying ? (
                    <Pause className="w-4 h-4 text-white fill-white" />
                  ) : (
                    <Play className="w-4 h-4 text-white fill-white translate-x-0.5" />
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-col min-w-0 flex-1">
                <span
                  className={`text-xs font-bold truncate transition ${
                    isSelected
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-zinc-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white"
                  }`}
                >
                  {song.title}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {song.artist}
                </span>
                <span className="text-[10px] text-zinc-400 font-medium mt-0.5">
                  {song.genre}
                </span>
              </div>

              {/* Status wave indicator */}
              {isSelected && isPlaying && (
                <div className="flex items-center gap-0.5 pr-2">
                  <div className="w-1 h-3 bg-indigo-500 rounded-full animate-bounce" />
                  <div className="w-1 h-4 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
