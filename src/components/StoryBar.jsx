import { useState, useEffect } from "react";
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

  const [activeStories, setActiveStories] = useState([]);
  const [groupedStories, setGroupedStories] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null); // index in groupedStories to play

  // Load và nhóm các Story
  const loadStories = async () => {
    try {
      const res = await storyService.getActiveStories();
      const list = res.data || [];
      setActiveStories(list);

      // Nhóm theo userId
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

      // Sắp xếp: Story của chính mình (nếu có) lên đầu tiên
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
    <div
      style={{
        display: "flex",
        gap: 10,
        overflowX: "auto",
        padding: "4px 0 16px 0",
        scrollbarWidth: "none", // ẩn scrollbar cho firefox
        msOverflowStyle: "none", // ẩn scrollbar cho IE/Edge
      }}
      className="story-bar-scrollable"
    >
      {/* Ẩn scrollbar trong chrome */}
      <style>{`
        .story-bar-scrollable::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Card 1: Tạo Tin mới (Luôn hiển thị nếu đã đăng nhập) */}
      {currentUser && (
        <div
          onClick={() => setShowCreateModal(true)}
          style={{
            flex: "0 0 110px",
            height: 175,
            borderRadius: 12,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          {/* Nửa trên: Avatar của tôi */}
          <div style={{ flex: 1.2, background: "var(--bg-secondary)", position: "relative", overflow: "hidden" }}>
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt="My Avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                background: currentUser.avatarColor ? `linear-gradient(135deg, ${currentUser.avatarColor}, ${currentUser.avatarColor}bb)` : "var(--primary)",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 700
              }}>
                {getInitials(currentUser.fullName || currentUser.username)}
              </div>
            )}
          </div>
          {/* Nút cộng + Nhãn Tạo tin ở dưới */}
          <div style={{
            flex: 0.8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "8px 4px",
            position: "relative",
            background: "var(--bg-card)",
          }}>
            {/* Nút tròn dấu cộng màu xanh */}
            <div style={{
              position: "absolute",
              top: -16,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#1877f2",
              border: "4px solid var(--bg-card)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 18,
              fontWeight: 800,
            }}>
              +
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textAlign: "center" }}>Tạo tin</span>
          </div>
        </div>
      )}

      {/* Danh sách Story các nhóm người dùng */}
      {groupedStories.map((group, idx) => {
        const user = group.user;
        const name = user.fullName || user.username;
        const firstStory = group.stories[0];

        // Nếu là story của mình, mà mình chỉ xem chứ không muốn click Tạo tin thì hiển thị bình thường
        // Không hiển thị trùng lặp Tạo tin
        const isMyGroup = currentUserId && user.id === currentUserId;

        return (
          <div
            key={user.id}
            onClick={() => setViewerIndex(idx)}
            style={{
              flex: "0 0 110px",
              height: 175,
              borderRadius: 12,
              background: firstStory.bgColor ? firstStory.bgColor : "#f0f2f5",
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 8,
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            {/* Nền ảnh hoặc video (nếu là story media) */}
            {!firstStory.bgColor && firstStory.mediaUrl && (
              isVideoUrl(firstStory.mediaUrl) ? (
                <video
                  src={firstStory.mediaUrl}
                  muted
                  playsInline
                  style={{
                    position: "absolute", top: 0, left: 0,
                    width: "100%", height: "100%", objectFit: "cover"
                  }}
                />
              ) : (
                <img
                  src={firstStory.mediaUrl}
                  alt="Story background"
                  style={{
                    position: "absolute", top: 0, left: 0,
                    width: "100%", height: "100%", objectFit: "cover"
                  }}
                />
              )
            )}

            {/* Bóng đổ tối mờ phủ lên nền (để dễ đọc chữ trắng) */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)",
              zIndex: 1
            }} />

            {/* Badge Avatar góc trái bên trên có viền tròn màu xanh */}
            <div style={{
              position: "absolute", top: 8, left: 8,
              width: 32, height: 32, borderRadius: "50%",
              border: isMyGroup ? "2px solid #ccc" : "2.5px solid #1877f2",
              boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              background: user.avatarColor ? `linear-gradient(135deg, ${user.avatarColor}, ${user.avatarColor}bb)` : "#1877f2",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, zIndex: 2, overflow: "hidden"
            }}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                getInitials(name)
              )}
            </div>

            {/* Preview Text nhỏ ở giữa (nếu là story chữ) */}
            {firstStory.bgColor && (
              <span style={{
                color: "#ffffff",
                fontSize: 10,
                fontWeight: 700,
                textAlign: "center",
                lineHeight: 1.3,
                zIndex: 2,
                wordBreak: "break-word",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              }}>
                {firstStory.textContent}
              </span>
            )}

            {/* Tên hiển thị ở góc dưới bên trái */}
            <span style={{
              position: "absolute", bottom: 8, left: 8, right: 8,
              color: "#ffffff", fontSize: 11, fontWeight: 700,
              zIndex: 2, textShadow: "0 1px 3px rgba(0,0,0,0.6)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
            }}>
              {isMyGroup ? "Tin của bạn" : name}
            </span>
          </div>
        );
      })}

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
