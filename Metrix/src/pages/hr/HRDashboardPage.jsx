import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HRSidebar          from '../../components/hr/HRSidebar';
import HRTopbar           from '../../components/hr/HRTopbar';
import StatusBadge        from '../../components/hr/StatusBadge';
import VisitorDetailPanel from '../../components/hr/VisitorDetailPanel';
import {
  getDashboardStats,
  getRecentActivity,
  getPendingVisitors,
  approveVisitor,
  rejectVisitor,
} from '../../utils/hrService';
import { getUser } from '../../utils/auth';
import '../../styles/hr/HRDashboard.css';

/* ── Stat card ────────────────────────────────────────── */
const StatCard = ({ label, value, icon, bg, color, sub, delay }) => (
  <div className="stat-card" style={{ animationDelay: delay }}>
    <div className="stat-card__top">
      <span className="stat-card__label">{label}</span>
      <div className="stat-card__icon" style={{ background: bg }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      </div>
    </div>
    <div className="stat-card__value" style={{ color }}>{value ?? '—'}</div>
    {sub && <div className="stat-card__change">{sub}</div>}
  </div>
);

/* ── Dashboard ────────────────────────────────────────── */
const HRDashboardPage = () => {
  const navigate  = useNavigate();
  const user      = getUser();
  const firstName = user?.name?.split(' ')[0] || 'HR';

  const [stats,    setStats]    = useState(null);
  const [pending,  setPending]  = useState([]);
  const [recent,   setRecent]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [actLoad,  setActLoad]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, r] = await Promise.all([
        getDashboardStats(),
        getPendingVisitors(),
        getRecentActivity(),
      ]);
      setStats(s ?? {});
      setPending(Array.isArray(p) ? p : []);
      setRecent(Array.isArray(r) ? r : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    setActLoad('approve');
    try {
      await approveVisitor(id);
      setPending(p => p.filter(v => v.id !== id));
      setSelected(null);
      await load();
    } finally { setActLoad(null); }
  };

  const handleReject = async (id) => {
    setActLoad('reject');
    try {
      await rejectVisitor(id);
      setPending(p => p.filter(v => v.id !== id));
      setSelected(null);
      await load();
    } finally { setActLoad(null); }
  };

  const statCards = [
    {
      label : "Today's Expected Visits",
      value : stats?.todaysVisits,
      icon  : '📅',
      bg    : '#eff6ff',
      color : 'var(--info)',
      sub   : 'Scheduled today',
      delay : '0.05s',
    },
    {
      label : 'Pending Approvals',
      value : stats?.pendingApprovals,
      icon  : '⏳',
      bg    : '#fffbeb',
      color : 'var(--warning)',
      sub   : stats?.pendingApprovals > 0
                ? `${stats.pendingApprovals} need action`
                : 'All caught up',
      delay : '0.10s',
    },
    {
      label : 'Approved',
      value : stats?.approvedThisWeek,
      icon  : '✅',
      bg    : '#f0fdf4',
      color : 'var(--success)',
      sub   : 'This week',
      delay : '0.15s',
    },
    {
      label : 'Inside Now',
      value : stats?.insideNow,
      icon  : '🟢',
      bg    : 'var(--teal-soft)',
      color : 'var(--teal-dark)',
      sub   : 'Currently in building',
      delay : '0.20s',
    },
  ];

  return (
    <div className="hr-layout">
      <HRSidebar pendingCount={pending.length} />

      <div className="hr-main">
        <HRTopbar
          title={`Good morning, ${firstName} 👋`}
          breadcrumb="HR Portal / Dashboard"
          showNotif={pending.length > 0}
        />

        <div className="page-content">

          {/* ── Stat cards ───────────────────────────── */}
          <div className="stats-grid">
            {statCards.map(c => (
              <StatCard key={c.label} {...c} value={loading ? '—' : c.value} />
            ))}
          </div>

          {/* ── Two-column: pending table + recent activity ── */}
          <div className="two-col" style={{ alignItems: 'start' }}>

            {/* Pending approvals */}
            <div className="content-card">
              <div className="content-card__head">
                <span className="content-card__title">
                  ⏳ Pending Approvals
                  {pending.length > 0 && (
                    <span className="sidebar__badge sidebar__badge--warn">{pending.length}</span>
                  )}
                </span>
                <button
                  className="btn btn--outline btn--sm"
                  onClick={() => navigate('/hr/pending')}
                >
                  View all
                </button>
              </div>

              {loading ? (
                <div className="empty-state">
                  <div style={{ fontSize:'1.8rem', animation:'spin 1s linear infinite', display:'inline-block' }}>⏳</div>
                  <p className="empty-state__sub">Loading...</p>
                </div>
              ) : pending.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">🎉</div>
                  <div className="empty-state__title">All caught up!</div>
                  <div className="empty-state__sub">No visitors waiting for approval.</div>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Visitor</th>
                      <th>Purpose</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.slice(0, 5).map(v => (
                      <tr
                        key={v.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelected(v)}
                      >
                        <td>
                          <div className="visitor-cell">
                            <div className="visitor-avatar">
                              {v.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="visitor-name">{v.name}</div>
                              <div className="visitor-email">{v.company}</div>
                            </div>
                          </div>
                        </td>
                        <td>{v.purpose}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {new Date(v.visitDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display:'flex', gap:6 }}>
                            <button
                              className="btn btn--success btn--sm"
                              onClick={() => handleApprove(v.id)}
                              disabled={!!actLoad}
                            >✓</button>
                            <button
                              className="btn btn--danger btn--sm"
                              onClick={() => handleReject(v.id)}
                              disabled={!!actLoad}
                            >✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Recent activity */}
            <div className="content-card">
              <div className="content-card__head">
                <span className="content-card__title">📋 Recent Activity</span>
                <button className="btn btn--outline btn--sm" onClick={() => navigate('/hr/visitors')}>
                  All visitors
                </button>
              </div>

              <div className="content-card__body">
                {loading ? (
                  <div className="empty-state">
                    <div className="empty-state__sub">Loading...</div>
                  </div>
                ) : recent.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state__icon">📭</div>
                    <div className="empty-state__sub">No recent activity</div>
                  </div>
                ) : (
                  <div className="timeline">
                    {recent.map(v => (
                      <div className="timeline__item" key={v.id}>
                        <div
                          className="timeline__dot"
                          style={{
                            background: v.status === 'Approved' ? 'var(--success-bg)' :
                                        v.status === 'Rejected'  ? 'var(--danger-bg)'  : 'var(--warning-bg)',
                          }}
                        >
                          {v.status === 'Approved' ? '✅' : v.status === 'Rejected' ? '❌' : '⏳'}
                        </div>
                        <div className="timeline__content">
                          <div className="timeline__action">
                            {v.name} — <StatusBadge status={v.status} />
                          </div>
                          <div className="timeline__meta">
                            {v.purpose} 
                           
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>{/* end two-col */}

          {/* ── Quick action strip ───────────────────── */}
          <div
            className="content-card"
            style={{ marginTop: 20, background: 'linear-gradient(135deg, #e8faf9 0%, #f0fdf4 100%)' }}
          >
            <div className="content-card__body" style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
              <span style={{ fontFamily:'var(--font-heading)', fontWeight:800, color:'var(--text-dark)', flex:1, minWidth:200 }}>
                ✉️ Need to invite a visitor?
              </span>
              <button className="btn btn--primary" onClick={() => navigate('/hr/invite')}>
                + Send Invitation
              </button>
              <button className="btn btn--outline" onClick={() => navigate('/hr/visitors')}>
                View All Visitors
              </button>
            </div>
          </div>

        </div>{/* end page-content */}
      </div>{/* end hr-main */}

      {selected && (
        <VisitorDetailPanel
          visitor={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          actionLoading={actLoad}
        />
      )}
    </div>
  );
};

export default HRDashboardPage;