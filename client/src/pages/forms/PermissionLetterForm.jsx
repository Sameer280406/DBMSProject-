import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Send, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function PermissionLetterForm() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date_of_activity: '',
    time_from: '',
    time_to: '',
    details: '',
    other_details: '',
    location: '',
    no_of_attendees: '',
    team_leader: '',
    person_undertaking: '',
    responsible_staff: '',
    hod_convenor: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!profile || profile.role !== 'student') {
        throw new Error('Only applicants can submit permission letters');
      }

      const response = await fetch('http://localhost:3000/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'permission_letter',
          student_id: profile.studentDoc.id,
          email: profile.email,
          ...formData
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      toast.success('Permission Letter drafted and submitted!');
      navigate('/student');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to submit permission letter.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  return (
    <motion.div initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} exit={{opacity:0, y:-20}} className="min-h-screen p-6 md:p-10 flex justify-center transition-colors">
      <div className="max-w-4xl w-full">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Permission Letter Draft</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Submit a generalized letter of permission for collegiate activities.</p>
        </header>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 premium-shadow space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                <span>Subject / Details of Activity</span> <FileText size={16} className="text-slate-400"/>
              </label>
              <textarea required rows="2" name="details" value={formData.details} onChange={handleChange} className="input-field" placeholder="E.g. Permission to conduct an industrial visit to..." />
            </div>

             <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                 <span>Date of Activity</span>
              </label>
              <input required type="date" name="date_of_activity" value={formData.date_of_activity} onChange={handleChange} className="input-field" />
            </div>

            <div /> {/* Spacing */}

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Time From</label>
              <input required type="time" name="time_from" value={formData.time_from} onChange={handleChange} className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Time To</label>
              <input required type="time" name="time_to" value={formData.time_to} onChange={handleChange} className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                <span>Location</span> 
              </label>
              <input required type="text" name="location" value={formData.location} onChange={handleChange} className="input-field" placeholder="Where will this occur?" />
            </div>

             <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                <span>Total Expected Attendees</span> 
              </label>
              <input required type="number" name="no_of_attendees" value={formData.no_of_attendees} onChange={handleChange} className="input-field" placeholder="10" />
            </div>
            
            <div className="md:col-span-2 mt-4 space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800/50">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Responsible Faculties & Leaders</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Team Leader Name</label>
                    <input required type="text" name="team_leader" value={formData.team_leader} onChange={handleChange} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Person Undertaking Activity</label>
                    <input required type="text" name="person_undertaking" value={formData.person_undertaking} onChange={handleChange} className="input-field" />
                  </div>
                   <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Responsible Staff Member</label>
                    <input required type="text" name="responsible_staff" value={formData.responsible_staff} onChange={handleChange} className="input-field" />
                  </div>
                   <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">HOD / Convenor Name</label>
                    <input required type="text" name="hod_convenor" value={formData.hod_convenor} onChange={handleChange} className="input-field" />
                  </div>
               </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                <span>Other Additional Details (Optional)</span>
              </label>
              <textarea rows="3" name="other_details" value={formData.other_details} onChange={handleChange} className="input-field" placeholder="" />
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-4 mt-6">
             <button type="button" onClick={() => navigate('/student')} className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
             <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} type="submit" disabled={loading} className="btn-primary text-md h-12 flex items-center justify-center gap-2 min-w-[150px]">
                {loading ? <><Loader2 className="animate-spin" size={18}/> Submitting...</> : <><Send size={18}/> Draft Letter</>}
             </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
