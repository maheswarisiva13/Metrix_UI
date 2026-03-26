/**
 * hrService.js
 *
 * Vite proxies /api → https://localhost:7275 (configured in vite.config.js)
 * So fetch('/api/...') in dev automatically hits our .NET backend.
 */

import { getToken, clearSession } from './auth';

const BASE = import.meta.env.VITE_API_URL || '/api';

/* ─────────────────────────────────────────────────────────
   INTERNAL HELPERS
   ───────────────────────────────────────────────────────── */

const authHeaders = () => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const request = async (endpoint, options = {}) => {
  const url = `${BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    clearSession();
    window.location.href = '/login';
    return;
  }

  let body = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await response.json();
  }

  if (!response.ok) {
    const message =
      body?.message ||
      body?.title  ||
      body?.error  ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body;
};

const get  = (endpoint)       => request(endpoint, { method: 'GET' });
const post = (endpoint, data) => request(endpoint, { method: 'POST', body: JSON.stringify(data) });

/* ─────────────────────────────────────────────────────────
   HR SERVICE METHODS
   ───────────────────────────────────────────────────────── */

export const getDashboardStats  = ()   => get('/hr/dashboard');
export const getRecentActivity  = ()   => get('/hr/visitors/recent');
export const getVisitors        = ()   => get('/hr/visitors');
export const getPendingVisitors = ()   => get('/hr/visitors/pending');
export const approveVisitor     = (id) => post(`/hr/visitors/${id}/approve`);
export const rejectVisitor      = (id) => post(`/hr/visitors/${id}/reject`);
export const getInvitations     = ()   => get('/invitations');

/**
 * POST /api/invitations/send
 * hrId is NOT sent in the body — backend reads it from the JWT(JSON Web Token) token...
 */
export const sendInvitation = (data) =>
  post('/invitations/send', {
    visitorName:  data.visitorName,
    visitorEmail: data.visitorEmail,
    purpose:      data.purpose,
    visitDate:    data.visitDate

  });
  export const registerHr = (data) =>
  post('/hr', { 
    name: data.name,
    email: data.email,
    password: data.password
  });