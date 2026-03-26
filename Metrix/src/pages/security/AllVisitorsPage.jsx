import React, { useState, useEffect, useCallback } from 'react';
import SecuritySidebar from '../../components/security/SecuritySidebar';
import SecurityTopbar  from '../../components/security/Securitytopbar';
import { getVisitorHistory, getCheckedInVisitors } from '../../utils/securityService';
import '../../styles/security/SecurityDashboard.css';

/* ── Helpers ─────────────────────────────────────────────── */
const initials = (name) =>
  name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : '—';

const fmtDT = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : null;

const toDateStr = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const fmtSelectedDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
};

const isToday = (iso) => {
  if (!iso) return false;
  const d = new Date(iso), t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
};

const elapsed = (iso) => {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 60) return `${diff}m`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
};

const duration = (inIso, outIso) => {
  if (!inIso || !outIso) return null;
  const diff = Math.floor((new Date(outIso) - new Date(inIso)) / 60000);
  if (diff < 60) return `${diff} min`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
};

/* ── Status Badge ────────────────────────────────────────── */
const CheckBadge = ({ visitor }) => {
  if (visitor.checkedOutAt) return <span className="sec-badge sec-badge--out">Checked Out</span>;
  if (visitor.checkedInAt)  return <span className="sec-badge sec-badge--in">Inside</span>;
  return <span className="sec-badge sec-badge--approved">Not Arrived</span>;
};

