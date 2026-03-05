// src/utils/securityService.js

import { getToken, clearSession } from './auth';

const BASE = import.meta.env.VITE_API_URL || '/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

const request = async (endpoint, options = {}) => {
  const response = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (response.status === 401) { clearSession(); window.location.href = '/login'; return; }
  let body = null;
  if (response.headers.get('content-type')?.includes('application/json')) body = await response.json();
  if (!response.ok) throw new Error(body?.message || body?.title || `Error ${response.status}`);
  return body;
};

const get  = (ep)       => request(ep, { method: 'GET' });
const post = (ep, data) => request(ep, { method: 'POST', body: JSON.stringify(data) });

export const getSecurityDashboard = () => get('/security/dashboard');
export const getTodayVisitors     = () => get('/security/visitors/today');
export const getCheckedInVisitors = () => get('/security/visitors/checked-in');
export const getAllVisitors        = () => get('/security/visitors/all');
export const getTodayVisitLogs    = () => get('/security/logs/today');
export const lookupVisitor        = (regId) => get(`/security/visitor/lookup?registrationId=${encodeURIComponent(regId)}`);
export const checkInVisitor       = (id) => post(`/security/visitor/${id}/check-in`);
export const checkOutVisitor      = (id) => post(`/security/visitor/${id}/check-out`);