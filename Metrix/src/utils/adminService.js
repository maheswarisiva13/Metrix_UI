// src/utils/adminService.js

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

export const getAdminDashboard  = ()           => get('/admin/dashboard');

export const getSecurityUsers   = ()           => get('/admin/security-users');
export const getAllVisitors      = ()           => get('/admin/visitors');
export const getSystemActivity  = ()           => get('/admin/activity');
export const createSecurityUser = (data)       => post('/admin/security-users', data);
export const deactivateUser     = (id, role)   => post(`/admin/${role}-users/${id}/deactivate`);