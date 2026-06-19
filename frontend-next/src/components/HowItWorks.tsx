'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';

gsap.registerPlugin(ScrollTrigger);

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable on mobile if we want vertical stack, but we can do horizontal on desktop
    const isDesktop = window.innerWidth >= 1024;
    
    if (isDesktop && sectionRef.current && wrapperRef.current) {
      const pinDistance = wrapperRef.current.scrollWidth - window.innerWidth;

      const tl = gsap.to(wrapperRef.current, {
        x: -pinDistance,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: `+=${pinDistance}`,
          pin: true,
          scrub: 1,
        }
      });

      return () => {
        tl.kill();
        ScrollTrigger.getAll().forEach(t => t.kill());
      };
    }
  }, []);

  const steps = [
    { num: "01", title: "Paste the Offer", desc: "User inputs the job description or a URL linking to the job posting.", img: "/images/step_1.png" },
    { num: "02", title: "AI Extracts Signals", desc: "Our ML model analyzes over 40 red flag patterns like payment requests and vague roles.", img: "/images/step_2.png" },
    { num: "03", title: "Risk Score Generated", desc: "A definitive 0 to 100 danger score is computed in milliseconds.", img: "/images/step_3.png" },
    { num: "04", title: "Verdict Delivered", desc: "You receive a clear Fake or Legit verdict with a full explanation of the signals.", img: "/images/step_4.png" },
  ];

  return (
    <section ref={sectionRef} className="w-full min-h-screen bg-[#FAFAFA] overflow-hidden flex items-center relative border-y border-black/[0.05]">
      <div className="absolute top-12 md:top-24 left-4 md:left-12 z-10">
        <h2 className="text-4xl md:text-6xl text-black font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          HOW IT WORKS
        </h2>
      </div>

      {/* Horizontal Wrapper */}
      <div 
        ref={wrapperRef} 
        className="flex w-max h-[70vh] items-center px-4 md:px-[10vw] gap-8 md:gap-16 lg:flex-row flex-col lg:h-auto overflow-y-auto lg:overflow-visible mt-24 lg:mt-0"
      >
        {steps.map((step, idx) => (
          <div 
            key={idx} 
            className="group relative w-[85vw] md:w-[450px] h-[550px] bg-white border border-black/5 shadow-sm rounded-3xl p-8 flex flex-col shrink-0 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 overflow-hidden"
          >
            {/* Background Step Number */}
            <div 
              className="absolute top-6 right-8 text-[6rem] leading-none text-black opacity-[0.02] font-bold pointer-events-none select-none transition-opacity duration-500 group-hover:opacity-[0.05]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {step.num}
            </div>

            {/* Image Container */}
            <div className="relative z-10 h-1/2 w-full rounded-2xl bg-black/[0.02] mb-8 overflow-hidden flex items-center justify-center p-4">
              <div className="w-full h-full relative">
                <Image 
                  src={step.img} 
                  alt={step.title} 
                  fill
                  style={{ objectFit: 'contain' }}
                  className="mix-blend-multiply transition-transform duration-700 group-hover:scale-105" 
                />
              </div>
            </div>

            {/* Text Content */}
            <div className="relative z-10 flex-1 flex flex-col">
              <h3 className="text-2xl font-semibold text-black mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                {step.title}
              </h3>
              <p className="text-[var(--color-muted)] text-base leading-relaxed">
                {step.desc}
              </p>
            </div>
            
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl border border-black/10" />
          </div>
        ))}
      </div>
    </section>
  );
}
