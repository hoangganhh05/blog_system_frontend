import { useChat } from "../context/ChatContext";
import ChatBoxWindow from "./ChatBoxWindow";

export default function FloatingChatDock() {
  const { activeChats } = useChat();

  if (!activeChats || activeChats.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-4 md:right-16 z-50 flex items-end space-x-3 pointer-events-none select-none">
      {activeChats.map((chat) => (
        <ChatBoxWindow key={chat.user.id} chat={chat} />
      ))}
    </div>
  );
}
