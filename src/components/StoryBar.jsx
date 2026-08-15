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
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-2.5 sm:p-3 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar py-0.5 scroll-smooth touch-pan-x overscroll-x-contain">
        {/* 1. THẺ TẠO TIN (DẠNG DỌC CHUẨN FACEBOOK/INSTAGRAM) */}
        {currentUser && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="w-26 h-40 sm:w-28 sm:h-44 rounded-2xl relative overflow-hidden flex-shrink-0 flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 group cursor-pointer shadow-xs hover:shadow-md transition-all duration-300 select-none bg-zinc-100 dark:bg-zinc-800/90 text-left focus:outline-none"
          >
            {/* Nửa trên: Ảnh đại diện/ảnh bìa user */}
            <div className="relative w-full h-[66%] overflow-hidden bg-zinc-200 dark:bg-zinc-700">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName || currentUser.username}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-bold text-white text-xl group-hover:scale-105 transition-transform duration-300"
                  style={{ backgroundColor: currentUser.avatarColor || "#4f46e5" }}
                >
                  {getInitials(currentUser.fullName || currentUser.username)}
                </div>
              )}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
            </div>

            {/* Nửa dưới: Nút tạo + text */}
            <div className="relative w-full h-[34%] bg-white dark:bg-zinc-800 flex flex-col items-center justify-end pb-1.5 px-1">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center border-3 border-white dark:border-zinc-800 shadow-md group-hover:scale-110 group-hover:bg-indigo-700 transition-all duration-200">
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate text-center">
                Tạo tin
              </span>
            </div>
          </button>
        )}

        {/* 2. DANH SÁCH THẺ DỌC: "TIN CỦA BẠN" & TIN CỦA BẠN BÈ */}
        {groupedStories.map((group, idx) => {
          const user = group.user || {};
          const isMyStory = currentUserId && (Number(user.id) === Number(currentUserId) || Number(user.id) === Number(currentUser?.id));
          const displayName = isMyStory ? "Tin của bạn" : user.fullName || user.username || "Người dùng";
          const latestStory = group.stories?.[group.stories.length - 1];
          const storyMedia = latestStory?.mediaUrl || latestStory?.imageUrl;
          const userAvatar = isMyStory ? (currentUser?.avatarUrl || user.avatarUrl) : user.avatarUrl;
          const userColor = isMyStory ? (currentUser?.avatarColor || user.avatarColor) : user.avatarColor;
          const backgroundMedia = storyMedia || userAvatar;

          return (
            <button
              key={user.id || idx}
              type="button"
              onClick={() => setViewerIndex(idx)}
              className="w-26 h-40 sm:w-28 sm:h-44 rounded-2xl relative overflow-hidden flex-shrink-0 flex flex-col justify-between border border-zinc-200/80 dark:border-zinc-800 group cursor-pointer shadow-xs hover:shadow-md transition-all duration-300 select-none bg-zinc-900 text-left focus:outline-none"
            >
              {/* Ảnh nền / Media Thumbnail chiếm trọn khung */}
              {backgroundMedia ? (
                <img
                  src={backgroundMedia}
                  alt={displayName}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div
                  className="absolute inset-0 w-full h-full flex items-center justify-center font-bold text-white text-3xl group-hover:scale-105 transition-transform duration-300"
                  style={{ backgroundColor: latestStory?.bgColor || userColor || "#4f46e5" }}
                >
                  {latestStory?.textContent ? (
                    <span className="p-3 text-xs text-center font-medium line-clamp-4">
                      {latestStory.textContent}
                    </span>
                  ) : (
                    getInitials(displayName)
                  )}
                </div>
              )}

              {/* Lớp phủ Gradient mờ tối để làm nổi bật Avatar và Tên */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 pointer-events-none group-hover:from-black/60 group-hover:to-black/90 transition-colors" />

              {/* Avatar ở góc trên cùng bên trái với viền sáng nhận diện tin */}
              <div className="relative z-10 p-2.5">
                <div className="w-9 h-9 rounded-full ring-2 ring-indigo-500 dark:ring-white p-0.5 bg-black/20 backdrop-blur-xs flex items-center justify-center overflow-hidden shadow-md">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={displayName}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center font-bold text-white text-[11px]"
                    style={{
                      backgroundColor: userColor || "#4f46e5",
                      display: userAvatar ? "none" : "flex",
                    }}
                  >
                    {getInitials(displayName)}
                  </div>
                </div>
              </div>

              {/* Tên người dùng / "Tin của bạn" ở góc dưới */}
              <div className="relative z-10 p-2.5">
                <span className="text-white text-xs font-bold drop-shadow-md truncate block leading-tight">
                  {displayName}
                </span>
              </div>
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
