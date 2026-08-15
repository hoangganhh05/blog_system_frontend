import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import postService from "../services/postService";
import commentService from "../services/commentService";
import PostCard from "../components/PostCard";
import Comment from "../components/Comment";
import GifPicker from "../components/GifPicker";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [selectedGif, setSelectedGif] = useState(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const replyInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    postService
      .getById(id)
      .then((res) => {
        if (cancelled) return;
        setPost(res.data);
      })
      .catch(() => {
        if (!cancelled) setPost(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Fetch comments
    commentService
      .getByPost(id)
      .then((res) => {
        if (cancelled) return;
        setComments(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleCreateComment = async (e) => {
    if (e) e.preventDefault();
    if ((!replyText.trim() && !selectedGif) || isSubmitting || !currentUserId) return;

    setIsSubmitting(true);
    try {
      let finalContent = replyText.trim();
      if (selectedGif) {
        finalContent = finalContent ? `${finalContent} 📷 ${selectedGif}` : `📷 ${selectedGif}`;
      }

      const payload = {
        content: finalContent,
        post: { id: Number(id) }
      };
      const res = await commentService.create(payload);
      setComments((prev) => [...prev, res.data]);
      setReplyText("");
      setSelectedGif(null);
      setShowGifPicker(false);
      toast.success("Đã đăng bình luận!");
    } catch {
      toast.error("Không thể gửi bình luận. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = (delId) => {
    setComments((prev) => prev.filter((c) => c.id !== delId));
  };

  const handleReplyCreated = (newReply) => {
    setComments((prev) => [...prev, newReply]);
  };

  if (loading) {
    return (
      <div className="p-12 text-center flex justify-center text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-12 text-center text-zinc-500">
        <p>Không tìm thấy bài viết này hoặc bài viết đã bị xóa.</p>
        <Link to="/" className="text-primary font-bold mt-2 inline-block">
          ← Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-3 mb-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-300 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">
          Bài viết
        </span>
      </div>

      {/* Main Post Card */}
      <PostCard
        post={post}
        isDetailed={true}
        onDelete={() => navigate("/")}
        onEdit={(updated) => setPost(updated)}
      />

      {/* Reply Composer Box with GIF Support */}
      {currentUser && (
        <div className="relative mb-3">
          {showGifPicker && (
            <div className="absolute bottom-full right-0 mb-2 z-50 shadow-2xl">
              <GifPicker
                onSelectGif={(url) => {
                  setSelectedGif(url);
                  setShowGifPicker(false);
                }}
                onClose={() => setShowGifPicker(false)}
              />
            </div>
          )}

          <form
            onSubmit={handleCreateComment}
            className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2.5 bg-white dark:bg-zinc-900 shadow-xs"
          >
            {/* Selected GIF Preview */}
            {selectedGif && (
              <div className="relative inline-block self-start rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm max-w-[200px] max-h-[140px]">
                <img src={selectedGif} alt="GIF preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setSelectedGif(null)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-black transition cursor-pointer"
                  title="Gỡ ảnh GIF"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="shrink-0">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs bg-zinc-800 dark:bg-zinc-700 shrink-0">
                    {getInitials(currentUser.fullName || currentUser.username)}
                  </div>
                )}
              </div>

              <input
                ref={replyInputRef}
                type="text"
                placeholder="Đăng câu trả lời của bạn..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 bg-transparent border-none text-[14px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
              />

              {/* GIF Button */}
              <button
                type="button"
                onClick={() => setShowGifPicker((prev) => !prev)}
                className={`px-2 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                  showGifPicker || selectedGif
                    ? "bg-amber-500 text-black shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
                title="Chọn ảnh GIF động"
              >
                GIF
              </button>

              <button
                type="submit"
                disabled={(!replyText.trim() && !selectedGif) || isSubmitting}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-white dark:text-black bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Trả lời"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Threaded Comments List */}
      <div className="flex flex-col px-4">
        {comments.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 flex flex-col items-center gap-2">
            <MessageSquare className="w-8 h-8 stroke-[1.5] text-zinc-300 dark:text-zinc-700" />
            <p className="text-xs">Chưa có bình luận nào. Hãy là người đầu tiên trả lời!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              onDelete={handleDeleteComment}
              onReplyCreated={handleReplyCreated}
            />
          ))
        )}
      </div>
    </div>
  );
}
