'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Trash2, Shield, User as UserIcon, Loader2 } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminTeam() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:10000/api/v1/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await fetch(`http://localhost:10000/api/v1/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetch(`http://localhost:10000/api/v1/admin/users/${userId}`, {
        method: 'DELETE'
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as any, bounce: 0.4 } } };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10 max-w-[1200px] mx-auto w-full mt-10">
      
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl text-black tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            User Management
          </h1>
          <p className="text-black/50">Manage registered users and administrator roles.</p>
        </div>
        <div className="w-16 h-16 bg-[#166534]/10 text-[#166534] rounded-2xl flex items-center justify-center">
          <Users size={28} />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-white border border-black/5 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 flex justify-center items-center text-black/40">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : users.length === 0 ? (
          <div className="p-20 text-center text-black/40 font-medium">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/5 bg-black/[0.02]">
                  <th className="px-6 py-4 text-xs font-semibold text-black/40 tracking-wider">USER</th>
                  <th className="px-6 py-4 text-xs font-semibold text-black/40 tracking-wider">ROLE</th>
                  <th className="px-6 py-4 text-xs font-semibold text-black/40 tracking-wider">JOINED</th>
                  <th className="px-6 py-4 text-xs font-semibold text-black/40 tracking-wider text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-black/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-black">{u.name || 'Anonymous User'}</div>
                      <div className="text-sm text-black/50">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        u.role === 'admin' ? 'bg-[#166534]/10 text-[#166534]' : 'bg-black/5 text-black/60'
                      }`}>
                        {u.role === 'admin' ? <Shield size={14} /> : <UserIcon size={14} />}
                        {(u.role || 'user').toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-black/60">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => updateRole(u.id, u.role || 'user')}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                        </button>
                        <button 
                          onClick={() => deleteUser(u.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[#FF2D2D]/60 hover:bg-[#FF2D2D]/10 hover:text-[#FF2D2D] transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
