import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, Send, Loader2, ArrowLeft, AlertCircle, Calendar, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingSplash from '../components/LoadingSplash';

export default function EditPermissionLetter() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date_of_activity: '',
    time_from: '',
    time_to: '',
    details: '',
    location: '',
    no_of_attendees: '',
    team_leader: '',
    person_undertaking: '',
    responsible_staff: '',
    hod_convenor: ''
  });
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchApplicationData();
  }, [id]);

  const fetchApplicationData = async () => {
    try {
      const { data: app, error } = await supabase
        .from('applications')
        .select(`*, permission_letters(*), approval_log(*)`)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const letter = app.permission_letters?.[0];
      if (letter) {
        setFormData({
          date_of_activity: letter.date_of_activity || '',
          time_from: letter.time_from || '',
          time_to: letter.time_to || '',
          details: letter.details || '',
          location: letter.location || '',
          no_of_attendees: letter.no_of_attendees || '',
          team_leader: letter.team_leader || '',
          person_undertaking: letter.person_undertaking || '',
          responsible_staff: letter.responsible_staff || '',
          hod_convenor: letter.hod_convenor || ''
        });
      }

      const returnLog = app.approval_log
        ?.filter(l => l.action === 'returned')
        .sort((a, b) => new Date(b.acted_at) - new Date(a.acted_at))[0];
      
      if (returnLog) setFeedback(returnLog.remark);

    } catch (err) {
      toast.error('Failed to load letter data');
      navigate('/student');
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/update-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: id,
          type: 'permission_letter',
          ...formData
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      toast.success('Permission Letter resubmitted!');
      navigate('/student');
    } catch (err) {
      toast.error(err.message || 'Failed to update letter.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  if (loading) return <LoadingSplash />;

  return (
    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="min-h-screen p-6 md:p-10 flex justify-center pb-20">
      <div className="max-w-3xl w-full">
        <button onClick={() => navigate('/student')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-brand-600 font-semibold transition">
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Revise Permission Letter</h1>
        </header>

        {feedback && (
          <div className="mb-8 p-6 rounded-2xl bg-orange-50 border border-orange-100 dark:bg-orange-900/10 dark:border-orange-800/30">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-black uppercase text-xs tracking-widest mb-3">
              <AlertCircle size={16} /> Revision Feedback
            </div>
            <p className="text-orange-800 dark:text-orange-300 font-medium italic leading-relaxed">"{feedback}"</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-8 premium-shadow space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-orange-500"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">Activity Details <FileText size={14}/></label>
              <textarea required rows="4" name="details" value={formData.details} onChange={handleChange} className="input-field py-3 text-slate-800 dark:text-white" />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">Activity Date <Calendar size={14}/></label>
              <input required type="date" name="date_of_activity" value={formData.date_of_activity} onChange={handleChange} className="input-field py-3 text-slate-800 dark:text-white" />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">Location <MapPin size={14}/></label>
              <input required type="text" name="location" value={formData.location} onChange={handleChange} className="input-field py-3 text-slate-800 dark:text-white" />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">Time From <Clock size={14}/></label>
              <input required type="time" name="time_from" value={formData.time_from} onChange={handleChange} className="input-field py-3 text-slate-800 dark:text-white" />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">Time To <Clock size={14}/></label>
              <input required type="time" name="time_to" value={formData.time_to} onChange={handleChange} className="input-field py-3 text-slate-800 dark:text-white" />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Number of Attendees</label>
              <input required type="number" name="no_of_attendees" value={formData.no_of_attendees} onChange={handleChange} className="input-field py-3 text-slate-800 dark:text-white" />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Team Leader Name</label>
                <input required type="text" name="team_leader" value={formData.team_leader} onChange={handleChange} className="input-field py-3 text-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Responsible Staff</label>
                <input required type="text" name="responsible_staff" value={formData.responsible_staff} onChange={handleChange} className="input-field py-3 text-slate-800 dark:text-white" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} type="submit" disabled={submitting} className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-orange-500/20 disabled:opacity-50">
              {submitting ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>} Resubmit Application
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
