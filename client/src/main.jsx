import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import './index.css';

import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import EventProposalForm from './pages/forms/EventProposalForm';
import EditProposal from './pages/EditProposal';
import EditVenueBooking from './pages/EditVenueBooking';
import EditPermissionLetter from './pages/EditPermissionLetter';
import VenueBookingForm from './pages/forms/VenueBookingForm';
import PermissionLetterForm from './pages/forms/PermissionLetterForm';
import ApplicationDetail from './pages/ApplicationDetail';
import ITDashboard from './pages/ITDashboard';

const ProtectedRoute = ({ children, role }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user || (role && profile?.role !== role)) return <Navigate to="/" />;

  return children;
};

const AppRoutes = () => {
  const { user, profile } = useAuth();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
        user ? (
          !profile ? (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
               <div className="text-center p-8 glass-card rounded-2xl premium-shadow max-w-sm">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Session Syncing...</h2>
                  <p className="text-slate-500 mb-6 text-sm">We are recovering your pipeline permissions. If this takes too long, your account might have been refreshed by an administrator.</p>
                  <div className="flex gap-3 justify-center">
                      <button onClick={() => window.location.reload()} className="btn-primary flex-1 py-2">Reload</button>
                      <button onClick={async () => {
                          const { supabase } = await import('./config/supabaseClient');
                          await supabase.auth.signOut();
                          window.location.reload();
                      }} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors">Sign Out</button>
                  </div>
               </div>
             </div>
            ) : profile.role === 'admin' 
            ? <Navigate to="/admin" replace /> 
            : profile.role === 'it_support'
            ? <Navigate to="/it-support" replace />
            : <Navigate to="/student" replace />
        ) : <Login />
      } />
      
      <Route path="/student" element={
        <ProtectedRoute role="student">
          <StudentDashboard />
        </ProtectedRoute>
      } />
        <Route path="/student/new-proposal" element={<ProtectedRoute role="student"><EventProposalForm /></ProtectedRoute>} />
        <Route path="/student/event-proposal" element={<ProtectedRoute role="student"><EventProposalForm /></ProtectedRoute>} />
        <Route path="/edit-proposal/:id" element={<ProtectedRoute role="student"><EditProposal /></ProtectedRoute>} />
        <Route path="/edit-venue-booking/:id" element={<ProtectedRoute role="student"><EditVenueBooking /></ProtectedRoute>} />
        <Route path="/edit-permission-letter/:id" element={<ProtectedRoute role="student"><EditPermissionLetter /></ProtectedRoute>} />
        <Route path="/student/book-venue" element={<ProtectedRoute role="student"><VenueBookingForm /></ProtectedRoute>} />
        <Route path="/student/venue-booking" element={<ProtectedRoute role="student"><VenueBookingForm /></ProtectedRoute>} />

      <Route path="/student/permission-letter" element={
        <ProtectedRoute role="student">
          <PermissionLetterForm />
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute role="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/it-support" element={
        <ProtectedRoute role="it_support">
          <ITDashboard />
        </ProtectedRoute>
      } />

      <Route path="/student/view/:id" element={
        <ProtectedRoute role="student">
          <ApplicationDetail />
        </ProtectedRoute>
      } />

        <Route path="/admin/view/:id" element={
          <ProtectedRoute role="admin">
            <ApplicationDetail />
          </ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-center" toastOptions={{
             style: { background: '#1e293b', color: '#fff', borderRadius: '12px' }
          }}/>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
