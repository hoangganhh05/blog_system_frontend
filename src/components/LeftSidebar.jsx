import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Home,
  Compass,
  Radio,
  Users,
  Bookmark,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  User,
  BookOpen,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

const SIDEBAR_ITEMS = [
  { to: "/", tooltip: "Hồ sơ thực tập sinh", icon: User },
  { to: "/trending", tooltip: "Tài liệu học tập", icon: BookOpen },
  { to: "/dashboard", tooltip: "Quản lý task", icon: CheckSquare },
];

export default function LeftSidebar() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? Number(currentUser.id || currentUser.userId) : null;
  const [isExpanded, setIsExpanded] = useState(false);

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar_expanded");
    if (savedState !== null) {
      setIsExpanded(savedState === "true");
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("sidebar_expanded", isExpanded.toString());
    // Emit custom event for MainLayout to sync
    window.dispatchEvent(new CustomEvent("sidebar_state_changed"));
  }, [isExpanded]);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <aside 
      className={`fixed left-0 top-14 bottom-0 hidden md:flex flex-col bg-white dark:bg-[#242526] border-r border-slate-200 dark:border-zinc-800 z-30 select-none overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? "w-64" : "w-16 md:w-20"
      }`}
    >
      {/* Logo Section */}
      <div className="flex-shrink-0 py-4 px-3 flex flex-col items-center gap-2">
        {isExpanded ? (
          <div className="flex flex-col items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
              IMS
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">IMS</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">VIETTEL SOFTWARE NEXTGEN</span>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            IMS
          </div>
        )}
      </div>

      {/* Profile Section */}
      {currentUser ? (
        <Link
          to={`/profile/${currentUserId}`}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition relative group mb-2 shrink-0 ${
            isExpanded ? "mx-2" : "mx-auto"
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
            className="w-10 h-10 min-w-10 min-h-10 border border-zinc-200 dark:border-zinc-700 shadow-xs shrink-0"
          />
          {isExpanded && (
            <div className="flex flex-col min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                {currentUser.fullName || currentUser.username}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">@{currentUser.username}</span>
            </div>
          )}
          {!isExpanded && (
            <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 dark:bg-zinc-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-lg z-50">
              Trang cá nhân ({currentUser.fullName || currentUser.username})
              <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-1 border-4 border-transparent border-r-slate-900 dark:border-r-zinc-800" />
            </div>
          )}
        </Link>
      ) : (
        <Link
          to="/login"
          className={`flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition mb-2 shrink-0 relative group ${
            isExpanded ? "mx-2" : "mx-auto"
          }`}
        >
          <Avatar size="sm" className="shrink-0" />
          {isExpanded && (
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200 animate-in fade-in slide-in-from-left-2 duration-300">
              Đăng nhập
            </span>
          )}
          {!isExpanded && (
            <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 dark:bg-zinc-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-lg z-50">
              Đăng nhập
              <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-1 border-4 border-transparent border-r-slate-900 dark:border-r-zinc-800" />
            </div>
          )}
        </Link>
      )}

      {/* Divider */}
      <div className={`h-px bg-slate-200 dark:bg-zinc-800 mb-2 shrink-0 ${isExpanded ? "mx-4" : "mx-4 w-8"}`} />

      {/* Navigation Items */}
      <nav className="flex flex-col gap-1 px-2 flex-1">
        {SIDEBAR_ITEMS.map(({ to, tooltip, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative group cursor-pointer ${
                isActive
                  ? "bg-[#0866ff]/10 dark:bg-[#0866ff]/20 text-[#0866ff]"
                  : "text-slate-600 dark:text-zinc-400 hover:text-[#0866ff] dark:hover:text-[#0866ff] hover:bg-slate-100 dark:hover:bg-zinc-800/80"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon 
                  strokeWidth={isActive ? 2.5 : 1.8} 
                  className={`w-5 h-5 shrink-0 ${isActive ? "text-[#0866ff]" : ""}`} 
                />
                {isExpanded && (
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200 animate-in fade-in slide-in-from-left-2 duration-300">
                    {tooltip}
                  </span>
                )}
                {!isExpanded && (
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
      <div className="flex-shrink-0 py-4 px-3">
        <button
          onClick={toggleSidebar}
          className={`w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-all duration-300 cursor-pointer shadow-sm ${
            isExpanded ? "mx-auto" : "mx-auto"
          }`}
          title={isExpanded ? "Thu gọn sidebar" : "Mở rộng sidebar"}
        >
          {isExpanded ? (
            <ChevronLeft className="w-5 h-5 transition-transform duration-300" />
          ) : (
            <ChevronRight className="w-5 h-5 transition-transform duration-300" />
          )}
        </button>
      </div>
    </aside>
  );
}
