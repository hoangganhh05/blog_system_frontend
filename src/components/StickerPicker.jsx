import { useState, useMemo, useRef, useEffect } from "react";
import { X, Sparkles, Cat, Heart, Laugh, Smile, Flame, PartyPopper, Utensils } from "lucide-react";

const STICKER_PACKS = [
  {
    id: "all",
    name: "🌟 Tất cả",
    icon: Sparkles,
    stickers: [
      { id: "cat_love", name: "Mèo thả tim", url: "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif" },
      { id: "cat_dance", name: "Mèo nhảy múa", url: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif" },
      { id: "cat_laugh", name: "Mèo cười té ghế", url: "https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif" },
      { id: "cat_kiss", name: "Mèo hôn", url: "https://media.giphy.com/media/ygcB6X8A5qM50JmUjq/giphy.gif" },
      { id: "cat_cool", name: "Mèo đeo kính", url: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif" },
      { id: "cat_sad", name: "Mèo khóc", url: "https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif" },
      { id: "cat_shock", name: "Mèo ngạc nhiên", url: "https://media.giphy.com/media/l3q2wJsC23ikJg9xe/giphy.gif" },
      { id: "cat_sleep", name: "Mèo ngủ", url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif" },
      { id: "mochi_love", name: "Gấu yêu thương", url: "https://media.giphy.com/media/MOWPkhJx7OdEaseETn/giphy.gif" },
      { id: "mochi_happy", name: "Gấu vui sướng", url: "https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/giphy.gif" },
      { id: "mochi_party", name: "Tiệc tùng", url: "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif" },
      { id: "mochi_clap", name: "Gấu vỗ tay", url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif" },
      { id: "mochi_cool", name: "Đỉnh cao", url: "https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif" },
      { id: "mochi_shock", name: "Sốc visual", url: "https://media.giphy.com/media/krewXUB6LBja/giphy.gif" },
      { id: "mochi_haha", name: "Cười thả ga", url: "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif" },
      { id: "mochi_hug", name: "Gấu ôm chặt", url: "https://media.giphy.com/media/GCLlQnV7dXZ2E/giphy.gif" },
      { id: "meme_cheers", name: "Nâng ly", url: "https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/giphy.gif" },
      { id: "meme_brain", name: "Não to", url: "https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif" },
      { id: "meme_dance2", name: "Quẩy tưng bừng", url: "https://media.giphy.com/media/26FLdmIp6wJr91JAI/giphy.gif" },
      { id: "meme_applause", name: "100 điểm", url: "https://media.giphy.com/media/M90mJvfWfd5mbUuULX/giphy.gif" },
      { id: "fun_wow", name: "Wow tuyệt cú mèo", url: "https://media.giphy.com/media/gl0mkIZOW6Nwc/giphy.gif" },
      { id: "fun_dance3", name: "Nhạc lên", url: "https://media.giphy.com/media/3o72F8t9TDi2xVnxOE/giphy.gif" },
      { id: "fun_cute", name: "Dễ thương", url: "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif" },
      { id: "fun_cheer", name: "Chiến thắng", url: "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif" },
    ],
  },
  {
    id: "cats",
    name: "🐱 Mèo Cute",
    icon: Cat,
    stickers: [
      { id: "cat_love", name: "Thả tim", url: "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif" },
      { id: "cat_dance", name: "Quẩy nhiệt tình", url: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif" },
      { id: "cat_laugh", name: "Cười ngất", url: "https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif" },
      { id: "cat_kiss", name: "Hôn má", url: "https://media.giphy.com/media/ygcB6X8A5qM50JmUjq/giphy.gif" },
      { id: "cat_cool", name: "Ngầu đét", url: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif" },
      { id: "cat_sad", name: "Mèo khóc", url: "https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif" },
      { id: "cat_shock", name: "Hốt hoảng", url: "https://media.giphy.com/media/l3q2wJsC23ikJg9xe/giphy.gif" },
      { id: "cat_sleep", name: "Ngủ khò khò", url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif" },
      { id: "cat_food", name: "Đói bụng", url: "https://media.giphy.com/media/krewXUB6LBja/giphy.gif" },
      { id: "cat_party", name: "Sinh nhật", url: "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif" },
      { id: "cat_smile", name: "Tươi cười", url: "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif" },
      { id: "cat_cute", name: "Nũng nịu", url: "https://media.giphy.com/media/GCLlQnV7dXZ2E/giphy.gif" },
    ],
  },
  {
    id: "mochi",
    name: "🐻 Gấu & Mochi",
    icon: Heart,
    stickers: [
      { id: "mochi_love", name: "Yêu thương", url: "https://media.giphy.com/media/MOWPkhJx7OdEaseETn/giphy.gif" },
      { id: "mochi_happy", name: "Vui vẻ", url: "https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/giphy.gif" },
      { id: "mochi_party", name: "Chúc mừng", url: "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif" },
      { id: "mochi_clap", name: "Vỗ tay tán thưởng", url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif" },
      { id: "mochi_cool", name: "Đỉnh chóp", url: "https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif" },
      { id: "mochi_shock", name: "Wow", url: "https://media.giphy.com/media/krewXUB6LBja/giphy.gif" },
      { id: "mochi_haha", name: "Cười ha ha", url: "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif" },
      { id: "mochi_hug", name: "Ôm cái nào", url: "https://media.giphy.com/media/GCLlQnV7dXZ2E/giphy.gif" },
      { id: "mochi_dance", name: "Điệu nhảy vui vẻ", url: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif" },
      { id: "mochi_kiss", name: "Hôn gió", url: "https://media.giphy.com/media/ygcB6X8A5qM50JmUjq/giphy.gif" },
      { id: "mochi_cry", name: "Buồn thiu", url: "https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif" },
      { id: "mochi_sleep", name: "Chúc ngủ ngon", url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif" },
    ],
  },
  {
    id: "memes",
    name: "🐸 Meme Hài",
    icon: Laugh,
    stickers: [
      { id: "meme_cheers", name: "Nâng ly", url: "https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/giphy.gif" },
      { id: "meme_thinking", name: "Tư duy thông minh", url: "https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif" },
      { id: "meme_happy", name: "Tuyệt đỉnh", url: "https://media.giphy.com/media/MOWPkhJx7OdEaseETn/giphy.gif" },
      { id: "meme_excited", name: "Quá đã", url: "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif" },
      { id: "meme_clap", name: "10 điểm", url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif" },
      { id: "meme_dance", name: "Vũ điệu", url: "https://media.giphy.com/media/26FLdmIp6wJr91JAI/giphy.gif" },
      { id: "meme_applause", name: "Tán thưởng", url: "https://media.giphy.com/media/M90mJvfWfd5mbUuULX/giphy.gif" },
      { id: "meme_love", name: "Trái tim", url: "https://media.giphy.com/media/ygcB6X8A5qM50JmUjq/giphy.gif" },
      { id: "meme_shock", name: "Bất ngờ chưa bà già", url: "https://media.giphy.com/media/l3q2wJsC23ikJg9xe/giphy.gif" },
      { id: "meme_cat_dance", name: "Mèo quẩy", url: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif" },
      { id: "meme_cool", name: "VIP Pro", url: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif" },
      { id: "meme_cry", name: "Khóc ròng", url: "https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif" },
    ],
  },
  {
    id: "fun",
    name: "✨ Biểu Cảm",
    icon: Sparkles,
    stickers: [
      { id: "fun_wow", name: "Bất ngờ", url: "https://media.giphy.com/media/gl0mkIZOW6Nwc/giphy.gif" },
      { id: "fun_cute", name: "Dễ thương", url: "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif" },
      { id: "fun_cheer", name: "Cố lên", url: "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif" },
      { id: "fun_dance", name: "Nhảy múa", url: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif" },
      { id: "fun_love", name: "Bắn tim", url: "https://media.giphy.com/media/MOWPkhJx7OdEaseETn/giphy.gif" },
      { id: "fun_smile", name: "Tươi tắn", url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif" },
      { id: "fun_cool", name: "Bá đạo", url: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif" },
      { id: "fun_cry", name: "Mít ướt", url: "https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif" },
      { id: "fun_cheers", name: "Chúc mừng", url: "https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/giphy.gif" },
      { id: "fun_sleep", name: "Khò khò", url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif" },
      { id: "fun_haha", name: "Haha", url: "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif" },
      { id: "fun_hug", name: "Ôm yêu", url: "https://media.giphy.com/media/GCLlQnV7dXZ2E/giphy.gif" },
    ],
  },
  {
    id: "party",
    name: "🎉 Tiệc Tùng",
    icon: PartyPopper,
    stickers: [
      { id: "party_cheer", name: "Chúc mừng năm mới", url: "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif" },
      { id: "party_wine", name: "Cạn chén", url: "https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/giphy.gif" },
      { id: "party_dance", name: "Nhảy nhót", url: "https://media.giphy.com/media/26FLdmIp6wJr91JAI/giphy.gif" },
      { id: "party_clap", name: "Vỗ tay rộn ràng", url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif" },
      { id: "party_fire", name: "Nhiệt huyết", url: "https://media.giphy.com/media/M90mJvfWfd5mbUuULX/giphy.gif" },
      { id: "party_smile", name: "Rạng rỡ", url: "https://media.giphy.com/media/MOWPkhJx7OdEaseETn/giphy.gif" },
      { id: "party_music", name: "Giai điệu", url: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif" },
      { id: "party_cool", name: "Chill phết", url: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif" },
    ],
  },
  {
    id: "yummy",
    name: "🍕 Ăn Uống",
    icon: Utensils,
    stickers: [
      { id: "yum_cheers", name: "Nâng ly", url: "https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/giphy.gif" },
      { id: "yum_hungry", name: "Thèm ăn", url: "https://media.giphy.com/media/krewXUB6LBja/giphy.gif" },
      { id: "yum_delicious", name: "Ngon tuyệt", url: "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif" },
      { id: "yum_coffee", name: "Cà phê sáng", url: "https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif" },
      { id: "yum_party", name: "Ăn tiệc", url: "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif" },
      { id: "yum_sweet", name: "Bánh ngọt", url: "https://media.giphy.com/media/MOWPkhJx7OdEaseETn/giphy.gif" },
      { id: "yum_cool", name: "Giải nhiệt", url: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif" },
      { id: "yum_hug", name: "No căng rốn", url: "https://media.giphy.com/media/GCLlQnV7dXZ2E/giphy.gif" },
    ],
  },
];

export default function StickerPicker({ onSelectSticker, onClose }) {
  const [activePackId, setActivePackId] = useState("all");
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

  const activePack = useMemo(() => {
    return STICKER_PACKS.find((p) => p.id === activePackId) || STICKER_PACKS[0];
  }, [activePackId]);

  return (
    <div
      ref={containerRef}
      className="w-72 sm:w-84 max-w-[calc(100vw-32px)] h-[320px] sm:h-[350px] max-h-[350px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Header & Tabs */}
      <div className="p-2 sm:p-2.5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col gap-1.5 shrink-0 bg-white dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-extrabold text-[10px]">
              STICKER
            </span>
            Kho Nhãn Dán Sinh Động
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

        {/* Sticker Pack Tabs - Horizontal Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5 whitespace-nowrap">
          {STICKER_PACKS.map((pack) => {
            const Icon = pack.icon;
            const isSelected = activePackId === pack.id;
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => setActivePackId(pack.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer select-none whitespace-nowrap ${
                  isSelected
                    ? "bg-rose-500 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
                title={pack.name}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span>{pack.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stickers Grid - Vertical Scroll with custom-scrollbar */}
      <div className="p-2 flex-1 min-h-0 overflow-y-auto grid grid-cols-4 gap-2 custom-scrollbar">
        {activePack.stickers.map((stk, index) => (
          <button
            key={`${stk.id}-${index}`}
            type="button"
            onClick={() => {
              onSelectSticker(stk.url);
              onClose?.();
            }}
            className="aspect-square p-1 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/40 hover:border-rose-400 dark:hover:border-rose-500 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer flex flex-col items-center justify-center group shadow-2xs"
            title={stk.name}
          >
            <img
              src={stk.url}
              alt={stk.name}
              className="w-full h-full object-contain pointer-events-none"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Footer Branding */}
      <div className="px-2 py-1 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 text-center text-[9px] font-mono text-zinc-400 shrink-0">
        Nhấp vào nhãn dán để gửi trực tiếp vào tin nhắn
      </div>
    </div>
  );
}
