'use client';

import { useEffect, useState } from 'react';
import CountUp from 'react-countup';

export default function Stats() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const el = document.getElementById('stats-section');
    if (el) observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <section id="stats-section" className="w-full py-32 bg-white flex justify-center px-4 border-t border-black/[0.05]">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        
        <div className="flex flex-col items-center">
          <div className="text-5xl md:text-7xl lg:text-[5rem] text-black" style={{ fontFamily: 'var(--font-display)' }}>
            {isVisible ? <CountUp end={12000} duration={2.5} separator="," suffix="+" /> : "0+"}
          </div>
          <div className="mt-4 text-[var(--color-muted)] uppercase tracking-[0.2em] text-sm font-medium" style={{ fontFamily: 'var(--font-mono)' }}>
            Jobs Analyzed
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-5xl md:text-7xl lg:text-[5rem] text-[var(--color-safe)]" style={{ fontFamily: 'var(--font-display)' }}>
            {isVisible ? <CountUp end={94} duration={2.5} suffix="%" /> : "0%"}
          </div>
          <div className="mt-4 text-[var(--color-muted)] uppercase tracking-[0.2em] text-sm font-medium" style={{ fontFamily: 'var(--font-mono)' }}>
            Detection Accuracy
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-5xl md:text-7xl lg:text-[5rem] text-black" style={{ fontFamily: 'var(--font-display)' }}>
            {isVisible ? <CountUp prefix="₹" end={8} duration={2.5} suffix=" Crore+" /> : "₹0 Crore+"}
          </div>
          <div className="mt-4 text-[var(--color-muted)] uppercase tracking-[0.2em] text-sm font-medium" style={{ fontFamily: 'var(--font-mono)' }}>
            Scams Prevented
          </div>
        </div>

      </div>
    </section>
  );
}
