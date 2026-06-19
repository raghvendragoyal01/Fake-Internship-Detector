'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, ShieldAlert, TrendingUp, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

export default function AdminAnalytics() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/admin/dashboard-stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as any, bounce: 0.4 } } };

  const barData = stats?.monthly_scam_trends?.length > 0 ? stats.monthly_scam_trends : [
    { month: 'Jan', count: 12 }, { month: 'Feb', count: 19 }, { month: 'Mar', count: 15 },
    { month: 'Apr', count: 22 }, { month: 'May', count: 30 }, { month: 'Jun', count: 45 }
  ];

  const pieData = stats?.risk_distribution || [
    { risk_level: 'Safe', count: 850 },
    { risk_level: 'High Risk', count: 150 }
  ];

  const pieColors = ['#166534', '#FF2D2D'];

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10 max-w-[1600px] mx-auto w-full mt-10">
      <motion.div variants={itemVariants} className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl text-black tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Deep Analytics
          </h1>
          <p className="text-black/50">Historical data, ML performance, and platform-wide telemetry.</p>
        </div>
        <div className="w-16 h-16 bg-[#166534]/10 text-[#166534] rounded-2xl flex items-center justify-center">
          <BarChart2 size={28} />
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="animate-spin text-black/40" size={40} />
        </div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-medium mb-8 text-black flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <TrendingUp size={20} className="text-blue-600" /> Detected Scams Over Time
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barSize={40}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#999'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#999'}} dx={-10} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" radius={[8, 8, 8, 8]}>
                    {barData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#F59E0B' : '#FF2D2D'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-medium mb-8 text-black flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <ShieldAlert size={20} className="text-[#FF2D2D]" /> Platform Risk Distribution
            </h3>
            <div className="h-[300px] w-full flex">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="count" nameKey="risk_level">
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-medium mb-6 text-black" style={{ fontFamily: 'var(--font-display)' }}>
              Highest Risk Flags (Recent)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black/5">
                    <th className="pb-4 font-semibold text-black/40 text-xs tracking-wider">COMPANY NAME</th>
                    <th className="pb-4 font-semibold text-black/40 text-xs tracking-wider">RISK REASON</th>
                    <th className="pb-4 font-semibold text-black/40 text-xs tracking-wider text-right">DATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {stats?.recent_flags?.map((flag: any, idx: number) => (
                    <tr key={idx} className="hover:bg-black/[0.01] transition-colors">
                      <td className="py-4">
                        <div className="font-medium text-black">{flag.company_name}</div>
                      </td>
                      <td className="py-4">
                        <div className="text-sm text-black/60 bg-[#FF2D2D]/5 inline-flex px-3 py-1 rounded-full text-[#FF2D2D] font-medium border border-[#FF2D2D]/10">
                          {flag.reason}
                        </div>
                      </td>
                      <td className="py-4 text-right text-sm text-black/50">
                        {new Date(flag.reported_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </motion.div>
      )}
    </motion.div>
  );
}
