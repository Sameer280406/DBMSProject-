import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Map, Calendar, Users, Send, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function VenueBookingForm() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [formData, setFormData] = useState({
    event_proposal_id: '',
    venue: '',
    day_date: '',
    start_time: '',
    end_time: '',
    external_involvement: false,
    expected_attendees: '',
    attendees_students: '',
    attendees_others: '',
    conflicts_academic: false,
    conflict_reason: '',
    play_player: false,
    national_anthem: false,
    lamp_lighting: false,
    projector: false,
    backdrop: false,
    audio_recording: false,
    video_recording: false,
    live_streaming: false,
    photography: false,
    wifi: false,
    stage_requirements: false,
    podium_logo: false,
    laptop_on_podium: false,
    special_lighting: false,
    extra_electrical: false,
    standees: false,
    food_arrangement_venue: '',
    food_arrangement_details: '',
    submitted_by_name: profile?.name || ''
  });

  useEffect(() => {
    if (!profile?.studentDoc?.id) return;
    
    const fetchData = async () => {
      // 1. Fetch Approved event proposals
      const { data: apps, error: aErr } = await supabase
        .from('applications')
        .select(`id, event_proposals!event_proposals_application_id_fkey(id, event_name, venue)`)
        .eq('type', 'event_proposal')
        .eq('status', 'approved')
        .eq('student_id', profile.studentDoc.id);

      if (!aErr && apps) {
        setApprovedEvents(apps.flatMap(app => app.event_proposals || []));
      }

      // 2. Fetch Active Venues from lookup table
      const { data: vData, error: vErr } = await supabase
        .from('venues')
        .select('name')
        .eq('is_active', true)
        .order('name');
      
      if (!vErr && vData) {
        setVenues(vData.map(v => v.name));
      }
    };

    fetchData();
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'venue_booking',
          student_id: profile.studentDoc.id,
          email: profile.email,
          ...formData
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      toast.success('Venue Booking submitted successfully!');
      navigate('/student');

    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to submit venue booking.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({...formData, [e.target.name]: value});
  };

  return (
    <motion.div initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} exit={{opacity:0, y:-20}} className="min-h-screen p-6 md:p-10 flex justify-center transition-colors">
      <div className="max-w-4xl w-full">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Venue Booking</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Request collegiate spaces for an Approved Event.</p>
        </header>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 premium-shadow space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                <span>Select Approved Event</span> <Calendar size={16} className="text-slate-400"/>
              </label>
              <select required name="event_proposal_id" value={formData.event_proposal_id} onChange={handleChange} className="input-field">
                <option value="">-- Choose an Event --</option>
                {approvedEvents.map(evt => (
                  <option key={evt.id} value={evt.id}>{evt.event_name} - {evt.venue}</option>
                ))}
              </select>
              {approvedEvents.length === 0 && <p className="text-xs text-red-500 mt-2">You must have a fully Approved Event Proposal first.</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                <span>Venue Requested</span> <Map size={16} className="text-slate-400"/>
              </label>
              <select 
                required 
                name="venue" 
                value={formData.venue} 
                onChange={handleChange} 
                className="input-field"
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
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
              <input required type="date" name="day_date" value={formData.day_date} onChange={handleChange} className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Start Time</label>
              <input required type="time" name="start_time" value={formData.start_time} onChange={handleChange} className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">End Time</label>
              <input required type="time" name="end_time" value={formData.end_time} onChange={handleChange} className="input-field" />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                <span>Total Expected Attendees</span> <Users size={16} className="text-slate-400"/>
              </label>
              <input required type="number" name="expected_attendees" value={formData.expected_attendees} onChange={handleChange} className="input-field" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-slate-500">Breakdown: Students</label>
              <input required type="number" name="attendees_students" value={formData.attendees_students} onChange={handleChange} className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-slate-500">Breakdown: Others</label>
              <input required type="number" name="attendees_others" value={formData.attendees_others} onChange={handleChange} className="input-field" />
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/50" />
          
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Venue Requirements</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['projector', 'backdrop', 'audio_recording', 'video_recording', 'live_streaming', 'photography', 'wifi', 'lamp_lighting', 'national_anthem'].map(req => (
               <label key={req} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium cursor-pointer transition-colors hover:text-brand-600 dark:hover:text-brand-400">
                 <input type="checkbox" name={req} checked={formData[req]} onChange={handleChange} className="w-4 h-4 text-brand-600 border-slate-300 dark:border-slate-600 rounded focus:ring-brand-500" />
                 {req.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
               </label>
            ))}
          </div>

          <div className="pt-6 flex justify-end gap-4 border-t border-slate-100 dark:border-slate-800 mt-8">
             <button type="button" onClick={() => navigate('/student')} className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
             <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} type="submit" disabled={loading || approvedEvents.length === 0} className="btn-primary text-md h-12 flex items-center justify-center gap-2 min-w-[150px]">
                {loading ? <><Loader2 className="animate-spin" size={18}/> Submitting...</> : <><Send size={18}/> Request Venue</>}
             </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
