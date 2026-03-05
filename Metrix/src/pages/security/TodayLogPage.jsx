import React, { useState, useEffect, useCallback } from 'react';
import SecuritySidebar from '../../components/security/SecuritySidebar';
import SecurityTopbar  from '../../components/security/SecurityTopbar';
import { getTodayVisitLogs, getCheckedInVisitors } from '../../utils/securityService';
import '../../styles/security/SecurityDashboard.css';

const initials = (name) =>
  name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  }) : '—';

const TodayLogPage = () => {
  const [logs,     setLogs]     = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [insideCount, setInsideCount] = useState(0);
  const [filter,   setFilter]   = useState('all'); // all | in | out

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [logData, insideData] = await Promise.all([
        getTodayVisitLogs(),
        getCheckedInVisitors(),
      ]);
      const list = logData || [];
      setLogs(list);
      setFiltered(list);
      setInsideCount((insideData || []).length);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (q) => {
    const lower = q.toLowerCase();
    applyFilter(filter, logs.filter(l =>
      l.visitorName?.toLowerCase().includes(lower) ||
      l.registrationId?.toLowerCase().includes(lower) ||
      l.purpose?.toLowerCase().includes(lower)
    ));
  };

  const applyFilter = (f, source = logs) => {
    setFilter(f);
    if (f === 'in')  setFiltered(source.filter(l => l.eventType === 'CheckIn'));
    else if (f === 'out') setFiltered(source.filter(l => l.eventType === 'CheckOut'));
    else setFiltered(source);
  };

  const todayDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  const checkIns  = logs.filter(l => l.eventType === 'CheckIn').length;
  const checkOuts = logs.filter(l => l.eventType === 'CheckOut').length;

  return (
    <div className="sec-layout">
      <SecuritySidebar pendingCount={insideCount} />

      <div className="sec-main">
        <SecurityTopbar
          title="Today's Log"
          breadcrumb="Security / Today's Log"
          onSearch={handleSearch}
          alertCount={insideCount}
        />

        <div className="sec-page-content">

          <div className="sec-page-header">
            <div>
              <div className="sec-page-header__title">📋 Today's Visit Log</div>
              <div className="sec-page-header__sub">{todayDate}</div>
            </div>
            <button className="sec-refresh-btn" onClick={load}>↻ Refresh</button>
          </div>

          {/* Summary stat row */}
          <div className="sec-log-summary">
            {[
              { label: 'Total Events',  value: logs.length,  icon: '📋', color: 'var(--teal-dark)'  },
              { label: 'Check Ins',     value: checkIns,     icon: '✅', color: 'var(--success)'    },
              { label: 'Check Outs',    value: checkOuts,    icon: '🚪', color: 'var(--warning)'    },
              { label: 'Inside Now',    value: insideCount,  icon: '🏢', color: 'var(--info)'       },
            ].map(s => (
              <div className="sec-log-summary__item" key={s.label}>
                <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>
                    {loading ? '—' : s.value}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 700, marginTop: 2 }}>
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="sec-filter-tabs">
            {[
              { key: 'all', label: 'All Events' },
              { key: 'in',  label: '✅ Check Ins' },
              { key: 'out', label: '🚪 Check Outs' },
            ].map(t => (
              <button
                key={t.key}
                className={`sec-filter-tab${filter === t.key ? ' sec-filter-tab--active' : ''}`}
                onClick={() => applyFilter(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Log table */}
          <div className="sec-card">
            <div className="sec-card__head">
              <span className="sec-card__title">
                Event Timeline
                {filtered.length > 0 && (
                  <span className="sec-sidebar__badge" style={{ background: 'var(--teal)', marginLeft: 6 }}>
                    {filtered.length}
                  </span>
                )}
              </span>
            </div>

            {loading ? (
              <div className="sec-empty">
                <span className="sec-spin sec-spin--lg" />
                <div style={{ marginTop: 12 }}>Loading logs…</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="sec-empty">
                <div className="sec-empty__icon">📭</div>
                <div className="sec-empty__title">No events found</div>
                <div>
                  {logs.length === 0
                    ? 'No check-in or check-out activity today'
                    : 'No events match your filter'}
                </div>
              </div>
            ) : (
              <div>
                {filtered.map((log, idx) => {
                  const isIn  = log.eventType === 'CheckIn';
                  const isLast = idx === filtered.length - 1;
                  return (
                    <div className="sec-timeline-row" key={log.id || idx} style={{ borderBottom: isLast ? 'none' : undefined }}>

                      {/* Timeline line + dot */}
                      <div className="sec-timeline-line">
                        <div className={`sec-timeline-dot sec-timeline-dot--${isIn ? 'in' : 'out'}`} />
                        {!isLast && <div className="sec-timeline-connector" />}
                      </div>

                      {/* Time */}
                      <div className="sec-log-time">
                        {fmtTime(isIn ? log.entryTime : log.exitTime)}
                      </div>

                      {/* Avatar */}
                      <div className="sec-visitor-avatar" style={{ width: 34, height: 34, fontSize: '0.73rem', flexShrink: 0 }}>
                        {initials(log.visitorName)}
                      </div>

                      {/* Info */}
                      <div className="sec-visitor-info">
                        <div className="sec-visitor-name">{log.visitorName}</div>
                        <div className="sec-visitor-meta">
                          {log.purpose}
                          {log.verifiedBy ? ` · Verified by ${log.verifiedBy}` : ''}
                          {!isIn && log.entryTime && ` · Duration: ${durationLabel(log.entryTime, log.exitTime)}`}
                        </div>
                      </div>

                      {/* Reg ID */}
                      {log.registrationId && (
                        <span className="sec-visitor-reg">{log.registrationId}</span>
                      )}

                      {/* Event badge */}
                      <span className={`sec-log-event sec-log-event--${isIn ? 'in' : 'out'}`}>
                        {isIn ? '✅ Check In' : '🚪 Check Out'}
                      </span>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

/* duration between two ISO timestamps */
function durationLabel(entry, exit) {
  if (!entry || !exit) return '';
  const mins = Math.round((new Date(exit) - new Date(entry)) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default TodayLogPage;