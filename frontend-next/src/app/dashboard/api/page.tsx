'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, Key, Copy, Loader2, Check, Lock, AlertTriangle, Terminal, ArrowRight, Eye, EyeOff, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UserApiPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [user, setUser] = useState<any>(null);
  
  // States for Key Reveal/Mask
  const [isKeyRevealed, setIsKeyRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  // States for Password Modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordAction, setPasswordAction] = useState<'reveal' | 'generate' | null>(null);
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState("");

  // States for Generate Modal
  const [newKeyModalOpen, setNewKeyModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('scamshield_user');
    const token = localStorage.getItem('scamshield_token');
    if (!stored || !token) {
      router.push('/auth');
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      fetchApiKey();
    } catch(e) {}
  }, [router]);

  const fetchApiKey = async () => {
    const token = localStorage.getItem('scamshield_token');
    try {
      const res = await fetch('/api/v1/api-key', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.api_key) {
        setApiKey(data.api_key);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setAuthError("Please enter your password");
      return;
    }
    
    setIsVerifying(true);
    setAuthError("");
    
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, password: password })
      });
      const data = await res.json();
      
      if (data.success) {
        setPasswordModalOpen(false);
        setPassword("");
        
        if (passwordAction === 'reveal') {
          setIsKeyRevealed(true);
        } else if (passwordAction === 'generate') {
          executeGenerate();
        }
      } else {
        setAuthError("Incorrect password");
      }
    } catch (e) {
      setAuthError("Error connecting to server");
    }
    setIsVerifying(false);
  };

  const executeGenerate = async () => {
    setIsGenerating(true);
    const token = localStorage.getItem('scamshield_token');
    try {
      const res = await fetch('/api/v1/api-key/regenerate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setApiKey(data.api_key);
        setNewKeyModalOpen(true);
        setIsKeyRevealed(false); // Make sure it's masked on the main page
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getMaskedKey = (key: string) => {
    if (!key) return "";
    if (key.length <= 15) return "****************";
    return key.substring(0, 15) + "************************";
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as any, bounce: 0.4 } } };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10 max-w-[1000px] mx-auto w-full">
      <motion.div variants={itemVariants} className="mb-10">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center">
            <Terminal size={24} />
          </div>
          <h1 className="text-4xl text-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Developer API</h1>
        </div>
        <p className="text-black/50 ml-16">Integrate the ScamShield ML engine directly into your own platforms.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-8">
          <div className="bg-white border border-black/10 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>
            <h3 className="font-medium text-lg mb-4 text-black flex items-center gap-2">
              <Key size={18} className="text-black/50" /> Secret Key
            </h3>
            
            {apiKey ? (
              <div className="space-y-4">
                <div className="bg-black/[0.02] border border-black/10 rounded-xl p-4 font-mono text-sm text-black break-all tracking-wider relative overflow-hidden">
                  {isKeyRevealed ? apiKey : getMaskedKey(apiKey)}
                </div>
                <div className="flex gap-2">
                  {!isKeyRevealed ? (
                    <button 
                      onClick={() => { setPasswordAction('reveal'); setPasswordModalOpen(true); }}
                      className="flex-1 bg-black text-white px-4 py-2.5 rounded-xl hover:bg-black/80 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Eye size={16} /> Reveal Key
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleCopy(apiKey)}
                        className="flex-1 bg-black text-white px-4 py-2.5 rounded-xl hover:bg-black/80 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        {copied ? <Check size={16} className="text-[#166534]" /> : <Copy size={16} />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                      <button 
                        onClick={() => setIsKeyRevealed(false)}
                        className="bg-black/5 text-black px-4 py-2.5 rounded-xl hover:bg-black/10 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        title="Hide Key"
                      >
                        <EyeOff size={16} />
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => { setPasswordAction('generate'); setPasswordModalOpen(true); }}
                    disabled={isGenerating}
                    className="bg-black/5 text-black px-4 py-2.5 rounded-xl hover:bg-black/10 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    title="Regenerate Key"
                  >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Loader2 size={16} className="rotate-90" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="bg-black/[0.02] border border-black/5 border-dashed rounded-xl p-4 text-center text-black/50 text-sm mb-4">
                  No active API key.
                </div>
                <button 
                  onClick={() => { setPasswordAction('generate'); setPasswordModalOpen(true); }}
                  disabled={isGenerating}
                  className="w-full bg-black text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-black/80 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                  Generate Key
                </button>
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-black/5">
              <p className="text-[11px] text-black/40">
                Keep this key secret. Do not expose it in public repositories or client-side code like React or Vue.
              </p>
            </div>
          </div>

          <div className="bg-[#166534]/5 border border-[#166534]/20 rounded-3xl p-6">
            <h3 className="font-medium text-[#166534] mb-2">Usage Limits</h3>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#166534]/70">Requests per minute</span>
                <span className="font-mono font-medium text-[#166534]">120</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#166534]/70">Monthly quota</span>
                <span className="font-mono font-medium text-[#166534]">10,000</span>
              </div>
            </div>
            <div className="w-full bg-[#166534]/10 rounded-full h-1.5 mt-4">
              <div className="bg-[#166534] h-1.5 rounded-full" style={{ width: '12%' }}></div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-black/10 rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-medium text-black mb-6" style={{ fontFamily: 'var(--font-display)' }}>Documentation</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-black mb-2 flex items-center gap-2">
                  <ArrowRight size={16} className="text-black/40" /> Analyze Job Posting
                </h3>
                <p className="text-sm text-black/60 mb-4">
                  Send a job description to our ML engine to receive a comprehensive risk analysis and scam probability score.
                </p>
                
                <div className="bg-black text-white rounded-xl overflow-hidden font-mono text-sm shadow-xl">
                  <div className="flex items-center justify-between px-4 py-2 bg-white/10 text-white/50 text-xs">
                    <span>HTTP Request</span>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded font-bold">POST</span>
                  </div>
                  <div className="p-4 overflow-x-auto whitespace-pre">
                    <span className="text-pink-400">POST</span> https://api.scamshield.io/v1/developer/analyze
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-black mb-3 text-sm">cURL Example</h4>
                <div className="bg-black text-white rounded-xl overflow-hidden font-mono text-sm shadow-xl">
                  <div className="p-4 overflow-x-auto whitespace-pre leading-relaxed text-white/80">
<span className="text-green-400">curl</span> -X POST https://api.scamshield.io/v1/developer/analyze \
-H <span className="text-yellow-300">"Authorization: Bearer YOUR_API_KEY"</span> \
-H <span className="text-yellow-300">"Content-Type: application/json"</span> \
-d <span className="text-yellow-300">'{'{'}
  "company_name": "Tech Corp",
  "job_description": "We are hiring...",
  "recruiter_email": "jobs@techcorp.com"
{'}'}'</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-black mb-3 text-sm">PowerShell Example (Windows)</h4>
                <div className="bg-black text-white rounded-xl overflow-hidden font-mono text-sm shadow-xl">
                  <div className="p-4 overflow-x-auto whitespace-pre leading-relaxed text-white/80">
<span className="text-green-400">Invoke-RestMethod</span> -Method Post -Uri <span className="text-yellow-300">"https://api.scamshield.io/v1/developer/analyze"</span> `
-Headers @{'{'} <span className="text-yellow-300">"Authorization"</span> = <span className="text-yellow-300">"Bearer YOUR_API_KEY"</span> {'}'} `
-ContentType <span className="text-yellow-300">"application/json"</span> `
-Body <span className="text-yellow-300">'{'{'}"company_name":"Tech Corp","job_description":"We are hiring...","recruiter_email":"jobs@techcorp.com"{'}'}'</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-black mb-3 text-sm">Python Example</h4>
                <div className="bg-black text-white rounded-xl overflow-hidden font-mono text-sm shadow-xl">
                  <div className="p-4 overflow-x-auto whitespace-pre leading-relaxed text-white/80">
<span className="text-pink-400">import</span> requests

url = <span className="text-yellow-300">"https://api.scamshield.io/v1/developer/analyze"</span>
headers = {'{'}
  <span className="text-yellow-300">"Authorization"</span>: <span className="text-yellow-300">"Bearer YOUR_API_KEY"</span>,
  <span className="text-yellow-300">"Content-Type"</span>: <span className="text-yellow-300">"application/json"</span>
{'}'}
data = {'{'}
  <span className="text-yellow-300">"company_name"</span>: <span className="text-yellow-300">"Tech Corp"</span>,
  <span className="text-yellow-300">"job_description"</span>: <span className="text-yellow-300">"We are hiring..."</span>
{'}'}

response = requests.post(url, headers=headers, json=data)
<span className="text-blue-300">print</span>(response.json())
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-black mb-3 text-sm">Response Payload</h4>
                <div className="bg-black text-white rounded-xl overflow-hidden font-mono text-sm shadow-xl">
                  <div className="p-4 overflow-x-auto whitespace-pre leading-relaxed text-white/80">
{'{'}
<span className="text-blue-300">"success"</span>: <span className="text-pink-400">true</span>,
<span className="text-blue-300">"data"</span>: {'{'}
  <span className="text-blue-300">"scam_score"</span>: <span className="text-purple-400">85</span>,
  <span className="text-blue-300">"risk_level"</span>: <span className="text-yellow-300">"HIGH"</span>,
  <span className="text-blue-300">"suspicious_keywords"</span>: [<span className="text-yellow-300">"western union"</span>, <span className="text-yellow-300">"wire transfer"</span>],
  <span className="text-blue-300">"recommendation"</span>: <span className="text-yellow-300">"Do not proceed. High risk of financial fraud."</span>
{'}'}
{'}'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Password Verification Modal */}
      <AnimatePresence>
        {passwordModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 shadow-2xl max-w-[400px] w-full relative"
            >
              <button 
                onClick={() => { setPasswordModalOpen(false); setAuthError(""); setPassword(""); }}
                className="absolute top-4 right-4 text-black/40 hover:text-black/80 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6 mt-2">
                <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center text-black mx-auto mb-4">
                  <Lock size={24} />
                </div>
                <h3 className="font-medium text-xl text-black" style={{ fontFamily: 'var(--font-display)' }}>Security Check</h3>
                <p className="text-sm text-black/50 mt-1">Please enter your password to continue.</p>
              </div>
              
              <form onSubmit={handleVerifyPassword} className="space-y-4">
                <div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Account Password"
                    className="w-full bg-black/[0.02] border border-black/10 rounded-xl py-3 px-4 text-black outline-none focus:border-black/30 transition-all text-center tracking-widest"
                    autoFocus
                  />
                </div>
                
                <AnimatePresence>
                  {authError && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[#FF2D2D] text-sm text-center flex items-center justify-center gap-2 overflow-hidden">
                      <AlertTriangle size={14} /> {authError}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <button 
                  type="submit" 
                  disabled={isVerifying || !password}
                  className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-black/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isVerifying ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Password'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New API Key Generated Modal */}
      <AnimatePresence>
        {newKeyModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] p-8 md:p-10 shadow-2xl max-w-[600px] w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6">
                <Check size={32} strokeWidth={3} />
              </div>
              
              <h2 className="text-3xl font-medium text-black mb-3" style={{ fontFamily: 'var(--font-display)' }}>API Key Generated!</h2>
              <p className="text-black/60 mb-8 max-w-md mx-auto">
                Please copy this key and save it somewhere safe. For your security, it will be masked once you close this window.
              </p>
              
              <div className="bg-black/[0.03] border border-black/10 rounded-2xl p-6 mb-8 relative group">
                <p className="font-mono text-lg text-black break-all select-all tracking-wider font-medium">
                  {apiKey}
                </p>
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => handleCopy(apiKey)}
                  className="bg-black text-white px-8 py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-black/90 transition-transform active:scale-95"
                >
                  {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                  {copied ? "Copied to Clipboard!" : "Copy Secret Key"}
                </button>
                <button 
                  onClick={() => setNewKeyModalOpen(false)}
                  className="bg-black/5 text-black px-8 py-4 rounded-xl font-medium hover:bg-black/10 transition-colors"
                >
                  I've saved it securely
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
