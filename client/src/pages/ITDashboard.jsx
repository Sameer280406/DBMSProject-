import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient';
import { 
  Users, Shield, Trash2, Search, Filter, 
  Settings, LogOut, Moon, Sun, Loader2, 
  UserPlus, RefreshCw, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import LoadingSplash from '../components/LoadingSplash';

export default function ITDashboard() {
  const { profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [purgingId, setPurgingId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/all-users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error("Failed to fetch user directory.");
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const handlePurge = async (userId) => {
    if (!window.confirm("CRITICAL ACTION: This will permanently delete this user from Supabase Auth and all vCAMPs records. This cannot be undone. Proceed?")) return;
    
    setPurgingId(userId);
    try {
      const response = await fetch('/api/admin/purge-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await response.json();
      if (data.success) {
        toast.success("User successfully purged from system.");
        setUsers(users.filter(u => u.id !== userId));
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error(err.message || "Failed to purge user.");
    } finally {
      setPurgingId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || u.role === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <LoadingSplash />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden lg:flex flex-col z-30">
        <div className="p-8">
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter flex items-center gap-2">
                <Shield className="text-brand-500" /> vCAMPs <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-500">IT</span>
            </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-50 dark:bg-brand-900/10 text-brand-600 dark:text-brand-400 font-bold text-sm">
                <Users size={18} /> User Directory
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-sm transition">
                <Settings size={18} /> System Settings
            </button>
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
                <p className="text-sm font-bold text-slate-700 dark:text-white truncate">{profile?.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Network Administrator</p>
            </div>
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold text-sm transition">
                <LogOut size={18} /> Sign Out
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-6 md:p-10 pb-24 lg:pb-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Tech Support Console</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Unified command center for vCAMPs user infrastructure.</p>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={toggleTheme} className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm">
                   {theme === 'dark' ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-slate-600"/>}
                </button>
                <button onClick={fetchUsers} className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm">
                   <RefreshCw size={20} className="text-slate-500"/>
                </button>
            </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
                { label: 'Total Users', value: users.length, icon: Users, color: 'brand' },
                { label: 'Total Students', value: users.filter(u => u.role === 'student').length, icon: Shield, color: 'blue' },
                { label: 'Authorities', value: users.filter(u => u.role === 'admin').length, icon: Shield, color: 'indigo' },
            ].map(stat => (
                <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 premium-shadow">
                    <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 dark:bg-${stat.color}-900/10 flex items-center justify-center text-${stat.color}-600 dark:text-${stat.color}-400 mb-4`}>
                        <stat.icon size={24} />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stat.value}</p>
                </div>
            ))}
        </div>

        {/* User Directory Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 premium-shadow overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                 <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name or email..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition"
                    />
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {['all', 'student', 'admin'].map(r => (
                            <button 
                                key={r}
                                onClick={() => setFilter(r)}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                                    filter === r ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'
                                }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                 </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-6 py-4">User Identity</th>
                            <th className="px-6 py-4">Role System</th>
                            <th className="px-6 py-4">Associated Metadata</th>
                            <th className="px-6 py-4">System Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        <AnimatePresence>
                            {filteredUsers.map((user) => (
                                <motion.tr 
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    key={user.id} 
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white">{user.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            user.role === 'it_support' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
                                            user.role === 'admin' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' :
                                            'bg-brand-100 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400'
                                        }`}>
                                            {user.role?.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {user.role === 'student' ? (
                                                <>{user.studentDetails?.committee_name || 'No Committee'} • {user.studentDetails?.branch || 'General'}</>
                                            ) : user.role === 'admin' ? (
                                                <>{user.deskDetails?.name || 'Unassigned Desk'}</>
                                            ) : (
                                                'Full Access'
                                            )}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {user.role !== 'it_support' && (
                                                <button 
                                                    onClick={() => handlePurge(user.id)}
                                                    disabled={purgingId === user.id}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition disabled:opacity-50"
                                                    title="Purge User Account"
                                                >
                                                    {purgingId === user.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            )}
                                            {user.role === 'it_support' && (
                                                <span className="text-[10px] font-bold text-slate-300 italic px-2">PROTECTED</span>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {filteredUsers.length === 0 && (
                <div className="p-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <UserPlus size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">No users found</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Refine your search or filter to find specific personnel.</p>
                </div>
            )}
        </div>

        {/* System Warnings */}
        <div className="mt-10 p-6 rounded-3xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/30 flex gap-4">
             <AlertTriangle className="text-amber-500 flex-shrink-0" size={24} />
             <div>
                <h4 className="text-sm font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-1">Administrative Safety Notice</h4>
                <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
                    Account purging is immediate and irreversible. It resets all application histories, signatures, and credentials associated with the user ID. Use this authority only for system maintenance or authorized offboarding.
                </p>
             </div>
        </div>
      </main>
    </div>
  );
}
