import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SecuritySidebar from '../../components/security/SecuritySidebar';
import SecurityTopbar  from '../../components/security/SecurityTopbar';
import {
  getSecurityDashboard,
  getTodayVisitors,
  getCheckedInVisitors,
  lookupVisitor,
  checkInVisitor,
  checkOutVisitor,
} from '../../utils/securityService';
import { getUser } from '../../utils/auth';
import '../../styles/security/SecurityDashboard.css';

/* ── Stat card ─────────────────────────────────────────── */
const StatCard = ({ label, value, icon, bg, color, sub, delay }) => (
  <div className="sec-stat-card" style={{ animationDelay: delay }}>
    <div className="sec-stat-card__top">
      <span className="sec-stat-card__label">{label}</span>
      <div className="sec-stat-card__icon" style={{ background: bg }}>
        <span>{icon}</span>
      </div>
    </div>
    <div className="sec-stat-card__value" style={{ color }}>{value ?? '—'}</div>
    {sub && <div className="sec-stat-card__sub">{sub}</div>}
  </div>
);

/* ── Security Dashboard ────────────────────────────────── */
const SecurityDashboardPage = () => {
  const navigate  = useNavigate();
  const user      = getUser();
  const firstName = user?.name?.split(' ')[0] || 'Security';

  const [stats,      setStats]      = useState(null);
  const [todayList,  setTodayList]  = useState([]);
  const [insideList, setInsideList] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [actionId,   setActionId]   = useState(null);

  // Lookup state
  const [regInput,   setRegInput]   = useState('');
  const [lookupRes,  setLookupRes]  = useState(null);
  const [lookupErr,  setLookupErr]  = useState('');
  const [looking,    setLooking]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t, i] = await Promise.all([
        getSecurityDashboard(),
        getTodayVisitors(),
        getCheckedInVisitors(),
      ]);
      setStats(s);
      setTodayList(t || []);
      setInsideList(i || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Lookup by registration ID */
  const handleLookup = async () => {
    if (!regInput.trim()) return;
    setLooking(true);
    setLookupErr('');
    setLookupRes(null);
    try {
      const res = await lookupVisitor(regInput.trim());
      setLookupRes(res);
    } catch {
      setLookupErr('No visitor found with that Registration ID.');
    } finally {
      setLooking(false);
    }
  };

  /* Check in */
  const handleCheckIn = async (id) => {
    setActionId(id);
    try {
      await checkInVisitor(id);
      setLookupRes(null);
      setRegInput('');
      await load();
    } finally { setActionId(null); }
  };

  /* Check out */
  const handleCheckOut = async (id) => {
    setActionId(id);
    try {
      await checkOutVisitor(id);
      await load();
    } finally { setActionId(null); }
  };

  const statCards = [
    { label: 'Today Visitors',  value: stats?.todayVisitors,    icon: '📅', bg: '#e0f7f5', color: 'var(--teal-dark)',  sub: 'Scheduled today',    delay: '0.05s' },
    { label: 'Inside Now',      value: stats?.insideNow,        icon: '🏢', bg: '#f0fdf4', color: 'var(--success)',    sub: 'Currently checked in', delay: '0.10s' },
    { label: 'Checked In Today',value: stats?.checkedInToday,   icon: '✅', bg: '#fffbeb', color: 'var(--warning)',    sub: 'Entries today',       delay: '0.15s' },
    { label: 'Checked Out',     value: stats?.checkedOutToday,  icon: '🚪', bg: '#eff6ff', color: 'var(--info)',       sub: 'Exits today',         delay: '0.20s' },
  ];

  const fmt = (iso) => iso
    ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

  const initials = (name) =>
    name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  const badgeClass = (status) => {
    if (!status) return 'sec-badge';
    const s = status.toLowerCase();
    if (s === 'approved') return 'sec-badge sec-badge--approved';
    if (s === 'pending')  return 'sec-badge sec-badge--pending';
    if (s === 'rejected') return 'sec-badge sec-badge--rejected';
    return 'sec-badge';
  };

  return (
    <div className="sec-layout">
      <SecuritySidebar pendingCount={insideList.length} />

      <div className="sec-main">
        <SecurityTopbar
          title={`Security Portal — ${firstName}`}
          breadcrumb="Security / Dashboard"
          alertCount={insideList.length}
        />

        <div className="sec-page-content">

          {/* Dark alert bar when visitors are inside */}
          {insideList.length > 0 && (
            <div className="sec-alert">
              <span className="sec-alert__icon">🏢</span>
              <div className="sec-alert__text">
                <h3>Visitors currently inside the building</h3>
                <p>Monitor and check out visitors when they leave the premises.</p>
              </div>
              <div className="sec-alert__badge">{insideList.length}</div>
            </div>
          )}

          {/* ── Stat cards ──────────────────────────────── */}
          <div className="sec-stats-grid">
            {statCards.map(c => (
              <StatCard key={c.label} {...c} value={loading ? '—' : c.value} />
            ))}
          </div>

          {/* ── Lookup + Inside Now ─────────────────────── */}
          <div className="sec-two-col">

            {/* Visitor Lookup */}
            <div className="sec-card">
              <div className="sec-card__head">
                <span className="sec-card__title">🔍 Check In Visitor</span>
              </div>
              <div className="sec-lookup">
                <input
                  className="sec-lookup__input"
                  placeholder="Enter Registration ID (e.g. VIS-2026-0001)"
                  value={regInput}
                  onChange={e => setRegInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleLookup()}
                />
                <button
                  className="sec-lookup__btn"
                  onClick={handleLookup}
                  disabled={looking || !regInput.trim()}
                >
                  {looking ? '...' : 'Lookup'}
                </button>
              </div>

              {lookupErr && (
                <div style={{ padding: '14px 20px', color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 700 }}>
                  ❌ {lookupErr}
                </div>
              )}

              {lookupRes && (
                <div className="sec-result">
                  <div className="sec-result__header">
                    <span>✅</span>
                    <span>{lookupRes.name}</span>
                    <span className={badgeClass(lookupRes.status)} style={{ marginLeft: 'auto' }}>
                      {lookupRes.status}
                    </span>
                  </div>
                  <div className="sec-result__body">
                    <div className="sec-result__field">
                      <label>Registration ID</label>
                      <span style={{ fontFamily: 'Courier New, monospace', color: 'var(--teal-dark)' }}>
                        {lookupRes.registrationId}
                      </span>
                    </div>
                    <div className="sec-result__field">
                      <label>Visit Date</label>
                      <span>{lookupRes.visitDate ? new Date(lookupRes.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                    </div>
                    <div className="sec-result__field">
                      <label>Purpose</label>
                      <span>{lookupRes.purpose}</span>
                    </div>
                    <div className="sec-result__field">
                      <label>ID Proof</label>
                      <span>{lookupRes.idProofType}</span>
                    </div>
                    <div className="sec-result__field">
                      <label>Phone</label>
                      <span>{lookupRes.phone}</span>
                    </div>
                    <div className="sec-result__field">
                      <label>Invited By</label>
                      <span>{lookupRes.hrName || '—'}</span>
                    </div>
                  </div>
                  <div className="sec-result__actions">
                    <button
                      className="sec-btn-check-out"
                      style={{ background: '#e2e8f0', color: 'var(--text-mid)' }}
                      onClick={() => { setLookupRes(null); setRegInput(''); }}
                    >
                      Cancel
                    </button>
                    <button
                      className="sec-btn-check-in"
                      onClick={() => handleCheckIn(lookupRes.id)}
                      disabled={actionId === lookupRes.id || lookupRes.status !== 'Approved'}
                    >
                      {actionId === lookupRes.id ? 'Checking In...' : '✅ Check In'}
                    </button>
                  </div>
                </div>
              )}

              {!lookupRes && !lookupErr && (
                <div className="sec-empty">
                  <div className="sec-empty__icon">🪪</div>
                  <div className="sec-empty__title">Enter a Registration ID to look up visitor</div>
                  <div>Only approved visitors can be checked in</div>
                </div>
              )}
            </div>

            {/* Inside Now */}
            <div className="sec-card">
              <div className="sec-card__head">
                <span className="sec-card__title">
                  🏢 Inside Now
                  {insideList.length > 0 && (
                    <span className="sec-sidebar__badge" style={{ background: 'var(--success)' }}>
                      {insideList.length}
                    </span>
                  )}
                </span>
              </div>
              {loading ? (
                <div className="sec-empty"><div>Loading...</div></div>
              ) : insideList.length === 0 ? (
                <div className="sec-empty">
                  <div className="sec-empty__icon">🏢</div>
                  <div className="sec-empty__title">No visitors inside</div>
                  <div>Building is clear</div>
                </div>
              ) : (
                insideList.map(v => (
                  <div className="sec-visitor-row" key={v.id}>
                    <div className="sec-visitor-avatar">{initials(v.name)}</div>
                    <div className="sec-visitor-info">
                      <div className="sec-visitor-name">{v.name}</div>
                      <div className="sec-visitor-meta">{v.purpose} · In since {fmt(v.checkedInAt)}</div>
                    </div>
                    <span className="sec-visitor-reg">{v.registrationId}</span>
                    <div className="sec-visitor-actions">
                      <button
                        className="sec-btn-check-out"
                        onClick={() => handleCheckOut(v.id)}
                        disabled={actionId === v.id}
                      >
                        {actionId === v.id ? '...' : '🚪 Out'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Today's Visitors ───────────────────────── */}
          <div className="sec-card">
            <div className="sec-card__head">
              <span className="sec-card__title">📅 Today's Expected Visitors</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
            {loading ? (
              <div className="sec-empty"><div>Loading...</div></div>
            ) : todayList.length === 0 ? (
              <div className="sec-empty">
                <div className="sec-empty__icon">📭</div>
                <div className="sec-empty__title">No visitors scheduled for today</div>
              </div>
            ) : (
              todayList.map(v => (
                <div className="sec-visitor-row" key={v.id}>
                  <div className="sec-visitor-avatar">{initials(v.name)}</div>
                  <div className="sec-visitor-info">
                    <div className="sec-visitor-name">{v.name}</div>
                    <div className="sec-visitor-meta">{v.purpose} · {v.phone} · Invited by {v.hrName}</div>
                  </div>
                  <span className={badgeClass(v.status)}>{v.status}</span>
                  {v.registrationId && (
                    <span className="sec-visitor-reg">{v.registrationId}</span>
                  )}
                  {v.status === 'Approved' && !v.checkedInAt && (
                    <div className="sec-visitor-actions">
                      <button
                        className="sec-btn-check-in"
                        onClick={() => handleCheckIn(v.id)}
                        disabled={actionId === v.id}
                      >
                        {actionId === v.id ? '...' : '✅ Check In'}
                      </button>
                    </div>
                  )}
                  {v.checkedInAt && !v.checkedOutAt && (
                    <div className="sec-visitor-actions">
                      <button
                        className="sec-btn-check-out"
                        onClick={() => handleCheckOut(v.id)}
                        disabled={actionId === v.id}
                      >
                        {actionId === v.id ? '...' : '🚪 Check Out'}
                      </button>
                    </div>
                  )}
                  {v.checkedOutAt && (
                    <span className="sec-badge sec-badge--out" style={{ fontSize: '0.73rem' }}>
                      Left {fmt(v.checkedOutAt)}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SecurityDashboardPage;
