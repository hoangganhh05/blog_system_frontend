import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, Send, Loader2, Bot, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import aiService from "../services/aiService";

const QUICK_SUGGESTIONS = [
  "💡 Gợi ý 3 chủ đề viết blog hấp dẫn hôm nay",
  "✍️ Viết bài ngắn về cân bằng cuộc sống và công việc",
  "☕ Sáng tác 1 bài thơ ngắn về cà phê sáng",
  "🚀 Bí quyết tối ưu tư duy cho lập trình viên",
];

export default function AiAssistantModal({ isOpen = true, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: "ai-intro",
      role: "ai",
      content:
        "Xin chào! Mình là **Trợ lý BlogViet** được hỗ trợ bởi trí tuệ nhân tạo Gemini 1.5 Flash ✨.\n\nMình có thể giúp bạn lên ý tưởng, viết bài blog, tóm tắt nội dung hay trò chuyện giải đáp bất kỳ chủ đề nào. Hãy nhắn cho mình nhé!",
      time: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isOpen, messages, isThinking]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || isThinking) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      time: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsThinking(true);

    try {
      const reply = await aiService.chatWithAI(text);
      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: reply,
        time: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("Lỗi AI:", err);
      toast.error("Không thể kết nối với Trợ lý AI. Vui lòng thử lại!");
    } finally {
      setIsThinking(false);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Đã sao chép câu trả lời!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: "ai-intro-new",
        role: "ai",
        content: "Đã làm mới đoạn hội thoại! Bạn muốn khám phá chủ đề gì tiếp theo? ✨",
        time: new Date(),
      },
    ]);
    toast.info("Đã xóa lịch sử trò chuyện với AI");
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pt-20 pb-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg h-[540px] max-h-[calc(100vh-96px)] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Trợ lý BlogViet
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60">
                  Gemini 1.5
                </span>
              </div>
              <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sẵn sàng giải đáp 24/7
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClearHistory}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Làm mới hội thoại"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Body */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3.5 bg-zinc-50/50 dark:bg-zinc-950/40">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"} gap-1`}
              >
                <div
                  className={`flex items-end gap-2 max-w-[88%] group ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] shrink-0 mb-1 shadow-xs">
                      ✨
                    </div>
                  )}

                  <div
                    className={`px-4 py-2.5 text-xs font-normal leading-relaxed whitespace-pre-wrap break-words rounded-2xl ${
                      isUser
                        ? "bg-black text-white dark:bg-white dark:text-black rounded-br-xs shadow-sm"
                        : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/60 rounded-bl-xs shadow-sm"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="opacity-0 group-hover:opacity-100 transition p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                      title="Sao chép"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Thinking State */}
          {isThinking && (
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 p-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <span>Trợ lý BlogViet đang suy nghĩ và tạo câu trả lời...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length <= 2 && !isThinking && (
          <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(sug)}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 whitespace-nowrap transition cursor-pointer"
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Input Footer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Hỏi bất kỳ điều gì với Trợ lý BlogViet..."
            disabled={isThinking}
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="w-9 h-9 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center hover:opacity-90 active:scale-95 transition cursor-pointer disabled:opacity-40 shrink-0"
          >
            {isThinking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
