import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';

/**
 * App — root router
 *
 * Add your protected dashboard routes below as you build them.
 * Example:
 *   <Route path="/hr/dashboard"       element={<ProtectedRoute role="hr"><HRDashboard /></ProtectedRoute>} />
 *   <Route path="/admin/dashboard"    element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
 *   <Route path="/security/check"     element={<ProtectedRoute role="security"><SecurityCheck /></ProtectedRoute>} />
 */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default → Login */}
        <Route path="/"      element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Placeholder dashboard routes — replace with real pages */}
        <Route path="/hr/dashboard"      element={<Placeholder title="HR Dashboard"       color="#f5e6e0" />} />
        <Route path="/admin/dashboard"   element={<Placeholder title="Admin Dashboard"    color="#fdecea" />} />
        <Route path="/security/check"    element={<Placeholder title="Security Check-In"  color="#e0f7f5" />} />

        {/* Visitor registration via invite link */}
        <Route path="/register" element={<Placeholder title="Visitor Registration" color="#fff" />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

/** Temporary placeholder for unbuilt pages */
const Placeholder = ({ title, color }) => (
  <div style={{
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: color, fontFamily: 'Nunito, sans-serif', gap: 16,
  }}>
    <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#1a2130' }}>{title}</h1>
    <p style={{ color: '#6b7a94' }}>Page under construction.</p>
    <a href="/login" style={{ color: '#4ecdc4', fontWeight: 700, textDecoration: 'underline' }}>
      ← Back to Login
    </a>
  </div>
);

export default App;