'use client';

export default function Marquee() {
  const text1 = "FAKE OFFER DETECTED · ₹2.4 LAKH SAVED · 189 SCAMS BLOCKED TODAY · AI-POWERED DETECTION · VERIFY NOW · 94% ACCURACY · ";
  const text2 = "189 SCAMS BLOCKED TODAY · AI-POWERED DETECTION · VERIFY NOW · 94% ACCURACY · FAKE OFFER DETECTED · ₹2.4 LAKH SAVED · ";

  return (
    <section className="relative w-full overflow-hidden bg-[#FF2D2D] py-6 flex flex-col gap-2 rotate-[-2deg] scale-110">
      
      {/* Row 1: Left to Right */}
      <div className="flex w-[200vw] sm:w-[150vw] md:w-[100vw] text-black font-medium text-lg md:text-xl uppercase tracking-widest whitespace-nowrap hover:[animation-play-state:paused]" style={{ fontFamily: 'var(--font-mono)' }}>
        <div className="animate-marquee1 flex min-w-full justify-around shrink-0 gap-4 hover:[animation-play-state:paused]">
          <span>{text1.repeat(3)}</span>
        </div>
        <div className="animate-marquee1 flex min-w-full justify-around shrink-0 gap-4 hover:[animation-play-state:paused]">
          <span>{text1.repeat(3)}</span>
        </div>
      </div>

      {/* Row 2: Right to Left */}
      <div className="flex w-[200vw] sm:w-[150vw] md:w-[100vw] text-black font-medium text-lg md:text-xl uppercase tracking-widest whitespace-nowrap hover:[animation-play-state:paused]" style={{ fontFamily: 'var(--font-mono)' }}>
        <div className="animate-marquee2 flex min-w-full justify-around shrink-0 gap-4 hover:[animation-play-state:paused]">
          <span>{text2.repeat(3)}</span>
        </div>
        <div className="animate-marquee2 flex min-w-full justify-around shrink-0 gap-4 hover:[animation-play-state:paused]">
          <span>{text2.repeat(3)}</span>
        </div>
      </div>
      
    </section>
  );
}
