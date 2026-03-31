import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient';
import { AlertTriangle, Clock, FastForward, CheckCircle, Search, Edit3, LogOut, Loader2, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function AdminDashboard() {
  const { profile, logout } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (profile?.desk?.id) fetchApplications();
  }, [profile]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id, type, status, created_at, updated_at, submitted_at,
          students(user_id, roll_no, branch, committee_name),
          event_proposals(event_name, date_of_event)
        `)
        .eq('current_desk_id', profile.desk.id)
        .in('status', ['pending', 'under_review'])
        .order('updated_at', { ascending: true }); // Oldest first for SLA

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching admin apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysLeft = (updatedAt) => {
    const passed = (new Date() - new Date(updatedAt)) / (1000 * 60 * 60 * 24);
    return Math.max(0, 4 - passed).toFixed(1);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", bounce: 0.4 } }
  };

  return (
    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, scale:0.98}} className="min-h-screen p-6 md:p-10 transition-colors">
      <header className="flex justify-between items-center mb-10 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Authority Portal</h1>
          <p className="text-brand-600 dark:text-brand-400 font-bold bg-brand-50 dark:bg-brand-900/30 inline-block px-3 py-1 rounded-full text-sm mt-2">
            Desk {profile?.desk?.order_index} • {profile?.desk?.name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 mr-2 rounded-full glass-card hover:bg-slate-200 dark:hover:bg-slate-700 transition">
            {theme === 'dark' ? <Sun size={20} className="text-brand-400"/> : <Moon size={20} className="text-slate-600"/>}
          </button>
          <div className="flex bg-white dark:bg-slate-900/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 px-4 py-2 w-72">
            <Search size={18} className="text-slate-400 mr-2 mt-0.5" />
            <input 
              type="text" 
              placeholder="Search Application ID..." 
              className="bg-transparent border-none outline-none text-sm w-full dark:text-white"
            />
          </div>
          <button onClick={logout} className="px-4 py-2 font-semibold text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-2">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="glass-card p-6 rounded-2xl flex items-center gap-4 premium-shadow">
          <div className="p-3 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Action Required</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{applications.length}</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-center gap-4 premium-shadow">
          <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl"><Clock size={24} /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Critical (SLA &lt; 24h)</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {applications.filter(a => Number(calculateDaysLeft(a.updated_at)) < 1).length}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden premium-shadow">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Pending Applications Queue</h2>
        </div>
        <div className="p-0 overflow-x-auto">
          {loading ? (
             <div className="p-10 flex flex-col items-center justify-center text-slate-500 h-48 bg-slate-50/30 dark:bg-slate-900/30">
                <Loader2 size={32} className="animate-spin text-brand-500 mb-4" />
                <p className="font-medium animate-pulse">Syncing administrative queue...</p>
             </div>
          ) : applications.length === 0 ? (
            <div className="p-10 text-center text-slate-500 dark:text-slate-400">
               <CheckCircle size={40} className="mx-auto mb-4 text-green-400 dark:text-green-500" />
               <p className="text-lg font-medium text-slate-700 dark:text-slate-300">All caught up!</p>
               <p className="text-sm text-slate-400">There are no pending applications waiting at your desk.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold text-sm border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4">Applicant</th>
                  <th className="p-4">Type / Event</th>
                  <th className="p-4 flex items-center gap-2"><Clock size={16}/> SLA Clock</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <motion.tbody variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {applications.map((app) => {
                  const daysLeft = calculateDaysLeft(app.updated_at);
                  const isCritical = Number(daysLeft) < 1;
                  
                  return (
                    <motion.tr variants={itemVariants} key={app.id} className={`transition-colors ${isCritical ? 'bg-red-50/30 dark:bg-red-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{app.students?.committee_name || app.students?.roll_no || 'Unknown'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">ID: {app.id.slice(0, 8)}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                           {app.type.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            {app.event_proposals?.[0]?.event_name || 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${isCritical ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 animate-[pulse_1.5s_infinite]' : 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'}`}>
                          {daysLeft} days left
                        </span>
                      </td>
                      <td className="p-4">
                        <motion.div whileHover={{scale:1.02}} whileTap={{scale:0.98}}>
                          <Link to={`/admin/view/${app.id}`} className="bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 dark:hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 w-max">
                             <Edit3 size={16}/> Review
                          </Link>
                        </motion.div>
                      </td>
                    </motion.tr>
                  )
                })}
              </motion.tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  );
}
