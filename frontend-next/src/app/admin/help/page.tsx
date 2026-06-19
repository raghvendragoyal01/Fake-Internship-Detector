'use client';

import { motion } from 'framer-motion';
import { HelpCircle, Book, ShieldAlert, Cpu, Users } from 'lucide-react';

export default function AdminHelp() {
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as any, bounce: 0.4 } } };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10 max-w-[1600px] mx-auto w-full mt-10">
      <motion.div variants={itemVariants} className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl text-black tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>Support & Documentation</h1>
          <p className="text-black/50">Guides and FAQ for managing the ScamShield platform.</p>
        </div>
        <div className="w-16 h-16 bg-black/5 text-black/40 rounded-2xl flex items-center justify-center">
          <HelpCircle size={28} />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#166534]/10 text-[#166534] flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <h2 className="text-xl font-semibold text-black" style={{ fontFamily: 'var(--font-display)' }}>Report Management</h2>
          </div>
          <p className="text-black/60 mb-4 leading-relaxed">
            Community submitted reports appear in the <strong>Reports</strong> tab. Review each submission and classify it as a <strong>Confirmed Scam</strong> or a <strong>False Alarm</strong>. Confirming a scam automatically impacts the associated recruiter's Trust Score.
          </p>
        </div>

        <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Cpu size={20} />
            </div>
            <h2 className="text-xl font-semibold text-black" style={{ fontFamily: 'var(--font-display)' }}>ML Scoring Engine</h2>
          </div>
          <p className="text-black/60 mb-4 leading-relaxed">
            The platform utilizes a combination of Natural Language Processing and Fraud Detection models. Scans are fed into the <strong>All Scans</strong> history where jobs scoring above 50% are automatically flagged as <strong>High Risk</strong>.
          </p>
        </div>

        <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center">
              <Users size={20} />
            </div>
            <h2 className="text-xl font-semibold text-black" style={{ fontFamily: 'var(--font-display)' }}>Admin Team Roles</h2>
          </div>
          <p className="text-black/60 mb-4 leading-relaxed">
            Manage your moderation team from the <strong>Team</strong> section. Only Super Admins can promote regular users to Admin status. Ensure your team is properly vetted before granting elevated privileges.
          </p>
        </div>

        <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Book size={20} />
            </div>
            <h2 className="text-xl font-semibold text-black" style={{ fontFamily: 'var(--font-display)' }}>API Access</h2>
          </div>
          <p className="text-black/60 mb-4 leading-relaxed">
            Developer APIs are available for generating bulk ML predictions. API keys can be rotated from the <strong>Settings</strong> tab. Contact the system architect if you experience rate-limiting issues.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
