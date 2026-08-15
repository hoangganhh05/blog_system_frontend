import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, Sparkles, Flame, Smile, Heart, ThumbsUp, PartyPopper } from "lucide-react";

// Kho GIF động phong phú, chất lượng cao, CDN ổn định 100%
const CURATED_GIFS = [
  // Trending & Vinahouse / Party
  {
    id: "g1",
    title: "DJ Vinahouse Party Dance",
    tags: ["vinahouse", "party", "dance", "nhay", "quay", "dj", "trending"],
    url: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif",
  },
  {
    id: "g2",
    title: "Cat Vibing Party",
    tags: ["cat", "meo", "vibe", "dance", "nhac", "vinahouse", "trending"],
    url: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif",
  },
  {
    id: "g3",
    title: "Party Hard Dance",
    tags: ["party", "dance", "quay", "nhay", "vui", "trending"],
    url: "https://media.giphy.com/media/l3q2wJsC23ikJg9xe/giphy.gif",
  },
  {
    id: "g4",
    title: "Doge Dance",
    tags: ["doge", "cho", "dance", "nhay", "trending", "vui"],
    url: "https://media.giphy.com/media/ygcB6X8A5qM50JmUjq/giphy.gif",
  },

  // Haha & Cười nghiêng ngả
  {
    id: "g5",
    title: "Laughing Cat",
    tags: ["haha", "cuoi", "lol", "laugh", "hai", "meo", "funny"],
    url: "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif",
  },
  {
    id: "g6",
    title: "Minion Laughing",
    tags: ["haha", "cuoi", "minion", "hai", "funny", "vui"],
    url: "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif",
  },
  {
    id: "g7",
    title: "Leonardo DiCaprio Laugh",
    tags: ["haha", "cuoi", "leo", "cheers", "hai", "funny"],
    url: "https://media.giphy.com/media/GCLlQnV7dXZ2E/giphy.gif",
  },
  {
    id: "g8",
    title: "Duck Laughing",
    tags: ["haha", "cuoi", "duck", "vit", "hai"],
    url: "https://media.giphy.com/media/krewXUB6LBja/giphy.gif",
  },

  // Yêu thương & Heart / Love
  {
    id: "g9",
    title: "Blowing Heart Kiss",
    tags: ["love", "heart", "tim", "yeu", "kiss", "cute"],
    url: "https://media.giphy.com/media/M90mJvfWfd5mbUuULX/giphy.gif",
  },
  {
    id: "g10",
    title: "Pikachu Love Heart",
    tags: ["love", "heart", "tim", "pikachu", "cute", "dang yeu", "anime"],
    url: "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif",
  },
  {
    id: "g11",
    title: "Cute Cat Hug Love",
    tags: ["love", "heart", "tim", "hug", "om", "meo", "cute"],
    url: "https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif",
  },
  {
    id: "g12",
    title: "Love Sparkle Heart",
    tags: ["love", "heart", "tim", "cute", "sparkle"],
    url: "https://media.giphy.com/media/26FLdmIp6wJr91JAI/giphy.gif",
  },

  // Vỗ tay & Chúc mừng & Thumbs Up
  {
    id: "g13",
    title: "Clapping Leonardo",
    tags: ["clap", "vo tay", "chuc mung", "good", "10 diem", "dinh"],
    url: "https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/giphy.gif",
  },
  {
    id: "g14",
    title: "Thumbs Up Kid",
    tags: ["thumbs up", "like", "ok", "tuyet voi", "chuan", "good"],
    url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
  },
  {
    id: "g15",
    title: "Minions Celebrating",
    tags: ["party", "chuc mung", "celebrate", "vui", "clap"],
    url: "https://media.giphy.com/media/MOWPkhJx7OdEaseETn/giphy.gif",
  },
  {
    id: "g16",
    title: "Popcorn Watching Drama",
    tags: ["popcorn", "hong", "drama", "an bong", "xem"],
    url: "https://media.giphy.com/media/gl0mkIZOW6Nwc/giphy.gif",
  },

  // Wow & Bất ngờ / Cảm xúc
  {
    id: "g17",
    title: "Mind Blown Galaxy",
    tags: ["wow", "mindblown", "bat ngo", "ao", "dinh"],
    url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
  },
  {
    id: "g18",
    title: "Shocked Cat Face",
    tags: ["wow", "shock", "bat ngo", "meo", "cute"],
    url: "https://media.giphy.com/media/3o72F8t9TDi2xVnxOE/giphy.gif",
  },
  {
    id: "g19",
    title: "Crying Sad Cat",
    tags: ["sad", "buon", "khoc", "cry", "meo"],
    url: "https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif",
  },
  {
    id: "g20",
    title: "Thinking Smart Head",
    tags: ["think", "suy nghi", "smart", "nao", "it", "code"],
    url: "https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif",
  },
];

