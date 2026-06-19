'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="fixed bottom-6 right-6 z-[10000] w-12 h-12 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle 
          cx="50" cy="50" r="46" 
          stroke="var(--color-muted)" 
          strokeWidth="4" 
          fill="none" 
          opacity="0.2"
        />
        <motion.circle 
          cx="50" cy="50" r="46" 
          stroke="var(--color-danger)" 
          strokeWidth="4" 
          fill="none"
          strokeLinecap="round"
          style={{ pathLength: scaleY }}
        />
      </svg>
      <div className="text-[10px] font-bold text-[var(--color-foreground)]" style={{ fontFamily: 'var(--font-mono)' }}>
        <motion.span>
          {/* We can optionally show percentage here if desired */}
        </motion.span>
      </div>
    </div>
  );
}
