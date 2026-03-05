import React, { useState, useEffect, useCallback } from 'react';
import SecuritySidebar from '../../components/security/SecuritySidebar';
import SecurityTopbar  from '../../components/security/SecurityTopbar';
import { getAllVisitors, getCheckedInVisitors } from '../../utils/securityService';
import '../../styles/security/SecurityDashboard.css';

const initials = (name) =>
  name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const AllVisitorsPage = () => {
  const [visitors, setVisitors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insideCount, setInsideCount] = useState(0);
  const [selected, setSelected] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vData, iData] = await Promise.all([
        getAllVisitors(),
        getCheckedInVisitors(),
      ]);

      // ✅ SHOW ONLY APPROVED VISITORS
      const approvedVisitors = (vData || []).filter(
        v => v.status?.toLowerCase() === 'approved'
      );

      setVisitors(approvedVisitors);
      applyFilters(approvedVisitors, searchQuery);
      setInsideCount((iData || []).length);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => { load(); }, [load]);

  const applyFilters = (source, q) => {
    let result = source;

    if (q) {
      const lower = q.toLowerCase();
      result = result.filter(v =>
        v.name?.toLowerCase().includes(lower) ||
        v.registrationId?.toLowerCase().includes(lower) ||
        v.purpose?.toLowerCase().includes(lower) ||
        v.email?.toLowerCase().includes(lower) ||
        v.phone?.includes(lower)
      );
    }

    setFiltered(result);
  };

  const handleSearch = (q) => {
    setSearchQuery(q);
    applyFilters(visitors, q);
  };

  return (
    <div className="sec-layout">
      <SecuritySidebar pendingCount={insideCount} />

      <div className="sec-main">
        <SecurityTopbar
          title="Approved Visitors"
          breadcrumb="Security / Approved Visitors"
          onSearch={handleSearch}
          alertCount={insideCount}
        />

        <div className="sec-page-content">

          <div className="sec-page-header">
            <div>
              <div className="sec-page-header__title">✅ Approved Visitors</div>
              <div className="sec-page-header__sub">
                {loading ? 'Loading…' : `${filtered.length} visitors`}
              </div>
            </div>
            <button className="sec-refresh-btn" onClick={load}>↻ Refresh</button>
          </div>

          <div className="sec-card">
            {loading ? (
              <div className="sec-empty">
                <div>Loading visitors…</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="sec-empty">
                <div>No approved visitors found</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="sec-table">
                  <thead>
                    <tr>
                      <th>Visitor</th>
                      <th>Registration ID</th>
                      <th>Purpose</th>
                      <th>Visit Date</th>
                      <th>Invited By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(v => (
                      <tr key={v.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="sec-visitor-avatar">
                              {initials(v.name)}
                            </div>
                            <div>
                              <div className="sec-visitor-name">{v.name}</div>
                              <div className="sec-visitor-meta">{v.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{v.registrationId || '—'}</td>
                        <td>{v.purpose}</td>
                        <td>{fmtDate(v.visitDate)}</td>
                        <td>{v.hrName || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AllVisitorsPage;