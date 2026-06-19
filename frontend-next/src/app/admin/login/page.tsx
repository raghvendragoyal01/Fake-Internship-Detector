'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Hardcoded master admin credentials for prototype
    setTimeout(() => {
      const emailInput = email.trim().toLowerCase();
      if (emailInput === 'admin@scamshield.com' && password === 'admin123') {
        localStorage.setItem('admin_auth', 'true');
        router.push('/admin/dashboard');
      } else {
        setError('Invalid admin credentials.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white rounded-[2rem] p-10 shadow-xl shadow-black/5 border border-black/5">
        
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-[#166534] rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-[#166534]/20">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-black mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Admin Portal
          </h1>
          <p className="text-black/50 font-medium text-sm">
            Restricted access. Please sign in to continue.
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-black/70 mb-2">Email Address</label>
            <div className="relative">
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@scamshield.com"
                className="w-full bg-black/[0.02] border border-black/5 rounded-xl px-4 py-3 text-black outline-none focus:border-black/20 focus:bg-white transition-all font-medium placeholder:font-normal"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-black/70 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/[0.02] border border-black/5 rounded-xl pl-11 pr-4 py-3 text-black outline-none focus:border-black/20 focus:bg-white transition-all font-medium placeholder:font-normal"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-[#FF2D2D]/10 text-[#FF2D2D] rounded-xl text-sm font-medium text-center">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white rounded-xl py-3.5 font-medium flex items-center justify-center gap-2 hover:bg-black/80 transition-colors mt-2"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>Sign In <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs font-medium text-black/40">
          For prototype purposes, use: <br/>
          <span className="text-black/60">admin@scamshield.com / admin123</span>
        </div>

      </div>
    </div>
  );
}
