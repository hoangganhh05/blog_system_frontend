import { useState, useMemo, useRef, useEffect } from "react";
import { X, Smile, Heart, ThumbsUp, Cat, Pizza, Sparkles } from "lucide-react";

const EMOJI_CATEGORIES = [
  {
    key: "smileys",
    label: "Biểu cảm",
    icon: Smile,
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
      "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😋",
      "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐",
      "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌",
      "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧",
      "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓",
      "🧐", "😕", "😟", "🙁", "😮", "😯", "😲", "😳", "🥺", "😦",
      "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞",
      "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿",
      "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖",
    ],
  },
  {
    key: "hearts",
    label: "Tình cảm",
    icon: Heart,
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "💌",
      "💋", "🫂", "😻", "😽", "🧑‍🤝‍🧑", "👭", "👬", "💑", "👩‍❤️‍👨", "👩‍❤️‍👩",
    ],
  },
  {
    key: "gestures",
    label: "Cử chỉ",
    icon: ThumbsUp,
    emojis: [
      "👍", "👎", "👊", "✊", "🤛", "🤜", "👏", "🙌", "👐", "🤲",
      "🤝", "🙏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆",
      "🖕", "👇", "☝️", "🖐", "✋", "🖖", "👋", "🤏", "✍️", "🤳",
      "💪", "🦵", "🦶", "👂", "👃", "👀", "👁️", "🧠", "🦴", "🦷",
    ],
  },
  {
    key: "animals",
    label: "Động vật",
    icon: Cat,
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
      "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆",
      "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋",
      "🐌", "🐞", "🐜", "🦟", "🐢", "🐍", "🦎", "🐙", "🦑", "🦐",
      "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🦈", "🐊", "🐅",
    ],
  },
  {
    key: "food",
    label: "Ăn uống",
    icon: Pizza,
    emojis: [
      "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐",
      "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🥦",
      "🌽", "🥕", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🥞", "🧇",
      "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🥪", "🥙",
      "🌮", "🌯", "🥗", "🍜", "🍝", "🍣", "🍱", "🥟", "🍤", "🍙",
      "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬",
      "🍫", "🍿", "🍩", "🍪", "☕", "🍵", "🧃", "🥤", "🧋", "🍺",
      "🍻", "🥂", "🍷", "🥃", "🍸", "🍹", "🍾", "🧊",
    ],
  },
  {
    key: "activities",
    label: "Hoạt động",
    icon: Sparkles,
    emojis: [
      "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸",
      "🥅", "🥊", "🥋", "🥇", "🥈", "🥉", "🏆", "🎖️", "🎫", "🎪",
      "🎨", "🎬", "🎤", "🎧", "🎼", "🎹", "🥁", "🎷", "🎺", "🎸",
      "🎲", "🎯", "🎳", "🎮", "🎰", "🚗", "🚕", "🚙", "🚌", "🏎️",
      "🚑", "🚒", "🚚", "🚜", "🛵", "🏍️", "🚲", "🛴", "🚀", "🛸",
      "💡", "🕯️", "📱", "💻", "🖥️", "⌚", "⏰", "💵", "💎", "🔥",
      "⭐", "✨", "💥", "💯", "🎉", "🎊", "🎈", "🎁", "🚩", "⚡",
    ],
  },
];

export default function EmojiPicker({ onSelectEmoji, onClose }) {
  const [activeCategory, setActiveCategory] = useState("smileys");
  const containerRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose?.();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const displayedEmojis = useMemo(() => {
    const cat = EMOJI_CATEGORIES.find((c) => c.key === activeCategory);
    return cat ? cat.emojis : EMOJI_CATEGORIES[0].emojis;
  }, [activeCategory]);

  return (
    <div
      ref={containerRef}
      className="w-72 sm:w-80 max-w-[calc(100vw-32px)] h-[280px] sm:h-[300px] max-h-[300px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Header & Tabs */}
      <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 flex flex-col gap-1.5 shrink-0 bg-white dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <span className="text-sm">😊</span>
            Biểu tượng cảm xúc (Emoji)
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

        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
          {EMOJI_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold shrink-0 transition cursor-pointer ${
                  isSelected
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
                title={cat.label}
              >
                <Icon className="w-3 h-3" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Emoji Grid */}
      <div className="p-2 flex-1 min-h-0 overflow-y-auto grid grid-cols-7 sm:grid-cols-8 gap-1 custom-scrollbar">
        {displayedEmojis.map((emoji, idx) => (
          <button
            key={`${emoji}-${idx}`}
            type="button"
            onClick={() => onSelectEmoji(emoji)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-125 transition-all cursor-pointer select-none active:scale-95"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Footer Hint */}
      <div className="px-2 py-1 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 text-center text-[9px] text-zinc-400 shrink-0">
        Nhấp vào emoji để chèn vào tin nhắn
      </div>
    </div>
  );
}
