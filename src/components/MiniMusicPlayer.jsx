import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useMusic, formatAudioTime, formatDurationTime } from "../context/MusicContext";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Disc3,
  Radio,
  ExternalLink,
  Search,
  ListMusic,
  X,
  Music2,
  ChevronUp,
  Maximize2,
} from "lucide-react";

// Hàm chuẩn hóa tiếng Việt không dấu để tìm kiếm thông minh
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

export default function MiniMusicPlayer() {
  const {
    playlist,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    currentTime,
    duration,
    isMuted,
    isMiniPlayerVisible,
    hideMiniPlayer,
    showMiniPlayer,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    toggleMute,
    playTrack,
  } = useMusic();

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Lọc thông minh hỗ trợ cả tiếng Việt có dấu và không dấu
  const filteredPlaylist = useMemo(() => {
    if (!searchQuery.trim()) return playlist;
    const rawQ = searchQuery.toLowerCase().trim();
    const normalizedQ = removeVietnameseTones(searchQuery);

    return playlist.filter((item) => {
      const titleNorm = removeVietnameseTones(item.title);
      const artistNorm = removeVietnameseTones(item.artist);
      const genreNorm = removeVietnameseTones(item.genre);

      return (
        item.title.toLowerCase().includes(rawQ) ||
        item.artist.toLowerCase().includes(rawQ) ||
        item.genre.toLowerCase().includes(rawQ) ||
        titleNorm.includes(normalizedQ) ||
        artistNorm.includes(normalizedQ) ||
        genreNorm.includes(normalizedQ)
      );
    });
  }, [playlist, searchQuery]);

  return (
    <>
      {/* ======================================================================
          1. DESKTOP CARD VIEW (Visible on LG/XL in RightSidebar)
          ====================================================================== */}
      <div className="hidden lg:block w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
        {isPlaying && (
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-rose-500/10 dark:bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />
        )}

        {/* Header Tag with Link to Full Radio & Playlist Toggle */}
        <div className="flex items-center justify-between mb-3">
          <Link
            to="/radio"
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:text-rose-600 dark:hover:text-rose-400 transition group/link"
            title="Mở phòng nghe nhạc Radio toàn màn hình"
          >
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>V-Pop, Ballad & Remix</span>
            <ExternalLink className="w-3 h-3 text-zinc-400 group-hover/link:text-rose-500 opacity-0 group-hover/link:opacity-100 transition" />
          </Link>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowPlaylist((prev) => !prev)}
              className={`p-1 rounded-lg text-xs transition cursor-pointer ${
                showPlaylist
                  ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
              title="Danh sách bài hát & Tìm kiếm"
            >
              <ListMusic className="w-3.5 h-3.5" />
            </button>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                currentTrack.genreColor || "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {currentTrack.genre}
            </span>
          </div>
        </div>

        {/* Search & Playlist Dropdown Drawer */}
        {showPlaylist && (
          <div className="mb-3 p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/80 animate-in fade-in zoom-in-95 duration-100">
            <div className="relative mb-2">
              <Search className="w-3 h-3 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm bài hát, ca sĩ, thể loại (Ballad, Remix, Nhạc Trẻ...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg pl-7 pr-6 py-1 text-[11px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-rose-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="max-h-44 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
              {filteredPlaylist.map((track) => {
                const originalIndex = playlist.findIndex((p) => String(p.id) === String(track.id));
                const isThisPlaying = currentTrackIndex === originalIndex;

                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => {
                      if (isThisPlaying) {
                        togglePlay();
                      } else {
                        playTrack(originalIndex);
                      }
                    }}
                    className={`flex items-center justify-between gap-2 p-1.5 rounded-lg text-left transition w-full cursor-pointer ${
                      isThisPlaying
                        ? "bg-black text-white dark:bg-white dark:text-black font-semibold"
                        : "hover:bg-zinc-200 dark:hover:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Music2 className="w-3 h-3 shrink-0" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[11px] truncate">{track.title}</span>
                        <span
                          className={`text-[9px] truncate ${
                            isThisPlaying ? "opacity-80" : "text-zinc-400"
                          }`}
                        >
                          {track.artist}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isThisPlaying && isPlaying && (
                        <div className="flex items-center gap-0.5">
                          <div className="w-0.5 h-2 bg-current rounded-full animate-bounce" />
                          <div className="w-0.5 h-3 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                        </div>
                      )}
                      <span
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          track.genreColor || "bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        {track.genre}
                      </span>
                    </div>
                  </button>
                );
              })}
              {filteredPlaylist.length === 0 && (
                <span className="text-[11px] text-zinc-400 text-center py-2">
                  Không tìm thấy bài hát phù hợp
                </span>
              )}
            </div>
          </div>
        )}

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
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {currentTrack.title}
              </span>
              <span
                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ${
                  currentTrack.genreColor || "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {currentTrack.genre}
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
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
            <span>{formatAudioTime(currentTime)}</span>
            <span>{formatDurationTime(duration)}</span>
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
          2. MOBILE FLOATING MUSIC BAR (Fixed bottom-14 above bottom-nav, z-40)
          ====================================================================== */}
      {!isMiniPlayerVisible ? (
        isPlaying && (
          <div
            onClick={() => showMiniPlayer()}
            className="lg:hidden fixed bottom-16 right-3 z-40 bg-black/90 dark:bg-white/90 text-white dark:text-black p-2 px-2.5 rounded-full shadow-xl border border-white/20 dark:border-black/20 flex items-center gap-1.5 cursor-pointer animate-in zoom-in-95 duration-200 backdrop-blur-md active:scale-95"
            title="Mở thanh phát nhạc"
          >
            <Disc3 className="w-4 h-4 animate-spin text-rose-500" style={{ animationDuration: "3s" }} />
            <span className="text-[10px] font-bold">Phát nhạc</span>
          </div>
        )
      ) : (
        <div className="lg:hidden fixed bottom-14 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-between shadow-md">
          {/* Top Progress Line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-rose-600 dark:bg-rose-400 transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Left: Mini spinning art & title & genre tag -> Click opens Mobile Full Sheet */}
          <div
            onClick={() => setShowMobileModal(true)}
            className="flex items-center gap-2.5 min-w-0 flex-1 pr-2 cursor-pointer"
          >
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
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {currentTrack.title}
                </span>
                <span
                  className={`text-[8px] font-bold px-1 py-0.2 rounded shrink-0 ${
                    currentTrack.genreColor || "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {currentTrack.genre}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 truncate">
                {currentTrack.artist} · <span className="font-mono">{formatAudioTime(currentTime)}</span>
              </span>
            </div>
          </div>

          {/* Right: Quick Controls & Hide / Expand Button */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevTrack();
              }}
              className="p-1 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Bài trước"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-xs active:scale-95 transition cursor-pointer"
              title={isPlaying ? "Tạm dừng" : "Phát"}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextTrack();
              }}
              className="p-1 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Bài tiếp theo"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMobileModal(true);
              }}
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
              title="Mở rộng"
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            {/* Nút Ẩn / Đóng thanh Mini Player */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                hideMiniPlayer();
              }}
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer ml-0.5"
              title="Ẩn thanh phát nhạc"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================================
          3. FULL MOBILE MUSIC BOTTOM SHEET / MODAL
          ====================================================================== */}
      {showMobileModal && (
        <div
          className="lg:hidden fixed inset-0 z-[999999] bg-black/70 backdrop-blur-md flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setShowMobileModal(false)}
        >
          <div
            className="w-full max-h-[85vh] bg-white dark:bg-zinc-900 rounded-t-3xl border-t border-zinc-200 dark:border-zinc-800 p-5 flex flex-col shadow-2xl overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <Link
                to="/radio"
                onClick={() => setShowMobileModal(false)}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:text-rose-500"
              >
                <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>Phòng Radio Toàn Màn Hình</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </Link>

              <button
                type="button"
                onClick={() => setShowMobileModal(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Big Vinyl Cover */}
            <div className="flex flex-col items-center justify-center my-4">
              <div className="relative w-36 h-36 rounded-full overflow-hidden shadow-xl border-4 border-zinc-200 dark:border-zinc-800">
                <img
                  src={currentTrack.cover}
                  alt=""
                  className={`w-full h-full object-cover ${isPlaying ? "animate-spin" : ""}`}
                  style={{ animationDuration: "8s" }}
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-700 shadow-inner flex items-center justify-center">
                    <Disc3 className="w-4 h-4 text-rose-500" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center text-center mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {currentTrack.title}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      currentTrack.genreColor || "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
                    }`}
                  >
                    {currentTrack.genre}
                  </span>
                </div>
                <span className="text-xs text-zinc-500 mt-0.5">{currentTrack.artist}</span>
              </div>
            </div>

            {/* Progress Scrubber */}
            <div className="flex flex-col gap-1 my-2">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
              />
              <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                <span>{formatAudioTime(currentTime)}</span>
                <span>{formatDurationTime(duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-center gap-6 py-2">
              <button
                type="button"
                onClick={toggleMute}
                className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={prevTrack}
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={nextTrack}
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <div className="text-xs font-mono text-zinc-400">
                {currentTrackIndex + 1}/{playlist.length}
              </div>
            </div>

            {/* Searchable Playlist Inside Mobile Modal */}
            <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex flex-col gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm bài hát, ca sĩ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-9 pr-7 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                />
              </div>

              <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1 custom-scrollbar">
                {filteredPlaylist.map((track) => {
                  const origIdx = playlist.findIndex((p) => String(p.id) === String(track.id));
                  const isCur = currentTrackIndex === origIdx;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => {
                        if (isCur) {
                          togglePlay();
                        } else {
                          playTrack(origIdx);
                        }
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl text-left transition w-full cursor-pointer ${
                        isCur
                          ? "bg-black text-white dark:bg-white dark:text-black font-semibold shadow-xs"
                          : "hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Music2 className="w-3.5 h-3.5 shrink-0" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs truncate">{track.title}</span>
                          <span className="text-[10px] opacity-75 truncate">{track.artist}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isCur && isPlaying && (
                          <div className="flex items-center gap-0.5">
                            <div className="w-0.5 h-2.5 bg-current rounded-full animate-bounce" />
                            <div className="w-0.5 h-3.5 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                          </div>
                        )}
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            track.genreColor || "bg-zinc-200 text-zinc-700"
                          }`}
                        >
                          {track.genre}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
