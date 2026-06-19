'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, ArrowRight, Search, Briefcase, Bell, FileText } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

function Counter({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    const animation = animate(count, value, { duration: 1.5, ease: "easeOut" });
    return animation.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
}

import { useRouter } from 'next/navigation';

export default function UserDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [scanUrl, setScanUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('scamshield_user');
    if (!storedUser) {
      router.push('/auth');
      return;
    }
    
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    fetch(`http://localhost:10000/api/v1/user/dashboard-stats?email=${encodeURIComponent(parsedUser.email)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.data);
        }
      })
      .catch(console.error);
  }, [router]);

  const handleScan = async () => {
    if (!scanUrl) return;
    setIsScanning(true);
    setScanResult(null);
    try {
      const res = await fetch('http://localhost:10000/api/v1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scanUrl, company_name: "Quick Scan", url: scanUrl })
      });
      const data = await res.json();
      setScanResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as any, bounce: 0.4 } }
  };

  const pieData = [
    { name: 'Safe Jobs', value: stats?.stats?.safe_jobs_found || 0 },
    { name: 'High Risk', value: Math.max(0, (stats?.stats?.jobs_scanned || 0) - (stats?.stats?.safe_jobs_found || 0)) }
  ];
  const pieColors = ['#166534', '#FF2D2D'];

  const barData = [
    { day: 'Mon', scans: Math.max(1, Math.round((stats?.stats?.jobs_scanned || 5) * 0.1)) },
    { day: 'Tue', scans: Math.max(2, Math.round((stats?.stats?.jobs_scanned || 5) * 0.2)) },
    { day: 'Wed', scans: Math.max(1, Math.round((stats?.stats?.jobs_scanned || 5) * 0.15)) },
    { day: 'Thu', scans: Math.max(3, Math.round((stats?.stats?.jobs_scanned || 5) * 0.25)) },
    { day: 'Fri', scans: Math.max(4, Math.round((stats?.stats?.jobs_scanned || 5) * 0.3)) },
  ];

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10 max-w-[1400px] mx-auto w-full">
      
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h1 className="text-4xl text-black tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-black/50">Here is an overview of your recent job scans and alerts.</p>
        </div>
        
        {/* Quick Scan Inline */}
        <div className="flex flex-col items-end gap-2 relative">
          <div className="flex items-center bg-white border border-black/10 rounded-full p-1.5 shadow-sm w-full md:w-[400px] focus-within:ring-2 ring-black/10 transition-all">
            <input 
              type="text" 
              placeholder="Paste job URL to scan..." 
              value={scanUrl}
              onChange={(e) => setScanUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              className="flex-1 bg-transparent border-none outline-none text-black px-4 text-sm"
            />
            <button 
              onClick={handleScan}
              disabled={isScanning}
              className="bg-black text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-black/80 transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isScanning ? <span className="animate-pulse">Scanning...</span> : <><Search size={16} /> Scan</>}
            </button>
          </div>
          
          {/* Scan Result Dropdown */}
          {scanResult && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="absolute top-14 right-0 w-[400px] bg-white border border-black/10 shadow-xl rounded-2xl p-6 z-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg" style={{ fontFamily: 'var(--font-display)' }}>Scan Verdict</h3>
                <button onClick={() => setScanResult(null)} className="text-black/40 hover:text-black">✕</button>
              </div>
              <div className="mb-4">
                <div className="text-sm text-black/60 mb-1">Risk Score</div>
                <div className="text-3xl font-bold" style={{ color: scanResult.is_scam ? '#FF2D2D' : '#166534' }}>
                  {scanResult.risk_score}%
                </div>
              </div>
              <ul className="text-sm space-y-2 mb-4 text-black/70">
                {scanResult.reasons?.map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#FF2D2D]">•</span> {r}
                  </li>
                ))}
              </ul>
              <div className={`p-3 rounded-xl text-center font-semibold text-sm ${scanResult.is_scam ? 'bg-[#FF2D2D]/10 text-[#FF2D2D]' : 'bg-[#166534]/10 text-[#166534]'}`}>
                {scanResult.is_scam ? 'HIGH RISK DETECTED' : 'SAFE TO APPLY'}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm flex items-center gap-6 hover:-translate-y-1 transition-transform">
          <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center text-black">
            <Search size={24} />
          </div>
          <div>
            <div className="text-3xl font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              {stats?.stats?.jobs_scanned ? <Counter value={stats.stats.jobs_scanned} /> : "..."}
            </div>
            <div className="text-black/50 text-sm font-medium">Jobs Scanned</div>
          </div>
        </div>

        <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm flex items-center gap-6 hover:-translate-y-1 transition-transform">
          <div className="w-16 h-16 rounded-2xl bg-[#166534]/10 flex items-center justify-center text-[#166534]">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="text-3xl font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              {stats?.stats?.safe_jobs_found ? <Counter value={stats.stats.safe_jobs_found} /> : "..."}
            </div>
            <div className="text-black/50 text-sm font-medium">Safe Jobs Found</div>
          </div>
        </div>

        <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm flex items-center gap-6 hover:-translate-y-1 transition-transform">
          <div className="w-16 h-16 rounded-2xl bg-[#FF2D2D]/10 flex items-center justify-center text-[#FF2D2D]">
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="text-3xl font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              {stats?.stats?.jobs_scanned ? <Counter value={Math.max(0, stats.stats.jobs_scanned - stats.stats.safe_jobs_found)} /> : "..."}
            </div>
            <div className="text-black/50 text-sm font-medium">Scams Avoided</div>
          </div>
        </div>

        <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm flex items-center gap-6 hover:-translate-y-1 transition-transform">
          <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B]">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-3xl font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              {stats?.stats?.reports_submitted !== undefined ? <Counter value={stats.stats.reports_submitted} /> : "..."}
            </div>
            <div className="text-black/50 text-sm font-medium">Reports Submitted</div>
          </div>
        </div>
      </motion.div>

      {/* Visualizations Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm flex flex-col hover:-translate-y-1 transition-transform min-h-[300px]">
          <h3 className="text-lg font-medium text-black mb-4" style={{ fontFamily: 'var(--font-display)' }}>Risk Breakdown</h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip cursor={{fill: 'transparent'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm flex flex-col hover:-translate-y-1 transition-transform min-h-[300px]">
          <h3 className="text-lg font-medium text-black mb-4" style={{ fontFamily: 'var(--font-display)' }}>Weekly Scan Activity</h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000010" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#00000060', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#00000060', fontSize: 12}} />
                <Tooltip cursor={{fill: '#00000005'}} />
                <Bar dataKey="scans" fill="#000000" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Main Grid Content */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Recent Scans */}
        <div className="lg:col-span-2 bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-medium text-black" style={{ fontFamily: 'var(--font-display)' }}>Recent Scans</h3>
            <button className="text-sm font-medium text-black/40 hover:text-black transition-colors flex items-center gap-1">
              View All <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="flex flex-col gap-4">
            {stats?.recent_scans ? stats.recent_scans.map((scan: any, idx: number) => (
              <motion.div 
                key={idx} 
                onClick={() => scan.url && window.open(scan.url, '_blank')}
                whileHover={{ scale: 1.01 }} 
                className="group flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-black/5 hover:bg-black/[0.02] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${scan.status === 'SAFE' ? 'bg-[#166534]/10 text-[#166534]' : 'bg-[#FF2D2D]/10 text-[#FF2D2D]'}`}>
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h4 className={`font-medium transition-colors ${scan.status === 'SAFE' ? 'group-hover:text-[#166534]' : 'group-hover:text-[#FF2D2D]'}`}>{scan.company_name}</h4>
                    <p className="text-sm text-black/50 mt-0.5 max-w-[200px] md:max-w-[400px] truncate">{scan.url || 'No URL'} • {new Date(scan.reported_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${scan.status === 'SAFE' ? 'bg-[#166534]/10 text-[#166534] border-[#166534]/20' : 'bg-[#FF2D2D]/10 text-[#FF2D2D] border-[#FF2D2D]/20'}`}>
                    {scan.status}
                  </span>
                </div>
              </motion.div>
            )) : (
              <div className="text-black/50 text-sm">No recent scans.</div>
            )}
          </div>
        </div>

        {/* Right Column - Subscribed Alerts */}
        <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-medium text-black" style={{ fontFamily: 'var(--font-display)' }}>Active Alerts</h3>
            <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/50">
              <Bell size={16} />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col gap-4">
            {stats?.alerts?.length > 0 ? stats.alerts.map((alert: any, idx: number) => (
              <div key={idx} className="p-4 border border-black/10 rounded-2xl flex flex-col hover:border-black/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-black text-sm">{alert.skills}</span>
                  <div className="w-2 h-2 rounded-full bg-[#166534]" />
                </div>
                <button onClick={() => router.push('/dashboard/alerts')} className="text-xs font-medium text-black hover:text-[#166534] transition-colors self-start mt-2">Manage Alert →</button>
              </div>
            )) : (
              <div className="text-sm text-black/50 p-4 border border-dashed border-black/20 rounded-2xl text-center">
                No active alerts.
              </div>
            )}
          </div>

          <button onClick={() => window.location.href='/dashboard/alerts'} className="w-full mt-6 bg-black/5 text-black py-3 rounded-xl font-medium flex justify-center items-center gap-2 hover:bg-black/10 transition-transform active:scale-95">
            <Bell size={16} /> Create New Alert
          </button>
        </div>

      </motion.div>
    </motion.div>
  );
}
