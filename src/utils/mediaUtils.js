/**
 * Kiểm tra xem URL có phải là Video hay không
 * @param {string} url 
 * @returns {boolean}
 */
export function isVideoUrl(url) {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  return (
    lower.startsWith("blob:") ||
    lower.includes("/video/") ||
    lower.includes("video") ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".ogg") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".m4v") ||
    lower.endsWith(".mkv")
  );
}
