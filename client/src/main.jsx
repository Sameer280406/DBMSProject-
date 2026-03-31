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
import VenueBookingForm from './pages/forms/VenueBookingForm';
import PermissionLetterForm from './pages/forms/PermissionLetterForm';
import ApplicationDetail from './pages/ApplicationDetail';

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
          profile?.role === 'admin' 
            ? <Navigate to="/admin" /> 
            : <Navigate to="/student" />
        ) : <Login />
      } />
      
      <Route path="/student" element={
        <ProtectedRoute role="student">
          <StudentDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/student/event-proposal" element={
        <ProtectedRoute role="student">
          <EventProposalForm />
        </ProtectedRoute>
      } />

      <Route path="/student/venue-booking" element={
        <ProtectedRoute role="student">
          <VenueBookingForm />
        </ProtectedRoute>
      } />

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
