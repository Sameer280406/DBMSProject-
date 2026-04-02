import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, MapPin, DollarSign, Send, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingSplash from '../components/LoadingSplash';

export default function EditProposal() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [venues, setVenues] = useState([]);
  const [formData, setFormData] = useState({
    event_name: '',
    brief: '',
    venue: '',
    date_of_event: '',
    start_time: '',
    end_time: '',
    description: '',
    outcome: '',
    estimated_budget: ''
  });
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchApplicationData();
    fetchVenues();
  }, [id]);

  const fetchVenues = async () => {
    const { data } = await supabase
        .from('venues')
        .select('name')
        .eq('is_active', true)
        .order('name');
    if (data) setVenues(data.map(v => v.name));
  };
创新教育
  const fetchApplicationData = async () => {
    try {
      const { data: app, error: appErr } = await supabase
        .from('applications')
        .select(`
          *,
          event_proposals:event_proposals!event_proposals_application_id_fkey(*),
          approval_log(remark, action, acted_at)
        `)
        .eq('id', id)
        .single();

      if (appErr) throw appErr;
      if (!app) throw new Error('Application not found');
      
      const proposal = app.event_proposals?.[0];
      if (proposal) {
        setFormData({
          event_name: proposal.event_name || '',
          brief: proposal.brief || '',
          venue: proposal.venue || '',
          date_of_event: proposal.date_of_event || '',
          start_time: proposal.start_time || '',
          end_time: proposal.end_time || '',
          description: proposal.description || '',
          outcome: proposal.outcome || '',
          estimated_budget: proposal.estimated_budget || ''
        });
      }

      // Get latest return feedback
      const returnLog = app.approval_log
        ?.filter(l => l.action === 'returned')
        .sort((a, b) => new Date(b.acted_at) - new Date(a.acted_at))[0];
      
      if (returnLog) setFeedback(returnLog.remark);

    } catch (err) {
      toast.error('Failed to load application data');
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
          type: 'event_proposal',
          ...formData
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      toast.success('Proposal resubmitted successfully!');
      navigate('/student');

    } catch (err) {
      toast.error(err.message || 'Failed to update proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  if (loading) return <LoadingSplash />;

  return (
    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="min-h-screen p-6 md:p-10 flex justify-center transition-colors">
      <div className="max-w-3xl w-full">
        <button onClick={() => navigate('/student')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-brand-600 font-semibold transition">
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Revise & Resubmit</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Update your proposal details based on authority feedback.</p>
        </header>

        {feedback && (
          <div className="mb-8 p-6 rounded-2xl bg-orange-50 border border-orange-100 dark:bg-orange-900/10 dark:border-orange-800/30">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-black uppercase text-xs tracking-widest mb-3">
              <AlertCircle size={16} /> Revision Feedback
            </div>
            <p className="text-orange-800 dark:text-orange-300 font-medium italic leading-relaxed whitespace-pre-wrap">
              "{feedback}"
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-8 premium-shadow space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-orange-500"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Event Name</label>
              <input required type="text" name="event_name" value={formData.event_name} onChange={handleChange} className="input-field py-3 text-slate-800 dark:text-white" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Brief Summary</label>
              <textarea required rows="2" name="brief" value={formData.brief} onChange={handleChange} className="input-field py-3 text-slate-800 dark:text-white"></textarea>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                <span>Location</span> <MapPin size={14}/>
              </label>
              <select 
                required 
                name="venue" 
                value={formData.venue} 
                onChange={handleChange} 
                className="input-field py-3 text-slate-800 dark:text-white"
              >
                <option value="">-- Select Venue --</option>
                {venues.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
                {formData.venue && !venues.includes(formData.venue) && (
                   <option value={formData.venue}>{formData.venue} (Original)</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                 <span>Event Date</span> <Calendar size={14}/>
              </label>
              <input required type="date" name="date_of_event" value={formData.date_of_event} onChange={handleChange} className="input-field py-3 text-slate-800 dark:text-white" />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Start Time</label>
              <input required type="time" name="start_time" value={formData.start_time} onChange={handleChange} className="input-field py-3 text-slate-800 dark:text-white" />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">End Time</label>
              <input required type="time" name="end_time" value={formData.end_time} onChange={handleChange} className="input-field py-3 text-slate-800 dark:text-white" />
            </div>

            <div className="md:col-span-2 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Detailed Plan</label>
                <textarea required rows="4" name="description" value={formData.description} onChange={handleChange} className="input-field py-3 text-slate-800 dark:text-white"></textarea>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Expected Outcome</label>
                <textarea required rows="3" name="outcome" value={formData.outcome} onChange={handleChange} className="input-field py-3 text-slate-800 dark:text-white"></textarea>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                <span>Estimated Budget (INR)</span> <DollarSign size={14}/>
              </label>
              <input required type="number" name="estimated_budget" value={formData.estimated_budget} onChange={handleChange} className="input-field py-3 w-full md:w-1/2 text-slate-800 dark:text-white" />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
             <button type="button" onClick={() => navigate('/student')} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors">Discard Draft</button>
             <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} type="submit" disabled={submitting} className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-orange-500/20 disabled:opacity-50">
                {submitting ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>} 
                Resubmit to HOD
             </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
