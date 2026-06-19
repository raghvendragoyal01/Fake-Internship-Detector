'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle2, Trash2, Loader2, ExternalLink, Download } from 'lucide-react';

interface ReportData {
  report_id: string;
  user_email: string;
  company_name: string;
  job_url: string;
  scam_type: string;
  description: string;
  status: string;
  created_at: string;
  proof_file?: string;
}

export default function AdminReports() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('http://localhost:10000/api/v1/admin/reports');
      const data = await res.json();
      if (data.success) {
        setReports(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const resolveReport = async (reportId: string, status: string) => {
    try {
      await fetch(`http://localhost:10000/api/v1/admin/reports/${reportId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report permanently?')) return;
    try {
      await fetch(`http://localhost:10000/api/v1/admin/reports/${reportId}`, {
        method: 'DELETE'
      });
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  const exportCSV = () => {
    if (reports.length === 0) return;
    const headers = ['ID', 'Date', 'User Email', 'Company', 'Job URL', 'Scam Type', 'Status'];
    const csvContent = [
      headers.join(','),
      ...reports.map(r => 
        [r.report_id, new Date(r.created_at).toLocaleDateString(), r.user_email, `"${r.company_name}"`, r.job_url, `"${r.scam_type}"`, r.status].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `scamshield_reports_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as any, bounce: 0.4 } } };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10 max-w-[1200px] mx-auto w-full mt-10">
      
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl text-black tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Report Management
          </h1>
          <p className="text-black/50">Investigate user-submitted scam reports.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-black/5 hover:bg-black/10 text-black rounded-full font-medium transition-colors"
          >
            <Download size={16} /> Export CSV
          </button>
          <div className="w-16 h-16 bg-[#F59E0B]/10 text-[#F59E0B] rounded-2xl flex items-center justify-center">
            <FileText size={28} />
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col gap-6">
        {isLoading ? (
          <div className="bg-white border border-black/5 rounded-3xl p-20 flex justify-center items-center text-black/40">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white border border-black/5 rounded-3xl p-20 text-center text-black/40 font-medium">No reports submitted yet.</div>
        ) : (
          <AnimatePresence>
            {reports.map((r) => (
              <motion.div 
                key={r.report_id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm flex flex-col gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-black" style={{ fontFamily: 'var(--font-display)' }}>{r.company_name}</h3>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        r.status === 'valid_scam' ? 'bg-[#166534]/10 text-[#166534]' : 
                        r.status === 'false_alarm' ? 'bg-black/5 text-black/60' : 
                        'bg-[#F59E0B]/10 text-[#F59E0B]'
                      }`}>
                        {r.status === 'valid_scam' ? 'Confirmed' : r.status === 'false_alarm' ? 'Dismissed' : 'Pending'}
                      </span>
                    </div>
                    <div className="text-sm text-black/50 font-medium">
                      Reported by {r.user_email} on {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {r.status === 'pending' || !r.status ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => resolveReport(r.report_id, 'valid_scam')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#166534]/10 hover:bg-[#166534]/20 text-[#166534] rounded-lg text-sm font-medium transition-colors"
                        >
                          <CheckCircle2 size={16} /> Confirm Scam
                        </button>
                        <button 
                          onClick={() => resolveReport(r.report_id, 'false_alarm')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 hover:bg-black/10 text-black/60 rounded-lg text-sm font-medium transition-colors"
                        >
                          False Alarm
                        </button>
                      </div>
                    ) : (
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${r.status === 'valid_scam' ? 'bg-[#166534]/10 text-[#166534] border-[#166534]/20' : 'bg-black/5 text-black/60 border-black/10'}`}>
                        {r.status === 'valid_scam' ? 'CONFIRMED SCAM' : 'FALSE ALARM'}
                      </span>
                    )}
                    <button 
                      onClick={() => deleteReport(r.report_id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 hover:bg-[#FF2D2D]/10 hover:text-[#FF2D2D] text-black/60 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="p-4 bg-black/[0.02] rounded-2xl border border-black/5">
                    <div className="text-xs font-semibold text-black/40 mb-1">SCAM TYPE</div>
                    <div className="text-sm font-medium text-black">{r.scam_type}</div>
                  </div>
                  <div className="p-4 bg-black/[0.02] rounded-2xl border border-black/5">
                    <div className="text-xs font-semibold text-black/40 mb-1">JOB LINK</div>
                    <a href={r.job_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                      {r.job_url} <ExternalLink size={14} />
                    </a>
                  </div>
                </div>

                <div className="p-4 bg-black/[0.02] rounded-2xl border border-black/5">
                  <div className="text-xs font-semibold text-black/40 mb-1">USER DESCRIPTION</div>
                  <p className="text-sm text-black/80 whitespace-pre-wrap">{r.description}</p>
                </div>
                
                {r.proof_file && (
                  <div className="p-4 bg-[#166534]/5 rounded-2xl border border-[#166534]/10">
                    <div className="text-xs font-semibold text-[#166534]/60 mb-1">EVIDENCE PROVIDED</div>
                    <p className="text-sm text-[#166534] font-medium">{r.proof_file}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

    </motion.div>
  );
}
