import { useState, useEffect } from "react";
import { X, Archive, Calendar, Eye, Loader2, Sparkles } from "lucide-react";
import storyService from "../services/storyService";
import StoryViewerModal from "./StoryViewerModal";
import { isVideoUrl } from "../utils/mediaUtils";

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function StoryArchiveModal({ isOpen = true, onClose, userId }) {
  const [archivedStories, setArchivedStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerStory, setViewerStory] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    storyService
      .getArchivedStories(userId)
      .then((res) => {
        setArchivedStories(res.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Kho lưu trữ tin (Story Archive)
              </h2>
              <p className="text-xs text-zinc-500">
                Chỉ bạn mới có thể xem các tin 24h đã lưu trữ này
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto min-h-[300px]">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs font-medium">Đang tải kho lưu trữ...</span>
            </div>
          ) : archivedStories.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-zinc-400 text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-600">
                <Archive className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Chưa có tin nào trong kho lưu trữ
                </p>
                <p className="text-xs text-zinc-500 max-w-xs mt-1">
                  Khi tin 24h của bạn hết hạn, chúng sẽ tự động được lưu trữ tại đây một cách an toàn.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {archivedStories.map((story) => (
                <div
                  key={story.id}
                  onClick={() => setViewerStory(story)}
                  className="aspect-[9/16] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative cursor-pointer group shadow-xs hover:shadow-md hover:scale-[1.02] transition duration-200"
                  style={{
                    backgroundColor: story.bgColor ? story.bgColor : "#18181b",
                  }}
                >
                  {/* Media background */}
                  {!story.bgColor && story.mediaUrl && (
                    isVideoUrl(story.mediaUrl) ? (
                      <video
                        src={story.mediaUrl}
                        muted
                        playsInline
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <img
                        src={story.mediaUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

                  {/* Text Content for Text Story */}
                  {story.bgColor && story.textContent && (
                    <div className="absolute inset-0 p-2.5 flex items-center justify-center text-center">
                      <p className="text-[11px] font-bold text-white line-clamp-4 leading-tight drop-shadow-sm">
                        {story.textContent}
                      </p>
                    </div>
                  )}

                  {/* Date Badge */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-bold text-white drop-shadow-md">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(story.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <span className="text-xs text-zinc-500">
            Tổng cộng: <strong className="text-zinc-800 dark:text-zinc-200">{archivedStories.length}</strong> tin đã lưu trữ
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Story Viewer for Single Selected Story */}
      {viewerStory && (
        <StoryViewerModal
          groupedStories={[
            {
              user: viewerStory.user,
              stories: [viewerStory],
            },
          ]}
          initialUserIndex={0}
          onClose={() => setViewerStory(null)}
        />
      )}
    </div>
  );
}
