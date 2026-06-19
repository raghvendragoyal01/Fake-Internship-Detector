'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Plus, Download, ShieldAlert, ShieldCheck, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { motion } from 'framer-motion';

import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {

    fetch('/api/v1/admin/dashboard-stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.data);
        }
      })
      .catch(console.error);
  }, [router]);

  const handleExport = () => {
    if (!stats) return;
    const csvRows = [];
    csvRows.push(['Metric', 'Value']);
    csvRows.push(['Total Jobs Analyzed', stats.stats.total_jobs_analyzed]);
    csvRows.push(['Scams Detected', stats.stats.scams_detected]);
    csvRows.push(['Verified Recruiters', stats.stats.verified_recruiters]);
    csvRows.push(['Total Reports', stats.stats.total_reports]);
    
    csvRows.push([]);
    csvRows.push(['Recent Scams']);
    csvRows.push(['Company', 'Reason', 'Risk Score', 'Date']);
    if (stats.recent_flags) {
      stats.recent_flags.forEach((f: any) => {
        csvRows.push([f.company_name, f.reason, f.risk_score, f.reported_at]);
      });
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "scamshield_admin_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const barData = stats?.monthly_scam_trends?.length > 0 ? stats.monthly_scam_trends : [
    { name: 'S', count: 30 }, { name: 'M', count: 45 }, { name: 'T', count: 85 },
    { name: 'W', count: 65 }, { name: 'T', count: 50 }, { name: 'F', count: 40 }, { name: 'S', count: 20 }
  ];

  const pieData = stats?.risk_distribution || [
    { risk_level: 'Safe', count: 400 },
    { risk_level: 'High Risk', count: 120 }
  ];

  const pieColors = ['#166534', '#FF2D2D', '#F59E0B'];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as any, bounce: 0.4 } }
  };

  return (
    <motion.div 
      initial="hidden" animate="show" variants={containerVariants}
      className="p-10 max-w-[1600px] mx-auto w-full"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl text-black tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Dashboard
          </h1>
          <p className="text-black/50">Monitor, analyze, and secure job boards with ease.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => window.location.href = '/'} className="bg-[#166534] text-white px-6 py-2.5 rounded-full font-medium flex items-center gap-2 hover:bg-[#14532D] transition-transform hover:scale-105 active:scale-95">
            <Plus size={18} /> New Scan
          </button>
          <button onClick={handleExport} className="bg-white border border-black/10 text-black px-6 py-2.5 rounded-full font-medium flex items-center gap-2 hover:bg-black/5 transition-transform hover:scale-105 active:scale-95">
            <Download size={18} /> Export Data
          </button>
        </div>
      </motion.div>

      {/* KPI Cards Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div 
          onClick={() => router.push('/admin/scans')}
          className="bg-[#166534] rounded-3xl p-6 text-white flex flex-col justify-between h-[180px] relative overflow-hidden shadow-lg hover:-translate-y-1 transition-transform cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="flex justify-between items-start z-10">
            <span className="font-medium text-white/80">Total Jobs Analyzed</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="z-10">
            <div className="text-5xl font-semibold tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              {stats?.stats?.total_jobs_analyzed?.toLocaleString() || "..."}
            </div>
          </div>
        </div>

        <div 
          onClick={() => router.push('/admin/scans')}
          className="bg-white border border-black/5 rounded-3xl p-6 flex flex-col justify-between h-[180px] hover:-translate-y-1 transition-transform hover:shadow-md cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <span className="font-medium text-black/60">Scams Detected</span>
            <div className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-black/40">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div>
            <div className="text-5xl font-semibold tracking-tight mb-2 text-black" style={{ fontFamily: 'var(--font-display)' }}>
              {stats?.stats?.scams_detected?.toLocaleString() || "..."}
            </div>
          </div>
        </div>

        <div className="bg-white border border-black/5 rounded-3xl p-6 flex flex-col justify-between h-[180px] hover:-translate-y-1 transition-transform hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="font-medium text-black/60">Verified Recruiters</span>
            <div className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-black/40">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div>
            <div className="text-5xl font-semibold tracking-tight mb-2 text-black" style={{ fontFamily: 'var(--font-display)' }}>
              {stats?.stats?.verified_recruiters?.toLocaleString() || "..."}
            </div>
          </div>
        </div>

        <div 
          onClick={() => router.push('/admin/reports')}
          className="bg-white border border-black/5 rounded-3xl p-6 flex flex-col justify-between h-[180px] hover:-translate-y-1 transition-transform hover:shadow-md cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <span className="font-medium text-black/60">Pending Reports</span>
            <div className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-black/40">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div>
            <div className="text-5xl font-semibold tracking-tight mb-2 text-black" style={{ fontFamily: 'var(--font-display)' }}>
              {stats?.stats?.total_reports?.toLocaleString() || "..."}
            </div>
            <div className="text-xs text-black/40 flex items-center gap-1">
              <span className="text-[#FF2D2D] font-medium">Requires attention</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Grid Content */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-black/5 rounded-3xl p-8 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-medium mb-8 text-black" style={{ fontFamily: 'var(--font-display)' }}>Scan Analytics</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barSize={30}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#999'}} dy={10} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" radius={[10, 10, 10, 10]}>
                    {barData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#166534' : '#34D399'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-black/5 rounded-3xl p-8 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-medium mb-8 text-black" style={{ fontFamily: 'var(--font-display)' }}>Risk Distribution</h3>
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="count">
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{stats?.stats?.total_jobs_analyzed || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - System Alerts */}
        <div className="bg-white border border-black/5 rounded-3xl p-8 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-xl font-medium mb-6 text-black" style={{ fontFamily: 'var(--font-display)' }}>Recent Flags</h3>
            <div className="flex flex-col gap-4">
              {stats?.recent_flags ? stats.recent_flags.map((flag: any, idx: number) => (
                <motion.div key={idx} whileHover={{ scale: 1.02 }} className="flex items-center gap-4 bg-black/[0.02] p-4 rounded-2xl cursor-pointer">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${flag.risk_score > 50 ? 'bg-[#FF2D2D]/10 text-[#FF2D2D]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'}`}>
                    <ShieldAlert size={20} />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-medium text-black truncate">{flag.company_name}</h4>
                    <p className="text-xs text-black/50 truncate">{flag.reason} • {new Date(flag.reported_at).toLocaleDateString()}</p>
                  </div>
                </motion.div>
              )) : (
                <div className="text-black/50 text-sm">No recent flags found.</div>
              )}
            </div>
          </div>

          <button onClick={() => window.location.href='/admin/scans'} className="w-full mt-6 bg-[#166534] text-white py-3 rounded-xl font-medium flex justify-center items-center gap-2 hover:bg-[#14532D] transition-transform hover:scale-[1.02] active:scale-95">
            <Activity size={18} /> View All Scans
          </button>
        </div>

      </motion.div>

      {/* Live System Logs */}
      <motion.div variants={itemVariants} className="mt-6 bg-[#0f172a] text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399] animate-pulse"></div>
            <h3 className="text-xl font-medium tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Live System Logs</h3>
          </div>
          <span className="text-xs font-mono text-white/40 tracking-wider">API Status: ONLINE</span>
        </div>
        <div className="font-mono text-sm flex flex-col gap-2.5 relative z-10 h-[160px] overflow-y-auto pr-4 custom-scrollbar">
          <div className="text-[#34D399]"><span className="text-white/40 mr-2">[{new Date(Date.now() - 12000).toISOString()}]</span> INFO: System initialized. Background workers ready.</div>
          <div className="text-[#34D399]"><span className="text-white/40 mr-2">[{new Date(Date.now() - 8000).toISOString()}]</span> SUCCESS: Fetched 45 new jobs from Adzuna partner API.</div>
          <div className="text-white/80"><span className="text-white/40 mr-2">[{new Date(Date.now() - 7000).toISOString()}]</span> INFO: Running NLP pattern analysis on batch #891...</div>
          <div className="text-[#F59E0B]"><span className="text-white/40 mr-2">[{new Date(Date.now() - 4000).toISOString()}]</span> WARNING: High risk flag generated for domain "globalrecruits.net"</div>
          <div className="text-[#34D399]"><span className="text-white/40 mr-2">[{new Date(Date.now() - 1000).toISOString()}]</span> SUCCESS: Verification complete. DB updated.</div>
        </div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#34D399] blur-[120px] opacity-10 rounded-full pointer-events-none"></div>
      </motion.div>

    </motion.div>
  );
}
