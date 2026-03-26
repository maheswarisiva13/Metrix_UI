import React, { useState, useEffect, useCallback } from 'react';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopbar  from '../../components/admin/AdminTopbar';
import { getSecurityUsers, createSecurityUser, deactivateUser } from '../../utils/adminService';
import '../../styles/admin/AdminDashboard.css';

const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

/* ── Create Modal ─────────────────────────────────────────── */
const CreateModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [show, setShow] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setErr('All fields are required.'); return;
    }
    if (form.password.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    setSaving(true); setErr('');
    try { await onCreate(form); onClose(); }
    catch (e) { setErr(e.message || 'Failed to create account.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal__head">
          <span className="adm-modal__title">🛡️ Create Security Account</span>
          <button className="adm-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="adm-modal__body">
          {err && <div className="adm-form-error">❌ {err}</div>}
          <div className="adm-form-group">
            <label>Full Name</label>
            <input placeholder="e.g. Ravi Kumar" value={form.name} onChange={set('name')} autoFocus />
          </div>
          <div className="adm-form-group">
            <label>Email Address</label>
            <input type="email" placeholder="ravi@metrix.com" value={form.email} onChange={set('email')} />
          </div>
          <div className="adm-form-group">
            <label>Password</label>
            <div style={{ position:'relative' }}>
              <input
                type={show ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={set('password')}
                style={{ paddingRight:42 }}
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'1rem', color:'var(--text-light)' }}
              >
             
                 {show ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div className="adm-form-hint">
            🛡️ This account will have access to the Security Portal — check-in / check-out visitors.
          </div>
        </div>
        <div className="adm-modal__footer">
          <button className="adm-btn adm-btn--outline" onClick={onClose}>Cancel</button>
          <button className="adm-btn adm-btn--primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creating…' : '🛡️ Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Confirm Deactivate Modal ─────────────────────────────── */
const ConfirmDeactivateModal = ({ user, onClose, onConfirm, loading }) => (
  <div className="adm-modal-overlay" onClick={onClose}>
    <div className="adm-modal adm-modal--sm" onClick={e => e.stopPropagation()}>
      <div className="adm-modal__head">
        <span className="adm-modal__title">⛔ Deactivate Account</span>
        <button className="adm-modal__close" onClick={onClose}>✕</button>
      </div>
      <div className="adm-modal__body">
        <div style={{ textAlign:'center', padding:'8px 0 16px' }}>
          <div style={{
            width:56, height:56, borderRadius:'50%',
            background:'var(--danger-bg)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px', fontSize:'1.6rem'
          }}>
            ⛔
          </div>
          <div style={{ fontFamily:'var(--font-heading)', fontSize:'1.05rem', fontWeight:800, color:'var(--text-dark)', marginBottom:8 }}>
            Deactivate {user.name}?
          </div>
          <div style={{ fontSize:'0.85rem', color:'var(--text-mid)', lineHeight:1.6 }}>
            This will revoke their access to the Security Portal.
            They will <strong>not be able to log in</strong> after this action.
          </div>
        </div>
      </div>
      <div className="adm-modal__footer">
        <button className="adm-btn adm-btn--outline" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button className="adm-btn adm-btn--danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deactivating…' : '⛔ Yes, Deactivate'}
        </button>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════ */
const SecurityUsersPage = () => {
  const [users,       setUsers]       = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [confirmUser, setConfirmUser] = useState(null);
  const [actionId,    setActionId]    = useState(null);
  const [toast,       setToast]       = useState(null);
  const [filter,      setFilter]      = useState('all');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = (await getSecurityUsers()) || [];
      setUsers(list);
      applyFilter('all', list, '');
    } finally { setLoading(false); }
  }, []); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const applyFilter = (f, source = users, q = '') => {
    setFilter(f);
    let res = source;
    if (f === 'active')   res = res.filter(u => u.isActive);
    if (f === 'inactive') res = res.filter(u => !u.isActive);
    if (q) {
      const lower = q.toLowerCase();
      res = res.filter(u =>
        u.name?.toLowerCase().includes(lower) ||
        u.email?.toLowerCase().includes(lower)
      );
    }
    setFiltered(res);
  };

  const handleSearch = (q) => applyFilter(filter, users, q);

  const handleCreate = async (data) => {
    await createSecurityUser(data);
    showToast(`✅ Security account created for ${data.name}`);
    await load();
  };

  const handleDeactivateClick = (user) => setConfirmUser(user);

  const handleDeactivateConfirm = async () => {
    if (!confirmUser) return;
    setActionId(confirmUser.id);
    try {
      await deactivateUser(confirmUser.id, 'security');
      showToast(`🚫 ${confirmUser.name}'s account has been deactivated.`);
      setConfirmUser(null);
      await load();
    } catch (e) {
      showToast(e.message || 'Action failed.', 'error');
    } finally { setActionId(null); }
  };

  const activeCount   = users.filter(u => u.isActive).length;
  const inactiveCount = users.filter(u => !u.isActive).length;

  return (
    <div className="adm-layout">
      <AdminSidebar />
      <div className="adm-main">
        <AdminTopbar title="Security Users" breadcrumb="Admin / Security Users" onSearch={handleSearch} />
        <div className="adm-page-content">

          {toast && <div className={`adm-toast adm-toast--${toast.type}`}>{toast.msg}</div>}

          {/* Page header */}
          <div className="adm-page-header">
            <div>
              <div className="adm-page-header__title">🛡️ Security User Management</div>
              <div className="adm-page-header__sub">Create and manage security staff accounts</div>
            </div>
            <button className="adm-btn adm-btn--primary" onClick={() => setShowCreate(true)}>
              + Create Security User
            </button>
          </div>

          {/* Mini stats */}
          <div className="adm-mini-stats">
            {[
              { label:'Total',    value:users.length,  icon:'🛡️', color:'var(--info)'       },
              { label:'Active',   value:activeCount,   icon:'✅', color:'var(--success)'    },
              { label:'Inactive', value:inactiveCount, icon:'⛔', color:'var(--text-light)' },
            ].map(s => (
              <div className="adm-mini-stat" key={s.label}>
                <span style={{ fontSize:'1.5rem' }}>{s.icon}</span>
                <div>
                  <div style={{ fontFamily:'var(--font-heading)', fontSize:'1.6rem', fontWeight:900, color:s.color, lineHeight:1 }}>
                    {loading ? '—' : s.value}
                  </div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-light)', fontWeight:700 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="adm-filter-tabs">
            {[
              { key:'all',      label:'All Users'   },
              { key:'active',   label:'✅ Active'   },
              { key:'inactive', label:'⛔ Inactive' },
            ].map(t => (
              <button
                key={t.key}
                className={`adm-filter-tab${filter === t.key ? ' adm-filter-tab--active' : ''}`}
                onClick={() => applyFilter(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Table card */}
          <div className="adm-card">
            <div className="adm-card__head">
              <span className="adm-card__title">
                Security Accounts
                {!loading && (
                  <span style={{ marginLeft:8, background:'var(--info-bg)', color:'var(--info)', fontSize:'0.72rem', fontWeight:800, padding:'2px 8px', borderRadius:20 }}>
                    {filtered.length}
                  </span>
                )}
              </span>
              <button style={{ fontSize:'0.78rem', color:'var(--coral)', fontWeight:700, background:'none', border:'none', cursor:'pointer' }} onClick={load}>
                ↻ Refresh
              </button>
            </div>

            {loading ? (
              <div className="adm-empty">
                <div className="adm-spin adm-spin--lg"/>
                <div style={{ marginTop:12 }}>Loading security users…</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="adm-empty">
                <div className="adm-empty__icon">🛡️</div>
                <div className="adm-empty__title">
                  {users.length === 0 ? 'No security users yet' : 'No users match your search'}
                </div>
                {users.length === 0 && (
                  <button className="adm-btn adm-btn--primary" style={{ marginTop:14 }} onClick={() => setShowCreate(true)}>
                    + Create First Security User
                  </button>
                )}
              </div>
            ) : (
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="adm-user-cell">
                          <div className="adm-user-avatar" style={{ background: u.isActive ? 'var(--info)' : '#cbd5e0' }}>
                            {initials(u.name)}
                          </div>
                          <div className="adm-user-name">{u.name}</div>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`adm-badge ${u.isActive ? 'adm-badge--active' : 'adm-badge--inactive'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{fmt(u.createdAt)}</td>
                      <td>
                        {u.isActive ? (
                          <button
                            className="adm-btn adm-btn--danger adm-btn--sm"
                            onClick={() => handleDeactivateClick(u)}
                            disabled={actionId === u.id}
                          >
                            {actionId === u.id ? '…' : 'Deactivate'}
                          </button>
                        ) : (
                          <span style={{ fontSize:'0.75rem', color:'var(--text-light)' }}>Inactive</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}

      {confirmUser && (
        <ConfirmDeactivateModal
          user={confirmUser}
          onClose={() => setConfirmUser(null)}
          onConfirm={handleDeactivateConfirm}
          loading={actionId === confirmUser?.id}
        />
      )}
    </div>
  );
};

export default SecurityUsersPage;