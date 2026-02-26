/**
 * auth.js — token & role helpers
 */

export const TOKEN_KEY = 'metrix_token';
export const USER_KEY  = 'metrix_user';

export const saveSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

export const isLoggedIn = () => !!getToken();

/** Map role string → dashboard path */
export const dashboardPath = (role) => {
  switch (role?.toLowerCase()) {
    case 'admin':    return '/admin/dashboard';
    case 'hr':       return '/hr/dashboard';
    case 'security': return '/security/check';
    default:         return '/login';
  }
};