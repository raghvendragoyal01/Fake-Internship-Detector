'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, ShieldCheck, ShieldAlert, Ban } from 'lucide-react';

type CheckResult = {
  status: string;
  trust_score: number;
  domain_name?: string;
  previous_reports: number;
  domain_age: number;
  domain_ssl: boolean;
  domain_email: boolean;
  reason?: string;
};

type RecentCheck = {
  query: string;
  result: CheckResult;
  date: string;
};

export default function VerifyRecruiterPage() {
  const [query, setQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState("");
  const [recentChecks, setRecentChecks] = useState<RecentCheck[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scamshield_recent_verifications');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  useEffect(() => {
    // any effect logic if needed
  }, []);

  const handleVerify = async () => {
    if (!query) return;
    setIsScanning(true);
    setError("");
    setResult(null);

    try {
      const isEmail = query.includes('@');
      const params = new URLSearchParams();
      if (isEmail) {
        params.append('email', query);
      } else {
        params.append('domain', query);
      }

      const res = await fetch(`/api/v1/recruiter-check?${params.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setResult(data.data);
        const newCheck = { query, result: data.data, date: new Date().toISOString() };
        setRecentChecks(prev => {
          // Remove duplicates of the same query
          const filtered = prev.filter(c => c.query !== query);
          const updated = [newCheck, ...filtered].slice(0, 10);
          localStorage.setItem('scamshield_recent_verifications', JSON.stringify(updated));
          return updated;
        });
      } else {
        setError(data.detail || "Failed to verify recruiter");
      }
    } catch (e) {
      console.error(e);
      setError("An error occurred while connecting to the server.");
    } finally {
      setIsScanning(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as any, bounce: 0.4 } } };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10 max-w-[800px] mx-auto w-full mt-10">
      <motion.div variants={itemVariants} className="mb-10 text-center">
        <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center text-black/40 mx-auto mb-6">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-4xl text-black tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>Verify Recruiter</h1>
        <p className="text-black/50">Check if a recruiter email or company domain is trustworthy or blacklisted.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
        <div className="mb-6">
          <label className="block text-sm font-medium text-black/70 mb-2">Email Address or Company Domain</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-black/40">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. hr@company.com or company.com"
              className="w-full bg-black/[0.02] border border-black/5 rounded-xl py-4 pl-12 pr-4 text-black outline-none focus:border-black/20 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleVerify();
              }}
            />
          </div>
        </div>
        
        <button 
          onClick={handleVerify}
          disabled={isScanning || !query}
          className="w-full bg-black text-white px-8 py-4 rounded-xl font-medium flex justify-center items-center gap-2 hover:bg-black/80 transition-transform active:scale-95 disabled:opacity-50"
        >
          {isScanning ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : <><Search size={18} /> Run Verification</>}
        </button>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-[#FF2D2D]/10 text-[#FF2D2D] text-center text-sm font-medium">
            {error}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }} 
            animate={{ opacity: 1, height: 'auto', marginTop: 48 }} 
          >
            <div className={`border rounded-3xl p-8 shadow-sm ${
              result.status === 'Verified' ? 'bg-[#166534]/5 border-[#166534]/10' :
              result.status === 'Blacklisted' ? 'bg-[#FF2D2D]/5 border-[#FF2D2D]/10' :
              'bg-[#F59E0B]/5 border-[#F59E0B]/10'
            }`}>
              <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                <div>
                  <h3 className="text-2xl font-semibold text-black" style={{ fontFamily: 'var(--font-display)' }}>Trust Status</h3>
                  <p className="text-black/50 mt-1">Real-time check across multiple databases.</p>
                </div>
                <div className={`px-6 py-2 rounded-full font-bold text-lg flex items-center gap-2 ${
                  result.status === 'Verified' ? 'bg-[#166534]/10 text-[#166534]' :
                  result.status === 'Blacklisted' ? 'bg-[#FF2D2D]/10 text-[#FF2D2D]' :
                  'bg-[#F59E0B]/10 text-[#F59E0B]'
                }`}>
                  {result.status === 'Verified' && <ShieldCheck size={20} />}
                  {result.status === 'Blacklisted' && <Ban size={20} />}
                  {(result.status !== 'Verified' && result.status !== 'Blacklisted') && <ShieldAlert size={20} />}
                  {result.status.toUpperCase()} ({result.trust_score}%)
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/50 rounded-2xl p-6 border border-white">
                  <h4 className="text-sm font-semibold text-black/50 uppercase tracking-wider mb-4">Risk Profile</h4>
                  <ul className="space-y-4">
                    <li className="flex justify-between items-center">
                      <span className="text-black/70">Domain Name</span>
                      <span className="font-semibold text-black">{result.domain_name || "N/A"}</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-black/70">Previous Reports</span>
                      <span className={`font-semibold ${result.previous_reports > 0 ? 'text-[#FF2D2D]' : 'text-[#166534]'}`}>
                        {result.previous_reports}
                      </span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-black/70">Domain Age</span>
                      <span className="font-semibold text-black">{result.domain_age} days</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-black/70">SSL Certificate</span>
                      <span className={`font-semibold ${result.domain_ssl ? 'text-[#166534]' : 'text-[#FF2D2D]'}`}>
                        {result.domain_ssl ? 'Valid' : 'Missing/Invalid'}
                      </span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-black/70">Email Provider</span>
                      <span className={`font-semibold ${result.domain_email ? 'text-[#F59E0B]' : 'text-[#166534]'}`}>
                        {result.domain_email ? 'Free/Public' : 'Custom/Business'}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white/50 rounded-2xl p-6 border border-white flex flex-col">
                  <h4 className="text-sm font-semibold text-black/50 uppercase tracking-wider mb-4">Analysis Details</h4>
                  <p className="text-black/80 leading-relaxed text-sm">
                    {result.reason || "We checked this contact against our ML intelligence database and partner networks."}
                  </p>
                  
                  {result.status === 'Blacklisted' && (
                    <div className="mt-auto bg-[#FF2D2D]/10 text-[#FF2D2D] p-4 rounded-xl text-sm font-medium mt-4">
                      Do not engage. This entity has been confirmed as malicious or part of an ongoing scam operation.
                    </div>
                  )}
                  {result.status === 'Suspicious' && (
                    <div className="mt-auto bg-[#F59E0B]/10 text-[#F59E0B] p-4 rounded-xl text-sm font-medium mt-4">
                      Proceed with caution. Never pay upfront fees and avoid sharing sensitive personal information.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Checks Section */}
      {recentChecks.length > 0 && (
        <motion.div variants={itemVariants} className="mt-12 mb-10">
          <h3 className="text-xl font-medium text-black mb-6" style={{ fontFamily: 'var(--font-display)' }}>Recent Checks</h3>
          <div className="flex flex-col gap-4">
            {recentChecks.map((check, idx) => (
              <div 
                key={idx} 
                onClick={() => {
                  setQuery(check.query);
                  setResult(check.result);
                  setError("");
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:border-black/20 hover:bg-black/[0.02] transition-all cursor-pointer"
              >
                <div>
                  <h4 className="font-medium text-black text-lg">{check.query}</h4>
                  <p className="text-sm text-black/50 mt-1">{new Date(check.date).toLocaleString()}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${
                  check.result.status === 'Verified' ? 'bg-[#166534]/10 text-[#166534] border-[#166534]/20' :
                  check.result.status === 'Blacklisted' ? 'bg-[#FF2D2D]/10 text-[#FF2D2D] border-[#FF2D2D]/20' :
                  'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20'
                }`}>
                  {check.result.status} ({check.result.trust_score}%)
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
