import { useChat } from "../context/ChatContext";
import ChatBoxWindow from "./ChatBoxWindow";

export default function FloatingChatDock() {
  const { activeChats } = useChat();

  if (!activeChats || activeChats.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-20 flex items-end space-x-3 z-40 pointer-events-none select-none">
      {activeChats.map((chat) => (
        <ChatBoxWindow key={chat.user.id} chat={chat} />
      ))}
    </div>
  );
}
