import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopbar from '../../components/admin/AdminTopbar';
import {
  getAdminDashboard,
  getHRUsers,
  getSecurityUsers,
  createSecurityUser,
  deactivateUser,
} from '../../utils/adminService';
import { getUser } from '../../utils/auth';
import '../../styles/admin/AdminDashboard.css';

/* ── Stat card ─────────────────────────────────────────── */
const StatCard = ({ label, value, icon, bg, color, sub, delay }) => (
  <div className="adm-stat-card" style={{ animationDelay: delay }}>
    <div className="adm-stat-card__top">
      <span className="adm-stat-card__label">{label}</span>
      <div className="adm-stat-card__icon" style={{ background: bg }}>
        <span>{icon}</span>
      </div>
    </div>
    <div className="adm-stat-card__value" style={{ color }}>{value ?? '—'}</div>
    {sub && <div className="adm-stat-card__sub">{sub}</div>}
  </div>
);

/* ── Create Security User Modal ─────────────────────────── */
const CreateSecurityModal = ({ onClose, onCreate }) => {
  const [form, setForm]     = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      setErr('All fields are required.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      await onCreate(form);
      onClose();
    } catch (e) {
      setErr(e.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal__head">
          <span className="adm-modal__title">🛡️ Create Security User</span>
          <button className="adm-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="adm-modal__body">
          {err && (
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', fontWeight: 600 }}>
              ❌ {err}
            </div>
          )}
          <div className="adm-form-group">
            <label>Full Name</label>
            <input
              placeholder="e.g. Ravi Kumar"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="adm-form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="ravi@metrix.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="adm-form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>
        </div>
        <div className="adm-modal__footer">
          <button className="adm-btn adm-btn--outline" onClick={onClose}>Cancel</button>
          <button className="adm-btn adm-btn--primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Admin Dashboard ────────────────────────────────────── */
const AdminDashboardPage = () => {
  const navigate  = useNavigate();
  const user      = getUser();
  const firstName = user?.name?.split(' ')[0] || 'Admin';

  const [stats,         setStats]       = useState(null);
  const [hrUsers,       setHRUsers]     = useState([]);
  const [secUsers,      setSecUsers]    = useState([]);
  const [loading,       setLoading]     = useState(true);
  const [showCreate,    setShowCreate]  = useState(false);
  const [search,        setSearch]      = useState('');
  const [deactivating,  setDeactivating] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, hr, sec] = await Promise.all([
        getAdminDashboard(),
        getHRUsers(),
        getSecurityUsers(),
      ]);
      setStats(s);
      setHRUsers(hr || []);
      setSecUsers(sec || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreateSecurity = async (data) => {
    await createSecurityUser(data);
    await load();
  };

  const handleDeactivate = async (id, role) => {
    setDeactivating(id);
    try {
      await deactivateUser(id, role);
      await load();
    } finally { setDeactivating(null); }
  };

  const statCards = [
    { label: 'Total HR Users',       value: stats?.totalHRUsers,      icon: '👤', bg: '#e0f7f5', color: 'var(--teal-dark)', sub: 'Active HR staff',         delay: '0.05s' },
    { label: 'Security Users',       value: stats?.totalSecurityUsers, icon: '🛡️', bg: '#eff6ff',   color: 'var(--info)',      sub: 'Security personnel',     delay: '0.10s' },
    { label: 'Total Visitors',       value: stats?.totalVisitors,      icon: '👥', bg: '#fffbeb',   color: 'var(--warning)',  sub: 'All time',                delay: '0.15s' },
    { label: 'System Health',        value: stats?.systemHealth ?? '100%', icon: '⚡', bg: '#f0fdf4', color: 'var(--success)',  sub: 'All services running',   delay: '0.20s' },
  ];

  const filteredHR  = hrUsers.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredSec = secUsers.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const initials = (name) =>
    name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  const fmt = (iso) => iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="adm-layout">
      <AdminSidebar />

      <div className="adm-main">
        <AdminTopbar
          title={`Admin Panel — ${firstName}`}
          breadcrumb="Admin / Dashboard"
          onSearch={setSearch}
        />

        <div className="adm-page-content">

          {/* ── Stat cards ──────────────────────────────── */}
          <div className="adm-stats-grid">
            {statCards.map(c => (
              <StatCard key={c.label} {...c} value={loading ? '—' : c.value} />
            ))}
          </div>

          {/* ── Two col: HR Users + Security Users ──────── */}
          <div className="adm-two-col">

            {/* HR Users */}
            <div className="adm-card">
              <div className="adm-card__head">
                <span className="adm-card__title">👤 HR Users</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 700 }}>
                  {filteredHR.length} accounts
                </span>
              </div>
              {loading ? (
                <div className="adm-empty"><div>Loading...</div></div>
              ) : filteredHR.length === 0 ? (
                <div className="adm-empty">
                  <div className="adm-empty__icon">👤</div>
                  <div className="adm-empty__title">No HR users found</div>
                </div>
              ) : (
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHR.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div className="adm-user-cell">
                            <div className="adm-user-avatar" style={{ background: 'var(--teal)' }}>
                              {initials(u.name)}
                            </div>
                            <div>
                              <div className="adm-user-name">{u.name}</div>
                              <div className="adm-user-email">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`adm-badge ${u.isActive ? 'adm-badge--active' : 'adm-badge--inactive'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{fmt(u.createdAt)}</td>
                        <td>
                          {u.isActive && (
                            <button
                              className="adm-btn adm-btn--danger adm-btn--sm"
                              onClick={() => handleDeactivate(u.id, 'hr')}
                              disabled={deactivating === u.id}
                            >
                              {deactivating === u.id ? '...' : 'Deactivate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Security Users */}
            <div className="adm-card">
              <div className="adm-card__head">
                <span className="adm-card__title">🛡️ Security Users</span>
                <button
                  className="adm-btn adm-btn--primary adm-btn--sm"
                  onClick={() => setShowCreate(true)}
                >
                  + Add Security
                </button>
              </div>
              {loading ? (
                <div className="adm-empty"><div>Loading...</div></div>
              ) : filteredSec.length === 0 ? (
                <div className="adm-empty">
                  <div className="adm-empty__icon">🛡️</div>
                  <div className="adm-empty__title">No security users yet</div>
                  <div>Click + Add Security to create one</div>
                </div>
              ) : (
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSec.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div className="adm-user-cell">
                            <div className="adm-user-avatar" style={{ background: 'var(--info)' }}>
                              {initials(u.name)}
                            </div>
                            <div>
                              <div className="adm-user-name">{u.name}</div>
                              <div className="adm-user-email">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`adm-badge ${u.isActive ? 'adm-badge--active' : 'adm-badge--inactive'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{fmt(u.createdAt)}</td>
                        <td>
                          {u.isActive && (
                            <button
                              className="adm-btn adm-btn--danger adm-btn--sm"
                              onClick={() => handleDeactivate(u.id, 'security')}
                              disabled={deactivating === u.id}
                            >
                              {deactivating === u.id ? '...' : 'Deactivate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── Quick actions ────────────────────────────── */}
          <div className="adm-card" style={{ background: 'linear-gradient(135deg, #fff5f5, #fff9f0)' }}>
            <div className="adm-card__head" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <span className="adm-card__title">⚡ Quick Actions</span>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="adm-btn adm-btn--primary" onClick={() => setShowCreate(true)}>
                🛡️ Create Security User
              </button>
              <button className="adm-btn adm-btn--teal" onClick={() => navigate('/admin/visitors')}>
                👥 View All Visitors
              </button>
              <button className="adm-btn adm-btn--outline" onClick={() => navigate('/admin/reports')}>
                📈 View Reports
              </button>
            </div>
          </div>

        </div>
      </div>

      {showCreate && (
        <CreateSecurityModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateSecurity}
        />
      )}
    </div>
  );
};

export default AdminDashboardPage;
