import { useState, useRef } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

/**
 * Awwwards Luxury SpotlightCard
 * Creates a subtle interactive mouse-following light beam across the glassmorphic card
 */
export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(59, 130, 246, 0.07)",
  spotlightSize = 350,
  onClick,
  ...props
}) {
  const cardRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const background = useMotionTemplate`radial-gradient(${spotlightSize}px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 80%)`;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-zinc-900/85 backdrop-blur-xl shadow-xs transition-all duration-300 ${className}`}
      {...props}
    >
      {/* Dynamic Mouse Spotlight Glow Layer */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 block"
        style={{
          background,
        }}
        aria-hidden="true"
      />

      {/* Card Content */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </motion.div>
  );
}
