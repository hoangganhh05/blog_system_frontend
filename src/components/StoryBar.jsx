import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import storyService from "../services/storyService";
import CreateStoryModal from "./CreateStoryModal";
import StoryViewerModal from "./StoryViewerModal";
import { isVideoUrl } from "../utils/mediaUtils";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
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
    <div className="w-full mb-3 overflow-hidden">
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x select-none">
        {/* Card 1: Tạo Tin mới (Luôn hiển thị nếu đã đăng nhập) */}
        {currentUser && (
          <div
            onClick={() => setShowCreateModal(true)}
            className="flex-shrink-0 w-28 h-44 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col relative cursor-pointer shadow-xs hover:shadow-md transition-all duration-200 group snap-start"
          >
            {/* Nửa trên: Avatar */}
            <div className="flex-[1.3] bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-white text-lg bg-zinc-800 dark:bg-zinc-700">
                  {getInitials(currentUser.fullName || currentUser.username)}
                </div>
              )}
            </div>

            {/* Nút cộng + Nhãn Tạo tin ở dưới */}
            <div className="flex-[0.7] flex flex-col items-center justify-end pb-2.5 px-2 relative bg-white dark:bg-zinc-900">
              <div className="absolute -top-4.5 w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center border-3 border-white dark:border-zinc-900 shadow-md group-hover:scale-110 transition-transform">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 text-center tracking-tight">
                Tạo tin
              </span>
            </div>
          </div>
        )}

        {/* Danh sách Story các nhóm người dùng */}
        {groupedStories.map((group, idx) => {
          const user = group.user;
          const name = user.fullName || user.username;
          const firstStory = group.stories[0];
          const isMyGroup = currentUserId && user.id === currentUserId;

          return (
            <div
              key={user.id}
              onClick={() => setViewerIndex(idx)}
              className="flex-shrink-0 w-28 h-44 rounded-2xl relative overflow-hidden cursor-pointer shadow-xs hover:shadow-md transition-all duration-200 hover:scale-[1.02] border border-zinc-200 dark:border-zinc-800 p-2.5 flex flex-col justify-between group snap-start"
              style={{
                backgroundColor: firstStory.bgColor ? firstStory.bgColor : "#18181b",
              }}
            >
              {/* Nền ảnh hoặc video */}
              {!firstStory.bgColor && firstStory.mediaUrl && (
                isVideoUrl(firstStory.mediaUrl) ? (
                  <video
                    src={firstStory.mediaUrl}
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <img
                    src={firstStory.mediaUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

              {/* Avatar với viền gradient */}
              <div className="relative z-10 p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 w-9 h-9 shadow-md flex items-center justify-center shrink-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={name}
                    className="w-full h-full rounded-full object-cover border-1.5 border-white dark:border-zinc-900"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-zinc-900 text-white font-bold text-[10px] flex items-center justify-center border-1.5 border-white dark:border-zinc-900">
                    {getInitials(name)}
                  </div>
                )}
              </div>

              {/* Text content preview (nếu là story chữ) */}
              {firstStory.bgColor && firstStory.textContent && (
                <div className="relative z-10 my-auto text-center px-1">
                  <p className="text-[11px] font-bold text-white leading-tight line-clamp-3 drop-shadow-sm">
                    {firstStory.textContent}
                  </p>
                </div>
              )}

              {/* Tên hiển thị */}
              <span className="relative z-10 text-[11px] font-bold text-white truncate drop-shadow-md">
                {isMyGroup ? "Tin của bạn" : name}
              </span>
            </div>
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
