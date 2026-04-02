import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, DollarSign, Send, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function EventProposalForm() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    const fetchVenues = async () => {
        const { data } = await supabase
            .from('venues')
            .select('name')
            .eq('is_active', true)
            .order('name');
        if (data) setVenues(data.map(v => v.name));
    };
    fetchVenues();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!profile || profile.role !== 'student') {
        throw new Error('Only applicants can submit event proposals');
      }

      // 1. We insert via our custom Node Backend API to trigger the workflow, SLA, and Emails
      // Assuming your Node server is running on localhost:3000
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'event_proposal',
          student_id: profile.studentDoc.id,
          email: profile.email,
          ...formData
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      toast.success('Proposal submitted successfully! Check your email.');
      navigate('/student');

    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to submit proposal.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  return (
    <motion.div initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} exit={{opacity:0, y:-20}} className="min-h-screen p-6 md:p-10 flex justify-center transition-colors">
      <div className="max-w-3xl w-full">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">New Event Proposal</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Submit an activity for approval by the collegiate desk.</p>
        </header>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 premium-shadow space-y-6">
          
          <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 flex flex-col md:flex-row justify-between text-sm text-slate-600 dark:text-slate-300 mb-8 gap-2">
            <div><strong className="dark:text-white">Applicant:</strong> {profile?.name}</div>
            <div><strong className="dark:text-white">Email:</strong> {profile?.email}</div>
            <div><strong className="dark:text-white">Committee:</strong> {profile?.studentDoc?.committee_name || 'N/A'}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Event Name</label>
              <input required type="text" name="event_name" value={formData.event_name} onChange={handleChange} className="input-field" placeholder="E.g. Annual Tech Symposium" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Brief Description</label>
              <textarea required rows="2" name="brief" value={formData.brief} onChange={handleChange} className="input-field" placeholder="A short 1-line summary..."></textarea>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                <span>Location (Venue)</span> <MapPin size={16} className="text-slate-400"/>
              </label>
              <select 
                required 
                name="venue" 
                value={formData.venue} 
                onChange={handleChange} 
                className="input-field"
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
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                 <span>Date of Event</span> <Calendar size={16} className="text-slate-400"/>
              </label>
              <input required type="date" name="date_of_event" value={formData.date_of_event} onChange={handleChange} className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Start Time</label>
              <input required type="time" name="start_time" value={formData.start_time} onChange={handleChange} className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">End Time</label>
              <input required type="time" name="end_time" value={formData.end_time} onChange={handleChange} className="input-field" />
            </div>

            <div className="md:col-span-2 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Detailed Description</label>
                <textarea required rows="4" name="description" value={formData.description} onChange={handleChange} className="input-field" placeholder="Elaborate on the schedule, guests, and activities..."></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Expected Outcome</label>
                <textarea required rows="3" name="outcome" value={formData.outcome} onChange={handleChange} className="input-field" placeholder="What will the students gain from this?"></textarea>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                <span>Estimated Budget (INR)</span> <DollarSign size={16} className="text-slate-400"/>
              </label>
              <input required type="number" name="estimated_budget" value={formData.estimated_budget} onChange={handleChange} className="input-field w-full md:w-1/2" placeholder="0.00" />
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/50 my-8"/>

          <div className="flex justify-end gap-4">
             <button type="button" onClick={() => navigate('/student')} className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
             <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} type="submit" disabled={loading} className="btn-primary text-md h-12 flex items-center justify-center gap-2 min-w-[150px]">
                {loading ? <><Loader2 className="animate-spin" size={18}/> Submitting...</> : <><Send size={18}/> Submit Proposal</>}
             </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