/* ── Detail Row ──────────────────────────────────────────── */
const DetailRow = ({ label, value, valueStyle }) => {
  if (!value) return null;
  return (
    <div style={{
      display:'flex', justifyContent:'space-between', alignItems:'flex-start',
      padding:'10px 0', borderBottom:'1px solid var(--border-color)',
      gap: 12,
    }}>
      <span style={{ fontSize:'0.75rem', fontWeight:700, letterSpacing:'0.4px', textTransform:'uppercase', color:'var(--text-light)', flexShrink:0 }}>
        {label}
      </span>
      <span style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text-dark)', textAlign:'right', ...valueStyle }}>
        {value}
      </span>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════ */
const AllVisitorsPage = () => {
  const [visitors,    setVisitors]    = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [insideCount, setInsideCount] = useState(0);
  const [tab,         setTab]         = useState('all');
  const [search,      setSearch]      = useState('');
  const [dateFilter,  setDateFilter]  = useState('');
  const [selected,    setSelected]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hist, inside] = await Promise.all([
        getVisitorHistory(),
        getCheckedInVisitors(),
      ]);
      const list = (hist || []).filter(v => v.approvedAt);
      setVisitors(list);
      setInsideCount((inside || []).length);
      applyFilters(list, tab, search, dateFilter);
    } finally { setLoading(false); }
  }, []); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const applyFilters = (source, t, q, date) => {
    let res = source;
    if (t === 'today')  res = res.filter(v => isToday(v.visitDate) || isToday(v.checkedInAt) || isToday(v.checkedOutAt));
    if (t === 'inside') res = res.filter(v => v.checkedInAt && !v.checkedOutAt);
    if (t === 'out')    res = res.filter(v => !!v.checkedOutAt);
    if (date) {
      res = res.filter(v =>
        toDateStr(v.visitDate)    === date ||
        toDateStr(v.checkedInAt)  === date ||
        toDateStr(v.checkedOutAt) === date
      );
    }
    if (q) {
      const lower = q.toLowerCase();
      res = res.filter(v =>
        v.name?.toLowerCase().includes(lower)           ||
        v.registrationId?.toLowerCase().includes(lower) ||
        v.purpose?.toLowerCase().includes(lower)        ||
        v.email?.toLowerCase().includes(lower)
      );
    }
    setFiltered(res);
  };

  const handleSearch     = (q) => { setSearch(q);  applyFilters(visitors, tab, q, dateFilter); };
  const handleTab        = (t) => { setTab(t);      applyFilters(visitors, t, search, dateFilter); setSelected(null); };
  const handleDateChange = (e) => { const d = e.target.value; setDateFilter(d); setSelected(null); applyFilters(visitors, tab, search, d); };
  const clearDate        = () => { setDateFilter(''); applyFilters(visitors, tab, search, ''); };

  const counts = {
    all:    visitors.length,
    today:  visitors.filter(v => isToday(v.visitDate) || isToday(v.checkedInAt) || isToday(v.checkedOutAt)).length,
    inside: visitors.filter(v => v.checkedInAt && !v.checkedOutAt).length,
    out:    visitors.filter(v => !!v.checkedOutAt).length,
  };

  const TABS = [
    { key:'all',    label:'All History', icon:'📋' },
    { key:'today',  label:"Today's",     icon:'📅' },
    { key:'inside', label:'Inside Now',  icon:'🟢' },
    { key:'out',    label:'Checked Out', icon:'🔴' },
  ];

  const avatarBg = (v) =>
    v.checkedOutAt  ? '#64748b'
    : v.checkedInAt ? 'var(--teal)'
    : 'linear-gradient(135deg,var(--teal),var(--teal-dark))';

  return (
    <div className="sec-layout">
      <SecuritySidebar pendingCount={insideCount} />

      <div className="sec-main">
        <SecurityTopbar
          title="Visit History"
          breadcrumb="Security / Visit History"
          onSearch={handleSearch}
          alertCount={insideCount}
        />

        <div className="sec-page-content">

          {/* Page header */}
          <div className="sec-page-header">
            <div>
              <div className="sec-page-header__title">📋 Visit History</div>
              <div className="sec-page-header__sub">
                {loading ? 'Loading…'
                  : dateFilter
                    ? `${filtered.length} record${filtered.length !== 1 ? 's' : ''} on ${fmtSelectedDate(dateFilter)}`
                    : `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`}
              </div>
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <div className="sec-date-picker-wrap">
                <span style={{ fontSize:'0.95rem' }}>📅</span>
                <input type="date" className="sec-date-picker" value={dateFilter} onChange={handleDateChange} />
                {dateFilter && <button className="sec-date-clear" onClick={clearDate}>✕</button>}
              </div>
              <button className="sec-refresh-btn" onClick={load}>↻ Refresh</button>
            </div>
          </div>

          {/* Active date banner */}
          {dateFilter && (
            <div className="sec-date-banner">
              <span>📅 Showing visits on: <strong>{fmtSelectedDate(dateFilter)}</strong></span>
              <button onClick={clearDate}>Clear ✕</button>
            </div>
          )}

          {/* Filter tabs */}
          <div className="sec-filter-tabs" style={{ marginBottom:20 }}>
            {TABS.map(t => (
              <button key={t.key} className={`sec-filter-tab${tab === t.key ? ' sec-filter-tab--active' : ''}`} onClick={() => handleTab(t.key)}>
                {t.icon} {t.label}
                <span className="sec-filter-tab__count">{counts[t.key]}</span>
              </button>
            ))}
          </div>

          {/* Table + detail panel */}
          <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap:20, alignItems:'start' }}>

            {/* Table card */}
            <div className="sec-card" style={{ overflow:'visible' }}>
              <div className="sec-card__head">
                <span className="sec-card__title">
                  {TABS.find(t => t.key === tab)?.icon}&nbsp;
                  {TABS.find(t => t.key === tab)?.label}
                  {!loading && (
                    <span className="sec-sidebar__badge" style={{ background:'var(--teal)', marginLeft:6 }}>
                      {filtered.length}
                    </span>
                  )}
                </span>
              </div>

              {loading ? (
                <div className="sec-empty">
                  <span className="sec-spin sec-spin--lg"/>
                  <div style={{ marginTop:12 }}>Loading history…</div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="sec-empty">
                  <div className="sec-empty__icon">
                    {dateFilter ? '📅' : tab === 'inside' ? '🏢' : tab === 'out' ? '🚪' : tab === 'today' ? '📅' : '📋'}
                  </div>
                  <div className="sec-empty__title">
                    {dateFilter ? `No visits on ${fmtSelectedDate(dateFilter)}`
                      : tab === 'inside' ? 'No visitors inside right now'
                      : tab === 'out'    ? 'No check-outs yet'
                      : tab === 'today'  ? 'No activity today'
                      : 'No visit records yet'}
                  </div>
                  {dateFilter && (
                    <button className="sec-refresh-btn" style={{ marginTop:12, fontSize:'0.78rem' }} onClick={clearDate}>
                      Clear date filter
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table className="sec-table">
                    <thead>
                      <tr>
                        <th>Visitor</th>
                        <th>Reg. ID</th>
                        <th>Purpose</th>
                        <th>Visit Date</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Status</th>
                        <th>Invited By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(v => (
                        <tr
                          key={v.id}
                          className={`sec-table__row${selected?.id === v.id ? ' sec-table__row--selected' : ''}`}
                          onClick={() => setSelected(selected?.id === v.id ? null : v)}
                        >
                          <td>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <div className="sec-visitor-avatar" style={{ width:32, height:32, fontSize:'0.72rem', flexShrink:0, background: avatarBg(v) }}>
                                {initials(v.name)}
                              </div>
                              <div>
                                <div className="sec-visitor-name">{v.name}</div>
                                <div className="sec-visitor-meta">{v.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>{v.registrationId ? <span className="sec-visitor-reg">{v.registrationId}</span> : <span style={{ color:'var(--text-light)', fontSize:'0.8rem' }}>—</span>}</td>
                          <td style={{ fontSize:'0.83rem', color:'var(--text-mid)' }}>{v.purpose}</td>
                          <td style={{ fontSize:'0.83rem', whiteSpace:'nowrap' }}>{fmtDate(v.visitDate)}</td>
                          <td style={{ fontSize:'0.83rem', fontWeight:700, color:'var(--success)', whiteSpace:'nowrap' }}>{fmtTime(v.checkedInAt)}</td>
                          <td style={{ fontSize:'0.83rem', fontWeight:700, color: v.checkedOutAt ? 'var(--danger)' : 'var(--teal-dark)', whiteSpace:'nowrap' }}>
                            {v.checkedOutAt ? fmtTime(v.checkedOutAt) : v.checkedInAt ? 'Still inside' : '—'}
                          </td>
                          <td><CheckBadge visitor={v} /></td>
                          <td style={{ fontSize:'0.83rem', color:'var(--text-mid)' }}>{v.hrName || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Detail Panel ───────────────────────── */}
            {selected && (
              <div className="sec-card" style={{ position:'sticky', top:80 }}>

                {/* Header — dark navy like security theme */}
                <div style={{
                  background:'#0f1923', borderRadius:'14px 14px 0 0',
                  padding:'18px 20px',
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                }}>
                  <span style={{ fontFamily:'var(--font-heading)', fontWeight:800, fontSize:'0.9rem', color:'#fff' }}>
                    Visit Details
                  </span>
                  <button
                    onClick={() => setSelected(null)}
                    style={{
                      background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)',
                      borderRadius:8, color:'rgba(255,255,255,0.6)', cursor:'pointer',
                      width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'0.85rem',
                    }}
                  >✕</button>
                </div>

                {/* Visitor profile */}
                <div style={{
                  padding:'20px', textAlign:'center',
                  borderBottom:'1px solid var(--border-color)',
                  background:'linear-gradient(180deg, #f8fafc 0%, #fff 100%)',
                }}>
                  <div
                    className="sec-visitor-avatar"
                    style={{
                      width:60, height:60, fontSize:'1.1rem',
                      margin:'0 auto 12px',
                      background: avatarBg(selected),
                      boxShadow:'0 4px 16px rgba(0,0,0,0.15)',
                    }}
                  >
                    {initials(selected.name)}
                  </div>
                  <div style={{ fontFamily:'var(--font-heading)', fontWeight:800, fontSize:'1rem', color:'var(--text-dark)' }}>
                    {selected.name}
                  </div>
                  <div style={{ fontSize:'0.78rem', color:'var(--text-light)', marginTop:3 }}>
                    {selected.email}
                  </div>
                  {selected.phone && (
                    <div style={{ fontSize:'0.78rem', color:'var(--text-mid)', marginTop:2 }}>
                      📞 {selected.phone}
                    </div>
                  )}
                  <div style={{ marginTop:10, display:'flex', justifyContent:'center', gap:8, flexWrap:'wrap' }}>
                    <CheckBadge visitor={selected} />
                    {selected.registrationId && (
                      <span className="sec-visitor-reg" style={{ fontSize:'0.75rem' }}>
                        {selected.registrationId}
                      </span>
                    )}
                  </div>
                </div>

                {/* Visit info */}
                <div style={{ padding:'16px 20px' }}>

                  {/* Visit section */}
                  <div style={{ fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', color:'var(--text-light)', marginBottom:8 }}>
                    Visit Info
                  </div>
                  <DetailRow label="Purpose"    value={selected.purpose} />
                  <DetailRow label="Visit Date" value={fmtDate(selected.visitDate)} />
                  <DetailRow label="Invited By" value={selected.hrName} />

                  {/* Timeline section */}
                  <div style={{ fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', color:'var(--text-light)', margin:'16px 0 8px' }}>
                    Check-in Timeline
                  </div>

                  {/* Check In row */}
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                    <div style={{
                      width:10, height:10, borderRadius:'50%', flexShrink:0,
                      background: selected.checkedInAt ? 'var(--success)' : 'var(--border-color)',
                      boxShadow: selected.checkedInAt ? '0 0 0 3px rgba(34,197,94,0.2)' : 'none',
                    }}/>
                    <div>
                      <div style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px', color:'var(--text-light)' }}>Check In</div>
                      <div style={{ fontSize:'0.88rem', fontWeight:800, color: selected.checkedInAt ? 'var(--success)' : 'var(--text-light)' }}>
                        {selected.checkedInAt ? fmtDT(selected.checkedInAt) : 'Not yet'}
                      </div>
                    </div>
                  </div>

                  {/* Connector line */}
                  <div style={{ marginLeft:4, width:2, height:16, background:'var(--border-color)', marginBottom:8 }}/>

                  {/* Check Out row */}
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                    <div style={{
                      width:10, height:10, borderRadius:'50%', flexShrink:0,
                      background: selected.checkedOutAt ? 'var(--danger)' : 'var(--border-color)',
                      boxShadow: selected.checkedOutAt ? '0 0 0 3px rgba(239,68,68,0.2)' : 'none',
                    }}/>
                    <div>
                      <div style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px', color:'var(--text-light)' }}>Check Out</div>
                      <div style={{ fontSize:'0.88rem', fontWeight:800, color: selected.checkedOutAt ? 'var(--danger)' : 'var(--teal-dark)' }}>
                        {selected.checkedOutAt ? fmtDT(selected.checkedOutAt) : selected.checkedInAt ? '🟢 Still inside' : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Duration / elapsed */}
                  {selected.checkedInAt && selected.checkedOutAt && (
                    <div style={{
                      background:'var(--dash-bg)', borderRadius:10,
                      padding:'10px 14px', marginBottom:8,
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                    }}>
                      <span style={{ fontSize:'0.78rem', color:'var(--text-light)', fontWeight:600 }}>⏱ Duration</span>
                      <span style={{ fontSize:'0.88rem', fontWeight:800, color:'var(--text-dark)' }}>
                        {duration(selected.checkedInAt, selected.checkedOutAt)}
                      </span>
                    </div>
                  )}

                  {selected.checkedInAt && !selected.checkedOutAt && (
                    <div style={{
                      background:'var(--teal-soft)', borderRadius:10,
                      padding:'10px 14px', marginBottom:8,
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                    }}>
                      <span style={{ fontSize:'0.78rem', color:'var(--teal-dark)', fontWeight:600 }}>🟢 Time inside</span>
                      <span style={{ fontSize:'0.88rem', fontWeight:800, color:'var(--teal-dark)' }}>
                        {elapsed(selected.checkedInAt)}
                      </span>
                    </div>
                  )}

                  {/* ID Proof section */}
                  {(selected.idProofType || selected.idProofNumber) && (
                    <>
                      <div style={{ fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', color:'var(--text-light)', margin:'16px 0 8px' }}>
                        ID Proof
                      </div>
                      <DetailRow label="Type"   value={selected.idProofType} />
                      <DetailRow label="Number" value={selected.idProofNumber} />
                    </>
                  )}

                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AllVisitorsPage;