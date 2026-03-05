/* ── Auth Utilities — Metrix VMS ──────────────────────────── */

const TOKEN_KEY = 'metrix_token';
const USER_KEY  = 'metrix_user';

/* ── Core session helpers ───────────────────────────────── */

/**
 * Store auth token and user object after login.
 * @param {string} token - JWT or session token
 * @param {{ id: string, name: string, email: string, role: string }} user
 */
export const login = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/** Alias for login() — used by LoginPage */
export const saveSession = login;

/**
 * Remove auth data from storage.
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/** Alias for logout() — used by SecuritySidebar */
export const clearSession = logout;

/* ── Read helpers ───────────────────────────────────────── */

/**
 * Returns the stored auth token, or null.
 * @returns {string | null}
 */
export const getToken = () => localStorage.getItem(TOKEN_KEY) || null;

/**
 * Returns true if a valid token exists in storage.
 * @returns {boolean}
 */
export const isLoggedIn = () => Boolean(getToken());

/**
 * Returns the stored user object, or null if not logged in.
 * @returns {{ id: string, name: string, email: string, role: string } | null}
 */
export const getUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/* ── Request helper ─────────────────────────────────────── */

/**
 * Returns an Authorization header object for fetch / axios.
 * @returns {{ Authorization: string } | {}}
 */
export const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/* ── Route helper ───────────────────────────────────────── */

/**
 * Map a role string to its dashboard path.
 * @param {string} role
 * @returns {string}
 */
export const dashboardPath = (role) => {
  switch (role?.toLowerCase()) {
    case 'admin':    return '/admin/dashboard';
    case 'hr':       return '/hr/dashboard';
    case 'security': return '/security/dashboard';
    default:         return '/login';
  }
};