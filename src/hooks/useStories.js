import { useState, useEffect, useCallback } from "react";
import storyService from "../services/storyService";
import { useAuth } from "../context/AuthContext";

let globalStoryChannel = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    globalStoryChannel = new BroadcastChannel("blogviet_stories_sync");
  } catch {
    globalStoryChannel = null;
  }
}

export function useStories() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? Number(currentUser.id || currentUser.userId) : null;

  const [rawStories, setRawStories] = useState([]);
  const [groupedStories, setGroupedStories] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshStories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await storyService.getActiveStories();
      const list = res.data || [];
      setRawStories(list);

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
          if (Number(a.user.id) === currentUserId) return -1;
          if (Number(b.user.id) === currentUserId) return 1;
        }
        return 0;
      });

      setGroupedStories(groupedArray);
    } catch {
      // Fail silently
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    refreshStories();
  }, [refreshStories]);

  // Real-time synchronization across tabs and components
  useEffect(() => {
    const handleBroadcast = (e) => {
      if (e.data?.type === "STORIES_UPDATED") {
        refreshStories();
      }
    };

    const handleCustomEvent = () => {
      refreshStories();
    };

    if (globalStoryChannel) {
      globalStoryChannel.addEventListener("message", handleBroadcast);
    }
    window.addEventListener("blogviet_stories_updated", handleCustomEvent);

    return () => {
      if (globalStoryChannel) {
        globalStoryChannel.removeEventListener("message", handleBroadcast);
      }
      window.removeEventListener("blogviet_stories_updated", handleCustomEvent);
    };
  }, [refreshStories]);

  const notifyStoriesUpdated = useCallback(() => {
    if (globalStoryChannel) {
      try {
        globalStoryChannel.postMessage({ type: "STORIES_UPDATED", timestamp: Date.now() });
      } catch {}
    }
    window.dispatchEvent(new CustomEvent("blogviet_stories_updated"));
  }, []);

  const createStory = useCallback(
    async (payload) => {
      if (!currentUserId) throw new Error("Chưa đăng nhập");
      const res = await storyService.create(currentUserId, payload);
      notifyStoriesUpdated();
      await refreshStories();
      return res;
    },
    [currentUserId, notifyStoriesUpdated, refreshStories]
  );

  const deleteStory = useCallback(
    async (storyId) => {
      const res = await storyService.delete(storyId);
      notifyStoriesUpdated();
      await refreshStories();
      return res;
    },
    [notifyStoriesUpdated, refreshStories]
  );

  const reactStory = useCallback(
    async (storyId, reaction) => {
      const res = await storyService.react(storyId, currentUserId, reaction);
      notifyStoriesUpdated();
      return res;
    },
    [currentUserId, notifyStoriesUpdated]
  );

  const viewStory = useCallback(
    async (storyId) => {
      return storyService.view(storyId, currentUserId).catch(() => {});
    },
    [currentUserId]
  );

  return {
    rawStories,
    groupedStories,
    loading,
    refreshStories,
    createStory,
    deleteStory,
    reactStory,
    viewStory,
    notifyStoriesUpdated,
  };
}

export default useStories;
