import React, { useState, useEffect, useCallback } from 'react';
import HRSidebar          from '../../components/hr/HRSidebar';
import HRTopbar           from '../../components/hr/HRTopbar';
import StatusBadge        from '../../components/hr/StatusBadge';
import VisitorDetailPanel from '../../components/hr/VisitorDetailPanel';
import { getVisitors, approveVisitor, rejectVisitor } from '../../utils/hrService';
import '../../styles/hr/HRDashboard.css';

const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Rejected'];

const toDateStr = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const fmtSelectedDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
};

const AllVisitorsPage = () => {
  const [visitors,    setVisitors]    = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);
  const [actLoad,     setActLoad]     = useState(null);
  const [statusFil,   setStatusFil]   = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter,  setDateFilter]  = useState('');
  const [toast,       setToast]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await getVisitors();
      setVisitors(Array.isArray(raw) ? raw : []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* filter whenever visitors / search / status / date changes */
  useEffect(() => {
    let data = [...visitors];
    if (statusFil !== 'All') {
      data = data.filter(v => v.status?.toLowerCase() === statusFil.toLowerCase());
    }
    if (dateFilter) {
      data = data.filter(v => toDateStr(v.visitDate) === dateFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(v =>
        v.name?.toLowerCase().includes(q)           ||
        v.company?.toLowerCase().includes(q)        ||
        v.email?.toLowerCase().includes(q)          ||
        v.registrationId?.toLowerCase().includes(q) ||
        v.purpose?.toLowerCase().includes(q)
      );
    }
    setFiltered(data);
  }, [visitors, statusFil, searchQuery, dateFilter]);

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (id) => {
    setActLoad('approve');
    try {
      const res = await approveVisitor(id);
      setVisitors(prev => prev.map(v =>
        v.id === id ? { ...v, status:'Approved', registrationId: res.registrationId } : v
      ));
      setSelected(prev => prev ? { ...prev, status:'Approved', registrationId: res.registrationId } : null);
      showToast(`✅ Approved! ID: ${res.registrationId}`);
    } catch { showToast('Failed to approve.','error'); }
    finally   { setActLoad(null); }
  };

  const handleReject = async (id) => {
    setActLoad('reject');
    try {
      await rejectVisitor(id);
      setVisitors(prev => prev.map(v => v.id === id ? { ...v, status:'Rejected' } : v));
      setSelected(prev => prev ? { ...prev, status:'Rejected' } : null);
      showToast('❌ Visitor rejected.');
    } catch { showToast('Failed to reject.','error'); }
    finally   { setActLoad(null); }
  };

  const clearDate = () => setDateFilter('');

  const counts = {
    All:      visitors.length,
    Pending:  visitors.filter(v => v.status === 'Pending').length,
    Approved: visitors.filter(v => v.status === 'Approved').length,
    Rejected: visitors.filter(v => v.status === 'Rejected').length,
  };

  return (
    <div className="hr-layout">
      <HRSidebar pendingCount={counts.Pending} />

      <div className="hr-main">
        <HRTopbar
          title="All Visitors"
          breadcrumb="HR Portal / All Visitors"
          onSearch={q => setSearchQuery(q)}
        />

        <div className="page-content">

          {/* Page header */}
          <div className="page-header">
            <div>
              <div className="page-header__title">👥 Visitor Registry</div>
              <div className="page-header__sub">
                {loading ? 'Loading…'
                  : dateFilter
                    ? `${filtered.length} visitor${filtered.length !== 1 ? 's' : ''} on ${fmtSelectedDate(dateFilter)}`
                    : `${filtered.length} of ${visitors.length} visitors shown`}
              </div>
            </div>

            {/* Date picker */}
            <div className="hr-date-picker-wrap">
              <span className="hr-date-picker-icon">📅</span>
              <input
                type="date"
                className="hr-date-picker"
                value={dateFilter}
                onChange={e => { setDateFilter(e.target.value); setSelected(null); }}
                title="Filter by visit date"
              />
              {dateFilter && (
                <button className="hr-date-clear" onClick={clearDate} title="Clear">✕</button>
              )}
            </div>
          </div>

          {/* Active date banner */}
          {dateFilter && (
            <div className="hr-date-banner">
              <span>📅 Showing visits on: <strong>{fmtSelectedDate(dateFilter)}</strong></span>
              <button onClick={clearDate}>Clear ✕</button>
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div className={`alert alert--${toast.type === 'error' ? 'error' : 'success'}`}>
              {toast.msg}
            </div>
          )}

          <div className="content-card">
            {/* Toolbar */}
            <div className="content-card__head">
              <span className="content-card__title">
                Visitors
                {!loading && (
                  <span className="hr-count-badge">{filtered.length}</span>
                )}
              </span>
              <div className="table-toolbar">
                {STATUS_FILTERS.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFil(s)}
                    className={`hr-status-tab${statusFil === s ? ' hr-status-tab--active' : ''}`}
                  >
                    {s}
                    <span className="hr-status-tab__count">{counts[s]}</span>
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="empty-state">
                <div className="empty-state__sub">Loading visitors…</div>
              </div>

            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">{dateFilter ? '📅' : '🔍'}</div>
                <div className="empty-state__title">
                  {dateFilter
                    ? `No visitors on ${fmtSelectedDate(dateFilter)}`
                    : 'No visitors found'}
                </div>
                <div className="empty-state__sub">
                  {dateFilter
                    ? 'Try a different date or clear the filter.'
                    : 'Try adjusting your search or filter.'}
                </div>
                {dateFilter && (
                  <button
                    className="btn btn--outline btn--sm"
                    style={{ marginTop: 8 }}
                    onClick={clearDate}
                  >
                    Clear date filter
                  </button>
                )}
              </div>

            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Registration ID</th>
                    <th>Purpose</th>
                    <th>Visit Date</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(v => (
                    <tr
                      key={v.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelected(v)}
                    >
                      <td>
                        <div className="visitor-cell">
                          <div className="visitor-avatar">
                            {v.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div className="visitor-name">{v.name}</div>
                            <div className="visitor-email">{v.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {v.registrationId
                          ? <code style={{ fontSize:'0.78rem', color:'var(--teal-dark)', fontWeight:700 }}>
                              {v.registrationId}
                            </code>
                          : <span style={{ color:'var(--text-light)', fontSize:'0.78rem' }}>Not assigned</span>
                        }
                      </td>
                      <td style={{ fontSize: '0.83rem' }}>{v.purpose}</td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.83rem' }}>
                        {new Date(v.visitDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                      </td>
                      <td>
                        <StatusBadge status={v.status} />
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <button
                          className="btn btn--outline btn--sm btn--icon"
                          onClick={() => setSelected(v)}
                          title="View details"
                        >
                          👁
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Detail panel */}
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

export default AllVisitorsPage;