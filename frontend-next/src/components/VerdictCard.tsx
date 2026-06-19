'use client';

import { motion } from 'framer-motion';

type VerdictProps = {
  isFake: boolean;
  score: number;
  scanId: string;
  explanation: string;
  onClose: () => void;
};

export default function VerdictCard({ isFake, score, scanId, explanation, onClose }: VerdictProps) {
  const color = isFake ? '#FF2D2D' : '#00FF94';
  const glow = isFake ? 'rgba(255,45,45,0.2)' : 'rgba(0,255,148,0.2)';
  const label = isFake ? 'HIGH RISK' : 'SAFE';

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-white/60 backdrop-blur-sm">
      <motion.div 
        initial={{ rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        exit={{ rotateY: -90, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md p-8 bg-white border rounded-2xl overflow-hidden shadow-2xl"
        style={{ borderColor: color, boxShadow: `0 0 40px ${glow}` }}
      >
        {/* Scan ID Label */}
        <div className="absolute top-6 left-6 text-xs text-[var(--color-muted)] font-medium" style={{ fontFamily: 'var(--font-mono)' }}>
          SCAN ID: {scanId}
        </div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-[var(--color-muted)] hover:text-black transition-colors"
        >
          ✕
        </button>

        <div className="mt-12 flex flex-col items-center">
          <div 
            className="text-[4rem] leading-none mb-2" 
            style={{ fontFamily: 'var(--font-display)', color }}
          >
            {score}
          </div>
          <div 
            className="text-sm tracking-[0.2em] mb-8 px-3 py-1 rounded-full border bg-opacity-5"
            style={{ fontFamily: 'var(--font-mono)', color, borderColor: color, backgroundColor: glow }}
          >
            {label}
          </div>
          
          <p className="text-center text-[var(--color-muted)] text-sm md:text-base leading-relaxed font-medium">
            {explanation}
          </p>
        </div>

        {/* Decorative Grid Line */}
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-black/10 to-transparent" />
      </motion.div>
    </div>
  );
}
