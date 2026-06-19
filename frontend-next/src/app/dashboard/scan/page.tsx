'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, Link as LinkIcon, Mail } from 'lucide-react';

export default function UserScanPage() {
  const [text, setText] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [recruiterEmail, setRecruiterEmail] = useState("");
  
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleScan = async () => {
    if (!text && !jobUrl) return;
    setIsScanning(true);
    try {
      const payload = { 
        job_description: text, 
        job_url: jobUrl,
        recruiter_email: recruiterEmail
      };
      
      const res = await fetch('/api/v1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResult(data);
      
      // Auto-fill the textarea if we scraped something
      if (data?.data?.scraped_description && !text) {
        setText(data.data.scraped_description);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as any, bounce: 0.4 } } };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10 max-w-[1000px] mx-auto w-full">
      <motion.div variants={itemVariants} className="mb-10">
        <h1 className="text-4xl text-black tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>Deep Scan</h1>
        <p className="text-black/50">Paste a full job description or URL for a comprehensive Machine Learning analysis.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm mb-8">
        <div className="flex flex-col gap-6">
          <motion.div whileHover={{ scale: 1.01 }} transition={{ type: 'spring' as any, stiffness: 300 }}>
            <label className="block text-sm font-semibold text-black/80 mb-2 flex items-center gap-2">
              Job Description
              <span className="text-xs font-normal text-black/40 bg-black/5 px-2 py-0.5 rounded-full">Required (or provide URL below)</span>
            </label>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the full job description here. If left blank, we will attempt to scrape it from the URL..."
              className="w-full h-[180px] bg-black/[0.02] border border-black/10 hover:border-black/20 rounded-2xl p-5 text-black outline-none focus:border-black/30 focus:ring-4 focus:ring-black/5 transition-all resize-none shadow-inner"
            />
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring' as any, stiffness: 300 }}>
              <label className="block text-sm font-semibold text-black/80 mb-2">Job URL</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-black/40 group-focus-within:text-black transition-colors">
                  <LinkIcon size={18} />
                </div>
                <input 
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-black/[0.02] border border-black/10 hover:border-black/20 rounded-xl py-3 pl-12 pr-4 text-black outline-none focus:border-black/30 focus:ring-4 focus:ring-black/5 transition-all shadow-inner"
                />
              </div>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring' as any, stiffness: 300 }}>
              <label className="block text-sm font-semibold text-black/80 mb-2">Recruiter Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-black/40 group-focus-within:text-black transition-colors">
                  <Mail size={18} />
                </div>
                <input 
                  type="email"
                  value={recruiterEmail}
                  onChange={(e) => setRecruiterEmail(e.target.value)}
                  placeholder="hr@company.com"
                  className="w-full bg-black/[0.02] border border-black/10 hover:border-black/20 rounded-xl py-3 pl-12 pr-4 text-black outline-none focus:border-black/30 focus:ring-4 focus:ring-black/5 transition-all shadow-inner"
                />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="flex justify-end mt-10">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleScan}
            disabled={isScanning || (!text && !jobUrl)}
            className="bg-black text-white px-8 py-4 rounded-full font-semibold flex items-center gap-3 hover:bg-black/80 transition-colors disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-black/10"
          >
            {isScanning ? <><Loader2 size={20} className="animate-spin" /> Deep Scanning...</> : <><Search size={20} /> Start Deep Scan</>}
          </motion.button>
        </div>
      </motion.div>

      {result && result.data && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`border rounded-3xl p-8 shadow-sm ${result.data.risk_level === 'HIGH' ? 'bg-[#FF2D2D]/5 border-[#FF2D2D]/10' : result.data.risk_level === 'MEDIUM' ? 'bg-[#F59E0B]/5 border-[#F59E0B]/10' : 'bg-[#166534]/5 border-[#166534]/10'}`}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-semibold text-black" style={{ fontFamily: 'var(--font-display)' }}>Scan Verdict</h3>
              <p className="text-black/50 mt-1">Deep ML Analysis Complete.</p>
            </div>
            <div className={`px-6 py-2 rounded-full font-bold text-lg ${result.data.risk_level === 'HIGH' ? 'bg-[#FF2D2D]/10 text-[#FF2D2D]' : result.data.risk_level === 'MEDIUM' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-[#166534]/10 text-[#166534]'}`}>
              {result.data.scam_score}% RISK ({result.data.risk_level})
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/50 rounded-2xl p-6 border border-white">
              <h4 className="font-semibold text-black mb-4">Detected Signals</h4>
              {result.data.suspicious_keywords?.length > 0 ? (
                <ul className="space-y-3">
                  {result.data.suspicious_keywords.map((kw: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-black/70">
                      <span className="text-[#FF2D2D]">•</span> {kw}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-black/50 text-sm">No suspicious keywords detected.</p>
              )}
            </div>

            <div className="bg-white/50 rounded-2xl p-6 border border-white flex flex-col gap-4">
              <div>
                <h4 className="font-semibold text-black mb-1">Recommendation</h4>
                <p className="text-black/70 text-sm leading-relaxed">{result.data.recommendation}</p>
              </div>
              
              {result.data.domain_age_days !== undefined && result.data.domain_age_days !== null && result.data.domain_age_days >= 0 && (
                <div className="mt-auto">
                  <h4 className="font-semibold text-black mb-1">Domain Age</h4>
                  <p className="text-black/70 text-sm">{result.data.domain_age_days} days</p>
                </div>
              )}
              
              {result.data.scraped_description && !text && (
                <div className="mt-4 pt-4 border-t border-black/10">
                  <h4 className="font-semibold text-black mb-2">Scraped Description</h4>
                  <p className="text-black/60 text-xs italic line-clamp-4">
                    "{result.data.scraped_description}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
