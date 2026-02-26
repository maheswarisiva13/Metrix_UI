/**
 * Metrix API Route constants
 * Mirrors: Metrix.API.Constants.ApiRoutes
 */

const BASE = '/api';

export const ApiRoutes = {
  Setup: {
    CreateAdmin: `${BASE}/setup/create-admin`,
  },
  Admin: {
    CreateSecurity: `${BASE}/admin/create-security`,
  },
  Hr: {
    Root: `${BASE}/hr`,
    ById: (id) => `${BASE}/hr/${id}`,
  },
  Security: {
    Root: `${BASE}/security`,
    ById: (id) => `${BASE}/security/${id}`,
  },
  Auth: {
    Login: `${BASE}/auth/login`,
  },
  Visitor: {
    Root: `${BASE}/visitor`,
  },
  Invitation: {
    Root: `${BASE}/invitations`,
    Send: `${BASE}/invitations/send`,
  },
};

export default ApiRoutes;