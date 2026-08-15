import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isUserOnline, formatLastActive } from "../utils/statusUtils";

function getInitials(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZE_MAP = {
  xs: { box: "w-6 h-6 min-w-6 min-h-6", text: "text-[10px]", dot: "w-2 h-2" },
  sm: { box: "w-8 h-8 min-w-8 min-h-8", text: "text-xs", dot: "w-2.5 h-2.5" },
  md: { box: "w-10 h-10 min-w-10 min-h-10", text: "text-sm", dot: "w-3 h-3" },
  lg: { box: "w-12 h-12 min-w-12 min-h-12", text: "text-base", dot: "w-3.5 h-3.5" },
  xl: { box: "w-16 h-16 min-w-16 min-h-16", text: "text-lg", dot: "w-4 h-4" },
  "2xl": { box: "w-20 h-20 min-w-20 min-h-20", text: "text-xl", dot: "w-4 h-4" },
  "3xl": { box: "w-24 h-24 min-w-24 min-h-24 sm:w-28 sm:h-28 sm:min-w-28 sm:min-h-28", text: "text-2xl", dot: "w-5 h-5" },
};

export default function Avatar({
  userId,
  src,
  avatarUrl,
  name,
  alt,
  fullName,
  username,
  avatarColor,
  size = "md",
  isOnline,
  lastActiveAt,
  showActiveStatus,
  hideStatus = false,
  className = "",
  disableLink = false,
  onClick,
  title,
}) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const imageSrc = src || avatarUrl;
  const displayName = name || fullName || username || alt || "Người dùng";
  const userInitials = getInitials(displayName);
  
  const sizeConfig = SIZE_MAP[size] || {
    box: typeof size === "string" && size.startsWith("w-") ? size : "w-10 h-10 min-w-10 min-h-10",
    text: "text-sm",
    dot: "w-3 h-3",
  };

  const userObj = {
    isOnline,
    lastActiveAt,
    showActiveStatus: showActiveStatus !== undefined ? showActiveStatus : true,
  };

  const online = isUserOnline(userObj);
  const activeTooltip = formatLastActive(userObj) || displayName;
  const shouldShowStatus = !hideStatus && (showActiveStatus !== false) && online;

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
    if (!disableLink && userId) {
      navigate(`/profile/${userId}`);
    }
  };

  const isClickable = !disableLink && Boolean(userId);

  return (
    <div
      onClick={handleClick}
      title={title || (shouldShowStatus ? activeTooltip : displayName)}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none bg-transparent ${
        isClickable ? "cursor-pointer hover:opacity-90 active:scale-95 transition-all" : ""
      } ${sizeConfig.box} ${className}`}
      style={{ aspectRatio: "1 / 1" }}
    >
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center aspect-square bg-transparent"
        style={{ width: "100%", height: "100%", aspectRatio: "1 / 1" }}
      >
        {imageSrc && !imgError ? (
          <img
            src={imageSrc}
            alt={displayName}
            onError={() => setImgError(true)}
            className="w-full h-full rounded-full object-cover shrink-0 block aspect-square bg-transparent"
            style={{ width: "100%", height: "100%", objectFit: "cover", aspectRatio: "1 / 1" }}
          />
        ) : (
          <div
            className={`w-full h-full rounded-full flex items-center justify-center font-bold text-white uppercase text-center leading-none select-none shadow-xs ${sizeConfig.text}`}
            style={{ backgroundColor: avatarColor || "#0866ff", width: "100%", height: "100%", aspectRatio: "1 / 1" }}
          >
            <span className="flex items-center justify-center w-full text-center leading-none transform translate-y-[0.5px]">
              {userInitials}
            </span>
          </div>
        )}
      </div>

      {shouldShowStatus && (
        <span
          className={`absolute bottom-0 right-0 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900 z-10 pointer-events-none ${
            sizeConfig.dot
          }`}
          title="Đang hoạt động"
        />
      )}
    </div>
  );
}
