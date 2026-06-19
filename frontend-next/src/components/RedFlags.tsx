'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Tilt from 'react-parallax-tilt';
import { AlertTriangle, Banknote, Globe, Mail, Clock, FileQuestion } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function RedFlags() {
  const containerRef = useRef<HTMLDivElement>(null);

  const flags = [
    { icon: <Banknote size={40} className="text-[#FF2D2D]" />, text: "Too-good salary promised upfront" },
    { icon: <AlertTriangle size={40} className="text-[#FF2D2D]" />, text: "Asks for registration fee or security deposit" },
    { icon: <Globe size={40} className="text-[#FF2D2D]" />, text: "No company website or LinkedIn presence" },
    { icon: <Mail size={40} className="text-[#FF2D2D]" />, text: "Generic Gmail/Yahoo contact address" },
    { icon: <Clock size={40} className="text-[#FF2D2D]" />, text: "Urgency pressure: 'Apply in 24 hours'" },
    { icon: <FileQuestion size={40} className="text-[#FF2D2D]" />, text: "Vague job role with no clear responsibilities" },
  ];

  useEffect(() => {
    if (!containerRef.current) return;
    
    const cards = containerRef.current.querySelectorAll('.flag-card');

    gsap.fromTo(cards, 
      { y: 100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%", // triggers when top of container hits 80% down the viewport
        }
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section className="w-full min-h-screen bg-white py-24 px-4 flex flex-col items-center">
      <div className="max-w-6xl w-full">
        
        <div className="mb-16">
          <h2 className="text-4xl md:text-6xl text-black uppercase" style={{ fontFamily: 'var(--font-display)' }}>
            How Scammers Operate
          </h2>
        </div>

        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {flags.map((flag, idx) => (
            <div key={idx} className="flag-card opacity-0">
              <Tilt
                tiltMaxAngleX={10}
                tiltMaxAngleY={10}
                perspective={1000}
                scale={1.02}
                transitionSpeed={2500}
                gyroscope={false}
                className="group w-full h-[250px] bg-white border border-black/10 shadow-sm rounded-2xl p-8 flex flex-col justify-between hover:border-[#FF2D2D]/60 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-full bg-[#FF2D2D]/10 flex items-center justify-center">
                  {flag.icon}
                </div>
                
                <h3 className="text-xl text-black mt-8 font-medium" style={{ fontFamily: 'var(--font-sans)' }}>
                  {flag.text}
                </h3>

                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-[0_0_30px_rgba(255,45,45,0.05)] rounded-2xl" />
              </Tilt>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
