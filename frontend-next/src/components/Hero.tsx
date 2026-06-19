'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import VerdictCard from './VerdictCard';

export default function Hero() {
  const headingText = "The Internet Is Lying To You.";
  const words = headingText.split(' ');

  const [inputValue, setInputValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [verdictData, setVerdictData] = useState<Record<string, unknown> | null>(null);

  const router = useRouter();

  const handleAnalyze = async () => {
    if (!inputValue.trim()) return;

    if (!localStorage.getItem('scamshield_token')) {
      router.push('/auth');
      return;
    }
    
    setIsAnalyzing(true);
    setVerdictData(null);

    try {
      const isUrl = inputValue.startsWith('http://') || inputValue.startsWith('https://');
      const payload = {
        content: inputValue,
        type: isUrl ? 'url' : 'description',
        source: 'manual'
      };

      const response = await fetch('http://localhost:10000/api/v1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      
      setVerdictData({
        isFake: data.verdict === "Fake",
        score: data.scam_score,
        scanId: data.scan_id || `#SC-${Math.floor(Math.random() * 10000)}`,
        explanation: data.explanation || "Our ML models detected patterns indicative of a fraudulent listing based on historical telemetry."
      });
      
    } catch (err) {
      console.error(err);
      alert("Failed to connect to ScamShield scanning engine.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden pt-20 pb-10">
      
      {/* Background Drifting Blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF2D2D] rounded-full blur-[120px] opacity-[0.06] animate-blob mix-blend-screen pointer-events-none" />

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto mt-12">
        
        {/* Massive Animated Heading */}
        <h1 
          className="text-5xl md:text-7xl lg:text-[7rem] leading-[1.1] text-black font-semibold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {words.map((word, index) => (
            <span key={index} className="inline-block overflow-hidden mr-3 md:mr-6">
              <motion.span
                className="inline-block"
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 0.8,
                  ease: [0.33, 1, 0.68, 1], // easeOutCubic
                  delay: 2.5 + (index * 0.08) // Starts after LoadingScreen (2.5s)
                }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>

        {/* Subtitle */}
        <motion.p 
          className="mt-8 text-xl md:text-2xl text-[var(--color-muted)] max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 3.2 }}
        >
          Paste any job offer. We&apos;ll tell you the truth in seconds.
        </motion.p>

        {/* Input Box Area */}
        <motion.div 
          className="mt-12 w-full max-w-3xl relative interactive"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 3.4 }}
        >
          <div className="flex flex-col sm:flex-row items-center bg-black/5 border border-black/10 rounded-full p-2 backdrop-blur-md focus-within:border-black/20 transition-colors">
            <input 
              type="text" 
              placeholder="Paste job description or URL here..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              disabled={isAnalyzing}
              className="flex-1 bg-transparent border-none outline-none text-black px-6 py-4 placeholder:text-black/40 disabled:opacity-50"
            />
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="group relative overflow-hidden bg-black text-white px-8 py-3 rounded-full transition-colors hover:bg-[#FF2D2D] mt-4 sm:mt-0 sm:ml-2 whitespace-nowrap disabled:opacity-50"
            >
              <span className="relative z-10 font-medium tracking-wide uppercase text-sm">
                {isAnalyzing ? "Scanning..." : "Analyze"}
              </span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Verdict Card Portal */}
      <AnimatePresence>
        {verdictData && (
          <VerdictCard 
            isFake={verdictData.isFake}
            score={verdictData.score}
            scanId={verdictData.scanId}
            explanation={verdictData.explanation}
            onClose={() => setVerdictData(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
