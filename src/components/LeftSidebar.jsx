import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Home,
  Compass,
  Headphones,
  Users,
  Bookmark,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  Film,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

const SIDEBAR_ITEMS = [
  { to: "/", tooltip: "Bảng tin trang chủ", icon: Home },
  { to: "/trending", tooltip: "Khám phá xu hướng", icon: Compass },
  { to: "/shorts", tooltip: "Video ngắn Shorts", icon: Film },
  { to: "/soundscapes", tooltip: "Trạm Âm Thanh Môi Trường", icon: Headphones },
  { to: "/friends", tooltip: "Bạn bè & Kết nối", icon: Users },
  { to: "/saved", tooltip: "Bài viết đã lưu", icon: Bookmark },
  { to: "/dashboard", tooltip: "Bảng điều khiển & Công cụ", icon: BarChart3 },
];

export default function LeftSidebar() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? Number(currentUser.id || currentUser.userId) : null;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    window.dispatchEvent(new CustomEvent("sidebar_toggle", { detail: { isSidebarCollapsed: newState } }));
  };

  return (
    <aside 
      className={`fixed left-0 top-14 bottom-0 hidden md:flex flex-col py-4 bg-white dark:bg-[#242526] border-r border-slate-200 dark:border-zinc-800 z-30 select-none overflow-visible transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? "w-16 md:w-20 items-center" : "w-64 items-start"
      }`}
    >
      {/* 1. Profile Avatar Shortcut ở trên cùng */}
      {currentUser ? (
        <Link
          to={`/profile/${currentUserId}`}
          className={`p-1 rounded-full hover:ring-2 hover:ring-[#0866ff]/40 transition relative group mb-3 shrink-0 ${
            isSidebarCollapsed ? "" : "ml-2"
          }`}
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
          {!isSidebarCollapsed && (
            <span className="ml-3 text-xs font-medium text-slate-700 dark:text-slate-200">
              {currentUser.fullName || currentUser.username}
            </span>
          )}
        </Link>
      ) : (
        <Link
          to="/login"
          className={`p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition mb-3 shrink-0 relative group flex items-center ${
            isSidebarCollapsed ? "" : "ml-2"
          }`}
        >
          <Avatar size="sm" />
          <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 dark:bg-zinc-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-lg z-50">
            Đăng nhập
            <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-1 border-4 border-transparent border-r-slate-900 dark:border-r-zinc-800" />
          </div>
          {!isSidebarCollapsed && (
            <span className="ml-3 text-xs font-medium text-slate-700 dark:text-slate-200">
              Đăng nhập
            </span>
          )}
        </Link>
      )}

      {/* Đường phân cách mờ */}
      <div className={`h-px bg-slate-200 dark:bg-zinc-800 mb-2 shrink-0 ${isSidebarCollapsed ? "w-8" : "w-full mx-2"}`} />

      {/* 2. Danh sách Icon Điều Hướng + Tooltip */}
      <nav className="flex flex-col gap-2 w-full px-2 flex-1">
        {SIDEBAR_ITEMS.map(({ to, tooltip, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `p-3 rounded-2xl transition-all relative group flex items-center cursor-pointer ${
                isActive
                  ? "bg-[#0866ff]/10 dark:bg-[#0866ff]/20 text-[#0866ff] shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-[#0866ff] dark:hover:text-[#0866ff] hover:bg-slate-100 dark:hover:bg-zinc-800/80"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon strokeWidth={isActive ? 2.5 : 1.8} className="w-5 h-5 shrink-0" />
                {!isSidebarCollapsed && (
                  <span className="ml-3 text-xs font-medium text-slate-700 dark:text-slate-200">
                    {tooltip}
                  </span>
                )}
                {/* Tooltip bay ra bên phải khi hover */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 dark:bg-zinc-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 shadow-lg z-50">
                    {tooltip}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-1 border-4 border-transparent border-r-slate-900 dark:border-r-zinc-800" />
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0866ff]/40 active:scale-95 ${
          isSidebarCollapsed ? "" : "ml-2"
        }`}
        title={isSidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
      >
        <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${isSidebarCollapsed ? "rotate-0" : "rotate-180"}`} />
      </button>
    </aside>
  );
}
