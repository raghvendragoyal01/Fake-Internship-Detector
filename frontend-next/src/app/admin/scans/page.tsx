'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ShieldCheck, ShieldAlert, MoreHorizontal, Loader2 } from 'lucide-react';

interface ScanData {
  job_id: string;
  company_name: string;
  title: string;
  posted_date: string;
  scam_score: number;
  is_flagged: boolean;
}

export default function AdminScans() {
  const [scans, setScans] = useState<ScanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:10000/api/v1/admin/scans')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setScans(data.data || []);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as any, bounce: 0.4 } }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10 max-w-[1600px] mx-auto w-full mt-10">
      <motion.div variants={itemVariants} className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl text-black tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>All Scans</h1>
          <p className="text-black/50">A comprehensive history of all analyzed job listings.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center bg-white border border-black/10 rounded-full px-4 py-2 w-[300px]">
            <Search size={16} className="text-black/40 mr-2" />
            <input type="text" placeholder="Search by company or ID..." className="bg-transparent border-none outline-none text-sm w-full" />
          </div>
          <button className="bg-white border border-black/10 text-black px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-black/5 transition-colors">
            <Filter size={18} /> Filter
          </button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-white border border-black/5 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 flex justify-center items-center text-black/40">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : scans.length === 0 ? (
          <div className="p-20 text-center text-black/40 font-medium">No scan history found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/5 bg-black/[0.02]">
                  <th className="p-6 font-semibold text-black/40 text-xs tracking-wider">SCAN ID</th>
                  <th className="p-6 font-semibold text-black/40 text-xs tracking-wider">COMPANY & ROLE</th>
                  <th className="p-6 font-semibold text-black/40 text-xs tracking-wider">DATE</th>
                  <th className="p-6 font-semibold text-black/40 text-xs tracking-wider">RISK SCORE</th>
                  <th className="p-6 font-semibold text-black/40 text-xs tracking-wider">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {scans.map((scan) => (
                  <tr key={scan.job_id} className="hover:bg-black/[0.02] transition-colors">
                    <td className="p-6 text-sm font-medium text-black/70 font-mono">
                      {scan.job_id.substring(0, 8)}
                    </td>
                    <td className="p-6">
                      <div className="font-medium text-black">{scan.company_name}</div>
                      <div className="text-sm text-black/50">{scan.title}</div>
                    </td>
                    <td className="p-6 text-sm text-black/60">
                      {new Date(scan.posted_date || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-black/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${scan.is_flagged || scan.scam_score > 50 ? 'bg-[#FF2D2D]' : 'bg-[#166534]'}`} 
                            style={{ width: `${Math.min(100, Math.max(0, scan.scam_score))}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-black/60">{scan.scam_score}%</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border inline-flex items-center gap-1 ${
                        scan.is_flagged || scan.scam_score > 50 
                          ? 'bg-[#FF2D2D]/10 text-[#FF2D2D] border-[#FF2D2D]/20' 
                          : 'bg-[#166534]/10 text-[#166534] border-[#166534]/20'
                      }`}>
                        {scan.is_flagged || scan.scam_score > 50 ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                        {scan.is_flagged || scan.scam_score > 50 ? 'HIGH RISK' : 'SAFE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
