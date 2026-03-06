import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopbar  from '../../components/admin/AdminTopbar';
import { getAllVisitors } from '../../utils/adminService';
import '../../styles/admin/AdminDashboard.css';

const initials = (name) =>
  name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const toDateStr = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const badgeClass = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'approved') return 'adm-badge adm-badge--approved';
  if (s === 'rejected') return 'adm-badge adm-badge--rejected';
  return 'adm-badge';
};

const AllVisitorsPage = () => {
  const [visitors, setVisitors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let data = await getAllVisitors();
      data = data || [];
      // REMOVE pending visitors
      data = data.filter(v => v.status && v.status.toLowerCase() !== 'pending');
      setVisitors(data);
      applyFilters(data, '', dateFilter);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const applyFilters = (source, q, date) => {
    let res = source;
    if (date) res = res.filter(v => toDateStr(v.visitDate) === date);
    if (q) {
      const lower = q.toLowerCase();
      res = res.filter(v =>
        v.name?.toLowerCase().includes(lower) ||
        v.email?.toLowerCase().includes(lower) ||
        v.registrationId?.toLowerCase().includes(lower) ||
        v.purpose?.toLowerCase().includes(lower) ||
        v.hrName?.toLowerCase().includes(lower)
      );
    }
    setFiltered(res);
  };

  const handleSearch = (q) => {
    setSearchQuery(q);
    applyFilters(visitors, q, dateFilter);
  };

  const handleDateChange = (e) => {
    const d = e.target.value;
    setDateFilter(d);
    setSelected(null);
    applyFilters(visitors, searchQuery, d);
  };

  const clearDate = () => {
    setDateFilter('');
    applyFilters(visitors, searchQuery, '');
  };

  const fmtSelectedDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  };

  return (
    <div className="adm-layout">
      <AdminSidebar />
      <div className="adm-main">
        <AdminTopbar
          title="All Visitors"
          breadcrumb="Admin / All Visitors"
          onSearch={handleSearch}
        />
        <div className="adm-page-content">

          {/* Header */}
          <div className="adm-page-header">
            <div>
              <div className="adm-page-header__title">👥 All Visitors</div>
              <div className="adm-page-header__sub">
                {loading ? 'Loading…' : dateFilter ? 
                  `${filtered.length} visitor${filtered.length !== 1 ? 's' : ''} on ${fmtSelectedDate(dateFilter)}` :
                  `${filtered.length} of ${visitors.length} total visitors`}
              </div>
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <div className="adm-date-picker-wrap">
                <span className="adm-date-picker-icon">📅</span>
                <input type="date" className="adm-date-picker" value={dateFilter} onChange={handleDateChange} />
                {dateFilter && <button className="adm-date-clear" onClick={clearDate}>✕</button>}
              </div>
              <button className="adm-refresh-btn" onClick={load}>↻ Refresh</button>
            </div>
          </div>

          {/* Active date banner */}
          {dateFilter && (
            <div className="adm-date-banner">
              <span>📅 Showing visitors with visit date: <strong>{fmtSelectedDate(dateFilter)}</strong></span>
              <button onClick={clearDate}>Clear filter ✕</button>
            </div>
          )}

          {/* Table + detail panel */}
          <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 320px' : '1fr', gap:20, alignItems:'start' }}>

            {/* Table */}
            <div className="adm-card" style={{ overflow:'visible' }}>
              <div className="adm-card__head">
                <span className="adm-card__title">
                  Visitor Records
                  {!loading && (
                    <span style={{ marginLeft:8, background:'var(--teal-soft)', color:'var(--teal-dark)', fontSize:'0.72rem', fontWeight:800, padding:'2px 8px', borderRadius:20 }}>
                      {filtered.length}
                    </span>
                  )}
                </span>
              </div>

              {loading ? (
                <div className="adm-empty"><div className="adm-spin adm-spin--lg"/>Loading visitors…</div>
              ) : filtered.length === 0 ? (
                <div className="adm-empty">No approved or rejected visitors found</div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Visitor</th>
                        <th>Registration ID</th>
                        <th>Purpose</th>
                        <th>Visit Date</th>
                        <th>Status</th>
                        <th>Invited By</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(v => (
                        <tr key={v.id} style={{ cursor:'pointer', background: selected?.id === v.id ? 'var(--teal-soft)' : undefined }} onClick={() => setSelected(selected?.id === v.id ? null : v)}>
                          <td>
                            <div className="adm-user-cell">
                              <div className="adm-user-avatar" style={{ background:'var(--teal)', flexShrink:0 }}>{initials(v.name)}</div>
                              <div>
                                <div className="adm-user-name">{v.name}</div>
                                <div className="adm-user-email">{v.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>{v.registrationId || '—'}</td>
                          <td>{v.purpose}</td>
                          <td>{fmtDate(v.visitDate)}</td>
                          <td><span className={badgeClass(v.status)}>{v.status}</span></td>
                          <td>{v.hrName || '—'}</td>
                          <td>{fmtDateTime(v.submittedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Detail panel */}
            {selected && (
              <div className="adm-card" style={{ position:'sticky', top:80 }}>
                <div className="adm-card__head">
                  <span className="adm-card__title">Visitor Details</span>
                  <button onClick={() => setSelected(null)}>✕</button>
                </div>
                <div style={{ padding:'20px', textAlign:'center', borderBottom:'1px solid var(--border-color)' }}>
                  <div className="adm-user-avatar" style={{ width:52, height:52, fontSize:'1rem', margin:'0 auto 10px', background:'var(--teal)' }}>{initials(selected.name)}</div>
                  <div style={{ fontFamily:'var(--font-heading)', fontWeight:800 }}>{selected.name}</div>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-light)'} }>{selected.email}</div>
                  <div style={{ marginTop:8 }}><span className={badgeClass(selected.status)}>{selected.status}</span></div>
                  {selected.registrationId && <div style={{ marginTop:8 }}><span className="adm-reg-id">{selected.registrationId}</span></div>}
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