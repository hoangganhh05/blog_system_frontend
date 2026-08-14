import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Search, ArrowLeft, Loader2, UserPlus, Users } from "lucide-react";
import userService from "../services/userService";
import postService from "../services/postService";
import PostCard from "../components/PostCard";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("posts"); // "posts" | "people"
  const [inputVal, setInputVal] = useState(query);
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInputVal(query);
    if (!query.trim()) {
      setPosts([]);
      setUsers([]);
      return;
    }

    setLoading(true);
    Promise.all([
      postService.search(query.trim(), 0, 30).catch(() => ({ data: { content: [] } })),
      userService.search(query.trim(), 0, 20).catch(() => ({ data: { content: [] } }))
    ])
      .then(([postRes, userRes]) => {
        setPosts(postRes.data?.content || postRes.data || []);
        setUsers(userRes.data?.content || userRes.data || []);
      })
      .finally(() => setLoading(false));
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setSearchParams({ q: inputVal.trim() });
    }
  };

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Sticky Header with Search Input */}
      <header className="sticky top-0 z-30 h-14 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 px-3 shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition text-zinc-700 dark:text-zinc-300 shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết, tác giả..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full py-2 pl-10 pr-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </form>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("posts")}
          className={`flex-1 py-3 text-xs font-bold tracking-tight text-center relative transition ${
            activeTab === "posts"
              ? "text-zinc-950 dark:text-white"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          }`}
        >
          Bài viết ({posts.length})
          {activeTab === "posts" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950 dark:bg-white" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("people")}
          className={`flex-1 py-3 text-xs font-bold tracking-tight text-center relative transition ${
            activeTab === "people"
              ? "text-zinc-950 dark:text-white"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          }`}
        >
          Mọi người ({users.length})
          {activeTab === "people" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950 dark:bg-white" />
          )}
        </button>
      </div>

      {/* Results Feed */}
      <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
        {loading ? (
          <div className="p-12 text-center flex justify-center text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !query.trim() ? (
          <div className="p-16 text-center text-zinc-400 text-xs">
            Nhập từ khóa phía trên để bắt đầu tìm kiếm.
          </div>
        ) : activeTab === "posts" ? (
          posts.length === 0 ? (
            <div className="p-16 text-center text-zinc-400 text-xs">
              Không tìm thấy bài viết nào phù hợp với "{query}".
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )
        ) : (
          users.length === 0 ? (
            <div className="p-16 text-center text-zinc-400 text-xs">
              Không tìm thấy người dùng nào phù hợp với "{query}".
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="p-4 flex items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
                <Link to={`/profile/${user.id}`} className="flex items-center gap-3 min-w-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover" />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm"
                      style={{ backgroundColor: user.avatarColor || "#4f46e5" }}
                    >
                      {getInitials(user.fullName || user.username)}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                      {user.fullName || user.username}
                    </span>
                    <span className="text-xs text-zinc-400 truncate">
                      @{user.username}
                    </span>
                    {user.bio && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-1 mt-0.5">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </Link>

                <Link
                  to={`/profile/${user.id}`}
                  className="px-4 py-1.5 rounded-full text-xs font-bold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-80 transition shrink-0"
                >
                  Xem hồ sơ
                </Link>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
