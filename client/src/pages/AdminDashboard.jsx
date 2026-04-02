import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient';
import { AlertTriangle, Clock, CheckCircle, Search, Edit3, Save, X, LogOut, Loader2, Moon, Sun, LayoutDashboard, User, Menu, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import LoadingSplash from '../components/LoadingSplash';

export default function AdminDashboard() {
  const { profile, logout } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: profile?.name || '',
    desk_name: profile?.desk?.name || ''
  });

  useEffect(() => {
    if (profile?.desk?.id) fetchApplications();
  }, [profile]);

  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        desk_name: profile.desk?.name || ''
      });
    }
  }, [profile]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id, type, status, created_at, updated_at, submitted_at,
          students(user_id, roll_no, branch, committee_name),
          event_proposals:event_proposals!event_proposals_application_id_fkey(event_name),
          venue_bookings(venue),
          permission_letters(details)
        `)
        .eq('current_desk_id', profile.desk.id)
        .in('status', ['pending', 'under_review'])
        .order('updated_at', { ascending: true });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching admin apps:', error);
    } finally {
      // Small delay for the premium feel of the splash screen
      setTimeout(() => setLoading(false), 800);
    }
  };

  const calculateDaysLeft = (updatedAt) => {
    const passed = (new Date() - new Date(updatedAt)) / (1000 * 60 * 60 * 24);
    return Math.max(0, 4 - passed).toFixed(1);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const res = await fetch('/api/update-profile', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ user_id: profile.id, role: 'admin', ...profileData })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      
      toast.success("Authority Profile Updated!");
      setEditMode(false);
      window.location.reload(); 
    } catch(err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setUpdateLoading(false);
    }
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
    <AnimatePresence>
      {loading ? (
        <LoadingSplash key="admin-splash" message="Authenticating administrative portal..." />
      ) : (
        <motion.div 
          key="admin-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors"
        >
          {/* Sidebar Navigation */}
          <motion.aside 
            initial={{ width: 280 }}
            animate={{ width: isSidebarOpen ? 280 : 80 }}
            className="glass-card border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between sticky top-0 h-screen z-20 shrink-0 overflow-hidden premium-shadow"
          >
            <div>
              <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/50 h-[88px]">
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.div initial={{opacity:0, width:0}} animate={{opacity:1, width:'auto'}} exit={{opacity:0, width:0}} className="flex items-center gap-2 whitespace-nowrap overflow-hidden pl-2">
                      <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight"><span className="text-brand-600 dark:text-brand-400">v</span>CAMPs</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors mx-auto">
                    {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
                </button>
              </div>

              <nav className="p-4 space-y-2 mt-4">
                 <button 
                   onClick={() => setActiveTab('dashboard')} 
                   className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group ${activeTab === 'dashboard' ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 premium-shadow' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200'}`}
                 >
                   <LayoutDashboard size={20} className={`shrink-0 ${activeTab === 'dashboard' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                   <AnimatePresence>
                     {isSidebarOpen && <motion.span initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="font-bold whitespace-nowrap text-[15px]">My Desk Queue</motion.span>}
                   </AnimatePresence>
                 </button>

                 <button 
                   onClick={() => { setActiveTab('profile'); setEditMode(false); }} 
                   className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group ${activeTab === 'profile' ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 premium-shadow' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200'}`}
                 >
                   <User size={20} className={`shrink-0 ${activeTab === 'profile' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                   <AnimatePresence>
                     {isSidebarOpen && <motion.span initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="font-bold whitespace-nowrap text-[15px]">Authority Settings</motion.span>}
                   </AnimatePresence>
                 </button>
              </nav>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800/50 space-y-2">
              <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500 transition-colors group">
                {theme === 'dark' ? <Sun size={20} className="shrink-0 text-slate-400 group-hover:text-amber-500"/> : <Moon size={20} className="shrink-0 text-slate-400 group-hover:text-indigo-500"/>}
                <AnimatePresence>
                   {isSidebarOpen && <motion.span initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="font-bold whitespace-nowrap text-[15px]">Toggle Theme</motion.span>}
                </AnimatePresence>
              </button>
              <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors group">
                <LogOut size={20} className="shrink-0 text-slate-400 group-hover:text-red-500" />
                <AnimatePresence>
                   {isSidebarOpen && <motion.span initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="font-bold whitespace-nowrap text-[15px]">Sign Out</motion.span>}
                </AnimatePresence>
              </button>
            </div>
          </motion.aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto w-full">
             <div className="max-w-7xl mx-auto p-6 md:p-10 min-h-full">
                <header className="flex justify-between items-start mb-10 pb-6 border-b border-slate-200 dark:border-slate-800/60">
                  <div>
                    <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight capitalize">{activeTab === 'dashboard' ? 'Authority Portal' : 'Authority Settings'}</h1>
                    <p className="text-brand-600 dark:text-brand-400 font-bold bg-brand-50 dark:bg-brand-900/30 inline-block px-3 py-1 rounded-full text-sm mt-3">
                      Desk {profile?.desk?.order_index} • {profile?.desk?.name}
                    </p>
                  </div>
                  
                  {activeTab === 'dashboard' && (
                    <div className="flex flex-col md:flex-row items-center gap-3">
                      <div className="flex bg-white dark:bg-slate-900/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 px-4 py-2 w-72">
                        <Search size={18} className="text-slate-400 mr-2 mt-0.5" />
                        <input 
                          type="text" 
                          placeholder="Search Application ID..." 
                          className="bg-transparent border-none outline-none text-sm w-full dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </header>

                <AnimatePresence mode="wait">
                  {/* DASHBOARD TAB */}
                  {activeTab === 'dashboard' && (
                    <motion.div key="dashboard" initial={{opacity:0, y:15}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-15}} transition={{duration: 0.3}}>
                      
                      {/* Analytics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        <div className="glass-card p-6 rounded-2xl flex items-center gap-5 premium-shadow hover:translate-y-[-2px] transition-transform">
                          <div className="p-4 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-2xl"><AlertTriangle size={28} /></div>
                          <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Action Required</p>
                            <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{applications.length}</p>
                          </div>
                        </div>
                        <div className="glass-card p-6 rounded-2xl flex items-center gap-5 premium-shadow hover:translate-y-[-2px] transition-transform">
                          <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl"><Clock size={28} /></div>
                          <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Critical (SLA &lt; 24h)</p>
                            <p className="text-3xl font-black text-red-600 dark:text-red-400 mt-1">
                              {applications.filter(a => Number(calculateDaysLeft(a.updated_at)) < 1).length}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Applications Table */}
                      <div className="glass-card rounded-3xl overflow-hidden premium-shadow border border-slate-200/60 dark:border-slate-800/60">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50">
                          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Pending Applications Queue</h2>
                        </div>
                        <div className="p-0 overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                                <th className="p-5 flex-1 min-w-[200px]">Applicant</th>
                                <th className="p-5 w-48">Type / Event</th>
                                <th className="p-5 w-48 flex items-center gap-2"><Clock size={16}/> SLA Clock</th>
                                <th className="p-5 text-right w-24">Actions</th>
                              </tr>
                            </thead>
                            <motion.tbody variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-slate-100 dark:divide-slate-800/50 w-full min-w-[900px]">
                              {applications.length === 0 ? (
                                <tr>
                                  <td colSpan="4" className="p-16 text-center">
                                     <div className="flex flex-col items-center justify-center text-slate-500">
                                        <CheckCircle size={56} className="mb-6 text-green-400 dark:text-green-500" />
                                        <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">All caught up!</p>
                                        <p className="text-md text-slate-500 dark:text-slate-500 max-w-sm mx-auto">There are no pending applications waiting at your desk.</p>
                                     </div>
                                  </td>
                                </tr>
                              ) : (
                                applications.map((app) => {
                                  const daysLeft = calculateDaysLeft(app.updated_at);
                                  const isCritical = Number(daysLeft) < 1;
                                  
                                  return (
                                    <motion.tr variants={itemVariants} key={app.id} className={`transition-colors group ${isCritical ? 'bg-red-50/10 dark:bg-red-900/5 hover:bg-red-50/30 dark:hover:bg-red-900/10' : 'hover:bg-brand-50/30 dark:hover:bg-brand-900/10'}`}>
                                      <td className="p-5">
                                        <div className="font-bold text-slate-800 dark:text-slate-200">{app.students?.committee_name || app.students?.roll_no || 'Unknown'}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 w-max px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">ID: {app.id.slice(0, 8)}</div>
                                      </td>
                                      <td className="p-5">
                                        <div className="font-medium text-slate-700 dark:text-slate-300 capitalize whitespace-nowrap">
                                          {app.type.replace(/_/g, ' ')}
                                        </div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap truncate max-w-[150px]">
                                          {app.type === 'event_proposal' ? (app.event_proposals?.[0]?.event_name) : 
                                           app.type === 'venue_booking' ? (app.venue_bookings?.[0]?.event_proposals?.event_name || app.venue_bookings?.[0]?.venue) :
                                           app.type === 'permission_letter' ? (app.permission_letters?.[0]?.details) : 'N/A'}
                                        </div>
                                      </td>
                                      <td className="p-5">
                                        <span className={`px-4 py-1.5 rounded-full text-[11px] font-black border ${isCritical ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 animate-[pulse_1.5s_infinite]' : 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'} uppercase w-max flex`}>
                                          {daysLeft} days left
                                        </span>
                                      </td>
                                      <td className="p-5 text-right">
                                        <motion.div whileHover={{scale:1.02}} whileTap={{scale:0.98}}>
                                          <Link to={`/admin/view/${app.id}`} className="bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 dark:hover:text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 opacity-90 group-hover:opacity-100 whitespace-nowrap">
                                             <Edit3 size={16}/> Review
                                          </Link>
                                        </motion.div>
                                      </td>
                                    </motion.tr>
                                  )
                                })
                              )}
                            </motion.tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* PROFILE TAB */}
                  {activeTab === 'profile' && (
                    <motion.div key="profile" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} transition={{duration: 0.3}} className="max-w-3xl mx-auto mt-4 w-full">
                      <div className="glass-card rounded-3xl p-10 premium-shadow relative overflow-hidden ring-1 ring-slate-200/50 dark:ring-slate-800/50">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
                          <div className="flex items-center gap-4">
                             <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center shrink-0">
                                <User size={32} />
                             </div>
                             <div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Authority Details</h2>
                                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Manage your administrative identity</p>
                             </div>
                          </div>
                          {!editMode ? (
                            <button onClick={() => setEditMode(true)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 hover:text-brand-600 dark:hover:bg-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-2">
                               <Edit3 size={18}/> Edit Profile
                            </button>
                          ) : (
                            <button onClick={() => { setEditMode(false); }} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/40 rounded-xl font-bold text-red-500 transition-colors flex items-center gap-2">
                               <X size={18}/> Cancel
                            </button>
                          )}
                        </div>

                        {editMode ? (
                          <form onSubmit={handleProfileUpdate} className="space-y-6">
                              <div className="space-y-5">
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Full Name</label>
                                  <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="input-field py-2.5 font-semibold text-slate-800 dark:text-white w-full" required />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Desk Name (Designation)</label>
                                    <input type="text" value={profileData.desk_name} onChange={e => setProfileData({...profileData, desk_name: e.target.value})} className="input-field py-2.5 font-semibold text-slate-800 dark:text-white w-full" required />
                                  </div>
                                  <div className="opacity-60 cursor-not-allowed">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Desk Order (Locked)</label>
                                    <input type="text" value={`Desk ${profile?.desk?.order_index || 'N/A'}`} disabled className="input-field py-2.5 font-semibold text-slate-500 dark:text-slate-500 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50 border-0 w-full" />
                                  </div>
                                </div>

                              </div>

                              <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.99}} type="submit" disabled={updateLoading} className="w-full btn-primary h-14 text-lg mt-6 flex justify-center items-center gap-3 shadow-xl rounded-xl">
                                {updateLoading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />} Save Identity Changes
                              </motion.button>
                          </form>
                        ) : (
                          <div className="space-y-8">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                                 <div>
                                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Authority Name</p>
                                   <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{profile?.name || 'N/A'}</p>
                                 </div>
                                 <div>
                                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Registered Email</p>
                                   <p className="text-lg font-black font-mono text-brand-600 dark:text-brand-400 mt-1">{profile?.email || 'N/A'}</p>
                                 </div>
                              </div>

                              <div className="grid grid-cols-2 gap-8 pt-4">
                                 <div>
                                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Official Desk Name</p>
                                   <p className="text-3xl font-black text-brand-600 dark:text-brand-400 mt-2">{profile?.desk?.name || 'Unassigned Desk'}</p>
                                 </div>
                                 <div>
                                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center justify-between">
                                      <span>Pipeline Desk Order</span>
                                      <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">Read-Only</span>
                                   </p>
                                   <p className="text-3xl font-black text-slate-800 dark:text-white mt-2">Desk {profile?.desk?.order_index || '?'}</p>
                                 </div>
                              </div>
                              
                              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                                 <div className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/40">
                                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                                    <div>
                                       <p className="text-sm font-bold text-amber-800 dark:text-amber-500">System Pipeline Warning</p>
                                       <p className="text-xs text-amber-700/80 dark:text-amber-500/80 mt-1 leading-relaxed">Your Desk Order dictates the routing mathematics of student applications within the SLA hierarchy. It is strictly locked. Modifying the Pipeline Index without reconfiguring the dependency graph will result in Application deadlocks.</p>
                                    </div>
                                 </div>
                              </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
