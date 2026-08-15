import { Link } from "react-router-dom";

/**
 * Reusable Adaptive Logo Component for BlogViet
 *
 * Rules:
 * - Light Mode (Light background): Black/Dark background with White text
 * - Dark Mode (Dark background): White/Light background with Black text
 * - Highly adaptable with size variants: "sm", "md", "lg", "xl"
 */
export default function Logo({
  size = "md",
  withText = false,
  to = "/",
  className = "",
  showGlow = false,
}) {
  // Size presets for icon badge
  const sizeClasses = {
    xs: "w-6 h-6 rounded-lg text-xs font-black",
    sm: "w-7 h-7 rounded-lg text-xs font-black",
    md: "w-8 h-8 rounded-xl text-sm font-black",
    lg: "w-11 h-11 rounded-2xl text-xl font-black",
    xl: "w-14 h-14 rounded-2xl text-2xl font-black",
  };

  // Text sizes
  const textSizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-2xl",
  };

  const badgeClass = `
    ${sizeClasses[size] || sizeClasses.md}
    bg-black text-white dark:bg-white dark:text-black
    border border-black/10 dark:border-white/20
    shadow-xs dark:shadow-sm
    flex items-center justify-center
    tracking-tight leading-none
    transition-all duration-200
    group-hover:scale-105 active:scale-95
    select-none shrink-0
    ${showGlow ? "shadow-lg shadow-black/10 dark:shadow-white/10" : ""}
  `.trim();

  const logoBadge = (
    <div className={badgeClass}>
      BV
    </div>
  );

  const content = (
    <div className={`inline-flex items-center gap-2.5 group cursor-pointer ${className}`}>
      {logoBadge}
      {withText && (
        <span
          className={`font-black tracking-tight text-[#050505] dark:text-[#e4e6eb] group-hover:opacity-90 transition select-none ${
            textSizeClasses[size] || textSizeClasses.md
          }`}
        >
          BlogViet
        </span>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
