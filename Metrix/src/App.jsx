// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/App.jsx   (REPLACE EXISTING)
// Change: /register now loads VisitorRegistrationPage instead of Placeholder
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Auth
import LoginPage from './pages/LoginPage';

// HR pages
import HRDashboardPage      from './pages/hr/HRDashboardPage';
import SendInvitationPage   from './pages/hr/SendInvitationPage';
import PendingApprovalsPage from './pages/hr/PendingApprovalsPage';
import HRAllVisitorsPage      from './pages/hr/AllVisitorsPage';

// Security pages
import SecurityDashboardPage from './pages/security/SecurityDashboardPage';
import CheckInPage          from './pages/security/CheckInPage';
import InsideNowPage         from './pages/security/InsideNowPage';
import TodayLogPage          from './pages/security/TodayLogPage';
import SecurityAllVisitorsPage  from './pages/security/AllVisitorsPage';

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

// Public visitor registration
import VisitorRegistrationPage from './pages/visitor/VisitorRegistrationPage';

import { isLoggedIn, getUser } from './utils/auth';

/* ── Role guard ───────────────────────────────────────────── */
const Guard = ({ role, children }) => {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  const user = getUser();
  if (role && user?.role?.toLowerCase() !== role)
    return <Navigate to="/login" replace />;
  return children;
};

/* ── Post-login redirect by role ──────────────────────────── */
const RoleRedirect = () => {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  const role = getUser()?.role?.toLowerCase();
  if (role === 'hr')       return <Navigate to="/hr/dashboard"       replace />;
  if (role === 'security') return <Navigate to="/security/dashboard" replace />;
  if (role === 'admin')    return <Navigate to="/admin/dashboard"    replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"      element={<RoleRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        {/* ── HR ─────────────────────────────────────── */}
        <Route path="/hr/dashboard" element={<Guard role="hr"><HRDashboardPage /></Guard>} />
        <Route path="/hr/invite"    element={<Guard role="hr"><SendInvitationPage /></Guard>} />
        <Route path="/hr/pending"   element={<Guard role="hr"><PendingApprovalsPage /></Guard>} />
        <Route path="/hr/visitors"  element={<Guard role="hr"><HRAllVisitorsPage /></Guard>} />

        {/* ── Security ───────────────────────────────── */}
        <Route path="/security/dashboard"
          element={<Guard role="security"><SecurityDashboardPage /></Guard>} />
        <Route path="/security/check-in"
          element={<Guard role="security"><CheckInPage /></Guard>} />
        <Route path="/security/inside"
          element={<Guard role="security"><InsideNowPage /></Guard>} />
        <Route path="/security/logs"
          element={<Guard role="security"><TodayLogPage /></Guard>} />
        <Route path="/security/visitors"
          element={<Guard role="security"><SecurityAllVisitorsPage /></Guard>} />

        {/* ── Admin ──────────────────────────────────── */}
        <Route path="/admin/dashboard"
          element={<Guard role="admin"><AdminDashboardPage /></Guard>} />

        {/* ── PUBLIC: Visitor self-registration ─────── */}
        {/* No guard — anyone with the link can access   */}
        <Route path="/register" element={<VisitorRegistrationPage />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;