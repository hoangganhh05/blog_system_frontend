import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Sparkles,
  Send,
  Loader2,
  Trash2,
  Copy,
  Check,
  Image as ImageIcon,
  RotateCcw,
  Square,
  AlertCircle,
} from "lucide-react";
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
        "Xin chào! Mình là **Trợ lý BlogViet** được hỗ trợ bởi trí tuệ nhân tạo Gemini 3.7 Flash ✨.\n\nMình có thể giúp bạn lên ý tưởng, viết bài blog, tóm tắt nội dung, giải đáp thắc mắc và phân tích hình ảnh (ảnh chụp màn hình, ảnh lỗi, v.v.). Hãy nhắn hoặc gửi ảnh cho mình nhé!",
      time: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null); // { file, previewUrl, base64, mimeType }
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Đóng hộp thoại tin nhắn bạn bè để tránh xung đột giao diện khi mở Trợ lý AI
      window.dispatchEvent(new CustomEvent("close_chat_widget"));

      const timer = setTimeout(() => {
        inputRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          onClose?.();
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    // Auto scroll when streaming or new message arrives
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, isStreaming]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, JPEG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng ảnh tối đa là 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage({
        file,
        previewUrl: event.target.result,
        base64: event.target.result,
        mimeType: file.type || "image/jpeg",
      });
      toast.success("Đã đính kèm ảnh thành công!");
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsThinking(false);
    setIsStreaming(false);
  };

  const handleSendMessage = async (textToSend, imageOverride = null) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    const currentImage = imageOverride !== null ? imageOverride : selectedImage;

    if ((!text && !currentImage) || isThinking || isStreaming) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      image: currentImage?.previewUrl || null,
      time: new Date(),
    };

    const aiMsgId = `ai-${Date.now()}`;
    const placeholderAiMsg = {
      id: aiMsgId,
      role: "ai",
      content: "",
      isStreaming: true,
      time: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, placeholderAiMsg]);
    setInputText("");
    setSelectedImage(null);
    setIsThinking(true);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await aiService.streamChatWithAI(
        text,
        currentImage?.base64,
        currentImage?.mimeType,
        (chunk) => {
          setIsThinking(false); // First chunk received
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? { ...msg, content: (msg.content || "") + chunk }
                : msg
            )
          );
        },
        controller.signal
      );

      // Finish streaming
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
        )
      );
    } catch (err) {
      if (err.name === "AbortError") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  content: msg.content || "(Đã dừng tạo phản hồi)",
                  isStreaming: false,
                }
              : msg
          )
        );
        return;
      }

      console.error("Lỗi AI Streaming:", err);
      // Mark as error with retry capability
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                isError: true,
                isStreaming: false,
                failedPrompt: text,
                failedImage: currentImage,
                content:
                  msg.content ||
                  "Không thể kết nối hoặc phản hồi từ máy chủ AI bị gián đoạn. Vui lòng bấm Thử lại!",
              }
            : msg
        )
      );
      toast.error("Không thể kết nối với Trợ lý AI. Bạn có thể bấm Thử lại!");
    } finally {
      setIsThinking(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleRetry = (msg) => {
    if (!msg || (!msg.failedPrompt && !msg.failedImage)) return;
    // Remove the errored message and re-send
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    handleSendMessage(msg.failedPrompt, msg.failedImage);
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Đã sao chép câu trả lời!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    handleStopGenerating();
    setMessages([
      {
        id: "ai-intro-new",
        role: "ai",
        content:
          "Đã làm mới đoạn hội thoại! Bạn muốn khám phá hoặc phân tích hình ảnh gì tiếp theo? ✨",
        time: new Date(),
      },
    ]);
    setSelectedImage(null);
    toast.info("Đã xóa lịch sử trò chuyện với AI");
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pt-20 pb-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg h-[560px] max-h-[calc(100vh-96px)] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
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
                  Gemini 3.7 Flash · Streaming
                </span>
              </div>
              <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Phản hồi siêu tốc 24/7
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
                    className={`px-4 py-2.5 text-xs font-normal leading-relaxed whitespace-pre-wrap break-words rounded-2xl flex flex-col gap-2 ${
                      isUser
                        ? "bg-black text-white dark:bg-white dark:text-black rounded-br-xs shadow-sm"
                        : msg.isError
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60 rounded-bl-xs shadow-sm"
                        : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/60 rounded-bl-xs shadow-sm"
                    }`}
                  >
                    {/* User Attached Image Thumbnail */}
                    {msg.image && (
                      <div className="rounded-xl overflow-hidden max-w-[220px] max-h-52 border border-black/10 dark:border-white/10">
                        <img
                          src={msg.image}
                          alt="Ảnh đính kèm"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}

                    {/* AI Streaming Loading Indicator inside bubble */}
                    {!isUser && !msg.content && msg.isStreaming && (
                      <div className="flex items-center gap-2 text-zinc-400 py-0.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                        <span className="text-[11px]">Đang tạo câu trả lời...</span>
                      </div>
                    )}

                    {/* Text Content */}
                    {msg.content && (
                      <span className="relative">
                        {msg.content}
                        {msg.isStreaming && (
                          <span className="inline-block w-1.5 h-3.5 bg-indigo-500 animate-pulse ml-1 translate-y-0.5" />
                        )}
                      </span>
                    )}

                    {/* Error Box with Retry Button */}
                    {msg.isError && (
                      <div className="mt-2 pt-2 border-t border-rose-200 dark:border-rose-800/50 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Gặp sự cố khi phản hồi</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRetry(msg)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shrink-0"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Thử lại</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {!isUser && msg.content && !msg.isStreaming && !msg.isError && (
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

          {/* Floating Stop Generating Control */}
          {isStreaming && (
            <div className="sticky bottom-0 flex justify-center py-1">
              <button
                type="button"
                onClick={handleStopGenerating}
                className="px-3 py-1.5 rounded-full bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-sm hover:scale-105 transition active:scale-95 cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Dừng tạo phản hồi</span>
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length <= 2 && !isThinking && !isStreaming && !selectedImage && (
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

        {/* Image Preview Thumbnail (Above Input) */}
        {selectedImage && (
          <div className="px-4 pt-2.5 pb-1 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="relative group w-12 h-12 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shrink-0 shadow-2xs">
              <img
                src={selectedImage.previewUrl}
                alt="Xem trước ảnh"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
                title="Xóa ảnh"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {selectedImage.file?.name || "Ảnh đính kèm"}
              </span>
              <span className="text-[10px] text-zinc-400">
                {(selectedImage.file?.size
                  ? (selectedImage.file.size / 1024).toFixed(1) + " KB"
                  : "")} · Sẵn sàng gửi để AI phân tích
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="p-1 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Hủy đính kèm"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
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
          {/* Nút chọn ảnh / Upload Image Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isThinking || isStreaming}
            className="p-2.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer disabled:opacity-40 shrink-0"
            title="Đính kèm hình ảnh để AI phân tích"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              selectedImage
                ? "Nhập câu hỏi về hình ảnh này (hoặc bấm gửi để AI phân tích)..."
                : "Hỏi bất kỳ điều gì với Trợ lý BlogViet..."
            }
            disabled={isThinking || isStreaming}
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition"
          />

          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedImage) || isThinking || isStreaming}
            className="w-9 h-9 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center hover:opacity-90 active:scale-95 transition cursor-pointer disabled:opacity-40 shrink-0"
          >
            {isThinking || isStreaming ? (
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
