import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient';
import { 
  FileText, PlusCircle, LayoutDashboard, User, Moon, Sun, 
  LogOut, ChevronLeft, Menu, Loader2, CheckCircle2, 
  Clock, Trash2, Edit2, AlertCircle, X, Save, Edit3 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import LoadingSplash from '../components/LoadingSplash';

export default function StudentDashboard() {
  const { profile, logout } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    year_of_study: '',
    branch: '',
    committee_name: '',
    convenor_phone: '',
    convenor_email: '',
    designation: ''
  });

  useEffect(() => {
    if (profile?.id) {
      fetchApplications();
      setProfileData({
        name: profile.name || '',
        year_of_study: profile.studentDoc?.year_of_study || '',
        branch: profile.studentDoc?.branch || '',
        committee_name: profile.studentDoc?.committee_name || '',
        convenor_phone: profile.studentDoc?.convenor_phone || '',
        convenor_email: profile.studentDoc?.convenor_email || '',
        designation: profile.studentDoc?.designation || 'Student'
      });
    }
  }, [profile]);

  const fetchApplications = async () => {
    if (!profile?.studentDoc?.id) {
       setLoading(false);
       return;
    }
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id, type, status, created_at, updated_at,
          event_proposals:event_proposals!event_proposals_application_id_fkey(event_name),
          venue_bookings(venue),
          permission_letters(details),
          desks(name, order_index)
        `)
        .eq('student_id', profile.studentDoc.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching student apps:', error);
      toast.error("Failed to load applications");
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this application? This action will remove all related bookings and signatures and cannot be undone.");
    if (!confirmDelete) return;

    try {
      const res = await fetch('/api/delete-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: id, student_id: profile.id })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      
      toast.success("Application permanently deleted");
      setApplications(prev => prev.filter(app => app.id !== id));
    } catch (err) {
      toast.error(err.message || "Deletion failed");
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const res = await fetch('/api/update-profile', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ user_id: profile.id, role: 'student', ...profileData })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      
      toast.success("Profile Synchronization Successful!");
      setEditMode(false);
      window.location.reload(); 
    } catch(err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400';
      case 'returned': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400';
      case 'pending': 
      case 'under_review':
      default: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
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
    <AnimatePresence>
      {loading ? (
        <LoadingSplash key="student-splash" message="Preparing student portal..." />
      ) : (
        <motion.div 
          key="dashboard-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors"
        >
          {/* Sidebar */}
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
                     {isSidebarOpen && <motion.span initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="font-bold whitespace-nowrap text-[15px]">My Applications</motion.span>}
                   </AnimatePresence>
                 </button>

                 <button 
                   onClick={() => { setActiveTab('profile'); setEditMode(false); }} 
                   className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group ${activeTab === 'profile' ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 premium-shadow' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200'}`}
                 >
                   <User size={20} className={`shrink-0 ${activeTab === 'profile' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                   <AnimatePresence>
                     {isSidebarOpen && <motion.span initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="font-bold whitespace-nowrap text-[15px]">Profile Settings</motion.span>}
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
                  <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight capitalize">{activeTab.replace('_', ' ')}</h1>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Welcome back back to vCAMPs, <span className="text-brand-600 dark:text-brand-400">{profile?.name}</span></p>
                </div>
                
                {activeTab === 'dashboard' && (
                  <div className="flex flex-col md:flex-row items-center gap-3">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link to="/student/new-proposal" className="btn-primary flex items-center gap-2 shadow-lg shadow-brand-500/20">
                        <PlusCircle size={18} /> New Proposal
                      </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link to="/student/book-venue" className="btn-primary flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
                        <PlusCircle size={18} /> Book Venue
                      </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link to="/student/permission-letter" className="btn-primary flex items-center gap-2 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                        <FileText size={18} /> Permission Letter
                      </Link>
                    </motion.div>
                  </div>
                )}
              </header>

              <AnimatePresence mode="wait">
                {/* DASHBOARD TAB */}
                {activeTab === 'dashboard' && (
                  <motion.div key="dashboard" initial={{opacity:0, y:15}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-15}} transition={{duration: 0.3}}>
                    
                    {/* Analytics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                      <div className="glass-card p-6 rounded-2xl flex items-center gap-5 premium-shadow hover:translate-y-[-2px] transition-transform">
                        <div className="p-4 bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 rounded-2xl"><FileText size={28} /></div>
                        <div>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Submissions</p>
                          <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{applications.length}</p>
                        </div>
                      </div>
                      <div className="glass-card p-6 rounded-2xl flex items-center gap-5 premium-shadow hover:translate-y-[-2px] transition-transform">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl"><Clock size={28} /></div>
                        <div>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">In Progress</p>
                          <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{applications.filter(a => ['pending', 'under_review'].includes(a.status)).length}</p>
                        </div>
                      </div>
                      <div className="glass-card p-6 rounded-2xl flex items-center gap-5 premium-shadow hover:translate-y-[-2px] transition-transform">
                        <div className="p-4 bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-2xl"><CheckCircle2 size={28} /></div>
                        <div>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Approved</p>
                          <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{applications.filter(a => a.status === 'approved').length}</p>
                        </div>
                      </div>
                    </div>

                    {/* Applications Queue */}
                    <div className="glass-card rounded-3xl overflow-hidden premium-shadow border border-slate-200/60 dark:border-slate-800/60">
                      <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Submission History</h2>
                      </div>
                      <div className="p-0 overflow-x-auto">
                        {applications.length === 0 ? (
                           <div className="p-16 text-center">
                              <AlertCircle size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                              <p className="text-lg font-bold text-slate-500 dark:text-slate-400">No applications found</p>
                              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Submit a new proposal to see it here.</p>
                           </div>
                        ) : (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                                <th className="p-5">Application Info</th>
                                <th className="p-5">Submitted</th>
                                <th className="p-5">Status</th>
                                <th className="p-5">Current Desk</th>
                                <th className="p-5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <motion.tbody variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-slate-100 dark:divide-slate-800/50">
                              {applications.map((app) => (
                                <motion.tr variants={itemVariants} key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                                  <td className="p-5">
                                    <div className="font-bold text-slate-800 dark:text-slate-200 capitalize">{app.type.replace(/_/g, ' ')}</div>
                                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                                      {app.type === 'event_proposal' ? (app.event_proposals?.[0]?.event_name) : 
                                       app.type === 'venue_booking' ? (app.venue_bookings?.[0]?.event_proposals?.event_name || app.venue_bookings?.[0]?.venue) :
                                       app.type === 'permission_letter' ? (app.permission_letters?.[0]?.details) : ''}
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-400 mt-1">#{app.id.slice(0, 8)}</div>
                                  </td>
                                  <td className="p-5 text-slate-500 dark:text-slate-400 text-sm font-medium">
                                    {new Date(app.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
                                  </td>
                                  <td className="p-5">
                                    <span className={`px-4 py-1.5 rounded-full text-[11px] font-black border ${getStatusColor(app.status)} capitalize flex w-max items-center gap-1.5 shadow-sm`}>
                                      {app.status === 'approved' && <CheckCircle2 size={12} />}
                                      {app.status.replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td className="p-5 text-slate-600 dark:text-slate-400 text-sm font-semibold">
                                    {app.status === 'approved' ? (
                                      <span className="flex items-center gap-2 text-green-600 dark:text-green-500">
                                        <CheckCircle2 size={14} /> Completed
                                      </span>
                                    ) : (
                                      <div className="flex flex-col">
                                        <span>{app.desks?.name || 'Awaiting Desk'}</span>
                                        {app.desks && <span className="text-[10px] font-bold text-slate-400 uppercase">Desk Order {app.desks.order_index}</span>}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-5">
                                    <div className="flex items-center justify-end gap-2">
                                      {['pending', 'returned'].includes(app.status) && (
                                        <button 
                                          onClick={() => handleDelete(app.id)}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      )}
                                      {app.status === 'returned' && (
                                        <Link 
                                          to={app.type === 'venue_booking' ? `/edit-venue-booking/${app.id}` : 
                                              app.type === 'permission_letter' ? `/edit-permission-letter/${app.id}` : 
                                              `/edit-proposal/${app.id}`} 
                                          className="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-orange-100 dark:border-orange-900/50 flex items-center gap-1"
                                        >
                                          <Edit2 size={14}/> Resubmit
                                        </Link>
                                      )}
                                      <Link to={`/student/view/${app.id}`} className="text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-4 py-1.5 rounded-lg text-sm font-bold opacity-80 group-hover:opacity-100 transition-opacity">View</Link>
                                    </div>
                                  </td>
                                </motion.tr>
                              ))}
                            </motion.tbody>
                          </table>
                        )}
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
                              <h2 className="text-2xl font-black text-slate-800 dark:text-white">Profile Details</h2>
                              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Manage your academic identity</p>
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
                              
                              <div className="grid grid-cols-2 gap-5">
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Year of Study</label>
                                  <select value={profileData.year_of_study} onChange={e => setProfileData({...profileData, year_of_study: e.target.value})} className="input-field py-2.5 font-semibold text-slate-800 dark:text-white w-full" required>
                                    <option value="FY">First Year (FY)</option>
                                    <option value="SY">Second Year (SY)</option>
                                    <option value="TY">Third Year (TY)</option>
                                    <option value="Final">Final Year</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Branch</label>
                                  <input type="text" value={profileData.branch} onChange={e => setProfileData({...profileData, branch: e.target.value})} className="input-field py-2.5 font-semibold text-slate-800 dark:text-white w-full" />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-5">
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Committee Name</label>
                                  <input type="text" value={profileData.committee_name} onChange={e => setProfileData({...profileData, committee_name: e.target.value})} className="input-field py-2.5 font-semibold text-slate-800 dark:text-white w-full" required />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Designation</label>
                                  <select value={profileData.designation} onChange={e => setProfileData({...profileData, designation: e.target.value})} className="input-field py-2.5 font-semibold text-slate-800 dark:text-white w-full" required>
                                    <option value="Student">Student</option>
                                    <option value="Coordinator">Coordinator</option>
                                    <option value="General Secretary">General Secretary</option>
                                    <option value="President">President</option>
                                  </select>
                                </div>
                              </div>

                              <div className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                                 <h3 className="text-[11px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.2em] mb-4">Official Convenor Contact</h3>
                                 <div className="grid grid-cols-2 gap-5">
                                   <div>
                                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Phone No.</label>
                                     <input type="text" value={profileData.convenor_phone} onChange={e => setProfileData({...profileData, convenor_phone: e.target.value})} className="input-field py-2.5 font-semibold text-slate-800 dark:text-white w-full" />
                                   </div>
                                   <div>
                                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
                                     <input type="email" value={profileData.convenor_email} onChange={e => setProfileData({...profileData, convenor_email: e.target.value})} className="input-field py-2.5 font-semibold text-slate-800 dark:text-white w-full" />
                                   </div>
                                 </div>
                              </div>
                            </div>

                            <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.99}} type="submit" disabled={updateLoading} className="w-full btn-primary h-14 text-lg mt-6 flex justify-center items-center gap-3 shadow-xl rounded-xl">
                              {updateLoading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />} Sync with University CRM
                            </motion.button>
                        </form>
                      ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                               <div>
                                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Full Name</p>
                                 <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{profile?.name || 'N/A'}</p>
                               </div>
                               <div>
                                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Roll Number</p>
                                 <p className="text-lg font-black font-mono text-brand-600 dark:text-brand-400 mt-1 uppercase">{profile?.studentDoc?.roll_no || 'N/A'}</p>
                               </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                              <div>
                                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Year</p>
                                 <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{profile?.studentDoc?.year_of_study || 'N/A'}</p>
                              </div>
                              <div>
                                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Branch</p>
                                 <p className="text-lg font-black text-slate-800 dark:text-white mt-1 uppercase">{profile?.studentDoc?.branch || 'N/A'}</p>
                              </div>
                              <div>
                                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Designation</p>
                                 <p className="text-lg font-black text-slate-800 dark:text-white mt-1 uppercase">{profile?.studentDoc?.designation || 'Student'}</p>
                              </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Active Committee</p>
                               <p className="text-3xl font-black text-brand-600 dark:text-brand-400 mt-2">{profile?.studentDoc?.committee_name || 'General Body'}</p>
                            </div>

                            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                               <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Official Convenor Setup</h4>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 text-lg">📞</div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                                      <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{profile?.studentDoc?.convenor_phone || 'Unregistered'}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800 flex items-center justify-center text-green-600 dark:text-green-400 text-lg">✉️</div>
                                    <div className="overflow-hidden w-full">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Link</p>
                                      <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{profile?.studentDoc?.convenor_email || 'Unregistered'}</p>
                                    </div>
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
