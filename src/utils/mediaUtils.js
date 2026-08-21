/**
 * Kiểm tra xem URL có phải là Video hay không
 * @param {string} url
 * @returns {boolean}
 */
export function isVideoUrl(url) {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase().split("?")[0]; // strip query params
  // Check by file extension first (most reliable)
  if (
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".ogg") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".m4v") ||
    lower.endsWith(".mkv") ||
    lower.endsWith(".avi") ||
    lower.endsWith(".wmv")
  ) {
    return true;
  }
  // Blob URL
  if (lower.startsWith("blob:")) return true;
  // Path segment clearly indicates video folder (e.g. /shorts/ or /videos/)
  if (lower.includes("/shorts/") || lower.includes("/videos/") || lower.includes("/video/")) return true;
  return false;
}
