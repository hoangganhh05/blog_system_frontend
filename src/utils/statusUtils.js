/**
 * Utility functions for user online status and last active time formatting.
 */

export function isUserOnline(user) {
  if (!user) return false;
  if (user.showActiveStatus === false) return false;
  if (user.isOnline === true) return true;

  const timeField = user.lastActiveAt || user.lastActive || user.updatedAt;
  if (timeField) {
    let formatted = timeField;
    if (typeof formatted === "string" && !formatted.endsWith("Z") && !formatted.includes("+")) {
      formatted = formatted + "Z";
    }
    const timestamp = new Date(formatted).getTime();
    if (!isNaN(timestamp)) {
      const diff = Date.now() - timestamp;
      return diff >= 0 && diff < 5 * 60 * 1000; // Under 5 minutes = Online
    }
  }
  return false;
}

export function formatLastActive(user) {
  if (!user || user.showActiveStatus === false) return "";
  if (isUserOnline(user)) return "Đang hoạt động";

  const timeField = user.lastActiveAt || user.lastActive || user.updatedAt;
  if (!timeField) return "Ngoại tuyến";

  let formatted = timeField;
  if (typeof formatted === "string" && !formatted.endsWith("Z") && !formatted.includes("+")) {
    formatted = formatted + "Z";
  }
  const timestamp = new Date(formatted).getTime();
  if (isNaN(timestamp)) return "Ngoại tuyến";

  const diff = Date.now() - timestamp;
  if (diff < 0) return "Vừa xong";

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `Hoạt động ${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hoạt động ${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Hoạt động hôm qua";
  if (days < 30) return `Hoạt động ${days} ngày trước`;

  const months = Math.floor(days / 30);
  if (months < 12) return `Hoạt động ${months} tháng trước`;

  return "Ngoại tuyến";
}

