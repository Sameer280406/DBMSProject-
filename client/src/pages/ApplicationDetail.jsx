import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import { useAuth } from '../context/AuthContext';
import SignatureCanvas from '../components/SignatureCanvas';
import { ArrowLeft, CheckCircle, XCircle, CornerUpLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function ApplicationDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionRemark, setActionRemark] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [signatures, setSignatures] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select(`
          *,
          students(roll_no, committee_name, year_of_study, designation, profiles(name, email)),
          event_proposals(*),
          venue_bookings(*),
          permission_letters(*),
          desks(name, order_index)
        `)
        .eq('id', id)
        .single();
        
      if (appError) throw appError;
      setApp(appData);

      const { data: logData } = await supabase
        .from('approval_log')
        .select('*, desks(name), profiles(name)')
        .eq('application_id', id)
        .order('acted_at', { ascending: true });
        
      setLogs(logData || []);

      // Fetch signed URLs for any digital signatures
      if (logData) {
        let sigUrls = {};
        for (let log of logData) {
          if (log.digital_signature) {
             const { data: urlData } = await supabase.storage.from('signatures').createSignedUrl(log.digital_signature, 3600);
             if (urlData) sigUrls[log.id] = urlData.signedUrl;
          }
        }
        setSignatures(sigUrls);
      }

    } catch (err) {
      console.error(err);
      toast.error('Error loading application details');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionType, signaturePath = null) => {
    if ((actionType === 'rejected' || actionType === 'returned') && !actionRemark.trim()) {
      return toast.error('You must provide a remark or feedback for this action.');
    }
    
    if (actionType === 'approved' && !signaturePath) {
      return toast.error('You must save your signature first to approve.');
    }

    setIsProcessing(true);
    try {
      const res = await fetch('http://localhost:3000/api/desk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: app.id,
          action: actionType,
          remark: actionRemark,
          digital_signature: signaturePath,
          admin_user_id: profile.id
        })
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      
      toast.success(`Application successfully ${actionType}!`);
      navigate('/admin');

    } catch (err) {
      console.error(err);
      toast.error(err.message);
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Application Document...</div>;
  if (!app) return <div className="p-10 text-center text-red-500">Application not found.</div>;

  const isAdmin = profile.role === 'admin';
  const isMyDesk = isAdmin && app.current_desk_id === profile?.desk?.id && ['pending', 'under_review'].includes(app.status);
  
  // Extract specific details based on type
  const details = app.event_proposals?.[0] || app.venue_bookings?.[0] || app.permission_letters?.[0];

  return (
    <motion.div initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} exit={{opacity:0, y:20}} className="min-h-screen p-6 md:p-10 flex justify-center pb-24 transition-colors">
      <div className="max-w-4xl w-full">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-brand-600 dark:text-brand-400 font-semibold hover:text-brand-800 dark:hover:text-brand-300 transition">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="glass-card rounded-2xl p-8 premium-shadow">
          <header className="flex justify-between items-start mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight capitalize">{app.type.replace('_', ' ')}</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Application Reference: <span className="font-mono text-slate-700 dark:text-slate-300">{app.id}</span></p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-bold border capitalize ${
              app.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
              app.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
              app.status === 'expired' ? 'bg-slate-100 text-slate-700 border-slate-200' :
              'bg-blue-100 text-blue-700 border-blue-200'
            }`}>
              Status: {app.status.replace('_', ' ')}
            </div>
          </header>

          <section className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 bg-slate-100 dark:bg-slate-800/50 px-4 py-2 rounded-lg">Applicant Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-2 items-center">
              <div><p className="text-xs text-slate-400 font-bold uppercase">Name</p><p className="font-medium text-slate-700 dark:text-slate-300">{app.students.profiles.name}</p></div>
              <div><p className="text-xs text-slate-400 font-bold uppercase">Roll No</p><p className="font-medium text-slate-700 dark:text-slate-300">{app.students.roll_no}</p></div>
              <div><p className="text-xs text-slate-400 font-bold uppercase">Year</p><p className="font-medium text-slate-700 dark:text-slate-300">{app.students.year_of_study}</p></div>
              <div><p className="text-xs text-slate-400 font-bold uppercase">Committee</p><p className="font-medium text-slate-700 dark:text-slate-300">{app.students.committee_name || 'N/A'}</p></div>
              <div>
                 <p className="text-xs text-slate-400 font-bold uppercase mb-1">Designation</p>
                 <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 w-max">{app.students.designation || 'Student'}</span>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 bg-slate-100 dark:bg-slate-800/50 px-4 py-2 rounded-lg">Document Parameters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 px-2">
               {details && Object.keys(details).filter(k => !['id', 'application_id'].includes(k)).map(key => (
                 <div key={key}>
                    <p className="text-xs text-slate-400 font-bold uppercase">{key.replace(/_/g, ' ')}</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">
                      {typeof details[key] === 'boolean' ? (details[key] ? 'Yes Requirements' : 'No') : details[key]?.toString() || '—'}
                    </p>
                 </div>
               ))}
            </div>
          </section>

          {/* Audit Trail & Signatures */}
          {logs.length > 0 && (
            <section className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
               <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Approval Audit Trail & Signatures</h2>
               <div className="space-y-6">
                 {logs.map((log, i) => (
                    <div key={log.id} className="relative pl-6 border-l-2 border-brand-200 dark:border-brand-800">
                        <div className="absolute -left-2 top-0.5 w-3 h-3 rounded-full bg-brand-500 ring-4 ring-brand-50 dark:ring-brand-900"></div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {log.desks?.name || 'System Action'} 
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full capitalize ${
                            log.action === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                            log.action === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                             {log.action} by {log.profiles?.name}
                          </span>
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(log.acted_at).toLocaleString()}</p>
                        
                        {log.remark && (
                          <div className="mt-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 italic">
                             "{log.remark}"
                          </div>
                        )}

                        {signatures[log.id] && (
                          <div className="mt-4 border border-slate-200 rounded-lg p-2 bg-white inline-block">
                            <p className="text-xs text-slate-400 font-bold text-center mb-2 uppercase tracking-wide">Digital Signature Recorded</p>
                            <img src={signatures[log.id]} alt="Signature" className="h-20 object-contain mx-auto mix-blend-multiply" />
                          </div>
                        )}
                    </div>
                 ))}
               </div>
            </section>
          )}

          {/* Action Pad for Currently Assigned Admin */}
          {isMyDesk && (
            <div className="mt-12 pt-8 border-t-2 border-dashed border-brand-200 dark:border-brand-800">
               <h2 className="text-xl font-bold text-brand-700 dark:text-brand-400 mb-2">Authority Action Required</h2>
               <p className="text-sm text-brand-600/80 dark:text-brand-400/80 mb-6 font-medium">This application is currently sitting at your Desk. Please review all details before acting.</p>
               
               <div className="mb-6">
                 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Administrative Remark / Feedback</label>
                 <textarea 
                   rows="2" 
                   value={actionRemark} 
                   onChange={e => setActionRemark(e.target.value)} 
                   className="input-field" 
                   placeholder="(Required for Returns & Rejections. Optional for Approvals)"
                 />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                   <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><CheckCircle className="text-green-500" size={18}/> Approvals</h3>
                   <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">By explicitly signing below, you electronically approve the constraints of this application and agree to forward it to the next desk in the sequence.</p>
                   
                   {/* Digital Signature Component */}
                   <SignatureCanvas 
                     applicationId={app.id} 
                     deskId={profile.desk.id} 
                     onSignatureSaved={(path) => handleAction('approved', path)} 
                   />
                 </div>

                 <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                   <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><XCircle className="text-red-500" size={18}/> Denials / Revisions</h3>
                   <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">If the application violates policies or needs amending, explicitly bounce it back to the student.</p>
                   
                   <div className="space-y-3">
                     <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={() => handleAction('returned')} disabled={isProcessing} className="w-full btn-primary bg-orange-500 hover:bg-orange-600 focus:ring-orange-100 flex justify-center items-center gap-2">
                        <CornerUpLeft size={16}/> Return for Revision
                     </motion.button>
                     <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={() => handleAction('rejected')} disabled={isProcessing} className="w-full btn-primary bg-slate-800 dark:bg-slate-950 hover:bg-slate-900 focus:ring-slate-200 flex justify-center items-center gap-2">
                        <XCircle size={16}/> Flat Reject Document
                     </motion.button>
                   </div>
                 </div>
               </div>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}
