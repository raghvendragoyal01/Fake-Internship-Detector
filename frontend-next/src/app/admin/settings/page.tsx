'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Key, Shield, HardDrive, RefreshCcw, Save } from 'lucide-react';

export default function AdminSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState({
    maintenanceMode: false,
    mlStrictness: 'high',
    maxScansPerUser: 50,
    enablePublicAPI: true
  });

  const [apiKeys, setApiKeys] = useState([
    { id: 1, name: 'Main Frontend Application', key: 'sk_live_1234...890a', created: '2025-01-10', status: 'Active' },
    { id: 2, name: 'Third Party Integration', key: 'sk_live_abcd...efgh', created: '2025-02-15', status: 'Active' }
  ]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Settings saved successfully!');
    }, 1000);
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as any, bounce: 0.4 } } };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10 max-w-[1200px] mx-auto w-full mt-10">
      
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl text-black tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            System Settings
          </h1>
          <p className="text-black/50">Manage global configurations and developer access.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-[#166534] hover:bg-[#14532D] text-white rounded-full font-medium transition-colors"
          >
            {isSaving ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Config */}
        <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col gap-8">
          
          <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-medium mb-6 text-black flex items-center gap-3" style={{ fontFamily: 'var(--font-display)' }}>
              <Shield className="text-[#166534]" /> ML Intelligence Core
            </h3>
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-semibold text-black/70 mb-2">Algorithm Strictness</label>
                <select 
                  value={config.mlStrictness}
                  onChange={(e) => setConfig({...config, mlStrictness: e.target.value})}
                  className="w-full bg-black/[0.02] border border-black/5 rounded-xl px-4 py-3 text-black outline-none focus:border-black/20"
                >
                  <option value="low">Low (Fewer false positives, more scams might pass)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="high">High (Maximum protection, might flag legitimate jobs)</option>
                </select>
                <p className="text-xs text-black/50 mt-2">Determines how aggressively the natural language processing model flags suspicious patterns.</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-medium mb-6 text-black flex items-center gap-3" style={{ fontFamily: 'var(--font-display)' }}>
              <HardDrive className="text-blue-600" /> Platform Infrastructure
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-black/70 mb-2">Rate Limiting</label>
                <input 
                  type="number" 
                  value={config.maxScansPerUser}
                  onChange={(e) => setConfig({...config, maxScansPerUser: parseInt(e.target.value)})}
                  className="w-full bg-black/[0.02] border border-black/5 rounded-xl px-4 py-3 text-black outline-none focus:border-black/20"
                />
                <p className="text-xs text-black/50 mt-2">Max daily scans allowed per free user.</p>
              </div>

              <div className="flex items-center gap-4 p-4 border border-black/5 rounded-xl bg-black/[0.02]">
                <div className="flex-1">
                  <div className="font-semibold text-sm">Maintenance Mode</div>
                  <div className="text-xs text-black/50">Disables the public scanning API.</div>
                </div>
                <button 
                  onClick={() => setConfig({...config, maintenanceMode: !config.maintenanceMode})}
                  className={`w-12 h-6 rounded-full relative transition-colors ${config.maintenanceMode ? 'bg-[#FF2D2D]' : 'bg-black/20'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${config.maintenanceMode ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>

        </motion.div>

        {/* Sidebar Settings */}
        <motion.div variants={itemVariants} className="flex flex-col gap-8">
          
          <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-medium mb-6 text-black flex items-center gap-3" style={{ fontFamily: 'var(--font-display)' }}>
              <Key className="text-[#F59E0B]" /> Developer API Keys
            </h3>
            <div className="flex flex-col gap-4">
              {apiKeys.map(k => (
                <div key={k.id} className="p-4 bg-black/[0.02] border border-black/5 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-sm">{k.name}</span>
                    <span className="text-xs font-medium text-[#166534] bg-[#166534]/10 px-2 py-0.5 rounded-full">{k.status}</span>
                  </div>
                  <div className="font-mono text-xs text-black/60 mb-2">{k.key}</div>
                  <button className="text-xs font-medium text-[#FF2D2D] hover:underline">Revoke Access</button>
                </div>
              ))}
              <button className="w-full py-3 border border-dashed border-black/20 text-black/60 rounded-xl text-sm font-medium hover:bg-black/5 hover:text-black transition-colors mt-2">
                + Generate New Key
              </button>
            </div>
          </div>

        </motion.div>

      </div>
    </motion.div>
  );
}
