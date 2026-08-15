import { useState, useMemo, useEffect } from "react";
import { useMusic, formatAudioTime, formatDurationTime } from "../context/MusicContext";
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
  X,
  Loader2,
  Trash2,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Headphones,
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("single"); // "single" | "bulk"
  const [singleSong, setSingleSong] = useState({
    title: "",
    artist: "",
    genre: "Vinahouse",
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
        toast.success(`Đã cập nhật ${count} giai điệu thịnh hành mới!`);
      } else {
        toast.info("Kho nhạc đã được đồng bộ những giai điệu mới nhất!");
      }
      await reloadPlaylist();
    } catch {
      toast.error("Không thể làm mới danh sách lúc này. Vui lòng thử lại!");
    } finally {
      setIsSyncing(false);
    }
  };

  // Extract all unique genres dynamically
  const genres = useMemo(() => {
    const set = new Set(playlist.map((s) => s.genre).filter(Boolean));
    return ["ALL", ...Array.from(set)];
  }, [playlist]);

  // Filter songs by search and genre
  const filteredSongs = useMemo(() => {
    return playlist.filter((song) => {
      if (!song) return false;
      const matchesGenre = selectedGenre === "ALL" || song.genre === selectedGenre;
      if (!matchesGenre) return false;

      if (!searchQuery.trim()) return true;
      const rawQ = searchQuery.toLowerCase().trim();
      const normQ = removeVietnameseTones(searchQuery);

      const titleNorm = removeVietnameseTones(song.title || "");
      const artistNorm = removeVietnameseTones(song.artist || "");

      return (
        (song.title || "").toLowerCase().includes(rawQ) ||
        (song.artist || "").toLowerCase().includes(rawQ) ||
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
      toast.error("Vui lòng nhập tên bài hát và đường dẫn âm thanh!");
      return;
    }

    setIsSubmitting(true);
    try {
      await songService.create(singleSong);
      toast.success(`Đã thêm bài hát "${singleSong.title}" thành công!`);
      setSingleSong({ title: "", artist: "", genre: "Vinahouse", cover: "", src: "" });
      setIsImportModalOpen(false);
      await reloadPlaylist();
    } catch {
      toast.error("Không thể thêm bài hát lúc này. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Bulk List Import
  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!bulkJsonText.trim()) {
      toast.error("Vui lòng dán danh sách bài hát!");
      return;
    }

    let parsedList = [];
    try {
      parsedList = JSON.parse(bulkJsonText.trim());
      if (!Array.isArray(parsedList) || parsedList.length === 0) {
        throw new Error("Danh sách không hợp lệ");
      }
    } catch {
      toast.error("Dữ liệu danh sách không đúng định dạng!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await songService.bulkImport(parsedList);
      const count = Array.isArray(res.data) ? res.data.length : parsedList.length;
      toast.success(`Đã thêm thành công ${count} bài hát mới!`);
      setBulkJsonText("");
      setIsImportModalOpen(false);
      await reloadPlaylist();
    } catch {
      toast.error("Không thể nhập danh sách lúc này!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete song
  const handleDeleteSong = async (song) => {
    if (!song?.id) {
      toast.error("Không thể xóa bài hát mặc định");
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn xóa bài hát "${song.title}"?`)) {
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

  // Sample Template
  const sampleJsonTemplate = `[
  {
    "title": "Vinahouse Club Night & Bass Boosted",
    "artist": "DJ Live Mix",
    "genre": "Vinahouse",
    "cover": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600",
    "src": "https://streams.ilovemusic.de/iloveradio2.mp3"
  },
  {
    "title": "Lo-Fi Study & Chill Beats",
    "artist": "BlogViet Station",
    "genre": "Lofi Chill",
    "cover": "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600",
    "src": "https://streams.ilovemusic.de/iloveradio10.mp3"
  }
]`;

  return (
    <div className="w-full max-w-full flex flex-col gap-4">
      {/* ======================================================================
          1. HERO FEATURED PLAYER (Sleek Glassmorphism Banner)
          ====================================================================== */}
      <div className="relative w-full shrink-0 rounded-3xl overflow-hidden p-5 sm:p-6 bg-gradient-to-br from-slate-950 via-[#111827] to-[#0b0f19] text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Left: Spinning Vinyl Cover + Info */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 z-10 text-center sm:text-left min-w-0 w-full md:w-auto">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 group">
            {currentTrack?.cover ? (
              <img
                src={currentTrack.cover}
                alt={currentTrack.title || ""}
                className={`w-full h-full rounded-2xl object-cover shadow-2xl border border-white/10 ${
                  isPlaying ? "animate-pulse" : ""
                }`}
              />
            ) : (
              <div className="w-full h-full rounded-2xl bg-slate-800 flex items-center justify-center border border-white/10">
                <Music2 className="w-10 h-10 text-slate-500" />
              </div>
            )}

            {/* Vinyl Overlay badge */}
            <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-black/70 backdrop-blur-md text-rose-400 border border-white/10">
              <Disc3 className={`w-4 h-4 ${isPlaying ? "animate-spin" : ""}`} />
            </div>
          </div>

          <div className="flex flex-col gap-1 min-w-0 max-w-full">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/10 backdrop-blur border border-white/15 text-indigo-300 w-fit mx-auto sm:mx-0">
              <Sparkles className="w-3 h-3 text-amber-400" />
              {currentTrack?.genre || "Phòng nhạc trực tuyến"}
            </span>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight line-clamp-1">
              {currentTrack?.title || "Chưa chọn bài hát"}
            </h1>
            <p className="text-xs text-slate-300 font-medium truncate">
              {currentTrack?.artist || "BlogViet Streaming"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed hidden sm:block">
              Thưởng thức các giai điệu Vinahouse sôi động, Lofi thư giãn và Top Hit thịnh hành mỗi ngày.
            </p>
          </div>
        </div>

        {/* Right: Modern Playback Controls */}
        <div className="flex flex-col items-center gap-3 z-10 w-full md:w-56 shrink-0">
          {/* Main Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prevTrack}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer"
              title="Bài trước"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer"
              title={isPlaying ? "Tạm dừng" : "Phát nhạc"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black translate-x-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={nextTrack}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer"
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
              <span>{formatAudioTime(currentTime)}</span>
              <span>{formatDurationTime(duration)}</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 w-full px-1">
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
          2. VIEW MODE TOGGLE & ACTION TOOLBAR (Clean, Pro Alignment)
          ====================================================================== */}
      <div className="flex flex-col gap-3.5 bg-white dark:bg-[#242526] p-3.5 sm:p-4 rounded-2xl border border-[#e4e6eb] dark:border-[#393a3b] shadow-xs">
        {/* Row 1: Segmented Mode Tabs & Right Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Segmented Mode Switcher */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-[#18191a] rounded-xl border border-slate-200/50 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode("player")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === "player"
                  ? "bg-white dark:bg-[#242526] text-[#0866ff] shadow-xs font-extrabold"
                  : "text-[#65676b] dark:text-[#b0b3b8] hover:text-[#050505] dark:hover:text-white"
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Phát nhạc &amp; Thư giãn</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("manage")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === "manage"
                  ? "bg-white dark:bg-[#242526] text-[#0866ff] shadow-xs font-extrabold"
                  : "text-[#65676b] dark:text-[#b0b3b8] hover:text-[#050505] dark:hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Danh sách ({playlist.length})</span>
            </button>
          </div>

          {/* Action Buttons Group */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSyncing}
              onClick={handleSyncTrending}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#18191a] hover:bg-slate-200/80 dark:hover:bg-[#303031] text-[#050505] dark:text-[#e4e6eb] border border-slate-200/60 dark:border-zinc-800 text-xs font-semibold active:scale-95 transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Làm mới danh sách bài hát thịnh hành"
            >
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0866ff]" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span>{isSyncing ? "Đang đồng bộ..." : "Cập nhật mới"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#0866ff] hover:bg-[#0756d6] text-white text-xs font-bold active:scale-95 transition shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              title="Thêm bài hát mới"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm nhạc</span>
            </button>
          </div>
        </div>

        {/* Row 2: Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm bài hát, ca sĩ, thể loại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100/70 dark:bg-[#18191a] border border-slate-200 dark:border-zinc-800 rounded-xl py-2 pl-10 pr-8 text-xs text-[#050505] dark:text-[#e4e6eb] placeholder-[#65676b] dark:placeholder-[#b0b3b8] focus:outline-none focus:border-[#0866ff] dark:focus:border-[#0866ff] focus:ring-2 focus:ring-[#0866ff]/15 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
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
                ? "bg-[#0866ff] text-white shadow-xs"
                : "bg-white dark:bg-[#242526] text-zinc-600 dark:text-zinc-300 border border-[#e4e6eb] dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#303031]"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {paginatedSongs.map((song, index) => {
            if (!song) return null;
            const isSelected = Boolean(
              currentTrack && (
                (song.id !== undefined && currentTrack.id !== undefined && String(song.id) === String(currentTrack.id)) ||
                (song.title && currentTrack.title && song.title === currentTrack.title && song.artist === currentTrack.artist)
              )
            );

            return (
              <div
                key={song.id || index}
                onClick={() => {
                  if (isSelected) {
                    togglePlay();
                  } else {
                    playTrack(song);
                  }
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 group relative overflow-hidden ${
                  isSelected
                    ? "bg-blue-50/70 dark:bg-[#0866ff]/15 border-[#0866ff]/50 dark:border-[#0866ff]/60 shadow-xs"
                    : "bg-white dark:bg-[#242526] border-[#e4e6eb] dark:border-[#393a3b] hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xs"
                }`}
              >
                {/* Cover */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                  {song.cover ? (
                    <img
                      src={song.cover}
                      alt={song.title || ""}
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
                        ? "text-[#0866ff] dark:text-[#3b82f6]"
                        : "text-zinc-900 dark:text-zinc-100 group-hover:text-[#0866ff]"
                    }`}
                  >
                    {song.title}
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {song.artist || "BlogViet Streaming"}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium mt-0.5">
                    {song.genre}
                  </span>
                </div>

                {/* Wave indicator */}
                {isSelected && isPlaying && (
                  <div className="flex items-center gap-0.5 pr-1 shrink-0">
                    <div className="w-1 h-3 bg-[#0866ff] rounded-full animate-bounce" />
                    <div className="w-1 h-4 bg-[#0866ff] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1 h-2 bg-[#0866ff] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================================
          4B. VIEW MODE: TRACK LIST MANAGEMENT TABLE
          ====================================================================== */}
      {viewMode === "manage" && (
        <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#e4e6eb] dark:border-[#393a3b] shadow-xs overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-100 dark:border-[#393a3b] flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Kho bài hát trực tuyến
              </h3>
              <p className="text-[11px] text-zinc-500">
                Tuyển tập những bản nhạc chất lượng cao được yêu thích nhất
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#303031] text-zinc-600 dark:text-zinc-300">
              Tổng: {filteredSongs.length} bài
            </span>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#303031] text-zinc-500 font-semibold border-b border-slate-100 dark:border-[#393a3b]">
                <tr>
                  <th className="p-3 pl-4">Bài hát &amp; Nghệ sĩ</th>
                  <th className="p-3">Thể loại</th>
                  <th className="p-3 hidden sm:table-cell">Nguồn phát</th>
                  <th className="p-3 pr-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#393a3b]/60">
                {paginatedSongs.map((song) => {
                  const isSelected = Boolean(
                    currentTrack && (
                      (song.id !== undefined && currentTrack.id !== undefined && String(song.id) === String(currentTrack.id)) ||
                      (song.title && currentTrack.title && song.title === currentTrack.title && song.artist === currentTrack.artist)
                    )
                  );

                  return (
                    <tr
                      key={song.id || song.src}
                      className={`hover:bg-slate-50 dark:hover:bg-[#303031]/50 transition group ${
                        isSelected ? "bg-blue-50/40 dark:bg-[#0866ff]/10" : ""
                      }`}
                    >
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                            {song.cover ? (
                              <img src={song.cover} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Music2 className="w-4 h-4 text-slate-400 m-auto" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className={`font-bold truncate ${isSelected ? "text-[#0866ff]" : "text-zinc-900 dark:text-zinc-100"}`}>
                              {song.title}
                            </span>
                            <span className="text-[11px] text-zinc-500 truncate">
                              {song.artist || "Nhiều nghệ sĩ"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#0866ff] dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
                          {song.genre}
                        </span>
                      </td>

                      <td className="p-3 hidden sm:table-cell max-w-[160px]">
                        <a
                          href={song.src || song.audioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-mono text-zinc-500 hover:text-[#0866ff] truncate flex items-center gap-1"
                          title={song.src || song.audioUrl}
                        >
                          <span className="truncate">{song.src || song.audioUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>

                      <td className="p-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                togglePlay();
                              } else {
                                playTrack(song);
                              }
                            }}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isSelected && isPlaying
                                ? "bg-[#0866ff] text-white shadow-2xs"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-zinc-700 dark:text-zinc-300"
                            }`}
                            title={isSelected && isPlaying ? "Tạm dừng" : "Phát bài này"}
                          >
                            {isSelected && isPlaying ? (
                              <Pause className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            )}
                          </button>

                          {song.id && (
                            <button
                              type="button"
                              disabled={deletingId === song.id}
                              onClick={() => handleDeleteSong(song)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition cursor-pointer disabled:opacity-40"
                              title="Xóa bài hát"
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================================
          5. PAGINATION CONTROLS
          ====================================================================== */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-[#242526] px-3.5 py-2.5 rounded-2xl border border-[#e4e6eb] dark:border-[#393a3b] shadow-xs mt-1">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            {currentPage * pageSize + 1} -{" "}
            {Math.min((currentPage + 1) * pageSize, filteredSongs.length)} /{" "}
            <strong className="text-zinc-900 dark:text-zinc-100">{filteredSongs.length}</strong> bài
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              className="p-1.5 rounded-xl border border-[#e4e6eb] dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#303031] disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2.5 py-0.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-slate-100 dark:bg-[#303031] rounded-lg">
              {currentPage + 1}/{totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              className="p-1.5 rounded-xl border border-[#e4e6eb] dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#303031] disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================================
          6. MODAL THÊM BÀI HÁT
          ====================================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#393a3b] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0866ff] flex items-center justify-center">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Thêm bài hát mới
                  </h3>
                  <span className="text-[11px] text-zinc-500">
                    Dán liên kết âm thanh để phát nhạc trực tiếp
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#303031] transition text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex bg-slate-100 dark:bg-[#303031] p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setModalTab("single")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === "single"
                    ? "bg-white dark:bg-[#18191a] text-[#0866ff] shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm 1 bài</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab("bulk")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === "bulk"
                    ? "bg-white dark:bg-[#18191a] text-[#0866ff] shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Thêm danh sách</span>
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
                    placeholder="Ví dụ: Cắt Đôi Nỗi Sầu (Vinahouse Remix)..."
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#303031] border border-[#e4e6eb] dark:border-[#393a3b] text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#0866ff]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Nghệ sĩ
                    </label>
                    <input
                      type="text"
                      value={singleSong.artist}
                      onChange={(e) => setSingleSong({ ...singleSong, artist: e.target.value })}
                      placeholder="Tăng Duy Tân..."
                      className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#303031] border border-[#e4e6eb] dark:border-[#393a3b] text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#0866ff]"
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
                      placeholder="Vinahouse, Lofi Chill, V-Pop..."
                      className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#303031] border border-[#e4e6eb] dark:border-[#393a3b] text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#0866ff]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Đường dẫn âm thanh trực tuyến *
                  </label>
                  <input
                    type="url"
                    value={singleSong.src}
                    onChange={(e) => setSingleSong({ ...singleSong, src: e.target.value })}
                    placeholder="https://... (link mp3/stream audio)"
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#303031] border border-[#e4e6eb] dark:border-[#393a3b] text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#0866ff]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Ảnh bìa (Tùy chọn)
                  </label>
                  <input
                    type="url"
                    value={singleSong.cover}
                    onChange={(e) => setSingleSong({ ...singleSong, cover: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#303031] border border-[#e4e6eb] dark:border-[#393a3b] text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#0866ff]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#e4e6eb] dark:border-[#393a3b] text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#303031] transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#0866ff] hover:bg-[#0756d6] text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Lưu bài hát"}
                  </button>
                </div>
              </form>
            )}

            {/* Form 2: Bulk List Import */}
            {modalTab === "bulk" && (
              <form onSubmit={handleBulkImport} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Dán danh sách bài hát
                  </label>
                  <button
                    type="button"
                    onClick={() => setBulkJsonText(sampleJsonTemplate)}
                    className="text-[11px] text-[#0866ff] hover:underline font-semibold cursor-pointer"
                  >
                    Dán mẫu thử
                  </button>
                </div>

                <textarea
                  rows={8}
                  value={bulkJsonText}
                  onChange={(e) => setBulkJsonText(e.target.value)}
                  placeholder="[ { title: '...', artist: '...', genre: '...', src: '...' }, ... ]"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#303031] border border-[#e4e6eb] dark:border-[#393a3b] text-xs font-mono text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#0866ff] resize-none"
                />

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#e4e6eb] dark:border-[#393a3b] text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#303031] transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#0866ff] hover:bg-[#0756d6] text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Lưu danh sách"
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
