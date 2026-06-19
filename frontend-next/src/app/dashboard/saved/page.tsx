'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Clock, Briefcase, ExternalLink, ShieldCheck, ShieldAlert, Trash2, Search, Share2, CheckCircle2 } from 'lucide-react';

export default function UserSavedPage() {
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('scamshield_saved_jobs') || '[]');
      setSavedJobs(saved);
    } catch (e) {
      console.error("Failed to load saved jobs", e);
    }
  }, []);

  const handleRemoveJob = (urlToRemove: string) => {
    try {
      const updated = savedJobs.filter(job => job.url !== urlToRemove);
      setSavedJobs(updated);
      localStorage.setItem('scamshield_saved_jobs', JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to remove saved job", e);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const filteredJobs = useMemo(() => {
    if (!searchQuery) return savedJobs;
    const lowerQ = searchQuery.toLowerCase();
    return savedJobs.filter(job => 
      (job.title || "").toLowerCase().includes(lowerQ) || 
      (job.company || "").toLowerCase().includes(lowerQ)
    );
  }, [savedJobs, searchQuery]);

  const safeCount = savedJobs.filter(j => j.risk_level === 'LOW').length;

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as any, bounce: 0.4 } } };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10 max-w-[1200px] mx-auto w-full mt-6">
      
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 bg-white border border-black/5 p-8 rounded-3xl shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Bookmark size={28} />
          </div>
          <div>
            <h1 className="text-3xl text-black tracking-tight mb-1" style={{ fontFamily: 'var(--font-display)' }}>Saved Jobs</h1>
            <p className="text-black/50">You have {savedJobs.length} bookmarked {savedJobs.length === 1 ? 'job' : 'jobs'} ({safeCount} verified safe).</p>
          </div>
        </div>
        
        {savedJobs.length > 0 && (
          <div className="w-full md:w-72 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-black/40">
              <Search size={16} />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved jobs..."
              className="w-full bg-black/[0.02] border border-black/5 rounded-xl py-3 pl-10 pr-4 text-sm text-black outline-none focus:border-black/20 transition-colors"
            />
          </div>
        )}
      </motion.div>

      {savedJobs.length === 0 ? (
        <motion.div variants={itemVariants} className="bg-white border border-black/5 rounded-3xl p-16 text-center shadow-sm flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-black/[0.02] rounded-full flex items-center justify-center text-black/20 mb-6">
            <Clock size={32} />
          </div>
          <h3 className="text-2xl font-medium text-black mb-2" style={{ fontFamily: 'var(--font-display)' }}>Your vault is empty</h3>
          <p className="text-black/50 max-w-md mx-auto mb-8">
            Head over to the Job Alerts section to discover and save safe job opportunities. They will appear here for easy access.
          </p>
          <button 
            onClick={() => window.location.href='/dashboard/alerts'}
            className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-black/80 transition-transform active:scale-95"
          >
            Find Jobs
          </button>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence mode='popLayout'>
            {filteredJobs.map((job, idx) => (
              <motion.div 
                layout
                key={job.url || idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}
                className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="pr-4">
                    <h3 className="text-xl font-semibold text-black leading-tight mb-2">{job.title || "Job Title"}</h3>
                    <p className="text-black/60 flex items-center gap-2 text-sm font-medium">
                      <Briefcase size={14} className="text-black/40" /> {job.company || "Company"} • {job.location || "Location"}
                    </p>
                  </div>
                  {job.risk_level === 'LOW' ? (
                    <div className="bg-[#166534]/10 text-[#166534] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                      <ShieldCheck size={14} /> SAFE
                    </div>
                  ) : (
                    <div className="bg-[#FF2D2D]/10 text-[#FF2D2D] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                      <ShieldAlert size={14} /> RISKY ({job.scam_score}%)
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-black/60 line-clamp-3 mb-6 flex-grow leading-relaxed">
                  {job.description || "No description provided."}
                </p>
                
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-black/5">
                  <a 
                    href={job.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-black text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-black/80 transition-colors inline-flex items-center gap-2 flex-1 justify-center"
                  >
                    Apply Now <ExternalLink size={14} />
                  </a>
                  
                  <button
                    onClick={() => handleCopyLink(job.url)}
                    className="bg-black/[0.03] border border-black/5 text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/[0.06] transition-colors inline-flex items-center gap-2"
                    title="Copy Link"
                  >
                    {copiedUrl === job.url ? <CheckCircle2 size={16} className="text-[#166534]" /> : <Share2 size={16} />}
                  </button>

                  <button
                    onClick={() => handleRemoveJob(job.url)}
                    className="bg-[#FF2D2D]/5 border border-[#FF2D2D]/10 text-[#FF2D2D] px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#FF2D2D]/10 transition-colors inline-flex items-center gap-2"
                    title="Remove Bookmark"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredJobs.length === 0 && searchQuery && (
            <div className="col-span-full py-10 text-center text-black/50">
              No saved jobs matching "{searchQuery}"
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
