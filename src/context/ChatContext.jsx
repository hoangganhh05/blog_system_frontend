import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import chatService from "../services/chatService";
import { DEFAULT_THEME_ID } from "../utils/chatThemes";

const ChatContext = createContext(null);

const MAX_ACTIVE_CHATS = 3;

export function ChatProvider({ children }) {
  const { currentUser } = useAuth();
  const [activeChats, setActiveChats] = useState([]);

  // Lắng nghe sự kiện mở chat từ bất kỳ đâu (Profile, Friends page, Search, PostCard, Sidebar)
  useEffect(() => {
    const handleOpenFloatingChat = (event) => {
      const u = event.detail?.user || event.detail?.friend || event.detail?.targetUser;
      if (u) {
        openChat(u);
      }
    };

    window.addEventListener("open_floating_chat", handleOpenFloatingChat);
    window.addEventListener("open_chat_user", handleOpenFloatingChat);
    return () => {
      window.removeEventListener("open_floating_chat", handleOpenFloatingChat);
      window.removeEventListener("open_chat_user", handleOpenFloatingChat);
    };
  }, [openChat]);

  // Lắng nghe sự kiện đổi theme qua Realtime WebSocket / Custom Event
  useEffect(() => {
    const handleThemeUpdated = (event) => {
      const { conversationId, targetUserId, theme } = event.detail || {};
      if (!theme) return;

      setActiveChats((prev) =>
        prev.map((chat) => {
          if (
            (conversationId && chat.conversationId === conversationId) ||
            (targetUserId && String(chat.user.id) === String(targetUserId))
          ) {
            return { ...chat, theme };
          }
          return chat;
        })
      );
    };

    window.addEventListener("chat_theme_updated", handleThemeUpdated);
    return () => window.removeEventListener("chat_theme_updated", handleThemeUpdated);
  }, []);

  // Mở box chat với một người dùng
  const openChat = useCallback(async (user) => {
    if (!user || !user.id) return;
    const targetUserId = user.id;

    setActiveChats((prev) => {
      const existingIndex = prev.findIndex((c) => String(c.user.id) === String(targetUserId));

      if (existingIndex !== -1) {
        // Tab đã mở: Đưa lên đầu và phóng to
        const updated = [...prev];
        const [targetChat] = updated.splice(existingIndex, 1);
        return [{ ...targetChat, isMinimized: false }, ...updated];
      }

      // Tab mới: Chuẩn bị thông tin khởi tạo
      const newChat = {
        conversationId: null,
        user,
        isMinimized: false,
        theme: DEFAULT_THEME_ID,
        unreadCount: 0,
      };

      // Giới hạn tối đa MAX_ACTIVE_CHATS (3 tab)
      let nextList = [newChat, ...prev];
      if (nextList.length > MAX_ACTIVE_CHATS) {
        // Tự động thu nhỏ các tab thứ 3 trở đi
        nextList = nextList.map((chat, idx) => (idx >= 2 ? { ...chat, isMinimized: true } : chat));
        // Nếu quá 4 tab thì cắt bớt tab cũ nhất
        if (nextList.length > 4) {
          nextList = nextList.slice(0, 4);
        }
      }

      return nextList;
    });

    // Gọi API lấy Theme đã lưu của cuộc trò chuyện trong DB
    try {
      const res = await chatService.getConversationWithUser(targetUserId);
      if (res.data) {
        const { id, theme } = res.data;
        setActiveChats((prev) =>
          prev.map((chat) =>
            String(chat.user.id) === String(targetUserId)
              ? { ...chat, conversationId: id, theme: theme || DEFAULT_THEME_ID }
              : chat
          )
        );
      }
    } catch {
      // Bỏ qua lỗi ngầm nếu server chưa nạp
    }
  }, []);

  // Đóng box chat
  const closeChat = useCallback((userId) => {
    setActiveChats((prev) => prev.filter((chat) => String(chat.user.id) !== String(userId)));
  }, []);

  // Thu nhỏ box chat
  const minimizeChat = useCallback((userId) => {
    setActiveChats((prev) =>
      prev.map((chat) => (String(chat.user.id) === String(userId) ? { ...chat, isMinimized: true } : chat))
    );
  }, []);

  // Phóng to / Mở lại box chat
  const maximizeChat = useCallback((userId) => {
    setActiveChats((prev) =>
      prev.map((chat) => (String(chat.user.id) === String(userId) ? { ...chat, isMinimized: false } : chat))
    );
  }, []);

  // Toggle thu nhỏ / phóng to
  const toggleMinimizeChat = useCallback((userId) => {
    setActiveChats((prev) =>
      prev.map((chat) =>
        String(chat.user.id) === String(userId) ? { ...chat, isMinimized: !chat.isMinimized } : chat
      )
    );
  }, []);

  // Đổi Theme cuộc trò chuyện & Đồng bộ qua API + Realtime Event
  const setChatTheme = useCallback(async (userId, newTheme) => {
    setActiveChats((prev) =>
      prev.map((chat) => (String(chat.user.id) === String(userId) ? { ...chat, theme: newTheme } : chat))
    );

    try {
      await chatService.updateThemeWithUser(userId, newTheme);
      // Phát sự kiện đồng bộ toàn client
      window.dispatchEvent(
        new CustomEvent("chat_theme_updated", {
          detail: { targetUserId: userId, theme: newTheme },
        })
      );
    } catch {
      // Fallback
    }
  }, []);

  return (
    <ChatContext.Provider
      value={{
        activeChats,
        openChat,
        closeChat,
        minimizeChat,
        maximizeChat,
        toggleMinimizeChat,
        setChatTheme,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