const CATEGORIES = [
  { key: "all", label: "Tất cả", icon: Sparkles },
  { key: "vinahouse", label: "Quẩy / Dance", icon: Flame },
  { key: "cuoi", label: "Haha", icon: Smile },
  { key: "love", label: "Yêu", icon: Heart },
  { key: "clap", label: "Vỗ tay", icon: ThumbsUp },
  { key: "celebrate", label: "Chúc mừng", icon: PartyPopper },
];

export default function GifPicker({ onSelectGif, onClose }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const containerRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (onClose) onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const filteredGifs = useMemo(() => {
    let list = CURATED_GIFS;

    if (activeCategory !== "all") {
      list = list.filter((g) =>
        g.tags.some((t) => t.toLowerCase().includes(activeCategory.toLowerCase()))
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [search, activeCategory]);

  return (
    <div
      ref={containerRef}
      className="w-72 sm:w-80 max-w-[calc(100vw-32px)] h-[320px] sm:h-[350px] max-h-[350px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Header & Search */}
      <div className="p-2 sm:p-2.5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col gap-1.5 shrink-0 bg-white dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black font-extrabold text-[10px]">
              GIF
            </span>
            Kho ảnh GIF động
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition cursor-pointer"
              title="Đóng"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm GIF (dance, haha, love, clap...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl pl-8 pr-7 py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Quick Tag Pills - Horizontal Scroll */}
        <div
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          className="flex overflow-x-auto whitespace-nowrap scrollbar-none no-scrollbar scroll-smooth items-center gap-2 py-1 px-0.5"
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.key);
                  setSearch("");
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold flex-shrink-0 shrink-0 transition cursor-pointer select-none whitespace-nowrap ${
                  isSelected
                    ? "bg-amber-500 text-black shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <Icon className="w-3 h-3 flex-shrink-0 shrink-0" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* GIFs Grid - Vertical Scroll */}
      <div className="p-2 flex-1 min-h-0 overflow-y-auto grid grid-cols-2 gap-1.5 custom-scrollbar">
        {filteredGifs.length === 0 ? (
          <div className="col-span-2 py-8 text-center text-xs text-zinc-400">
            Không tìm thấy ảnh GIF phù hợp.
          </div>
        ) : (
          filteredGifs.map((gif) => (
            <button
              key={gif.id}
              type="button"
              onClick={() => {
                if (onSelectGif) onSelectGif(gif.url);
                if (onClose) onClose();
              }}
              className="group relative h-20 sm:h-22 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all duration-150 cursor-pointer shadow-xs"
              title={gif.title}
            >
              <img
                src={gif.url}
                alt={gif.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                <span className="text-[10px] text-white font-medium truncate drop-shadow">
                  {gif.title}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer Branding */}
      <div className="px-2 py-1 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 text-center text-[9px] font-mono text-zinc-400 shrink-0">
        Powered by GIPHY · BlogViet Media
      </div>
    </div>
  );
}
