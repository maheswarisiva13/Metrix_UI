/* ── Admin Service — Metrix VMS ───────────────────────────── */

import { authHeader } from './auth';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/** Generic fetch helper */
const request = async (method, path, body) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }

  return res.json();
};

/* ── Dashboard ──────────────────────────────────────────── */

/**
 * Fetch admin dashboard summary stats.
 * @returns {{ totalHRUsers: number, totalSecurityUsers: number, totalVisitors: number, systemHealth: string }}
 */
export const getAdminDashboard = () => request('GET', '/admin/dashboard');

/* ── HR Users ───────────────────────────────────────────── */

/**
 * Fetch all HR user accounts.
 * @returns {Array<{ id: string, name: string, email: string, isActive: boolean, createdAt: string }>}
 */
export const getHRUsers = () => request('GET', '/admin/users/hr');

/* ── Security Users ─────────────────────────────────────── */

/**
 * Fetch all Security user accounts.
 * @returns {Array<{ id: string, name: string, email: string, isActive: boolean, createdAt: string }>}
 */
export const getSecurityUsers = () => request('GET', '/admin/users/security');

/**
 * Create a new Security user.
 * @param {{ name: string, email: string, password: string }} data
 * @returns {{ id: string, name: string, email: string, role: string, isActive: boolean, createdAt: string }}
 */
export const createSecurityUser = (data) => request('POST', '/admin/users/security', data);

/* ── User Management ────────────────────────────────────── */

/**
 * Deactivate a user by ID and role.
 * @param {string} id   - User ID
 * @param {'hr' | 'security'} role
 * @returns {{ success: boolean }}
 */
export const deactivateUser = (id, role) =>
  request('PATCH', `/admin/users/${id}/deactivate`, { role });

/**
 * Reactivate a previously deactivated user.
 * @param {string} id
 * @param {'hr' | 'security'} role
 * @returns {{ success: boolean }}
 */
export const reactivateUser = (id, role) =>
  request('PATCH', `/admin/users/${id}/reactivate`, { role });