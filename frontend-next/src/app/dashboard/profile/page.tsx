'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Save, Loader2, UploadCloud, FileText, CheckCircle, GitBranch as Github, Link as Linkedin, Briefcase, ExternalLink, X, ChevronRight, BarChart, Copy, Code2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const CircularProgress = ({ value, label, color }: { value: number, label: string, color: string }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-black/5" />
          <circle 
            cx="48" cy="48" r={radius} stroke={color} strokeWidth="6" fill="transparent" 
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" 
            className="transition-all duration-1000 ease-out" 
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-black" style={{ fontFamily: 'var(--font-display)' }}>{value}</span>
        </div>
      </div>
      <span className="text-xs text-black/60 mt-1 font-medium tracking-wide uppercase text-center">{label}</span>
    </div>
  );
};

export default function UserProfilePage() {
  const router = useRouter();
  
  // Link States
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [indeed, setIndeed] = useState("");
  const [naukri, setNaukri] = useState("");
  const [isSubmittingLinks, setIsSubmittingLinks] = useState(false);
  const [linkMessage, setLinkMessage] = useState("");

  // GitHub Stats State
  const [githubStats, setGithubStats] = useState<any>(null);
  const [isFetchingGithub, setIsFetchingGithub] = useState(false);

  // Resume Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [targetJob, setTargetJob] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [atsResult, setAtsResult] = useState<any>(null);
  const [atsError, setAtsError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (github) {
      const match = github.match(/github\.com\/([^/]+)/);
      if (match && match[1]) {
        fetchGithubStats(match[1]);
      } else {
        setGithubStats(null);
      }
    } else {
      setGithubStats(null);
    }
  }, [github]);

  const fetchProfile = async () => {
    const token = localStorage.getItem('scamshield_token');
    try {
      const res = await fetch('http://localhost:10000/api/v1/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setLinkedin(data.data.linkedin || "");
        setGithub(data.data.github || "");
        setIndeed(data.data.indeed || "");
        setNaukri(data.data.naukri || "");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGithubStats = async (username: string) => {
    setIsFetchingGithub(true);
    try {
      const [statsRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`),
        fetch(`https://api.github.com/users/${username}/repos?per_page=100`)
      ]);
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        let topLanguages: string[] = [];
        if (reposRes.ok) {
          const reposData = await reposRes.json();
          const langCounts: Record<string, number> = {};
          reposData.forEach((repo: any) => {
            if (repo.language) {
              langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
            }
          });
          topLanguages = Object.entries(langCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(entry => entry[0]);
        }
        statsData.top_languages = topLanguages;
        setGithubStats(statsData);
      } else {
        setGithubStats(null);
      }
    } catch (e) {
      setGithubStats(null);
    } finally {
      setIsFetchingGithub(false);
    }
  };

  const handleSaveLinks = async () => {
    setIsSubmittingLinks(true);
    setLinkMessage("");
    const token = localStorage.getItem('scamshield_token');
    try {
      const res = await fetch('http://localhost:10000/api/v1/profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ linkedin, github, indeed, naukri })
      });
      const data = await res.json();
      if (data.success) {
        setLinkMessage("Profile links saved securely!");
        setTimeout(() => setLinkMessage(""), 3000);
      } else {
        setLinkMessage("Error saving profile. Constraints issue.");
      }
    } catch (e) {
      setLinkMessage("Failed to update profile.");
    } finally {
      setIsSubmittingLinks(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setAtsError("Please upload a PDF file.");
        return;
      }
      setResumeFile(file);
      setAtsError("");
      setAtsResult(null);
    }
  };

  const handleAnalyzeResume = async () => {
    if (!resumeFile) return;
    setIsAnalyzing(true);
    setAtsError("");
    setAtsResult(null);

    const formData = new FormData();
    formData.append('file', resumeFile);
    if (targetJob) formData.append('target_job', targetJob);

    const token = localStorage.getItem('scamshield_token');

    try {
      const res = await fetch('http://localhost:10000/api/v1/ats-analyze', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setAtsResult(data.data);
      } else {
        setAtsError(data.detail || "Analysis failed.");
      }
    } catch (e) {
      setAtsError("Network error. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopySkills = () => {
    if (atsResult?.extracted_skills) {
      navigator.clipboard.writeText(atsResult.extracted_skills.join(", "));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as any, bounce: 0.4 } } };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10 max-w-[1400px] mx-auto w-full">
      <motion.div variants={itemVariants} className="mb-12">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center">
            <User size={24} />
          </div>
          <h1 className="text-4xl text-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Profile & ATS Hub</h1>
        </div>
        <p className="text-black/50 ml-16">Link your professional identity and optimize your resume using ML.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Inputs & Uploads */}
        <div className="lg:col-span-5 space-y-8 sticky top-10">
          <motion.div variants={itemVariants} className="bg-white border border-black/10 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-medium text-black mb-6" style={{ fontFamily: 'var(--font-display)' }}>Professional Links</h2>
            
            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-black/70 mb-2">
                  <Linkedin size={16} className="text-[#0A66C2]" /> LinkedIn URL
                </label>
                <input 
                  type="text" value={linkedin} onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full bg-black/[0.02] border border-black/5 rounded-xl p-3 text-black outline-none focus:border-black/20 transition-colors"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-black/70 mb-2">
                  <Github size={16} /> GitHub URL
                </label>
                <input 
                  type="text" value={github} onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full bg-black/[0.02] border border-black/5 rounded-xl p-3 text-black outline-none focus:border-black/20 transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-black/70 mb-2">
                  <Briefcase size={16} className="text-blue-500" /> Indeed Profile
                </label>
                <input 
                  type="text" value={indeed} onChange={(e) => setIndeed(e.target.value)}
                  placeholder="https://indeed.com/p/username"
                  className="w-full bg-black/[0.02] border border-black/5 rounded-xl p-3 text-black outline-none focus:border-black/20 transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-black/70 mb-2">
                  <Briefcase size={16} className="text-orange-500" /> Naukri Profile
                </label>
                <input 
                  type="text" value={naukri} onChange={(e) => setNaukri(e.target.value)}
                  placeholder="https://naukri.com/mnjuser/profile"
                  className="w-full bg-black/[0.02] border border-black/5 rounded-xl p-3 text-black outline-none focus:border-black/20 transition-colors"
                />
              </div>
            </div>
            
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm font-medium text-[#166534] max-w-[200px] truncate">{linkMessage}</div>
              <button 
                onClick={handleSaveLinks} disabled={isSubmittingLinks}
                className="bg-black text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-black/80 transition-transform active:scale-95 disabled:opacity-50 whitespace-nowrap"
              >
                {isSubmittingLinks ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Links
              </button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white border border-black/10 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium text-black" style={{ fontFamily: 'var(--font-display)' }}>Resume Upload</h2>
              <div className="px-3 py-1 bg-purple-500/10 text-purple-600 rounded-full text-xs font-bold tracking-wider uppercase">ATS Scanner</div>
            </div>
            
            <div className="space-y-6">
              {/* File Upload Area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
                  ${resumeFile ? 'border-purple-500 bg-purple-500/5' : 'border-black/10 hover:border-black/30 hover:bg-black/[0.02]'}`}
              >
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} />
                {resumeFile ? (
                  <div className="flex flex-col items-center">
                    <FileText size={40} className="text-purple-500 mb-3" />
                    <span className="font-medium text-black">{resumeFile.name}</span>
                    <span className="text-xs text-black/50 mt-1">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    <button onClick={(e) => { e.stopPropagation(); setResumeFile(null); setAtsResult(null); }} className="mt-4 text-xs text-red-500 hover:underline">Remove</button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-black/50">
                    <UploadCloud size={40} className="mb-3 opacity-50" />
                    <span className="font-medium text-black/70">Upload your Resume (PDF)</span>
                    <span className="text-xs mt-2">Click or drag & drop</span>
                  </div>
                )}
              </div>

              {/* Target Job Area */}
              <div>
                <label className="block text-sm font-medium text-black/70 mb-2">Target Job Description <span className="text-black/40 font-normal">(Optional)</span></label>
                <textarea 
                  value={targetJob}
                  onChange={(e) => setTargetJob(e.target.value)}
                  placeholder="Paste the job description here to see how well your resume matches..."
                  className="w-full h-28 bg-black/[0.02] border border-black/5 rounded-xl p-3 text-black text-sm outline-none focus:border-black/20 transition-colors resize-none"
                ></textarea>
              </div>

              {atsError && <div className="text-sm text-red-500 font-medium text-center">{atsError}</div>}

              <button 
                onClick={handleAnalyzeResume} disabled={isAnalyzing || !resumeFile}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <BarChart size={18} />} 
                {isAnalyzing ? "Scanning Document..." : "Analyze Resume"}
              </button>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Visualizations & Extractions */}
        <div className="lg:col-span-7 space-y-8">
          
          <AnimatePresence>
            {githubStats && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-br from-[#0d1117] to-[#161b22] border border-[#30363d] rounded-3xl p-8 shadow-xl text-white overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Github size={120} />
                </div>
                <div className="flex items-center gap-4 mb-8 relative z-10">
                  <img src={githubStats.avatar_url} alt="GitHub Avatar" className="w-20 h-20 rounded-full border-2 border-[#58a6ff]" />
                  <div>
                    <h3 className="text-2xl font-bold">{githubStats.name || githubStats.login}</h3>
                    <a href={githubStats.html_url} target="_blank" className="text-[#58a6ff] hover:underline text-sm flex items-center gap-1 mt-1">
                      @{githubStats.login} <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 border-y border-[#30363d] py-6 relative z-10">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{githubStats.public_repos}</div>
                    <div className="text-xs text-white/50 uppercase tracking-widest mt-2">Repos</div>
                  </div>
                  <div className="text-center border-l border-r border-[#30363d]">
                    <div className="text-3xl font-bold">{githubStats.followers}</div>
                    <div className="text-xs text-white/50 uppercase tracking-widest mt-2">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{githubStats.following}</div>
                    <div className="text-xs text-white/50 uppercase tracking-widest mt-2">Following</div>
                  </div>
                </div>

                {githubStats.top_languages && githubStats.top_languages.length > 0 && (
                  <div className="mt-6 relative z-10">
                    <div className="text-xs text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Code2 size={14} /> Top Languages
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {githubStats.top_languages.map((lang: string) => (
                        <span key={lang} className="px-3 py-1 bg-[#238636]/20 text-[#3fb950] border border-[#238636]/50 rounded-full text-xs font-medium">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {githubStats.bio && (
                  <p className="mt-6 text-sm text-white/70 italic relative z-10">"{githubStats.bio}"</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {atsResult && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                
                {/* Extracted Skills Section */}
                <div className="bg-white border border-black/10 rounded-3xl p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-medium text-black flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                      <CheckCircle size={20} className="text-green-500" /> Extracted Skills
                    </h2>
                    <button 
                      onClick={handleCopySkills}
                      className="text-xs font-medium bg-black/5 hover:bg-black/10 text-black px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      {copied ? <><CheckCircle size={14} className="text-green-600"/> Copied!</> : <><Copy size={14} /> Copy List</>}
                    </button>
                  </div>
                  
                  {atsResult.extracted_skills && atsResult.extracted_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {atsResult.extracted_skills.map((skill: string, i: number) => (
                        <div key={i} className="px-4 py-2 bg-black/[0.03] border border-black/5 rounded-xl text-sm font-medium text-black/80">
                          {skill}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-black/50 italic">No technical skills automatically detected.</div>
                  )}
                </div>

                {/* ATS Score Visualizations */}
                <div className="bg-white border border-black/10 rounded-3xl p-8 shadow-sm">
                  <h2 className="text-xl font-medium text-black mb-8" style={{ fontFamily: 'var(--font-display)' }}>ATS Assessment</h2>
                  
                  <div className="flex items-center gap-8 mb-8">
                    <CircularProgress 
                      value={atsResult.overall_score} 
                      label="Match Score" 
                      color={atsResult.overall_score > 75 ? "#10B981" : atsResult.overall_score > 50 ? "#F59E0B" : "#EF4444"} 
                    />
                    
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div className="bg-black/[0.02] rounded-2xl p-5 flex flex-col justify-center items-center">
                        <div className="text-3xl font-bold text-black" style={{ fontFamily: 'var(--font-display)' }}>{atsResult.formatting_score}%</div>
                        <div className="text-xs text-black/50 uppercase tracking-wider mt-2 font-medium">Formatting</div>
                      </div>
                      <div className="bg-black/[0.02] rounded-2xl p-5 flex flex-col justify-center items-center">
                        <div className="text-3xl font-bold text-black" style={{ fontFamily: 'var(--font-display)' }}>{atsResult.keyword_match}%</div>
                        <div className="text-xs text-black/50 uppercase tracking-wider mt-2 font-medium">Keywords</div>
                      </div>
                      <div className="bg-black/[0.02] rounded-2xl p-5 flex flex-col justify-center items-center">
                        <div className="text-3xl font-bold text-black" style={{ fontFamily: 'var(--font-display)' }}>{atsResult.impact_metrics}%</div>
                        <div className="text-xs text-black/50 uppercase tracking-wider mt-2 font-medium">Impact</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6">
                    <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                      AI Feedback Insight
                    </h4>
                    <p className="text-[15px] text-blue-900/80 leading-relaxed">
                      {atsResult.feedback}
                    </p>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {!githubStats && !atsResult && (
            <div className="h-full min-h-[400px] border-2 border-dashed border-black/5 rounded-3xl flex flex-col items-center justify-center text-black/30 p-10 text-center">
              <BarChart size={64} className="mb-4 opacity-50" />
              <h3 className="text-xl font-medium text-black/50 mb-2">No Visualizations Yet</h3>
              <p className="max-w-xs">Upload your resume or link your GitHub profile to see AI-powered insights and stats appear here.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
