import { useState, useEffect, useCallback } from "react";
import {
  Headphones,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  Heart,
  MapPin,
  Clock,
  Plus,
  Search,
  Sparkles,
  CloudRain,
  Coffee,
  Trees,
  Building2,
  Waves,
  Upload,
  X,
  Loader2,
  Share2,
  Compass,
  Repeat,
} from "lucide-react";
import { useSoundscape } from "../context/SoundscapeContext";
import soundscapeService, { DEFAULT_SOUNDSCAPES } from "../services/soundscapeService";
import uploadService from "../services/uploadService";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "ALL", label: "Tất cả", icon: Sparkles, color: "from-indigo-500 to-purple-600" },
  { id: "RAIN", label: "Tiếng Mưa", icon: CloudRain, color: "from-blue-500 to-cyan-600" },
  { id: "CAFE", label: "Quán Cafe", icon: Coffee, color: "from-amber-600 to-orange-700" },
  { id: "NATURE", label: "Thiên Nhiên", icon: Trees, color: "from-emerald-500 to-teal-600" },
  { id: "URBAN", label: "Đô Thị Đêm", icon: Building2, color: "from-violet-600 to-indigo-800" },
  { id: "OCEAN", label: "Sóng Biển & Hè", icon: Waves, color: "from-teal-400 to-blue-600" },
];

