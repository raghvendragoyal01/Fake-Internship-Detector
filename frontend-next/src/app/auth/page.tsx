'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if coming back from Google OAuth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleOAuthCallback(session.user);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        handleOAuthCallback(session.user);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleOAuthCallback = async (user: any) => {
    setIsLoading(true);
    // Bridge Supabase Google Auth with our FastAPI JWT Auth
    try {
      const res = await fetch('http://localhost:10000/api/v1/auth/oauth-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: user.user_metadata?.full_name || "Google User" })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem("scamshield_token", data.token);
        localStorage.setItem("scamshield_user", JSON.stringify(data.user));
        
        if (data.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(data.detail || "OAuth login failed");
      }
    } catch (err) {
      console.error(err);
      setError("Server connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth'
      }
    });
    if (error) setError(error.message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const endpoint = isLogin ? '/login' : '/signup';
    const payload = isLogin ? { email, password } : { email, password, name };

    try {
      const res = await fetch(`http://localhost:10000/api/v1/auth${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        // Store JWT in localStorage as requested
        localStorage.setItem("scamshield_token", data.token);
        localStorage.setItem("scamshield_user", JSON.stringify(data.user));
        
        // Redirect based on role
        if (data.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(data.detail || "Authentication failed");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-black/[0.03] to-transparent pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] bg-white border border-black/10 rounded-3xl p-8 shadow-2xl shadow-black/5 relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white">
            <ShieldCheck size={24} />
          </div>
        </div>

        <h1 className="text-3xl text-center text-black mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h1>
        <p className="text-center text-black/50 text-sm mb-8">
          {isLogin ? 'Enter your details to access your dashboard.' : 'Start analyzing jobs with Machine Learning.'}
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[#FF2D2D]/10 text-[#FF2D2D] text-sm text-center font-medium border border-[#FF2D2D]/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-black/40">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/[0.02] border border-black/10 rounded-xl py-3 pl-12 pr-4 text-black outline-none focus:border-black/30 focus:bg-white transition-all"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-black/40">
              <Mail size={18} />
            </div>
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/[0.02] border border-black/10 rounded-xl py-3 pl-12 pr-4 text-black outline-none focus:border-black/30 focus:bg-white transition-all"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-black/40">
              <Lock size={18} />
            </div>
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/[0.02] border border-black/10 rounded-xl py-3 pl-12 pr-4 text-black outline-none focus:border-black/30 focus:bg-white transition-all"
            />
          </div>

          {isLogin && (
            <div className="flex justify-end">
              <a href="#" className="text-xs text-black/50 hover:text-black transition-colors">Forgot password?</a>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-black text-white py-4 rounded-xl font-medium flex justify-center items-center gap-2 hover:bg-black/80 transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="relative flex items-center py-6">
          <div className="flex-grow border-t border-black/10"></div>
          <span className="flex-shrink-0 mx-4 text-black/40 text-xs font-medium uppercase tracking-wider">Or continue with</span>
          <div className="flex-grow border-t border-black/10"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full bg-white border border-black/10 text-black py-4 rounded-xl font-medium flex justify-center items-center gap-3 hover:bg-black/[0.02] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.81 15.71 17.59V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
            <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.59C14.72 18.25 13.46 18.66 12 18.66C9.17 18.66 6.78 16.75 5.92 14.18H2.23V17.03C4.04 20.63 7.74 23 12 23Z" fill="#34A853"/>
            <path d="M5.92 14.18C5.7 13.52 5.58 12.78 5.58 12C5.58 11.22 5.7 10.48 5.92 9.82V6.97H2.23C1.49 8.44 1.06 10.15 1.06 12C1.06 13.85 1.49 15.56 2.23 17.03L5.92 14.18Z" fill="#FBBC05"/>
            <path d="M12 5.34C13.62 5.34 15.06 5.89 16.21 6.98L19.36 3.83C17.45 2.05 14.97 1 12 1C7.74 1 4.04 3.37 2.23 6.97L5.92 9.82C6.78 7.25 9.17 5.34 12 5.34Z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        <div className="mt-8 text-center text-sm text-black/60">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(""); }} 
            className="text-black font-semibold hover:underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
