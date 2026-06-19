'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogOut, LayoutDashboard } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function TopNav() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('scamshield_user');
      if (storedUser) {
        try {
          return JSON.parse(storedUser);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  useEffect(() => {

    // Also check if they just logged in
    const checkAuth = () => {
      const u = localStorage.getItem('scamshield_user');
      if (u) {
        setUser(JSON.parse(u));
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('scamshield_token');
    localStorage.removeItem('scamshield_user');
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  const handleDashboard = () => {
    if (user?.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-white/50 backdrop-blur-md border-b border-black/5">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white transition-transform group-hover:scale-105">
          <ShieldCheck size={18} />
        </div>
        <span className="font-semibold text-lg tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          ScamShield
        </span>
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <button 
              onClick={handleDashboard}
              className="text-sm font-medium hover:text-[#FF2D2D] transition-colors flex items-center gap-2"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </button>
            <button 
              onClick={handleLogout}
              className="text-sm font-medium text-black/60 hover:text-black transition-colors flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </>
        ) : (
          <Link 
            href="/auth" 
            className="bg-black text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-black/80 transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
