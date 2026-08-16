import { Link, NavLink } from "react-router-dom";
import {
  Home,
  Compass,
  Radio,
  Users,
  Bookmark,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

const SIDEBAR_ITEMS = [
  { to: "/", tooltip: "Bảng tin trang chủ", icon: Home },
  { to: "/trending", tooltip: "Khám phá xu hướng", icon: Compass },
  { to: "/radio", tooltip: "Phòng nhạc & Radio", icon: Radio },
  { to: "/friends", tooltip: "Bạn bè & Kết nối", icon: Users },
  { to: "/saved", tooltip: "Bài viết đã lưu", icon: Bookmark },
  { to: "/dashboard", tooltip: "Bảng điều khiển & Công cụ", icon: BarChart3 },
];

export default function LeftSidebar() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? Number(currentUser.id || currentUser.userId) : null;

  return (
    <aside className="w-16 md:w-20 fixed left-0 top-14 bottom-0 hidden md:flex flex-col items-center py-4 bg-white dark:bg-[#242526] border-r border-slate-200 dark:border-zinc-800 z-30 select-none overflow-visible">
      {/* 1. Profile Avatar Shortcut ở trên cùng */}
      {currentUser ? (
        <Link
          to={`/profile/${currentUserId}`}
          className="p-1 rounded-full hover:ring-2 hover:ring-[#0866ff]/40 transition relative group mb-3 shrink-0"
        >
          <Avatar
            userId={currentUserId}
            src={currentUser.avatarUrl}
            name={currentUser.fullName || currentUser.username}
            username={currentUser.username}
            avatarColor={currentUser.avatarColor}
            size="sm"
            isOnline={currentUser.isOnline}
            showActiveStatus={true}
            className="w-10 h-10 min-w-10 min-h-10 border border-zinc-200 dark:border-zinc-700 shadow-xs"
          />
          {/* Tooltip Hover */}
          <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 dark:bg-zinc-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-lg z-50">
            Trang cá nhân ({currentUser.fullName || currentUser.username})
            <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-1 border-4 border-transparent border-r-slate-900 dark:border-r-zinc-800" />
          </div>
        </Link>
      ) : (
        <Link
          to="/login"
          className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition mb-3 shrink-0 relative group"
        >
          <Avatar size="sm" />
          <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 dark:bg-zinc-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-lg z-50">
            Đăng nhập
            <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-1 border-4 border-transparent border-r-slate-900 dark:border-r-zinc-800" />
          </div>
        </Link>
      )}

      {/* Đường phân cách mờ */}
      <div className="w-8 h-px bg-slate-200 dark:bg-zinc-800 mb-2 shrink-0" />

      {/* 2. Danh sách Icon Điều Hướng + Tooltip */}
      <nav className="flex flex-col items-center gap-2 w-full px-2">
        {SIDEBAR_ITEMS.map(({ to, tooltip, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `p-3 rounded-2xl transition-all relative group flex items-center justify-center cursor-pointer ${
                isActive
                  ? "bg-[#0866ff]/10 dark:bg-[#0866ff]/20 text-[#0866ff] shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-[#0866ff] dark:hover:text-[#0866ff] hover:bg-slate-100 dark:hover:bg-zinc-800/80"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon strokeWidth={isActive ? 2.5 : 1.8} className="w-5 h-5" />
                {/* Tooltip bay ra bên phải khi hover */}
                <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 dark:bg-zinc-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 shadow-lg z-50">
                  {tooltip}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-1 border-4 border-transparent border-r-slate-900 dark:border-r-zinc-800" />
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