export default function SoundscapesPage() {
  const {
    currentSoundscape,
    isPlaying,
    playSoundscape,
    togglePlay,
    handleNext,
    handlePrev,
    volume,
    setVolume,
    isLooping,
    setIsLooping,
    sleepTimer,
    setTimer,
    sleepTimeRemaining,
  } = useSoundscape();

  const { currentUser } = useAuth();

  const [soundscapes, setSoundscapes] = useState(DEFAULT_SOUNDSCAPES);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchLocation, setSearchLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [likedMap, setLikedMap] = useState({});

  // Share Modal Form State
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    category: "RAIN",
    description: "",
    creatorName: currentUser?.fullName || currentUser?.username || "",
    audioUrl: "",
    imageUrl: "",
  });
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Soundscapes from Server
  const fetchSoundscapes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await soundscapeService.getAll(selectedCategory, searchLocation, 0, 30);
      const list = res.data?.content || res.data || [];
      setSoundscapes(list.length > 0 ? list : DEFAULT_SOUNDSCAPES);
    } catch {
      setSoundscapes(DEFAULT_SOUNDSCAPES);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchLocation]);

  useEffect(() => {
    fetchSoundscapes();
  }, [fetchSoundscapes]);

  const handleLike = async (id, e) => {
    e.stopPropagation();
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
    try {
      await soundscapeService.like(id);
      setSoundscapes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, likesCount: (s.likesCount || 0) + (likedMap[id] ? -1 : 1) } : s))
      );
      toast.success("Đã thả tim đoạn âm thanh!");
    } catch {
      // Ignored
    }
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAudio(true);
    try {
      const res = await uploadService.uploadMedia(file);
      const url = res.data?.url || res.data?.secure_url || res.data?.fileUrl;
      setFormData((prev) => ({ ...prev, audioUrl: url }));
      toast.success("Đã tải lên tệp âm thanh!");
    } catch {
      toast.error("Không thể tải lên tệp âm thanh!");
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await uploadService.uploadMedia(file);
      const url = res.data?.url || res.data?.secure_url || res.data?.fileUrl;
      setFormData((prev) => ({ ...prev, imageUrl: url }));
      toast.success("Đã tải lên ảnh không gian!");
    } catch {
      toast.error("Không thể tải lên ảnh!");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitShare = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tên không gian âm thanh!");
      return;
    }
    if (!formData.audioUrl.trim()) {
      toast.error("Vui lòng tải lên hoặc dán liên kết tệp âm thanh (.mp3, .ogg, .m4a)!");
      return;
    }

    setSubmitting(true);
    try {
      await soundscapeService.create(formData);
      toast.success("Đã chia sẻ đoạn âm thanh môi trường mới!");
      setShowShareModal(false);
      setFormData({
        title: "",
        location: "",
        category: "RAIN",
        description: "",
        creatorName: currentUser?.fullName || currentUser?.username || "",
        audioUrl: "",
        imageUrl: "",
      });
      fetchSoundscapes();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi chia sẻ âm thanh!");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-20 animate-in fade-in duration-200">
      {/* 1. Header Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-indigo-900 via-slate-900 to-zinc-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        {/* Glow ambient background circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-2 z-10 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-xs">
              <Headphones className="w-3.5 h-3.5 text-indigo-300" />
              <span>Trạm Âm Thanh Môi Trường</span>
            </span>
            <span className="text-xs text-emerald-400 font-medium">● Đang phát sóng</span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
            Thư giãn tâm trí cùng âm thanh thực tế
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Lắng nghe tiếng mưa rơi trên mái tôn, quán cà phê phố quen, tiếng sóng biển rì rào hay tiếng rừng thông đại ngàn khi đọc Blog &amp; làm việc.
          </p>
        </div>

        {/* Action Button: Chia sẻ không gian */}
        <div className="z-10 shrink-0">
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-zinc-900 hover:bg-zinc-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Chia sẻ âm thanh</span>
          </button>
        </div>
      </div>

      {/* 2. Main Featured Soundscape Player Card */}
      {currentSoundscape && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-sm flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          {/* Cover Photo */}
          <div className="relative w-full md:w-56 aspect-video md:aspect-square rounded-2xl overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-md group">
            <img
              src={currentSoundscape.imageUrl || "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600"}
              alt={currentSoundscape.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center gap-1">
                <span className="w-1.5 h-6 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-10 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-5 bg-white rounded-full animate-bounce" />
              </div>
            )}
          </div>

          {/* Info & Detailed Controls */}
          <div className="flex flex-col justify-between flex-1 w-full gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {currentSoundscape.location && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{currentSoundscape.location}</span>
                  </span>
                )}
                <span className="text-[11px] text-zinc-400">
                  Thu âm bởi <span className="font-semibold text-zinc-700 dark:text-zinc-300">{currentSoundscape.creatorName || "Thực địa"}</span>
                </span>
              </div>

              <h2 className="text-base sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
                {currentSoundscape.title}
              </h2>

              {currentSoundscape.description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {currentSoundscape.description}
                </p>
              )}
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              {/* Playback action buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                  title="Trước"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer"
                  title={isPlaying ? "Tạm dừng" : "Phát"}
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                  title="Tiếp theo"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                {/* Loop Button */}
                <button
                  type="button"
                  onClick={() => setIsLooping(!isLooping)}
                  className={`p-2.5 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                    isLooping
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60"
                      : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
                  title="Lặp lại vô tận"
                >
                  <Repeat className="w-4 h-4" />
                  <span className="hidden sm:inline">Lặp lại</span>
                </button>
              </div>

              {/* Volume & Sleep Timer Quick Dropdown */}
              <div className="flex items-center gap-3">
                {/* Volume Slider */}
                <div className="flex items-center gap-2 text-zinc-400">
                  <button
                    type="button"
                    onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
                    className="hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                  >
                    {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
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

                {/* Sleep Timer Selector */}
                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <select
                    value={sleepTimer}
                    onChange={(e) => setTimer(Number(e.target.value))}
                    className="bg-transparent border-none outline-none cursor-pointer text-xs"
                  >
                    <option value={0}>Hẹn giờ tắt</option>
                    <option value={15}>15 phút</option>
                    <option value={30}>30 phút</option>
                    <option value={45}>45 phút</option>
                    <option value={60}>60 phút</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth touch-pan-x">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md scale-105"
                    : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search by location */}
        <div className="relative w-full sm:w-60 shrink-0">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo địa điểm (Hà Nội...)"
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 4. Soundscape Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-3xl bg-zinc-100 dark:bg-zinc-800/60 animate-pulse border border-zinc-200 dark:border-zinc-800"
            />
          ))
        ) : soundscapes.length === 0 ? (
          <div className="col-span-full py-16 text-center text-zinc-400 flex flex-col items-center gap-3">
            <Compass className="w-10 h-10 stroke-[1.5]" />
            <p className="text-sm font-semibold">Chưa có đoạn âm thanh nào trong danh mục này.</p>
          </div>
        ) : (
          soundscapes.map((item) => {
            const isItemPlaying = isPlaying && currentSoundscape?.id === item.id;
            const isLiked = !!likedMap[item.id];

            return (
              <div
                key={item.id}
                onClick={() => playSoundscape(item, soundscapes)}
                className={`group relative bg-white dark:bg-zinc-900 border rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  isItemPlaying
                    ? "border-indigo-500 ring-2 ring-indigo-500/20"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                {/* Image & Overlay */}
                <div className="relative aspect-16/10 w-full overflow-hidden bg-zinc-950">
                  <img
                    src={item.imageUrl || "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=500"}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Category Badge */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-black/50 backdrop-blur-md text-white border border-white/20">
                      {item.category || "SOUND"}
                    </span>

                    {/* Like Button */}
                    <button
                      type="button"
                      onClick={(e) => handleLike(item.id, e)}
                      className="p-1.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:scale-110 active:scale-95 transition cursor-pointer"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-rose-500 text-rose-500" : "text-white"}`} />
                    </button>
                  </div>

                  {/* Center Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                        isItemPlaying
                          ? "bg-indigo-600 text-white scale-110"
                          : "bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 opacity-85 group-hover:opacity-100 group-hover:scale-110"
                      }`}
                    >
                      {isItemPlaying ? (
                        <Pause className="w-5 h-5 fill-white" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Location Tag */}
                  {item.location && (
                    <div className="absolute bottom-2.5 left-3 z-10 flex items-center gap-1 text-[11px] text-white/90 font-semibold drop-shadow-sm">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>{item.location}</span>
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-4 flex flex-col gap-2">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    {item.title}
                  </h3>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.description || "Đoạn thu âm thực tế môi trường đem lại cảm giác êm dịu, dễ chịu."}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-[11px] text-zinc-400">
                    <span>{item.creatorName || "Thu âm thực địa"}</span>
                    <span>{item.likesCount || 0} lượt thích</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Modal 'Chia sẻ Âm thanh mới' */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 flex flex-col gap-4 max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Chia sẻ âm thanh môi trường</h3>
                  <p className="text-[11px] text-zinc-400">Đăng tải đoạn thu âm thực tế từ không gian của bạn</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitShare} className="flex flex-col gap-3.5 text-xs">
              {/* Title */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Tên không gian / Tiêu đề *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Mưa rào trên mái tôn Hà Nội"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Location & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300">Địa điểm</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Ba Đình, Hà Nội"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    className="px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300">Danh mục</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="RAIN">Tiếng Mưa</option>
                    <option value="CAFE">Quán Cafe</option>
                    <option value="NATURE">Thiên Nhiên</option>
                    <option value="URBAN">Đô Thị Đêm</option>
                    <option value="OCEAN">Sóng Biển &amp; Hè</option>
                  </select>
                </div>
              </div>

              {/* Audio File or URL */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Tệp âm thanh (.mp3, .ogg, .m4a) *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Dán URL tệp âm thanh hoặc tải file..."
                    value={formData.audioUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, audioUrl: e.target.value }))}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                  <label className="px-3.5 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold cursor-pointer hover:bg-zinc-300 transition flex items-center gap-1.5 shrink-0">
                    {uploadingAudio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>Tải tệp</span>
                    <input type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
                  </label>
                </div>
              </div>

              {/* Image Cover or URL */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Ảnh chụp không gian</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Dán URL ảnh hoặc tải từ máy..."
                    value={formData.imageUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                  <label className="px-3.5 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold cursor-pointer hover:bg-zinc-300 transition flex items-center gap-1.5 shrink-0">
                    {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>Tải ảnh</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              {/* Creator Name */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Tên người thu âm (Field Recorder)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hoàng Anh (Field Record)"
                  value={formData.creatorName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, creatorName: e.target.value }))}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Mô tả ngắn</label>
                <textarea
                  rows={2}
                  placeholder="Cảm xúc, thời điểm thu âm, khuyến nghị tai nghe..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Đăng âm thanh</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
