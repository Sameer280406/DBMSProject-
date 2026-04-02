import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CalendarRange, Shield, UserPlus, LogIn, Loader2, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

import campusBg from '../assets/campus-bg.png';

export default function Login() {
  const [role, setRole] = useState('student');
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', 
    // Student specifics
    roll_no: '', committee_name: '', year_of_study: 'FY', branch: '', convenor_phone: '', convenor_email: '', designation: 'Student',
    // Admin specifics
    desk_name: '', desk_order: ''
  });
  
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, role })
        });
        
        const result = await res.json();
        if (!result.success) throw new Error(result.error);
        
        toast.success("Account created successfully!");
        await login(formData.email, formData.password);
        navigate(role === 'student' ? '/student' : '/admin');

      } else {
        await login(formData.email, formData.password);
        toast.success("Welcome back!");
        navigate(role === 'student' ? '/student' : '/admin');
      }
    } catch (err) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" } },
    exit: { opacity: 0 }
  };

  return (
    <motion.div 
      initial="initial" animate="animate" exit="exit" variants={pageVariants}
      className="min-h-screen flex items-center justify-center p-4 transition-colors relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${campusBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <button onClick={toggleTheme} className="absolute top-6 right-6 p-2 rounded-full glass-card hover:bg-slate-200 dark:hover:bg-white/10 transition z-50 backdrop-blur-md">
        {theme === 'dark' ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-white"/>}
      </button>

      <button onClick={() => {
        setRole('it_support');
        toast.success("IT Support Mode Active. Enter IT Credentials.");
      }} className="fixed bottom-6 right-6 p-3 rounded-2xl glass-card hover:bg-slate-200 dark:hover:bg-white/10 transition z-50 backdrop-blur-md flex items-center gap-2 border border-white/20 text-xs font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400">
        <Shield size={14}/> IT Administration
      </button>

      <div className="max-w-md w-full glass-card rounded-3xl p-8 premium-shadow relative overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/20">
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-800 dark:text-white tracking-tight flex justify-center items-center gap-2">
              <span className="text-brand-600 dark:text-brand-400">v</span>CAMPs
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                {role === 'it_support' ? 'Unified Tech Control Console' : (isSignUp ? 'Create a secure portal account' : 'Vidyalankar Institute of Technology')}
            </p>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                role === 'student' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <CalendarRange size={16} /> Applicant
            </button>
            
            {(role === 'admin' || role === 'student') && !isSignUp && (
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  role === 'admin' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Shield size={16} /> Authority
              </button>
            )}

            {role === 'it_support' && (
                <div className="flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-bold rounded-lg bg-slate-600 text-white shadow-sm">
                   <Shield size={16} /> IT ADMIN
                </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isSignUp && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field py-2.5" required={isSignUp} />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email ID</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field py-2.5" placeholder="user@vcamps.edu.in" required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field py-2.5" required />
            </div>

            {isSignUp && role === 'student' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Roll No / ID</label>
                    <input type="text" name="roll_no" value={formData.roll_no} onChange={handleChange} className="input-field py-2" required={isSignUp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Year of Study</label>
                    <select name="year_of_study" value={formData.year_of_study} onChange={handleChange} className="input-field py-2" required={isSignUp}>
                      <option value="FY">First Year (FY)</option>
                      <option value="SY">Second Year (SY)</option>
                      <option value="TY">Third Year (TY)</option>
                      <option value="Final">Final Year</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Branch</label>
                    <input type="text" name="branch" value={formData.branch} onChange={handleChange} className="input-field py-2" placeholder="e.g. Computer Science" required={isSignUp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Committee Name</label>
                    <input type="text" name="committee_name" value={formData.committee_name} onChange={handleChange} className="input-field py-2" placeholder="e.g. Tech Club" required={isSignUp} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Designation</label>
                    <select name="designation" value={formData.designation} onChange={handleChange} className="input-field py-2" required={isSignUp}>
                      <option value="Student">Student</option>
                      <option value="Coordinator">Coordinator</option>
                      <option value="General Secretary">General Secretary</option>
                      <option value="Joint Secretary">Joint Secretary</option>
                      <option value="President">President</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Convenor Phone</label>
                    <input type="text" name="convenor_phone" value={formData.convenor_phone} onChange={handleChange} className="input-field py-2" placeholder="Convenor Contact No." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Convenor Email</label>
                    <input type="email" name="convenor_email" value={formData.convenor_email} onChange={handleChange} className="input-field py-2" placeholder="Convenor Email ID" />
                  </div>
                </div>
              </div>
            )}

            
            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit" disabled={loading} className="w-full btn-primary text-md mt-6 h-12 flex justify-center items-center gap-2">
              {loading ? (
                <><Loader2 size={18} className="animate-spin"/> Processing...</>
              ) : isSignUp ? (
                <><UserPlus size={18}/> Sign Up</>
              ) : (
                <><LogIn size={18}/> Secure Login</>
              )}
            </motion.button>
          </form>

          <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 mt-6">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{' '}
            <button type="button" onClick={() => {
                const goingToSignUp = !isSignUp;
                setIsSignUp(goingToSignUp);
                if (goingToSignUp) setRole('student');
            }} className="text-brand-600 dark:text-brand-400 hover:text-brand-700 font-bold underline">
              {isSignUp ? 'Login Here' : 'Create one here'}
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
