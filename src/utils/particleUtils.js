import confetti from "canvas-confetti";

/**
 * Fires a localized micro-burst of heart particles at the button element's coordinates
 * Standard Awwwards / Web3 luxury micro-interaction
 */
export function fireHeartParticles(eventOrElement) {
  try {
    let x = 0.5;
    let y = 0.5;

    if (eventOrElement && eventOrElement.getBoundingClientRect) {
      const rect = eventOrElement.getBoundingClientRect();
      x = (rect.left + rect.width / 2) / window.innerWidth;
      y = (rect.top + rect.height / 2) / window.innerHeight;
    } else if (eventOrElement && eventOrElement.clientX) {
      x = eventOrElement.clientX / window.innerWidth;
      y = eventOrElement.clientY / window.innerHeight;
    }

    // Scalar heart shape emitter
    const heartShape = confetti.shapeFromPath({
      path: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
    });

    confetti({
      particleCount: 16,
      spread: 55,
      startVelocity: 16,
      origin: { x, y },
      colors: ["#f43f5e", "#fb7185", "#fda4af", "#e11d48", "#ec4899"],
      shapes: [heartShape, "circle"],
      scalar: 0.85,
      ticks: 70,
      gravity: 0.9,
      decay: 0.92,
      disableForReducedMotion: true,
    });
  } catch (err) {
    // Non-blocking fallback
    console.debug("[PARTICLE SPARKLE NOTICE]", err);
  }
}
