'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User, Bell, Lock, Shield, AlertTriangle, Save, Loader2, CheckCircle2, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export default function UserSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id?: string, name?: string, email?: string, avatar?: string | null } | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('Settings saved successfully');
  const [isToastError, setIsToastError] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  
  // Avatar States
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const fetchSettings = useCallback(async (token: string) => {
    try {
      const res = await fetch('http://localhost:10000/api/v1/auth/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.name) setName(data.data.name);
        if (data.data.email_alerts !== undefined) setEmailAlerts(data.data.email_alerts);
        if (data.data.push_alerts !== undefined) setPushAlerts(data.data.push_alerts);
        if (data.data.weekly_report !== undefined) setWeeklyReport(data.data.weekly_report);
        if (data.data.two_factor_enabled !== undefined) setTwoFactor(data.data.two_factor_enabled);
        if (data.data.avatar) setAvatarUrl(data.data.avatar);
      }
    } catch {
      console.error("Failed to fetch settings");
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('scamshield_user');
    const token = localStorage.getItem('scamshield_token');
    
    if (!stored || !token) {
      router.push('/auth');
      return;
    }
    
    try {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      setName(parsed.name || '');
      if (parsed.avatar) setAvatarUrl(parsed.avatar);
      fetchSettings(token);
    } catch {
      // ignore
    }
  }, [router, fetchSettings]);



  const showNotification = (msg: string, isError = false) => {
    setToastMsg(msg);
    setIsToastError(isError);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id || 'avatar'}-${Math.random()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    setIsUploadingAvatar(true);
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
      
      // Auto-save the avatar URL to the backend
      const token = localStorage.getItem('scamshield_token');
      await fetch('http://localhost:10000/api/v1/auth/update-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email_alerts: emailAlerts,
          push_alerts: pushAlerts,
          weekly_report: weeklyReport,
          two_factor_enabled: twoFactor,
          avatar: data.publicUrl
        })
      });
      
      // Update local storage
      if (user) {
        const updatedUser = { ...user, avatar: data.publicUrl };
        localStorage.setItem('scamshield_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
      
      showNotification("Avatar updated successfully", false);
    } catch (error: unknown) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Error uploading avatar";
      showNotification(msg, true);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const token = localStorage.getItem('scamshield_token');
    try {
      const res = await fetch('http://localhost:10000/api/v1/auth/update-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email_alerts: emailAlerts,
          push_alerts: pushAlerts,
          weekly_report: weeklyReport,
          two_factor_enabled: twoFactor,
          avatar: avatarUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        if (user) {
          const updatedUser = { ...user, name, avatar: avatarUrl };
          localStorage.setItem('scamshield_user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
        showNotification("Settings saved successfully", false);
      } else {
        showNotification(data.detail || "Failed to save settings", true);
      }
    } catch {
      showNotification("Error connecting to server", true);
    }

    setIsSaving(false);
  };
  
  const handlePasswordUpdate = async () => {
    if (!oldPassword || !newPassword) {
      showNotification("Please enter both old and new passwords", true);
      return;
    }
    
    setIsUpdatingPassword(true);
    const token = localStorage.getItem('scamshield_token');
    try {
      const res = await fetch('http://localhost:10000/api/v1/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Password updated successfully", false);
        setOldPassword('');
        setNewPassword('');
      } else {
        showNotification(data.detail || "Failed to update password", true);
      }
    } catch {
      showNotification("Error connecting to server", true);
    }
    setIsUpdatingPassword(false);
  };
  
  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to permanently delete your account? This action is irreversible.")) return;
    
    const token = localStorage.getItem('scamshield_token');
    try {
      const res = await fetch('http://localhost:10000/api/v1/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        localStorage.removeItem('scamshield_user');
        localStorage.removeItem('scamshield_token');
        router.push('/');
      } else {
        showNotification(data.detail || "Failed to delete account", true);
      }
    } catch {
      showNotification("Error connecting to server", true);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as any, bounce: 0.4 } } };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security', label: 'Security', icon: <Lock size={18} /> },
  ];

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10 max-w-[1000px] mx-auto w-full">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className={`fixed top-6 right-6 z-50 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 font-medium ${isToastError ? 'bg-[#FF2D2D]' : 'bg-[#166534]'}`}
          >
            {isToastError ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants} className="mb-10">
        <h1 className="text-4xl text-black tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Account Settings
        </h1>
        <p className="text-black/50">Manage your account preferences, notifications, and security.</p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <motion.div variants={itemVariants} className="w-full md:w-[240px] shrink-0">
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 hide-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-sm whitespace-nowrap
                  ${activeTab === tab.id ? 'bg-black text-white shadow-md' : 'text-black/60 hover:bg-black/5 hover:text-black'}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div variants={itemVariants} className="flex-1 bg-white border border-black/10 rounded-3xl p-8 shadow-sm">
          <form onSubmit={handleSave}>
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-xl font-medium text-black mb-1" style={{ fontFamily: 'var(--font-display)' }}>Personal Information</h2>
                  <p className="text-sm text-black/50 mb-6">Update your photo and personal details.</p>
                  
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-black/80 to-black/40 flex items-center justify-center text-white text-2xl font-semibold shadow-inner overflow-hidden relative group">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt="Avatar" fill style={{ objectFit: 'cover' }} />
                      ) : (
                        name ? name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U')
                      )}
                      <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer transition-all" onClick={() => fileInputRef.current?.click()}>
                        <UploadCloud size={24} className="text-white" />
                      </div>
                    </div>
                    <div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef}
                        className="hidden" 
                        onChange={handleAvatarUpload} 
                      />
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="bg-black/5 hover:bg-black/10 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors mb-2 disabled:opacity-50 flex items-center gap-2"
                      >
                        {isUploadingAvatar ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : 'Change Avatar'}
                      </button>
                      <p className="text-xs text-black/40">JPG, GIF or PNG. 1MB max.</p>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <div>
                      <label className="block text-sm font-medium text-black/70 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-black/[0.02] border border-black/10 rounded-xl py-3 px-4 text-black outline-none focus:border-black/30 focus:bg-white transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black/70 mb-2">Email Address</label>
                      <input 
                        type="email" 
                        value={user?.email || ''}
                        disabled
                        className="w-full bg-black/[0.05] border border-black/10 rounded-xl py-3 px-4 text-black/50 outline-none cursor-not-allowed"
                      />
                      <p className="text-xs text-black/40 mt-2 flex items-center gap-1">
                        <Shield size={12} /> Contact support to change your email address.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-xl font-medium text-black mb-1" style={{ fontFamily: 'var(--font-display)' }}>Notification Preferences</h2>
                  <p className="text-sm text-black/50 mb-6">Choose how we contact you regarding scans and alerts.</p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-black/5 hover:border-black/10 transition-colors">
                      <div>
                        <div className="font-medium text-black">Email Alerts</div>
                        <div className="text-sm text-black/50">Receive notifications when a new high-risk job matches your criteria.</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-black/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#166534]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl border border-black/5 hover:border-black/10 transition-colors">
                      <div>
                        <div className="font-medium text-black">Push Notifications</div>
                        <div className="text-sm text-black/50">Get instant browser alerts for manual scans.</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={pushAlerts} onChange={(e) => setPushAlerts(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-black/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#166534]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl border border-black/5 hover:border-black/10 transition-colors">
                      <div>
                        <div className="font-medium text-black">Weekly Digest</div>
                        <div className="text-sm text-black/50">A weekly summary of job market risk trends.</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={weeklyReport} onChange={(e) => setWeeklyReport(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-black/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#166534]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-xl font-medium text-black mb-1" style={{ fontFamily: 'var(--font-display)' }}>Security & Authentication</h2>
                  <p className="text-sm text-black/50 mb-6">Keep your account secure with strong passwords and 2FA.</p>

                  <div className="space-y-6">
                    <div className="p-5 rounded-2xl border border-black/10">
                      <div className="mb-4">
                        <div className="font-medium text-black mb-2">Change Password</div>
                        <div className="grid gap-3">
                          <input 
                            type="password" 
                            placeholder="Current Password" 
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full bg-black/[0.02] border border-black/10 rounded-xl py-2 px-4 text-black outline-none focus:border-black/30"
                          />
                          <input 
                            type="password" 
                            placeholder="New Password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-black/[0.02] border border-black/10 rounded-xl py-2 px-4 text-black outline-none focus:border-black/30"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-black/40">Only applicable for email sign-ins.</div>
                        <button type="button" disabled={isUpdatingPassword} onClick={handlePasswordUpdate} className="bg-black/5 hover:bg-black/10 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                          {isUpdatingPassword ? "Updating..." : "Update Password"}
                        </button>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-black/10">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-black flex items-center gap-2">Two-Factor Authentication <span className="bg-[#166534]/10 text-[#166534] text-[10px] uppercase font-bold px-2 py-0.5 rounded">Recommended</span></div>
                          <div className="text-sm text-black/50 mt-1 max-w-sm">Add an extra layer of security to your account by requiring an authenticator app code.</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={twoFactor} onChange={(e) => setTwoFactor(e.target.checked)} className="sr-only peer" />
                          <div className="w-11 h-6 bg-black/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#166534]"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-[#FF2D2D]/20">
                  <h2 className="text-xl font-medium text-[#FF2D2D] mb-1" style={{ fontFamily: 'var(--font-display)' }}>Danger Zone</h2>
                  <p className="text-sm text-[#FF2D2D]/70 mb-4">Irreversible actions regarding your account data.</p>
                  <div className="p-5 rounded-2xl border border-[#FF2D2D]/20 bg-[#FF2D2D]/5 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-[#FF2D2D]">Delete Account</div>
                      <div className="text-sm text-[#FF2D2D]/70">Permanently delete your account and all associated data.</div>
                    </div>
                    <button type="button" onClick={handleDeleteAccount} className="bg-[#FF2D2D] text-white px-4 py-2 rounded-lg text-sm font-medium transition-transform active:scale-95 hover:bg-[#CC2424]">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SAVE ACTION */}
            <div className="mt-10 pt-6 border-t border-black/10 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-black text-white px-8 py-3 rounded-xl font-medium flex justify-center items-center gap-2 hover:bg-black/80 transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Save Changes</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}
