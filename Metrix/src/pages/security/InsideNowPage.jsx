import React, { useState, useEffect, useCallback } from 'react';
import SecuritySidebar from '../../components/security/SecuritySidebar';
import SecurityTopbar  from '../../components/security/Securitytopbar';
import { getCheckedInVisitors, checkOutVisitor } from '../../utils/securityService';
import '../../styles/security/SecurityDashboard.css';

const initials = (name) =>
  name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

const elapsed = (iso) => {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
};

const InsideNowPage = () => {
  const [visitors,  setVisitors]  = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [actionId,  setActionId]  = useState(null);
  const [toast,     setToast]     = useState(null);
  const [selected,  setSelected]  = useState(null); // detail panel

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCheckedInVisitors();
      const list = data || [];
      setVisitors(list);
      setFiltered(list);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const handleSearch = (q) => {
    const lower = q.toLowerCase();
    setFiltered(visitors.filter(v =>
      v.name?.toLowerCase().includes(lower) ||
      v.registrationId?.toLowerCase().includes(lower) ||
      v.purpose?.toLowerCase().includes(lower)
    ));
  };

  const handleCheckOut = async (id, name) => {
    setActionId(id);
    try {
      await checkOutVisitor(id);
      showToast(`🚪 ${name} has been checked out successfully.`);
      if (selected?.id === id) setSelected(null);
      await load();
    } catch (err) {
      showToast(err.message || 'Check-out failed.', 'error');
    } finally { setActionId(null); }
  };

  return (
    <div className="sec-layout">
      <SecuritySidebar pendingCount={visitors.length} />

      <div className="sec-main">
        <SecurityTopbar
          title="Inside Now"
          breadcrumb="Security / Inside Now"
          onSearch={handleSearch}
          alertCount={visitors.length}
        />

        <div className="sec-page-content">

          {toast && (
            <div className={`sec-toast sec-toast--${toast.type}`}>{toast.msg}</div>
          )}

          <div className="sec-page-header">
            <div>
              <div className="sec-page-header__title">🏢 Visitors Inside Now</div>
              <div className="sec-page-header__sub">
                {loading ? 'Loading…'
                  : `${visitors.length} visitor${visitors.length !== 1 ? 's' : ''} currently inside the building`}
              </div>
            </div>
            <button
              className="sec-refresh-btn"
              onClick={load}
              title="Refresh"
            >
              ↻ Refresh
            </button>
          </div>

          {/* Alert banner */}
          {!loading && visitors.length > 0 && (
            <div className="sec-alert" style={{ marginBottom: 24 }}>
              <span className="sec-alert__icon">🏢</span>
              <div className="sec-alert__text">
                <h3>Building occupied</h3>
                <p>Monitor visitors and check them out when they leave the premises.</p>
              </div>
              <div className="sec-alert__badge">{visitors.length}</div>
            </div>
          )}

          {/* Grid of visitor cards */}
          {loading ? (
            <div className="sec-card">
              <div className="sec-empty">
                <span className="sec-spin sec-spin--lg" />
                <div style={{ marginTop: 12 }}>Loading visitors…</div>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="sec-card">
              <div className="sec-empty">
                <div className="sec-empty__icon">{visitors.length === 0 ? '✅' : '🔍'}</div>
                <div className="sec-empty__title">
                  {visitors.length === 0 ? 'Building is clear' : 'No results found'}
                </div>
                <div>
                  {visitors.length === 0
                    ? 'No visitors are currently inside the building'
                    : 'Try a different search term'}
                </div>
              </div>
            </div>
          ) : (
            <div className="sec-inside-grid">
              {filtered.map(v => (
                <div
                  className={`sec-inside-card${selected?.id === v.id ? ' sec-inside-card--selected' : ''}`}
                  key={v.id}
                  onClick={() => setSelected(selected?.id === v.id ? null : v)}
                >
                  {/* Card top */}
                  <div className="sec-inside-card__top">
                    <div className="sec-inside-card__avatar">{initials(v.name)}</div>
                    <div className="sec-inside-card__info">
                      <div className="sec-inside-card__name">{v.name}</div>
                      <div className="sec-inside-card__purpose">{v.purpose}</div>
                    </div>
                    <span className="sec-inside-card__elapsed">{elapsed(v.checkedInAt)}</span>
                  </div>

                  {/* Reg ID */}
                  <div style={{ padding: '0 16px 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="sec-visitor-reg">{v.registrationId}</span>
                    <span style={{ fontSize: '0.73rem', color: 'var(--text-light)' }}>
                      In: {fmt(v.checkedInAt)}
                    </span>
                  </div>

                  {/* Expanded detail */}
                  {selected?.id === v.id && (
                    <div className="sec-inside-card__detail">
                      {[
                        ['Phone',       v.phone],
                        ['Invited By',  v.hrName],
                        ['ID Proof',    v.idProofType],
                        ['Check-in',    fmt(v.checkedInAt)],
                      ].map(([k, val]) => (
                        <div className="sec-result__field" key={k} style={{ margin: '2px 0' }}>
                          <label>{k}</label>
                          <span>{val || '—'}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="sec-inside-card__actions">
                    <button
                      className="sec-btn-check-out"
                      style={{ width: '100%', padding: '9px', justifyContent: 'center', display: 'flex', gap: 6 }}
                      onClick={e => { e.stopPropagation(); handleCheckOut(v.id, v.name); }}
                      disabled={actionId === v.id}
                    >
                      {actionId === v.id
                        ? <><span className="sec-spin" /> Checking Out…</>
                        : '🚪 Check Out'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default InsideNowPage;