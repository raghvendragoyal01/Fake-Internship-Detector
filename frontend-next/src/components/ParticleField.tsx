'use client';

import { useEffect, useRef } from 'react';

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    const particleCount = 300;
    
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 100
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = 400; // Fixed height for separator
    };
    window.addEventListener('resize', resize);
    resize();

    class Particle {
      x: number;
      y: number;
      size: number;
      baseX: number;
      baseY: number;
      density: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.baseX = this.x;
        this.baseY = this.y;
        this.size = Math.random() * 2 + 0.5;
        this.density = (Math.random() * 30) + 1;
      }

      draw() {
        if (!ctx) return;
        // Premium soft grey
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        
        // Add subtle glow
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        
        ctx.fill();
        
        // Reset shadow
        ctx.shadowBlur = 0;
      }

      update() {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;
        const maxDistance = mouse.radius;
        const force = (maxDistance - distance) / maxDistance;
        const directionX = forceDirectionX * force * this.density;
        const directionY = forceDirectionY * force * this.density;

        if (distance < mouse.radius) {
          this.x -= directionX;
          this.y -= directionY;
        } else {
          if (this.x !== this.baseX) {
            const bdx = this.x - this.baseX;
            this.x -= bdx / 10;
          }
          if (this.y !== this.baseY) {
            const bdy = this.y - this.baseY;
            this.y -= bdy / 10;
          }
        }
        
        // Gentle drift
        this.baseX += (Math.random() - 0.5) * 0.2;
        this.baseY += (Math.random() - 0.5) * 0.2;
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
        particles[i].update();
      }
      requestAnimationFrame(animate);
    };

    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="w-full h-[400px] bg-white border-y border-black/[0.05] relative overflow-hidden flex items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 cursor-crosshair" />
      <div className="relative z-10 pointer-events-none opacity-[0.08] uppercase tracking-[0.5em] text-black font-bold" style={{ fontFamily: 'var(--font-display)' }}>
        Neural Scan Interface
      </div>
    </div>
  );
}
