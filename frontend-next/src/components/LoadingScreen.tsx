'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function LoadingScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!containerRef.current || !textRef.current) return;

    const spans = textRef.current.querySelectorAll('span');

    const tl = gsap.timeline();

    tl.to(spans, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.08,
      ease: 'power3.out',
    })
    .to(containerRef.current, {
      yPercent: -100,
      duration: 1,
      ease: 'power4.inOut',
      delay: 1.5, // Total 2 seconds wait approx
    });

    return () => {
      tl.kill();
    };
  }, []);

  const headingText = "SENTINEL";
  const chars = headingText.split('');

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
    >
      <h1 
        ref={textRef}
        className="text-5xl md:text-8xl tracking-widest text-black uppercase"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {chars.map((char, index) => (
          <span 
            key={index} 
            className="inline-block opacity-0 translate-y-5"
          >
            {char}
          </span>
        ))}
      </h1>
    </div>
  );
}
