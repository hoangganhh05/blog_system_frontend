import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Send, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import postService from "../services/postService";
import commentService from "../services/commentService";
import PostCard from "../components/PostCard";
import Comment from "../components/Comment";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const replyInputRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    postService.getById(id)
      .then((res) => setPost(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    commentService.getByPost(id)
      .then((res) => setComments(res.data || []))
      .catch(() => {});
  }, [id]);

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmitting || !currentUserId) return;

    setIsSubmitting(true);
    try {
      const payload = {
        content: replyText.trim(),
        post: { id: Number(id) }
      };
      const res = await commentService.create(payload);
      setComments((prev) => [...prev, res.data]);
      setReplyText("");
    } catch {
      alert("Không thể gửi bình luận. Vui lòng thử lại!");
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
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 h-13 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-6 px-4 shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition text-zinc-700 dark:text-zinc-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-extrabold text-base text-zinc-900 dark:text-white">
          Bài viết
        </span>
      </header>

      {/* Main Post Card */}
      <PostCard
        post={post}
        isDetailed={true}
        onDelete={() => navigate("/")}
      />

      {/* Reply Composer Box */}
      {currentUser && (
        <form
          onSubmit={handleCreateComment}
          className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/30"
        >
          <div className="shrink-0">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt=""
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
                style={{ backgroundColor: currentUser.avatarColor || "#4f46e5" }}
              >
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
            className="flex-1 bg-transparent border-none text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!replyText.trim() || isSubmitting}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              replyText.trim()
                ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 active:scale-95"
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Trả lời"}
          </button>
        </form>
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
