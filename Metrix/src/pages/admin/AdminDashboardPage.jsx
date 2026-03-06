// src/pages/admin/AdminDashboardPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopbar  from '../../components/admin/AdminTopbar';
import {
  getAdminDashboard,
  getSecurityUsers,
  getAllVisitors,
  createSecurityUser,
  deactivateUser,
} from '../../utils/adminService';
import { getUser } from '../../utils/auth';
import '../../styles/admin/AdminDashboard.css';

const initials = (n) => n?.split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase() || '?';
const fmtDate  = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN',{ day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtDT    = (iso) => iso ? new Date(iso).toLocaleString('en-IN',{ day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
const badge    = (s) => { const l=(s||'').toLowerCase(); return `adm-badge adm-badge--${l==='approved'?'approved':l==='pending'?'pending':l==='rejected'?'rejected':'inactive'}`; };

/* ── Stat Card ─────────── */
const StatCard = ({ label, value, icon, bg, color, sub, delay }) => (
  <div className="adm-stat-card" style={{ animationDelay: delay }}>
    <div className="adm-stat-card__top">
      <span className="adm-stat-card__label">{label}</span>
      <div className="adm-stat-card__icon" style={{ background: bg }}><span>{icon}</span></div>
    </div>
    <div className="adm-stat-card__value" style={{ color }}>{value ?? '—'}</div>
    {sub && <div className="adm-stat-card__sub">{sub}</div>}
  </div>
);

