import { useState, useMemo, useEffect } from "react";
import { useMusic } from "../context/MusicContext";
import songService from "../services/songService";
import { toast } from "sonner";
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
  Plus,
  UploadCloud,
  X,
  Loader2,
  Trash2,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
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
    reloadPlaylist,
  } = useMusic();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("ALL");
  const [viewMode, setViewMode] = useState("player"); // "player" | "manage"

  // Pagination state (for handling 1,000+ songs smoothly)
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 12;

  // Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("single"); // "single" | "bulk"
  const [singleSong, setSingleSong] = useState({
    title: "",
    artist: "",
    genre: "V-Pop",
    cover: "",
    src: "",
  });
  const [bulkJsonText, setBulkJsonText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Auto-sync trending charts from Backend
  const handleSyncTrending = async () => {
    setIsSyncing(true);
    try {
      const res = await songService.syncTrending();
      const count = res.data?.newAddedCount || 0;
      if (count > 0) {
        toast.success(`Đã tự động nạp ${count} bài hát Hot Trend mới vào Database!`);
      } else {
        toast.info("Kho nhạc đã được đồng bộ các bài hát Hot Trend mới nhất!");
      }
      await reloadPlaylist();
    } catch {
      toast.error("Không thể đồng bộ nhạc lúc này. Vui lòng thử lại sau!");
    } finally {
      setIsSyncing(false);
    }
  };

  // Extract all unique genres dynamically from Database playlist
  const genres = useMemo(() => {
    const set = new Set(playlist.map((s) => s.genre).filter(Boolean));
    return ["ALL", ...Array.from(set)];
  }, [playlist]);

  // Filter songs by search and genre
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

  // Paginated chunk
  const totalPages = Math.ceil(filteredSongs.length / pageSize) || 1;
  const paginatedSongs = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredSongs.slice(start, start + pageSize);
  }, [filteredSongs, currentPage, pageSize]);

  // Reset to page 0 when filtering
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, selectedGenre]);

  const handleSeek = (e) => {
    seek(Number(e.target.value));
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Submit Single Song
  const handleAddSingleSong = async (e) => {
    e.preventDefault();
    if (!singleSong.title.trim() || !singleSong.src.trim()) {
      toast.error("Vui lòng nhập tên bài hát và URL nguồn nhạc trực tuyến!");
      return;
    }

    setIsSubmitting(true);
    try {
      await songService.create(singleSong);
      toast.success(`Đã thêm bài hát "${singleSong.title}" vào Database!`);
      setSingleSong({ title: "", artist: "", genre: "V-Pop", cover: "", src: "" });
      setIsImportModalOpen(false);
      await reloadPlaylist();
    } catch {
      toast.error("Không thể thêm bài hát lúc này. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Bulk JSON Import (100 - 1,000 songs)
  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!bulkJsonText.trim()) {
      toast.error("Vui lòng dán danh sách JSON bài hát!");
      return;
    }

    let parsedList = [];
    try {
      parsedList = JSON.parse(bulkJsonText.trim());
      if (!Array.isArray(parsedList) || parsedList.length === 0) {
        throw new Error("Danh sách không hợp lệ");
      }
    } catch {
      toast.error("Dữ liệu JSON không đúng định dạng mảng bài hát!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await songService.bulkImport(parsedList);
      const count = Array.isArray(res.data) ? res.data.length : parsedList.length;
      toast.success(`Đã nhập thành công ${count} bài hát vào Database!`);
      setBulkJsonText("");
      setIsImportModalOpen(false);
      await reloadPlaylist();
    } catch {
      toast.error("Không thể nhập danh sách bài hát lúc này!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete song from Database
  const handleDeleteSong = async (song) => {
    if (!song.id) {
      toast.error("Không thể xóa bài hát mặc định hệ thống");
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn xóa bài hát "${song.title}" khỏi Database?`)) {
      return;
    }

    setDeletingId(song.id);
    try {
      await songService.remove(song.id);
      toast.success(`Đã xóa bài hát "${song.title}" thành công!`);
      await reloadPlaylist();
    } catch {
      toast.error("Lỗi khi xóa bài hát!");
    } finally {
      setDeletingId(null);
    }
  };

  // Sample JSON Template
  const sampleJsonTemplate = `[
  {
    "title": "Nơi Này Có Anh",
    "artist": "Sơn Tùng M-TP",
    "genre": "V-Pop",
    "cover": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600",
    "src": "https://streams.ilovemusic.de/iloveradio1.mp3"
  },
  {
    "title": "See Tình (Remix)",
    "artist": "Hoàng Thùy Linh",
    "genre": "Remix",
    "cover": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600",
    "src": "https://streams.ilovemusic.de/iloveradio2.mp3"
  }
]`;

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
              Nguồn nhạc trực tuyến lưu trữ trong Database, hỗ trợ mở rộng hàng ngàn bài hát nhẹ mượt.
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
          2. VIEW MODE TOGGLE & ACTION TOOLBAR
          ====================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs">
        {/* Left: View Mode Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewMode("player")}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === "player"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Phát nhạc &amp; Thư giãn</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("manage")}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === "manage"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Quản lý kho nhạc ({playlist.length})</span>
          </button>
        </div>

        {/* Right Actions: Search & Add/Import Modal */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm bài hát, ca sĩ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl py-1.5 pl-8 pr-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition"
            />
          </div>

          <button
            type="button"
            disabled={isSyncing}
            onClick={handleSyncTrending}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 active:scale-95 transition shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
            title="Tự động đồng bộ các bài hát Hot Trend từ hệ thống"
          >
            {isSyncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {isSyncing ? "Đang đồng bộ..." : "Tự động cập nhật Hot Trend"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 active:scale-95 transition shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Thêm nhạc vào Database"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thêm bài hát</span>
          </button>
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
          4A. VIEW MODE: GRID PLAYER CARDS
          ====================================================================== */}
      {viewMode === "player" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {paginatedSongs.map((song, index) => {
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
      )}

      {/* ======================================================================
          4B. VIEW MODE: STUDIO / DATABASE MANAGEMENT TABLE
          ====================================================================== */}
      {viewMode === "manage" && (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Bảng quản trị bài hát trong Database
              </h3>
              <p className="text-[11px] text-zinc-500">
                Lưu trữ vĩnh viễn trên Cloud Database, hỗ trợ URL nhạc trực tuyến không giới hạn
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-zinc-600 dark:text-zinc-300">
              Tổng: {filteredSongs.length} bài
            </span>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-zinc-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3 pl-4">Bài hát &amp; Nghệ sĩ</th>
                  <th className="p-3">Thể loại</th>
                  <th className="p-3 hidden md:table-cell">URL Nguồn nhạc trực tuyến</th>
                  <th className="p-3 pr-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {paginatedSongs.map((song) => (
                  <tr
                    key={song.id || song.src}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition group"
                  >
                    <td className="p-3 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                          {song.cover ? (
                            <img src={song.cover} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Music2 className="w-4 h-4 text-slate-400 m-auto" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {song.title}
                          </span>
                          <span className="text-[11px] text-zinc-500 truncate">
                            {song.artist || "Nhiều nghệ sĩ"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                        {song.genre}
                      </span>
                    </td>

                    <td className="p-3 hidden md:table-cell max-w-xs">
                      <a
                        href={song.src}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono text-zinc-500 hover:text-indigo-500 truncate flex items-center gap-1"
                        title={song.src}
                      >
                        <span className="truncate">{song.src}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>

                    <td className="p-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => playTrack(song)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                          title="Phát thử bài này"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>

                        {song.id && (
                          <button
                            type="button"
                            disabled={deletingId === song.id}
                            onClick={() => handleDeleteSong(song)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition cursor-pointer disabled:opacity-40"
                            title="Xóa bài hát khỏi Database"
                          >
                            {deletingId === song.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================================
          5. PAGINATION CONTROLS (Hỗ trợ 1.000+ bài hát mượt mà)
          ====================================================================== */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-[#111827] px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs mt-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Hiển thị {currentPage * pageSize + 1} -{" "}
            {Math.min((currentPage + 1) * pageSize, filteredSongs.length)} trong tổng số{" "}
            <strong className="text-zinc-900 dark:text-zinc-100">{filteredSongs.length}</strong> bài
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {currentPage + 1} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================================
          6. MODAL THÊM BÀI HÁT / NHẬP HÀNG LOẠT (BULK IMPORT 100 - 1000 BÀI)
          ====================================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Thêm &amp; Nhập kho nhạc vào Database
                  </h3>
                  <span className="text-[11px] text-zinc-500">
                    Lưu trữ URL nhạc trực tuyến, không tốn dung lượng máy chủ
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setModalTab("single")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === "single"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm 1 bài hát</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab("bulk")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === "bulk"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Nhập hàng loạt (JSON)</span>
              </button>
            </div>

            {/* Form 1: Single Song */}
            {modalTab === "single" && (
              <form onSubmit={handleAddSingleSong} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Tên bài hát *
                  </label>
                  <input
                    type="text"
                    value={singleSong.title}
                    onChange={(e) => setSingleSong({ ...singleSong, title: e.target.value })}
                    placeholder="Ví dụ: Nơi Này Có Anh..."
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Nghệ sĩ / Ca sĩ
                    </label>
                    <input
                      type="text"
                      value={singleSong.artist}
                      onChange={(e) => setSingleSong({ ...singleSong, artist: e.target.value })}
                      placeholder="Sơn Tùng M-TP..."
                      className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Thể loại
                    </label>
                    <input
                      type="text"
                      value={singleSong.genre}
                      onChange={(e) => setSingleSong({ ...singleSong, genre: e.target.value })}
                      placeholder="V-Pop, Ballad, Remix..."
                      className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    URL nguồn nhạc trực tuyến (Audio/Stream URL) *
                  </label>
                  <input
                    type="url"
                    value={singleSong.src}
                    onChange={(e) => setSingleSong({ ...singleSong, src: e.target.value })}
                    placeholder="https://... hoặc link stream mp3"
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Link ảnh bìa (Cover URL)
                  </label>
                  <input
                    type="url"
                    value={singleSong.cover}
                    onChange={(e) => setSingleSong({ ...singleSong, cover: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Lưu vào Database"}
                  </button>
                </div>
              </form>
            )}

            {/* Form 2: Bulk Import JSON */}
            {modalTab === "bulk" && (
              <form onSubmit={handleBulkImport} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Dán mảng JSON chứa danh sách bài hát (100 - 1.000 bài)
                  </label>
                  <button
                    type="button"
                    onClick={() => setBulkJsonText(sampleJsonTemplate)}
                    className="text-[11px] text-indigo-500 hover:underline font-semibold cursor-pointer"
                  >
                    Dán mẫu thử
                  </button>
                </div>

                <textarea
                  rows={8}
                  value={bulkJsonText}
                  onChange={(e) => setBulkJsonText(e.target.value)}
                  placeholder="Dán JSON [ { title: '...', artist: '...', genre: '...', src: '...' }, ... ]"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-black dark:focus:ring-white resize-none"
                />

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Nhập hàng loạt vào Database"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
