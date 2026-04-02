import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, MapPin, Users, Send, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingSplash from '../components/LoadingSplash';

export default function EditVenueBooking() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [formData, setFormData] = useState({
    event_proposal_id: '',
    venue: '',
    day_date: '',
    start_time: '',
    end_time: '',
    expected_attendees: '',
    attendees_students: '',
    attendees_others: '',
    projector: false,
    backdrop: false,
    audio_recording: false,
    video_recording: false,
    live_streaming: false,
    photography: false,
    wifi: false,
    lamp_lighting: false,
    national_anthem: false
  });
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (profile?.studentDoc?.id) {
        fetchApplicationData();
        fetchLookupData();
    }
  }, [id, profile]);

  const fetchLookupData = async () => {
    // 1. Fetch Approved Events
    const { data: apps } = await supabase
        .from('applications')
        .select(`id, event_proposals:event_proposals!event_proposals_application_id_fkey(id, event_name, venue)`)
        .eq('type', 'event_proposal')
        .eq('status', 'approved')
        .eq('student_id', profile.studentDoc.id);
    
    if (apps) {
        setApprovedEvents(apps.flatMap(app => app.event_proposals || []));
    }

    // 2. Fetch Active Venues
    const { data: vData } = await supabase
        .from('venues')
        .select('name')
        .eq('is_active', true)
        .order('name');
    
    if (vData) {
        setVenues(vData.map(v => v.name));
    }
  };

  const fetchApplicationData = async () => {
    try {
      const { data: app, error } = await supabase
        .from('applications')
        .select(`*, venue_bookings(*), approval_log(*)`)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const booking = app.venue_bookings?.[0];
      if (booking) {
        setFormData({
          event_proposal_id: booking.event_proposal_id || '',
          venue: booking.venue || '',
          day_date: booking.day_date || '',
          start_time: booking.start_time || '',
          end_time: booking.end_time || '',
          expected_attendees: booking.expected_attendees || '',
          attendees_students: booking.attendees_students || '',
          attendees_others: booking.attendees_others || '',
          projector: booking.projector || false,
          backdrop: booking.backdrop || false,
          audio_recording: booking.audio_recording || false,
          video_recording: booking.video_recording || false,
          live_streaming: booking.live_streaming || false,
          photography: booking.photography || false,
          wifi: booking.wifi || false,
          lamp_lighting: booking.lamp_lighting || false,
          national_anthem: booking.national_anthem || false
        });
      }

      const returnLog = app.approval_log
        ?.filter(l => l.action === 'returned')
        .sort((a, b) => new Date(b.acted_at) - new Date(a.acted_at))[0];
      
      if (returnLog) setFeedback(returnLog.remark);

    } catch (err) {
      toast.error('Failed to load booking data');
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
          type: 'venue_booking',
          ...formData
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      toast.success('Venue Booking resubmitted!');
      navigate('/student');
    } catch (err) {
      toast.error(err.message || 'Failed to update booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({...formData, [e.target.name]: value});
  };

  if (loading) return <LoadingSplash />;

  return (
    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="min-h-screen p-6 md:p-10 flex justify-center pb-20">
      <div className="max-w-3xl w-full">
        <button onClick={() => navigate('/student')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-brand-600 font-semibold transition">
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Revise Venue Booking</h1>
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
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Linked Event Proposal</label>
              <select required name="event_proposal_id" value={formData.event_proposal_id} onChange={handleChange} className="input-field py-3 text-slate-800 dark:text-white capitalize">
                <option value="">-- Select Approved Event --</option>
                {approvedEvents.map(evt => (
                  <option key={evt.id} value={evt.id}>{evt.event_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Venue Requested</label>
              <select 
                required 
                name="venue" 
                value={formData.venue} 
                onChange={handleChange} 
                className="input-field py-3 text-slate-800 dark:text-white"
              >
                <option value="">-- Choose Venue --</option>
                {venues.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
                {formData.venue && !venues.includes(formData.venue) && (
                   <option value={formData.venue}>{formData.venue} (Original)</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Booking Date</label>
              <input required type="date" name="day_date" value={formData.day_date} onChange={handleChange} className="input-field py-3 text-slate-800 dark:text-white" />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Start Time</label>
              <input required type="time" name="start_time" value={formData.start_time} onChange={handleChange} className="input-field py-3 text-slate-800 dark:text-white" />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">End Time</label>
              <input required type="time" name="end_time" value={formData.end_time} onChange={handleChange} className="input-field py-3 text-slate-800 dark:text-white" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Expected Attendees</label>
              <input required type="number" name="expected_attendees" value={formData.expected_attendees} onChange={handleChange} className="input-field py-3 text-slate-800 dark:text-white" />
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />
          
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Venue Requirements</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             {['projector', 'backdrop', 'audio_recording', 'video_recording', 'live_streaming', 'photography', 'wifi', 'lamp_lighting', 'national_anthem'].map(req => (
                <label key={req} className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input type="checkbox" name={req} checked={formData[req]} onChange={handleChange} className="w-4 h-4 text-orange-600 rounded" />
                  {req.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </label>
             ))}
          </div>

          <div className="flex justify-end pt-4">
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} type="submit" disabled={submitting} className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-orange-500/20 disabled:opacity-50">
              {submitting ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>} Resubmit Booking
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
