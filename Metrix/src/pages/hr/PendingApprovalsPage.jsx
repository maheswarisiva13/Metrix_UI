import React, { useState, useEffect, useCallback } from 'react';
import HRSidebar          from '../../components/hr/HRSidebar';
import HRTopbar           from '../../components/hr/HRTopbar';
import StatusBadge        from '../../components/hr/StatusBadge';
import VisitorDetailPanel from '../../components/hr/VisitorDetailPanel';
import { getPendingVisitors, approveVisitor, rejectVisitor } from '../../utils/hrService';
import '../../styles/hr/HRDashboard.css';

const PendingApprovalsPage = () => {
  const [visitors,  setVisitors]  = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [actLoad,   setActLoad]   = useState(null);
  const [toast,     setToast]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw  = await getPendingVisitors();
      const data = Array.isArray(raw) ? raw : [];
      setVisitors(data);
      setFiltered(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (id) => {
    setActLoad('approve');
    try {
      const res = await approveVisitor(id);
      setVisitors(p => p.filter(v => v.id !== id));
      setFiltered(p => p.filter(v => v.id !== id));
      setSelected(null);
      showToast(`✅ Visitor approved! Registration ID: ${res.registrationId}`);
    } catch {
      showToast('Failed to approve. Please try again.', 'error');
    } finally { setActLoad(null); }
  };

  const handleReject = async (id) => {
    setActLoad('reject');
    try {
      await rejectVisitor(id);
      setVisitors(p => p.filter(v => v.id !== id));
      setFiltered(p => p.filter(v => v.id !== id));
      setSelected(null);
      showToast('❌ Visitor rejected.');
    } catch {
      showToast('Failed to reject. Please try again.', 'error');
    } finally { setActLoad(null); }
  };

  const handleSearch = (q) => {
    const lower = q.toLowerCase();
    setFiltered(
      visitors.filter(v =>
        v.name?.toLowerCase().includes(lower) ||
        v.company?.toLowerCase().includes(lower) ||
        v.email?.toLowerCase().includes(lower) ||
        v.purpose?.toLowerCase().includes(lower)
      )
    );
  };

  return (
    <div className="hr-layout">
      <HRSidebar pendingCount={visitors.length} />

      <div className="hr-main">
        <HRTopbar
          title="Pending Approvals"
          breadcrumb="HR Portal / Pending Approvals"
          onSearch={handleSearch}
          showNotif={visitors.length > 0}
        />

        <div className="page-content">
          <div className="page-header">
            <div>
              <div className="page-header__title">⏳ Pending Approvals</div>
              <div className="page-header__sub">
                {loading ? 'Loading…' : `${filtered.length} visitor${filtered.length !== 1 ? 's' : ''} waiting for review`}
              </div>
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div className={`alert alert--${toast.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom:16 }}>
              {toast.msg}
            </div>
          )}

          <div className="content-card">
            <div className="content-card__head">
              <span className="content-card__title">
                Visitors Awaiting Approval
                {filtered.length > 0 && (
                  <span className="sidebar__badge sidebar__badge--warn">{filtered.length}</span>
                )}
              </span>
              <span style={{ fontSize:'0.8rem', color:'var(--text-light)' }}>
                Click a row to view details
              </span>
            </div>

            {loading ? (
              <div className="empty-state">
                <div style={{ fontSize:'2rem', animation:'spinAnim 1s linear infinite', display:'inline-block' }}>⏳</div>
                <div className="empty-state__sub">Loading pending visitors…</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">🎉</div>
                <div className="empty-state__title">No pending approvals!</div>
                <div className="empty-state__sub">All visitors have been reviewed.</div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Company</th>
                    <th>Purpose</th>
                    <th>Visit Date</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(v => (
                    <tr
                      key={v.id}
                      style={{ cursor:'pointer' }}
                      onClick={() => setSelected(v)}
                    >
                      <td>
                        <div className="visitor-cell">
                          <div className="visitor-avatar">
                            {v.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div className="visitor-name">{v.name}</div>
                            <div className="visitor-email">{v.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{v.company}</td>
                      <td>{v.purpose}</td>
                      <td style={{ whiteSpace:'nowrap' }}>
                        {new Date(v.visitDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                      </td>
                      <td style={{ whiteSpace:'nowrap', fontSize:'0.78rem', color:'var(--text-light)' }}>
                        {new Date(v.submittedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                        {' '}
                        {new Date(v.submittedAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                      </td>
                      <td>
                        <StatusBadge status={v.status} />
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display:'flex', gap:6 }}>
                          <button
                            className="btn btn--success btn--sm"
                            onClick={() => handleApprove(v.id)}
                            disabled={!!actLoad}
                            title="Approve"
                          >
                            {actLoad === 'approve' ? <span className="spin" /> : '✓ Approve'}
                          </button>
                          <button
                            className="btn btn--danger btn--sm"
                            onClick={() => handleReject(v.id)}
                            disabled={!!actLoad}
                            title="Reject"
                          >
                            {actLoad === 'reject' ? <span className="spin" /> : '✕ Reject'}
                          </button>
                        </div>
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

export default PendingApprovalsPage;