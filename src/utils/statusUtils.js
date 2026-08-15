/**
 * Utility functions for user online status and last active time formatting.
 * Rules:
 * 1. If user disabled active status (showActiveStatus === false or local setting disabled), they are shown as Offline.
 * 2. If lastActiveAt exists, user is ONLY online if lastActiveAt was within the last 3 minutes (180,000ms).
 *    This prevents stale `isOnline: true` in DB from showing offline users as online forever.
 */

export function isUserActiveStatusEnabled(userId) {
  if (typeof window === "undefined") return true;
  const globalSetting = localStorage.getItem("user_show_active_status");
  if (globalSetting !== null) {
    return globalSetting === "true";
  }
  if (userId) {
    const userSetting = localStorage.getItem(`active_status_disabled_${userId}`);
    if (userSetting === "true") return false;
  }
  return true;
}

export function setUserActiveStatusEnabled(userId, enabled) {
  if (typeof window === "undefined") return;
  localStorage.setItem("user_show_active_status", enabled ? "true" : "false");
  if (userId) {
    localStorage.setItem(`active_status_disabled_${userId}`, enabled ? "false" : "true");
  }
  window.dispatchEvent(
    new CustomEvent("active_status_toggle_changed", {
      detail: { userId, enabled },
    })
  );
}

export function isUserOnline(user) {
  if (!user) return false;
  
  // 1. Kiểm tra nếu người dùng đã chủ động tắt trạng thái hoạt động
  if (user.showActiveStatus === false) return false;
  if (user.id && !isUserActiveStatusEnabled(user.id)) return false;

  // 2. Tính toán thời gian hoạt động thực tế qua timestamp
  const timeField = user.lastActiveAt || user.lastActive || user.updatedAt;
  if (timeField) {
    let formatted = timeField;
    if (typeof formatted === "string" && !formatted.endsWith("Z") && !formatted.includes("+")) {
      formatted = formatted + "Z";
    }
    const timestamp = new Date(formatted).getTime();
    if (!isNaN(timestamp)) {
      const diff = Date.now() - timestamp;
      // Chỉ tính là đang hoạt động nếu có tín hiệu trong vòng 3 phút trở lại
      return diff >= 0 && diff < 3 * 60 * 1000;
    }
  }

  // 3. Nếu không có timestamp cụ thể, kiểm tra flag isOnline
  return Boolean(user.isOnline);
}

export function formatLastActive(user) {
  if (!user) return "";
  if (user.showActiveStatus === false) return "";
  if (user.id && !isUserActiveStatusEnabled(user.id)) return "";
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

