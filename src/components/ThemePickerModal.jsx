import { useState, useEffect, useRef } from "react";
import { X, Check, Sparkles, Palette, Search, Heart, Smile, Rocket, Coffee } from "lucide-react";
import { SPECIAL_THEMES, COLOR_THEMES, BASE_GRADIENTS } from "../constants/chatThemes";

const SPECIAL_CATEGORIES = [
  { id: "all", label: "Tất cả", icon: Sparkles },
  { id: "love", label: "Tình yêu", icon: Heart },
  { id: "cute", label: "Dễ thương", icon: Smile },
  { id: "science", label: "Khoa học & Vũ trụ", icon: Rocket },
  { id: "chill", label: "Chill & Thiên nhiên", icon: Coffee },
];

export default function ThemePickerModal({
  isOpen,
  onClose,
  currentThemeId = "DEFAULT",
  onSelectTheme,
  targetUserName = "Bạn bè",
}) {
  const [activeMainTab, setActiveMainTab] = useState("special"); // 'special' | 'gradient'
  const [specialCategory, setSpecialCategory] = useState("all");
  const [gradientSearch, setGradientSearch] = useState("");
  const modalContentRef = useRef(null);

  // Đóng bằng phím Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Lọc chủ đề đặc biệt
  const specialList = Object.values(SPECIAL_THEMES).filter((t) => {
    if (specialCategory === "all") return true;
    return t.category === specialCategory;
  });

  // Lọc gradient theo tìm kiếm
  const gradientList = BASE_GRADIENTS.filter((g) => {
    return g.name.toLowerCase().includes(gradientSearch.toLowerCase());
  });

  const handleSelect = (themeId) => {
    if (onSelectTheme) {
      onSelectTheme(themeId);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalContentRef}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200 text-left pointer-events-auto"
      >
        {/* 1. Header Modal */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md">
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Chủ đề đoạn chat</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Tùy chỉnh màu sắc và phong cách trò chuyện với <strong>{targetUserName}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer shrink-0"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Main Switcher Tabs (Chủ đề đặc biệt vs Màu sắc & Gradient) */}
        <div className="px-4 sm:px-5 pt-3 shrink-0">
          <div className="flex p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/50">
            <button
              type="button"
              onClick={() => setActiveMainTab("special")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMainTab === "special"
                  ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chủ đề minh họa (15+)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab("gradient")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMainTab === "gradient"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Màu sắc & Gradient (50+)</span>
            </button>
          </div>
        </div>

        {/* 3. Tab Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 pt-3">
          {/* TAB 1: CHỦ ĐỀ ĐẶC BIỆT */}
          {activeMainTab === "special" && (
            <div className="space-y-3.5">
              {/* Category Pills Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {SPECIAL_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = specialCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSpecialCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Grid 2 cột các Card Theme đặc biệt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {specialList.map((item) => {
                  const isSelected = currentThemeId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`p-3 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden group ${
                        isSelected
                          ? "border-indigo-600 dark:border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-zinc-900"
                      }`}
                    >
                      {/* Top Header Card */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl shrink-0 group-hover:scale-125 transition-transform duration-200">
                            {item.quickEmoji}
                          </span>
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                            {item.name}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-in zoom-in-50">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Mini Chat Simulation Preview Box */}
                      <div className={`p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 flex flex-col gap-1.5 ${item.chatBg || item.bodyBg || "bg-slate-50"}`}>
                        <div className="flex justify-end">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium max-w-[85%] truncate ${item.sentBubble || item.myBubble || "bg-blue-600 text-white"}`}>
                            Chào bạn! 👋
                          </span>
                        </div>
                        <div className="flex justify-start">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium max-w-[85%] truncate ${item.receivedBubble || item.theirBubble || "bg-white text-zinc-900 border"}`}>
                            Rất vui được kết nối ✨
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: MÀU SẮC & GRADIENT (50+) */}
          {activeMainTab === "gradient" && (
            <div className="space-y-3.5">
              {/* Search Bar for Gradients */}
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  value={gradientSearch}
                  onChange={(e) => setGradientSearch(e.target.value)}
                  placeholder="Tìm màu sắc (vd: Biển xanh, Hoàng hôn, Neon, Đỏ...)"
                  className="w-full pl-9 pr-3.5 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-blue-500/50 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none transition"
                />
              </div>

              {/* Grid 5 cột vòng tròn màu Gradient sắc sảo */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3.5">
                {gradientList.map((g) => {
                  const isSelected = currentThemeId === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handleSelect(g.id)}
                      className={`p-2.5 rounded-2xl flex flex-col items-center gap-1.5 transition cursor-pointer group hover:bg-zinc-100 dark:hover:bg-zinc-800/60 relative ${
                        isSelected
                          ? "bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-600"
                          : ""
                      }`}
                      title={g.name}
                    >
                      {/* Vòng tròn Gradient */}
                      <div
                        className="w-12 h-12 rounded-full shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-150 relative"
                        style={{
                          background: `linear-gradient(135deg, ${g.from}, ${g.to})`,
                        }}
                      >
                        <span className="text-base drop-shadow-xs">{g.emoji}</span>

                        {isSelected && (
                          <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Tên Màu */}
                      <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 text-center truncate max-w-full">
                        {g.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {gradientList.length === 0 && (
                <div className="text-center py-10 text-xs text-zinc-400">
                  Không tìm thấy màu sắc phù hợp với từ khóa "{gradientSearch}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Footer Modal */}
        <div className="p-3.5 sm:p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => handleSelect("DEFAULT")}
            className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer hover:underline"
          >
            Khôi phục mặc định
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full text-xs font-bold bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
