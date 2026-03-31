import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient';
import { Link } from 'react-router-dom';
import { PlusCircle, Clock, CheckCircle2, AlertCircle, FileText, LogOut, Loader2, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function StudentDashboard() {
  const { profile, logout } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id, type, status, created_at, updated_at,
          event_proposals(event_name),
          desks(name, order_index)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching student apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'returned': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'expired': return 'bg-stone-100 text-stone-700 border-stone-200';
      case 'pending':
      case 'under_review':
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300 } }
  };

  return (
    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="min-h-screen p-6 md:p-10 transition-colors">
      <header className="flex justify-between items-center mb-10 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Applicant Portal</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Welcome back, {profile?.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 mr-2 rounded-full glass-card hover:bg-slate-200 dark:hover:bg-slate-700 transition">
            {theme === 'dark' ? <Sun size={20} className="text-brand-400"/> : <Moon size={20} className="text-slate-600"/>}
          </button>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/student/event-proposal" className="btn-primary flex items-center gap-2">
              <PlusCircle size={18} /> New Proposal
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/student/venue-booking" className="btn-primary flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 focus:ring-indigo-100">
              <PlusCircle size={18} /> Book Venue
            </Link>
          </motion.div>
          <button onClick={logout} className="px-4 py-2 font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 dark:hover:bg-red-900/30 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </header>

      {/* Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 rounded-xl"><FileText size={24} /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Submissions</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{applications.length}</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl"><CheckCircle2 size={24} /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Approved</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{applications.filter(a => a.status === 'approved').length}</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl"><Clock size={24} /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">In Progress</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{applications.filter(a => ['pending','under_review'].includes(a.status)).length}</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden premium-shadow">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Recent Applications</h2>
        </div>
        <div className="p-0 overflow-x-auto">
          {loading ? (
             <div className="p-10 flex flex-col items-center justify-center text-slate-500 h-48 bg-slate-50/30 dark:bg-slate-900/30">
                <Loader2 size={32} className="animate-spin text-brand-500 mb-4" />
                <p className="font-medium animate-pulse">Fetching your application history...</p>
             </div>
          ) : applications.length === 0 ? (
            <div className="p-10 text-center text-slate-500 dark:text-slate-400">
               <AlertCircle size={40} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
               <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No applications found</p>
               <p className="text-sm text-slate-400 dark:text-slate-500">Submit an event proposal or permission letter to get started.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold text-sm border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4">Type</th>
                  <th className="p-4">Submitted</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 w-1/3">SLA Tracking Clock</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <motion.tbody variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {applications.map((app) => (
                  <motion.tr variants={itemVariants} key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-medium text-slate-700 dark:text-slate-200 capitalize">
                       {app.type.replace('_', ' ')}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(app.status)} capitalize flex w-max gap-1`}>
                        {app.status === 'approved' && <CheckCircle2 size={14} />}
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">
                      {app.status === 'approved' && 'Completed'}
                      {app.desks && `Desk ${app.desks.order_index} - ${app.desks.name}`}
                    </td>

                    <td className="p-4">
                      <Link to={`/student/view/${app.id}`} className="text-brand-600 hover:text-brand-800 font-semibold text-sm">View Status</Link>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  );
}
