import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import storyService from "../services/storyService";
import CreateStoryModal from "./CreateStoryModal";
import StoryViewerModal from "./StoryViewerModal";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StoryBar() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  const [groupedStories, setGroupedStories] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null);

  const loadStories = async () => {
    try {
      const res = await storyService.getActiveStories();
      const list = res.data || [];

      const groupsMap = new Map();
      list.forEach((story) => {
        const userId = story.user?.id;
        if (!userId) return;
        if (!groupsMap.has(userId)) {
          groupsMap.set(userId, {
            user: story.user,
            stories: [],
          });
        }
        groupsMap.get(userId).stories.push(story);
      });

      const groupedArray = Array.from(groupsMap.values());

      // Sắp xếp: Story của chính mình lên đầu tiên
      groupedArray.sort((a, b) => {
        if (currentUserId) {
          if (a.user.id === currentUserId) return -1;
          if (b.user.id === currentUserId) return 1;
        }
        return 0;
      });

      setGroupedStories(groupedArray);
    } catch {
      // Fail silently
    }
  };

  useEffect(() => {
    loadStories();
  }, [currentUserId]);

  const handleStoryCreated = () => {
    loadStories();
  };

  const handleStoryDeleted = () => {
    loadStories();
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3.5 mb-4 shadow-sm">
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
        {/* 1. NÚT TẠO TIN (Tối giản, nhỏ gọn) */}
        {currentUser && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer focus:outline-none"
          >
            <div className="relative w-14 h-14 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 group-hover:border-black dark:group-hover:border-white transition">
              <Plus className="w-5 h-5 text-zinc-600 dark:text-zinc-300 group-hover:scale-110 transition-transform stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
              Tạo tin
            </span>
          </button>
        )}

        {/* 2. DANH SÁCH TIN CỦA BẠN BÈ & NGƯỜI DÙNG (Hiển thị thumbnail story hoặc Avatar) */}
        {groupedStories.map((group, idx) => {
          const user = group.user || {};
          const isMyStory = currentUserId && (Number(user.id) === Number(currentUserId) || Number(user.id) === Number(currentUser?.id));
          const displayName = isMyStory ? "Tin của bạn" : user.fullName || user.username || "Người dùng";
          const latestStory = group.stories?.[group.stories.length - 1];
          const storyMedia = latestStory?.mediaUrl || latestStory?.imageUrl;
          const avatarUrl = isMyStory ? (currentUser?.avatarUrl || user.avatarUrl) : user.avatarUrl;
          const thumbnailSrc = storyMedia || avatarUrl;

          return (
            <button
              key={user.id || idx}
              type="button"
              onClick={() => setViewerIndex(idx)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer focus:outline-none"
            >
              {/* Vòng viền nổi bật báo hiệu tin */}
              <div className="p-0.5 rounded-full ring-2 ring-indigo-500 dark:ring-white group-hover:scale-105 transition-transform">
                {thumbnailSrc ? (
                  <img
                    src={thumbnailSrc}
                    alt={displayName}
                    className="w-13 h-13 rounded-full object-cover border-2 border-white dark:border-zinc-900 shadow-xs"
                  />
                ) : (
                  <div
                    className="w-13 h-13 rounded-full text-white font-bold text-xs flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-xs"
                    style={{ backgroundColor: user.avatarColor || (isMyStory ? currentUser?.avatarColor : "#4f46e5") || "#4f46e5" }}
                  >
                    {getInitials(isMyStory ? (currentUser?.fullName || currentUser?.username) : (user.fullName || user.username))}
                  </div>
                )}
              </div>
              <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 max-w-[64px] truncate">
                {displayName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Modal Tạo Tin */}
      {showCreateModal && (
        <CreateStoryModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleStoryCreated}
        />
      )}

      {/* Trình Xem Tin (Story Viewer) */}
      {viewerIndex !== null && (
        <StoryViewerModal
          key={viewerIndex}
          groupedStories={groupedStories}
          initialUserIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onStoryDeleted={handleStoryDeleted}
        />
      )}
    </div>
  );
}

export default StoryBar;
