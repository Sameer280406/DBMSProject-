import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient';
import { Link } from 'react-router-dom';
import { PlusCircle, Clock, CheckCircle2, AlertCircle, FileText, LogOut, Loader2, Moon, Sun, User, Edit3, Save, X, LayoutDashboard, Menu, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';

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
    name: profile?.name || '',
    year_of_study: profile?.studentDoc?.year_of_study || '',
    branch: profile?.studentDoc?.branch || '',
    committee_name: profile?.studentDoc?.committee_name || '',
    convenor_phone: profile?.studentDoc?.convenor_phone || '',
    convenor_email: profile?.studentDoc?.convenor_email || '',
    designation: profile?.studentDoc?.designation || ''
  });

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

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/update-profile', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ user_id: profile.id, ...profileData })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      
      toast.success("Profile Updated!");
      setEditMode(false);
      
      // Update local profile object so user sees immediate feedback without refreshing AuthContext
      if(profile && profile.studentDoc) {
          profile.name = profileData.name;
          profile.studentDoc.year_of_study = profileData.year_of_study;
          profile.studentDoc.branch = profileData.branch;
          profile.studentDoc.committee_name = profileData.committee_name;
          profile.studentDoc.convenor_phone = profileData.convenor_phone;
          profile.studentDoc.convenor_email = profileData.convenor_email;
          profile.studentDoc.designation = profileData.designation;
      }
    } catch(err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setUpdateLoading(false);
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
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors">
      
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
                 {isSidebarOpen && <motion.span initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="font-bold whitespace-nowrap text-[15px]">My Dashboard</motion.span>}
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
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Welcome back to vCAMPs, <span className="text-brand-600 dark:text-brand-400">{profile?.name}</span></p>
              </div>
              
              {activeTab === 'dashboard' && (
                <div className="flex flex-col md:flex-row items-center gap-3">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link to="/student/event-proposal" className="btn-primary flex items-center gap-2 shadow-lg shadow-brand-500/20">
                      <PlusCircle size={18} /> New Proposal
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link to="/student/venue-booking" className="btn-primary flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
                      <PlusCircle size={18} /> Book Venue
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
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl"><CheckCircle2 size={28} /></div>
                      <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Approved</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{applications.filter(a => a.status === 'approved').length}</p>
                      </div>
                    </div>
                    <div className="glass-card p-6 rounded-2xl flex items-center gap-5 premium-shadow hover:translate-y-[-2px] transition-transform">
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl"><Clock size={28} /></div>
                      <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">In Progress</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{applications.filter(a => ['pending','under_review'].includes(a.status)).length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Applications Table */}
                  <div className="glass-card rounded-3xl overflow-hidden premium-shadow border border-slate-200/60 dark:border-slate-800/60">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50">
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white">Recent Applications</h2>
                    </div>
                    <div className="p-0 overflow-x-auto">
                      {loading ? (
                        <div className="p-16 flex flex-col items-center justify-center text-slate-500 h-64 bg-slate-50/50 dark:bg-slate-900/30">
                            <Loader2 size={40} className="animate-spin text-brand-500 mb-6" />
                            <p className="font-semibold text-lg animate-pulse tracking-wide">Fetching your history...</p>
                        </div>
                      ) : applications.length === 0 ? (
                        <div className="p-16 flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 h-64">
                          <AlertCircle size={56} className="mb-6 text-slate-300 dark:text-slate-700" />
                          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">No applications found</p>
                          <p className="text-md text-slate-500 dark:text-slate-500 max-w-sm mx-auto">Submit an event proposal or permission letter to jumpstart your campus activities.</p>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                              <th className="p-5 flex-1 min-w-[200px]">Type</th>
                              <th className="p-5 w-40">Submitted</th>
                              <th className="p-5 w-40">Status</th>
                              <th className="p-5 w-80">SLA Tracking Clock</th>
                              <th className="p-5 text-right w-24">Actions</th>
                            </tr>
                          </thead>
                          <motion.tbody variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-slate-100 dark:divide-slate-800/50 w-full min-w-[900px]">
                            {applications.map((app) => (
                              <motion.tr variants={itemVariants} key={app.id} className="hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition-colors group">
                                <td className="p-5 font-bold text-slate-700 dark:text-slate-200 capitalize whitespace-nowrap">
                                  {app.type.replace('_', ' ')}
                                </td>
                                <td className="p-5 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                                  {new Date(app.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
                                </td>
                                <td className="p-5">
                                  <span className={`px-4 py-1.5 rounded-full text-[11px] font-black border ${getStatusColor(app.status)} capitalize flex w-max items-center gap-1.5 shadow-sm`}>
                                    {app.status === 'approved' && <CheckCircle2 size={14} className="stroke-[3]" />}
                                    {app.status.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="p-5 text-slate-600 dark:text-slate-400 font-semibold truncate max-w-[250px]">
                                  {app.status === 'approved' ? 'Completed Process' : app.desks ? `Assigned: Desk ${app.desks.order_index} - ${app.desks.name}` : 'Awaiting Assignment'}
                                </td>
                                <td className="p-5 text-right">
                                  <Link to={`/student/view/${app.id}`} className="text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 font-bold text-sm bg-brand-50 dark:bg-brand-900/30 px-5 py-2 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity">View</Link>
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
                        <button onClick={() => { setEditMode(false); setProfileData({
                          name: profile?.name || '',
                          year_of_study: profile?.studentDoc?.year_of_study || '',
                          branch: profile?.studentDoc?.branch || '',
                          committee_name: profile?.studentDoc?.committee_name || '',
                          convenor_phone: profile?.studentDoc?.convenor_phone || '',
                          convenor_email: profile?.studentDoc?.convenor_email || '',
                          designation: profile?.studentDoc?.designation || ''
                        }) }} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/40 rounded-xl font-bold text-red-500 transition-colors flex items-center gap-2">
                           <X size={18}/> Cancel
                        </button>
                      )}
                    </div>

                    {editMode ? (
                      <form onSubmit={handleProfileUpdate} className="space-y-6">
                          <div className="space-y-5">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Full Name</label>
                              <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="input-field py-2.5 font-semibold text-slate-800 dark:text-white" required />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-5">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Year of Study</label>
                                <select value={profileData.year_of_study} onChange={e => setProfileData({...profileData, year_of_study: e.target.value})} className="input-field py-2.5 font-semibold text-slate-800 dark:text-white" required>
                                  <option value="FY">First Year (FY)</option>
                                  <option value="SY">Second Year (SY)</option>
                                  <option value="TY">Third Year (TY)</option>
                                  <option value="Final">Final Year</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Branch</label>
                                <input type="text" value={profileData.branch} onChange={e => setProfileData({...profileData, branch: e.target.value})} className="input-field py-2.5 font-semibold text-slate-800 dark:text-white" />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Committee Name</label>
                                <input type="text" value={profileData.committee_name} onChange={e => setProfileData({...profileData, committee_name: e.target.value})} className="input-field py-2.5 font-semibold text-slate-800 dark:text-white" required />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Student Designation</label>
                                <select value={profileData.designation} onChange={e => setProfileData({...profileData, designation: e.target.value})} className="input-field py-2.5 font-semibold text-slate-800 dark:text-white" required>
                                  <option value="Student">Student</option>
                                  <option value="Coordinator">Coordinator</option>
                                  <option value="General Secretary">General Secretary</option>
                                  <option value="Joint Secretary">Joint Secretary</option>
                                  <option value="President">President</option>
                                </select>
                              </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                               <h3 className="text-[11px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-4">Official Convenor Contact</h3>
                               <div className="grid grid-cols-2 gap-5">
                                 <div>
                                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Phone No.</label>
                                   <input type="text" value={profileData.convenor_phone} onChange={e => setProfileData({...profileData, convenor_phone: e.target.value})} className="input-field py-2.5 font-semibold text-slate-800 dark:text-white" placeholder="e.g. 9876543210" />
                                 </div>
                                 <div>
                                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
                                   <input type="email" value={profileData.convenor_email} onChange={e => setProfileData({...profileData, convenor_email: e.target.value})} className="input-field py-2.5 font-semibold text-slate-800 dark:text-white" placeholder="faculty@vcamps.edu.in" />
                                 </div>
                               </div>
                            </div>
                          </div>

                          <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.99}} type="submit" disabled={updateLoading} className="w-full btn-primary h-14 text-lg mt-6 flex justify-center items-center gap-3 shadow-xl shadow-brand-500/20 rounded-xl">
                            {updateLoading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} className="stroke-[2.5]" />} Save Identity Changes
                          </motion.button>
                      </form>
                    ) : (
                      <div className="space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div>
                               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Registered Email</p>
                               <p className="text-lg font-black text-slate-700 dark:text-slate-200 mt-1">{profile?.email || 'N/A'}</p>
                             </div>
                             <div>
                               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">University Roll / ID</p>
                               <p className="text-lg font-black font-mono text-brand-600 dark:text-brand-400 mt-1 uppercase">{profile?.studentDoc?.roll_no || 'N/A'}</p>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div>
                               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Year</p>
                               <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{profile?.studentDoc?.year_of_study || 'N/A'}</p>
                            </div>
                            <div>
                               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Branch</p>
                               <p className="text-lg font-black text-slate-800 dark:text-white mt-1 uppercase">{profile?.studentDoc?.branch || 'N/A'}</p>
                            </div>
                            <div className="hidden md:block">
                               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Status / Role</p>
                               <span className="mt-1 inline-flex px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">{profile?.studentDoc?.designation || 'Student'}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-8">
                             <div>
                               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center justify-between">
                                  <span>Active Committee</span>
                                  <span className="md:hidden inline-flex px-3 py-1 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">{profile?.studentDoc?.designation || 'Student'}</span>
                               </p>
                               <p className="text-3xl font-black text-brand-600 dark:text-brand-400 mt-2">{profile?.studentDoc?.committee_name || 'General Body'}</p>
                             </div>
                          </div>

                          <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                             <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Official Convenor Setup</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 text-lg">📞</div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                                    <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{profile?.studentDoc?.convenor_phone || 'Unregisterd Phone'}</p>
                                  </div>
                               </div>
                               <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800 flex items-center justify-center text-green-600 dark:text-green-400 text-lg">✉️</div>
                                  <div className="overflow-hidden w-full space-y-0.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Link</p>
                                    <p className="font-bold text-slate-700 dark:text-slate-300 truncate w-full">{profile?.studentDoc?.convenor_email || 'Unregistered Mail'}</p>
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
    </div>
  );
}
