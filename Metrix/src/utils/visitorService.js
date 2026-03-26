// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/utils/visitorService.js   
// Public API — no JWT. Token from URL identifies the visitor.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_URL || '/api';

const request = async (endpoint, options = {}) => {
  const response = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });

  let body = null;
  if (response.headers.get('content-type')?.includes('application/json'))
    body = await response.json();

  if (!response.ok)
    throw new Error(body?.message || body?.title || `Error ${response.status}`);

  return body;
};

/**
 * GET /api/visitor/invite?token=XYZ
 * Returns: { visitorName, visitorEmail, purpose, visitDate, hrName, status }
 * Called when the page loads to validate the token and pre-fill the form.
 */
export const getInviteDetails = (token) =>
  request(`/visitor/invite?token=${encodeURIComponent(token)}`);

/**
 * POST /api/visitor/register
 * Body: { token, name, email, phone, idProofType, idProofNumber }
 * Returns: { success, message, visitorName }
 * After this call: Visitor row is in DB, HR gets email notification.
 */
export const registerVisitor = (data) =>
  request('/visitor/register', { method: 'POST', body: JSON.stringify(data) });