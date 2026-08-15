import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Home, Compass, Users, Bookmark, BarChart2, Shield, Hash, Sparkles, Radio } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";
import friendService from "../services/friendService";

import Logo from "./Logo";

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
    <div className="w-full flex flex-col gap-4">
      {/* 1. Profile Shortcut Card hoặc Guest Login Card */}
      {currentUser ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 shadow-sm flex flex-col gap-3">
          <Link
            to={`/profile/${currentUserId}`}
            className="flex items-center gap-3 group"
          >
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shadow-xs"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs"
                style={{ backgroundColor: currentUser.avatarColor || "#27272a" }}
              >
                {getInitials(currentUser.fullName || currentUser.username)}
              </div>
            )}

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
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {stats.postCount}
              </span>
              <span className="text-[10px] text-zinc-400">Bài viết</span>
            </div>
            <div className="flex flex-col border-x border-zinc-100 dark:border-zinc-800/80">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {stats.totalViews}
              </span>
              <span className="text-[10px] text-zinc-400">Lượt xem</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {stats.friendCount}
              </span>
              <span className="text-[10px] text-zinc-400">Bạn bè</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col gap-2.5 text-center items-center">
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

      {/* 2. Menu Lối tắt tiện ích */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 shadow-sm flex flex-col gap-0.5">
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
              `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                isActive
                  ? "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      {/* 3. Lối tắt chuyên mục / Trending Tags */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Chủ đề thịnh hành
          </span>
          <span className="text-[10px] text-zinc-400 font-semibold">Hot #</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {TRENDING_TAGS.map(({ tag, count }) => (
            <Link
              key={tag}
              to={`/search?q=${encodeURIComponent(tag.replace("#", ""))}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
            >
              <Hash className="w-3 h-3 text-zinc-400" />
              <span>{tag.replace("#", "")}</span>
              <span className="text-[9px] text-zinc-400 ml-0.5">{count}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
