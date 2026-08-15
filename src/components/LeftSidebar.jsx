import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Home, Compass, Users, Bookmark, BarChart2, Shield, Hash, Sparkles, Radio } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";
import friendService from "../services/friendService";

import Logo from "./Logo";
import Avatar from "./Avatar";

const TRENDING_TAGS = [
  { tag: "#Vinahouse", count: "1.2k" },
  { tag: "#IT", count: "3.4k" },
  { tag: "#Chung", count: "5.8k" },
  { tag: "#LapTrinh", count: "2.1k" },
  { tag: "#DuLich", count: "980" },
  { tag: "#AI", count: "4.5k" },
  { tag: "#DoiSong", count: "1.8k" },
];

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function LeftSidebar() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? Number(currentUser.id || currentUser.userId) : null;

  const [stats, setStats] = useState({
    postCount: 0,
    totalViews: 0,
    friendCount: 0,
  });

  useEffect(() => {
    if (currentUserId) {
      // Fetch user stats
      userService
        .getUserStats(currentUserId)
        .then((res) => {
          if (res.data) {
            setStats((prev) => ({
              ...prev,
              postCount: res.data.postCount || res.data.totalPosts || 0,
              totalViews: res.data.totalViews || res.data.viewCount || 0,
            }));
          }
        })
        .catch(() => {});

      // Fetch friend count
      friendService
        .getFriendCount(currentUserId)
        .then((res) => {
          if (res.data) {
            setStats((prev) => ({
              ...prev,
              friendCount: res.data.count || 0,
            }));
          }
        })
        .catch(() => {});
    }
  }, [currentUserId]);

  return (
    <div className="w-full flex flex-col space-y-4 px-1">
      {/* 1. Profile Shortcut Card hoặc Guest Login Card (Dạng phẳng) */}
      {currentUser ? (
        <div className="flex flex-col gap-3 px-2 py-1">
          <Link
            to={`/profile/${currentUserId}`}
            className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 transition group"
          >
            <Avatar
              userId={currentUserId}
              src={currentUser.avatarUrl}
              name={currentUser.fullName || currentUser.username}
              username={currentUser.username}
              avatarColor={currentUser.avatarColor}
              size="md"
              isOnline={currentUser.isOnline}
              lastActiveAt={currentUser.lastActiveAt}
              showActiveStatus={currentUser.showActiveStatus}
              className="border border-zinc-200 dark:border-zinc-700 shadow-xs"
            />

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:underline">
                {currentUser.fullName || currentUser.username}
              </span>
              <span className="text-[11px] text-zinc-500 truncate">
                @{currentUser.username}
              </span>
            </div>
          </Link>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-200/80 dark:border-zinc-800/80 text-center">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {stats.postCount}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Bài viết</span>
            </div>
            <div className="flex flex-col border-x border-slate-200/80 dark:border-zinc-800/80">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {stats.totalViews}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Lượt xem</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {stats.friendCount}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Bạn bè</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-2.5 text-center items-center rounded-2xl bg-slate-200/40 dark:bg-zinc-800/40">
          <Logo size="md" />
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            Chào mừng đến BlogViet!
          </span>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Đăng nhập để chia sẻ câu chuyện, kết nối bạn bè và khám phá những bài viết hay.
          </p>
          <Link
            to="/login"
            className="w-full py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 transition mt-1"
          >
            Đăng nhập ngay
          </Link>
        </div>
      )}

      {/* 2. Menu Lối tắt tiện ích (Dạng danh sách phẳng, cách đều) */}
      <div className="space-y-1">
        {[
          { to: "/", label: "Bảng tin trang chủ", icon: Home },
          { to: "/trending", label: "Khám phá xu hướng", icon: Compass },
          { to: "/radio", label: "Phòng nhạc & Radio", icon: Radio },
          { to: "/friends", label: "Bạn bè & Kết nối", icon: Users },
          { to: "/saved", label: "Bài viết đã lưu", icon: Bookmark },
          { to: "/dashboard", label: "Bảng điều khiển", icon: BarChart2 },
        ].map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-150 ${
                isActive
                  ? "bg-slate-200/80 dark:bg-zinc-800 text-black dark:text-white font-bold"
                  : "text-slate-700 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 hover:text-black dark:hover:text-white"
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* Nút mở nhanh Trợ lý AI BlogViet */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open_ai_assistant"));
          }}
          className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 transition cursor-pointer text-left w-full group"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform" />
            <span>Trợ lý BlogViet AI</span>
          </div>
          <span className="text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-md">
            Gemini 3.7
          </span>
        </button>
      </div>

      {/* 3. Lối tắt chuyên mục / Trending Tags (Dạng phẳng không viền hộp) */}
      <div className="pt-2 px-1 flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Chủ đề thịnh hành
          </span>
          <span className="text-[10px] text-zinc-400 font-semibold">Hot #</span>
        </div>

        <div className="flex flex-wrap gap-1.5 px-1">
          {TRENDING_TAGS.map(({ tag, count }) => (
            <Link
              key={tag}
              to={`/search?q=${encodeURIComponent(tag.replace("#", ""))}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-200/70 dark:bg-zinc-800 hover:bg-slate-300/80 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition cursor-pointer"
            >
              <Hash className="w-3 h-3 text-zinc-400" />
              <span>{tag.replace("#", "")}</span>
              <span className="text-[9px] text-zinc-500 ml-0.5">{count}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
