'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Loader2, Briefcase, ExternalLink, ShieldCheck, ShieldAlert, Bookmark } from 'lucide-react';

export default function UserAlertsPage() {
  const [skills, setSkills] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('scamshield_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserEmail(parsedUser.email);
      } catch (e) {
        console.error("Failed to parse user session", e);
      }
    }
  }, []);

  const handleSaveJob = (job: any) => {
    try {
      const saved = JSON.parse(localStorage.getItem('scamshield_saved_jobs') || '[]');
      const isAlreadySaved = saved.some((s: any) => s.url === job.url);
      if (!isAlreadySaved) {
        saved.push(job);
        localStorage.setItem('scamshield_saved_jobs', JSON.stringify(saved));
        alert("Job saved successfully!");
      } else {
        alert("Job is already saved.");
      }
    } catch (e) {
      console.error("Failed to save job", e);
    }
  };

  const handleSubscribe = async () => {
    if (!skills) return;
    setIsSubmitting(true);
    setMessage("");
    setJobs([]);
    try {
      const res = await fetch('http://localhost:10000/api/v1/subscribe-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, skills })
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Successfully subscribed to job alerts!");
        if (data.jobs && data.jobs.length > 0) {
          setJobs(data.jobs);
        }
      } else {
        setMessage("Failed to subscribe.");
      }
    } catch (e) {
      console.error(e);
      setMessage("Error subscribing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as any, bounce: 0.4 } } };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10 max-w-[800px] mx-auto w-full mt-10">
      <motion.div variants={itemVariants} className="mb-10 text-center">
        <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center text-black/40 mx-auto mb-6">
          <Bell size={32} />
        </div>
        <h1 className="text-4xl text-black tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>Job Alerts</h1>
        <p className="text-black/50">Get notified when safe jobs matching your skills are detected.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
        <div className="mb-6">
          <label className="block text-sm font-medium text-black/70 mb-2">Target Skills or Job Titles</label>
          <input 
            type="text" 
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. React Developer, Data Scientist, Python"
            className="w-full bg-black/[0.02] border border-black/5 rounded-xl p-4 text-black outline-none focus:border-black/20 transition-colors"
          />
        </div>
        
        <button 
          onClick={handleSubscribe}
          disabled={isSubmitting || !skills}
          className="w-full bg-black text-white px-8 py-4 rounded-xl font-medium flex justify-center items-center gap-2 hover:bg-black/80 transition-transform active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Subscribing...</> : <><Plus size={18} /> Create Alert</>}
        </button>

        {message && (
          <div className="mt-4 p-4 rounded-xl bg-[#166534]/10 text-[#166534] text-center text-sm font-medium">
            {message}
          </div>
        )}
      </motion.div>

      {/* Live Screened Jobs */}
      <AnimatePresence>
        {jobs.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            className="mt-12"
          >
            <h2 className="text-2xl font-semibold text-black mb-6" style={{ fontFamily: 'var(--font-display)' }}>Live Screened Jobs</h2>
            <div className="flex flex-col gap-4">
              {jobs.map((job, idx) => (
                <div key={idx} className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-medium text-black">{job.title || "Job Title"}</h3>
                      <p className="text-black/60 flex items-center gap-2 mt-1">
                        <Briefcase size={16} /> {job.company || "Company"} • {job.location || "Location"}
                      </p>
                    </div>
                    {job.risk_level === 'LOW' ? (
                      <div className="bg-[#166534]/10 text-[#166534] px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <ShieldCheck size={14} /> SAFE
                      </div>
                    ) : (
                      <div className="bg-[#FF2D2D]/10 text-[#FF2D2D] px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <ShieldAlert size={14} /> RISKY ({job.scam_score}%)
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-black/70 line-clamp-3 mb-4">
                    {job.description || "No description provided."}
                  </p>
                  {job.suspicious_keywords && job.suspicious_keywords.length > 0 && job.risk_level !== 'LOW' && (
                    <div className="mb-6 bg-[#FF2D2D]/5 rounded-xl p-4 border border-[#FF2D2D]/10">
                      <h4 className="text-xs font-bold text-[#FF2D2D] mb-2 uppercase tracking-wider">Detected Suspicious Keywords:</h4>
                      <div className="flex flex-wrap gap-2">
                        {job.suspicious_keywords.map((kw: string, i: number) => (
                          <span key={i} className="text-xs font-semibold text-[#FF2D2D] bg-[#FF2D2D]/10 px-2.5 py-1 rounded-md">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <a 
                      href={job.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-black/80 transition-colors inline-flex items-center gap-2"
                    >
                      View Original Posting <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={() => handleSaveJob(job)}
                      className="bg-white border border-black/10 text-black px-6 py-2.5 rounded-full text-sm font-medium hover:bg-black/5 transition-colors inline-flex items-center gap-2"
                    >
                      <Bookmark size={14} /> Save Job
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