/* ── Create Security Modal ─ */
const CreateModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) { setErr('All fields are required.'); return; }
    if (form.password.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    setSaving(true); setErr('');
    try { await onCreate(form); onClose(); }
    catch(e) { setErr(e.message || 'Failed to create account.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal adm-modal--create" onClick={e => e.stopPropagation()}>
        <div className="adm-modal__head">
          <div>
            <div className="adm-modal__title">🛡️ Create Security Account</div>
            <div className="adm-modal__sub">New staff will be able to log into the Security Portal</div>
          </div>
          <button className="adm-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="adm-modal__body">
          {err && <div className="adm-modal-err">❌ {err}</div>}
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
            <div className="adm-input-wrap">
              <input type={show ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={set('password')} />
              <button className="adm-input-eye" onClick={() => setShow(s => !s)} tabIndex={-1}>{show ? '🙈' : '👁️'}</button>
            </div>
          </div>
          <div className="adm-modal-hint">
            <span>🔒</span>
            <span>This email and password will be used to log in at the Security Portal.</span>
          </div>
        </div>
        <div className="adm-modal__footer">
          <button className="adm-btn adm-btn--outline" onClick={onClose}>Cancel</button>
          <button className="adm-btn adm-btn--primary" onClick={submit} disabled={saving}>
            {saving ? <><span className="adm-spin"/>Creating…</> : '🛡️ Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Confirm Modal ──────── */
const ConfirmModal = ({ user, onConfirm, onCancel, loading }) => (
  <div className="adm-modal-overlay" onClick={onCancel}>
    <div className="adm-modal adm-modal--confirm" onClick={e => e.stopPropagation()}>
      <div className="adm-modal__head">
        <div className="adm-modal__title">⚠️ Deactivate Account</div>
        <button className="adm-modal__close" onClick={onCancel}>✕</button>
      </div>
      <div className="adm-modal__body" style={{ textAlign:'center', padding:'28px 26px' }}>
        <div style={{ fontSize:'3rem', marginBottom:12 }}>🛡️</div>
        <div style={{ fontFamily:'var(--font-heading)', fontWeight:800, fontSize:'1rem', color:'var(--text-dark)', marginBottom:8 }}>
          Deactivate <span style={{ color:'var(--coral)' }}>{user?.name}</span>?
        </div>
        <div style={{ fontSize:'0.85rem', color:'var(--text-light)', lineHeight:1.6 }}>
          This will revoke their access to the Security Portal.<br/>
          They will not be able to log in after this action.
        </div>
      </div>
      <div className="adm-modal__footer">
        <button className="adm-btn adm-btn--outline" onClick={onCancel}>Cancel</button>
        <button className="adm-btn adm-btn--danger-solid" onClick={onConfirm} disabled={loading}>
          {loading ? <><span className="adm-spin"/>Deactivating…</> : '⚠️ Yes, Deactivate'}
        </button>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════ */
const AdminDashboardPage = () => {
  const user      = getUser();
  const firstName = user?.name?.split(' ')[0] || 'Admin';

  const [stats,       setStats]       = useState(null);
  const [secUsers,    setSecUsers]    = useState([]);
  const [visitors,    setVisitors]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState('security');
  const [showCreate,  setShowCreate]  = useState(false);
  const [confirmUser, setConfirmUser] = useState(null);
  const [deact,       setDeact]       = useState(false);
  const [toast,       setToast]       = useState(null);
  const [secSearch,   setSecSearch]   = useState('');
  const [visSearch,   setVisSearch]   = useState('');
  const [visFilter,   setVisFilter]   = useState('all');
  const [visSelected, setVisSelected] = useState(null);

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, sec, vis] = await Promise.all([
        getAdminDashboard(), getSecurityUsers(), getAllVisitors()
      ]);
      setStats(s);
      setSecUsers(sec || []);
      setVisitors(vis || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data) => {
    await createSecurityUser(data);
    await load();
    showToast(`✅ Security account for ${data.name} created.`);
  };

  const handleDeactivate = async () => {
    if (!confirmUser) return;
    setDeact(true);
    try {
      await deactivateUser(confirmUser.id, 'security');
      showToast(`⚠️ ${confirmUser.name} has been deactivated.`, 'warning');
      setConfirmUser(null);
      await load();
    } catch(e) { showToast(e.message || 'Failed.', 'error'); }
    finally { setDeact(false); }
  };

  const activeSec = secUsers.filter(u => u.isActive).length;

  const filteredSec = secUsers.filter(u =>
    u.name?.toLowerCase().includes(secSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(secSearch.toLowerCase())
  );

  const visCounts = {
    all:      visitors.length,
    approved: visitors.filter(v => v.status?.toLowerCase()==='approved').length,
    pending:  visitors.filter(v => v.status?.toLowerCase()==='pending').length,
    rejected: visitors.filter(v => v.status?.toLowerCase()==='rejected').length,
  };

  const filteredVis = visitors
    .filter(v => visFilter === 'all' || v.status?.toLowerCase() === visFilter)
    .filter(v =>
      v.name?.toLowerCase().includes(visSearch.toLowerCase()) ||
      v.registrationId?.toLowerCase().includes(visSearch.toLowerCase()) ||
      v.email?.toLowerCase().includes(visSearch.toLowerCase()) ||
      v.purpose?.toLowerCase().includes(visSearch.toLowerCase())
    );

const checkedInCount  = visitors.filter(v => v.checkedIn  === true || v.status?.toLowerCase() === 'checked-in').length;
const checkedOutCount = visitors.filter(v => v.checkedOut === true || v.status?.toLowerCase() === 'checked-out').length;

const statCards = [
  { label:'Security Staff', value: loading ? '—' : (stats?.totalSecurityUsers ?? secUsers.length), icon:'🛡️', bg:'#eff6ff', color:'var(--info)',    sub:`${activeSec} active`, delay:'0.05s' },
  { label:'Total Visitors', value: loading ? '—' : (stats?.totalVisitors ?? visitors.length),      icon:'👥', bg:'#fffbeb', color:'var(--warning)', sub:'All time registered', delay:'0.10s' },
  { label:'Checked In',     value: loading ? '—' : (stats?.checkedInCount  ?? checkedInCount),     icon:'🟢', bg:'#f0fdf4', color:'var(--success)', sub:'Currently inside',    delay:'0.15s' },
  { label:'Checked Out',    value: loading ? '—' : (stats?.checkedOutCount ?? checkedOutCount),    icon:'🔴', bg:'#fef2f2', color:'var(--danger)',  sub:'Exited today',        delay:'0.20s' },
];

  return (
    <div className="adm-layout">
      <AdminSidebar />
      <div className="adm-main">
        <AdminTopbar title={`Admin Panel — ${firstName}`} breadcrumb="Admin / Dashboard" />
        <div className="adm-page-content">

          {/* Toast */}
          {toast && (
            <div className={`adm-toast adm-toast--${toast.type}`}>{toast.msg}</div>
          )}

          {/* Stats */}
          <div className="adm-stats-grid">
            {statCards.map(c => <StatCard key={c.label} {...c} />)}
          </div>

          {/* Main panel */}
          <div className="adm-panel">

            {/* Panel header with tabs */}
            <div className="adm-panel__head">
              <div className="adm-tabs">
                <button
                  className={`adm-tab${activeTab==='security' ? ' adm-tab--active' : ''}`}
                  onClick={() => setActiveTab('security')}
                >
                  🛡️ Security Accounts
                  <span className="adm-tab__count">{secUsers.length}</span>
                </button>
                <button
                  className={`adm-tab${activeTab==='visitors' ? ' adm-tab--active' : ''}`}
                  onClick={() => setActiveTab('visitors')}
                >
                  👥 All Visitors
                  <span className="adm-tab__count">{visitors.length}</span>
                </button>
              </div>
              {activeTab === 'security' && (
                <button className="adm-btn adm-btn--primary" onClick={() => setShowCreate(true)}>
                  + Create Security Account
                </button>
              )}
            </div>

            {/* ── Security Tab ──────────────────────────── */}
            {activeTab === 'security' && (
              <div>
                <div className="adm-panel__toolbar">
                  <div className="adm-search">
                    <span>🔍</span>
                    <input
                      placeholder="Search by name or email…"
                      value={secSearch}
                      onChange={e => setSecSearch(e.target.value)}
                    />
                    {secSearch && <button onClick={() => setSecSearch('')} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-light)' }}>✕</button>}
                  </div>
                  <div style={{ display:'flex', gap:12, alignItems:'center', fontSize:'0.8rem' }}>
                    <span style={{ color:'var(--success)', fontWeight:700 }}>● {activeSec} active</span>
                    {secUsers.length - activeSec > 0 && (
                      <span style={{ color:'var(--text-light)', fontWeight:700 }}>● {secUsers.length - activeSec} inactive</span>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="adm-empty"><span className="adm-spin adm-spin--lg"/><div style={{ marginTop:12 }}>Loading…</div></div>
                ) : filteredSec.length === 0 ? (
                  <div className="adm-empty">
                    <div className="adm-empty__icon">🛡️</div>
                    <div className="adm-empty__title">{secUsers.length === 0 ? 'No security accounts yet' : 'No results'}</div>
                    <div style={{ marginBottom:secUsers.length===0 ? 16 : 0 }}>
                      {secUsers.length === 0 ? 'Create your first security account to get started' : 'Try a different search term'}
                    </div>
                    {secUsers.length === 0 && (
                      <button className="adm-btn adm-btn--primary" onClick={() => setShowCreate(true)}>+ Create Security Account</button>
                    )}
                  </div>
                ) : (
                  <div className="adm-sec-grid">
                    {filteredSec.map((u, i) => (
                      <div
                        className={`adm-sec-card${!u.isActive ? ' adm-sec-card--inactive' : ''}`}
                        key={u.id}
                        style={{ animationDelay:`${i * 0.05}s` }}
                      >
                        <div className="adm-sec-card__top">
                          <div className="adm-sec-card__avatar" style={{ opacity: u.isActive ? 1 : 0.4 }}>
                            {initials(u.name)}
                          </div>
                          <div className="adm-sec-card__info">
                            <div className="adm-sec-card__name">{u.name}</div>
                            <div className="adm-sec-card__email">{u.email}</div>
                          </div>
                          <span className={`adm-badge ${u.isActive ? 'adm-badge--active' : 'adm-badge--inactive'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="adm-sec-card__meta">📅 Joined {fmtDate(u.createdAt)}</div>
                        {u.isActive && (
                          <div className="adm-sec-card__actions">
                            <button
                              className="adm-btn adm-btn--danger adm-btn--sm"
                              style={{ width:'100%' }}
                              onClick={() => setConfirmUser(u)}
                            >
                              Deactivate Account
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Visitors Tab ──────────────────────────── */}
            {activeTab === 'visitors' && (
              <div style={{ display:'grid', gridTemplateColumns: visSelected ? '1fr 320px' : '1fr', alignItems:'start' }}>

                {/* Table side */}
                <div>
                  <div className="adm-panel__toolbar" style={{ borderBottom:'1px solid var(--border-color)' }}>
                    <div className="adm-search">
                      <span>🔍</span>
                      <input
                        placeholder="Search by name, ID, purpose…"
                        value={visSearch}
                        onChange={e => setVisSearch(e.target.value)}
                      />
                      {visSearch && <button onClick={() => setVisSearch('')} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-light)' }}>✕</button>}
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      {[
                        { key:'all',      label:'All',      count:visCounts.all      },
                        { key:'approved', label:'Approved', count:visCounts.approved },
                        { key:'rejected', label:'Rejected', count:visCounts.rejected },
                      ].map(f => (
                        <button
                          key={f.key}
                          className={`adm-filter-pill${visFilter===f.key ? ' adm-filter-pill--active' : ''}`}
                          onClick={() => setVisFilter(f.key)}
                        >
                          {f.label} <span className="adm-filter-pill__count">{f.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {loading ? (
                    <div className="adm-empty"><span className="adm-spin adm-spin--lg"/><div style={{ marginTop:12 }}>Loading…</div></div>
                  ) : filteredVis.length === 0 ? (
                    <div className="adm-empty">
                      <div className="adm-empty__icon">👥</div>
                      <div className="adm-empty__title">No visitors found</div>
                      <div>Try changing your search or filter</div>
                    </div>
                  ) : (
                    <div style={{ overflowX:'auto' }}>
                      <table className="adm-table adm-table--hover">
                        <thead>
                          <tr>
                            <th>Visitor</th>
                            <th>Registration ID</th>
                            <th>Purpose</th>
                            <th>Visit Date</th>
                            <th>Status</th>
                            <th>Invited By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredVis.map(v => (
                            <tr
                              key={v.id}
                              className={`adm-table__row${visSelected?.id===v.id ? ' adm-table__row--selected' : ''}`}
                              onClick={() => setVisSelected(visSelected?.id===v.id ? null : v)}
                            >
                              <td>
                                <div className="adm-user-cell">
                                  <div className="adm-user-avatar" style={{ background:'var(--teal)', flexShrink:0 }}>{initials(v.name)}</div>
                                  <div>
                                    <div className="adm-user-name">{v.name}</div>
                                    <div className="adm-user-email">{v.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                {v.registrationId
                                  ? <span className="adm-reg-id">{v.registrationId}</span>
                                  : <span style={{ color:'var(--text-light)',fontSize:'0.8rem' }}>—</span>}
                              </td>
                              <td style={{ fontSize:'0.83rem',color:'var(--text-mid)' }}>{v.purpose}</td>
                              <td style={{ fontSize:'0.83rem',whiteSpace:'nowrap' }}>{fmtDate(v.visitDate)}</td>
                              <td><span className={badge(v.status)}>{v.status}</span></td>
                              <td style={{ fontSize:'0.83rem',color:'var(--text-mid)' }}>{v.hrName || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Detail panel */}
                {visSelected && (
                  <div className="adm-detail-panel">
                    <div className="adm-detail-panel__head">
                      <span style={{ fontFamily:'var(--font-heading)',fontWeight:800,fontSize:'0.9rem' }}>Visitor Details</span>
                      <button onClick={() => setVisSelected(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-light)',fontSize:'1rem' }}>✕</button>
                    </div>
                    <div className="adm-detail-panel__profile">
                      <div className="adm-detail-panel__avatar">{initials(visSelected.name)}</div>
                      <div className="adm-detail-panel__name">{visSelected.name}</div>
                      <div className="adm-detail-panel__email">{visSelected.email}</div>
                      <span className={badge(visSelected.status)} style={{ marginTop:6 }}>{visSelected.status}</span>
                      {visSelected.registrationId && (
                        <span className="adm-reg-id" style={{ marginTop:6,fontSize:'0.78rem' }}>{visSelected.registrationId}</span>
                      )}
                    </div>
                    <div className="adm-detail-panel__fields">
                      {[
                        ['Phone',         visSelected.phone],
                        ['Purpose',       visSelected.purpose],
                        ['Visit Date',    fmtDate(visSelected.visitDate)],
                        ['ID Proof Type', visSelected.idProofType],
                        ['ID Number',     visSelected.idProofNumber],
                        ['Invited By',    visSelected.hrName],
                        ['Submitted',     fmtDT(visSelected.submittedAt)],
                        ['Approved At',   visSelected.approvedAt ? fmtDT(visSelected.approvedAt) : null],
                        ['Approved By',   visSelected.approvedByHR],
                      ].filter(([,val]) => val).map(([k,val]) => (
                        <div className="adm-detail-field" key={k}>
                          <label>{k}</label>
                          <span>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {confirmUser && <ConfirmModal user={confirmUser} onConfirm={handleDeactivate} onCancel={() => setConfirmUser(null)} loading={deact} />}
    </div>
  );
};

export default AdminDashboardPage;