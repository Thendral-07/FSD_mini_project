import React from "react";
import { motion } from "framer-motion";

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-200 via-background to-background dark:from-orange-950/60 dark:via-background dark:to-background">
      {/* Orb 1 */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.8, 0.5],
          x: [0, 80, 0],
          y: [0, -50, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-40 -right-40 w-96 h-96 bg-primary/30 rounded-full blur-[100px] pointer-events-none"
      />
      {/* Orb 2 */}
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.4, 0.7, 0.4],
          x: [0, -60, 0],
          y: [0, 80, 0]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute top-40 -left-20 w-80 h-80 bg-orange-500/20 rounded-full blur-[100px] pointer-events-none"
      />
      {/* Orb 3 (New for global presence) */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
          x: [0, -40, 0],
          y: [0, -30, 0]
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
        className="absolute bottom-10 right-20 w-72 h-72 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none"
      />
    </div>
  );
}
