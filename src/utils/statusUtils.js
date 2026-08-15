/**
 * Utility functions for user online status and last active time formatting.
 */

export function isUserOnline(user) {
  if (!user) return false;
  if (user.showActiveStatus === false) return false;
  if (user.isOnline) return true;
  if (user.lastActiveAt) {
    let formatted = user.lastActiveAt;
    if (typeof formatted === "string" && !formatted.endsWith("Z") && !formatted.includes("+")) {
      formatted = formatted + "Z";
    }
    const diff = Date.now() - new Date(formatted).getTime();
    return diff >= 0 && diff < 5 * 60 * 1000; // Under 5 minutes
  }
  return false;
}

export function formatLastActive(user) {
  if (!user || user.showActiveStatus === false) return "";
  if (isUserOnline(user)) return "Đang hoạt động";
  if (!user.lastActiveAt) return "Ngoại tuyến";

  let formatted = user.lastActiveAt;
  if (typeof formatted === "string" && !formatted.endsWith("Z") && !formatted.includes("+")) {
    formatted = formatted + "Z";
  }
  const diff = Date.now() - new Date(formatted).getTime();
  if (diff < 0) return "Vừa xong";
  
  const m = Math.floor(diff / 60000);
  if (m < 5) return "Đang hoạt động";
  if (m < 60) return `Hoạt động ${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hoạt động ${h} giờ trước`;
  const d = Math.floor(h / 24);
  return `Hoạt động ${d} ngày trước`;
}
