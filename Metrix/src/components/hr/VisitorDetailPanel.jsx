import React from 'react';
import StatusBadge from './StatusBadge';

const VisitorDetailPanel = ({ visitor, onClose, onApprove, onReject, actionLoading }) => {
  if (!visitor) return null;

  const initials = visitor.name
    ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  const fields = [
    { key: 'Email',        value: visitor.email },
    { key: 'Phone',        value: visitor.phone },
    { key: 'Purpose',      value: visitor.purpose },
    { key: 'Visit Date',   value: visitor.visitDate
        ? new Date(visitor.visitDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
        : '—' },
    { key: 'ID Type',      value: visitor.idProofType },
    { key: 'ID Number',    value: visitor.idProofNumber },
    { key: 'Submitted',    value: visitor.submittedAt
        ? new Date(visitor.submittedAt).toLocaleString()
        : '—' },
  ];

  const isPending = visitor.status?.toLowerCase() === 'pending';

  return (
    <>
      {/* Overlay to close */}
      <div
        style={{ position:'fixed', inset:0, zIndex:59 }}
        onClick={onClose}
      />

      <div className="detail-panel">
        {/* Head */}
        <div className="detail-panel__head">
          <span style={{ fontFamily:'var(--font-heading)', fontWeight:800, color:'var(--text-dark)' }}>
            Visitor Details
          </span>
          <button className="dash-modal__close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="detail-panel__body">
          {/* Profile header */}
          <div className="visitor-profile-head">
            <div className="visitor-profile-avatar">{initials}</div>
            <div>
              <div className="visitor-profile-name">{visitor.name}</div>
              {visitor.registrationId && (
                <div className="visitor-profile-id">{visitor.registrationId}</div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="detail-section">
            <div className="detail-section__label">Status</div>
            <StatusBadge status={visitor.status} />
          </div>

          {/* Info rows */}
          <div className="detail-section">
            <div className="detail-section__label">Information</div>
            {fields.map(f => (
              <div className="detail-row" key={f.key}>
                <span className="detail-row__key">{f.key}</span>
                <span className="detail-row__value">{f.value || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        {isPending && (
          <div className="detail-panel__foot">
            <button
              className="btn btn--success"
              onClick={() => onApprove(visitor.id)}
              disabled={actionLoading}
            >
              {actionLoading === 'approve' ? <span className="spin" /> : '✓'}
              Approve
            </button>
            <button
              className="btn btn--danger"
              onClick={() => onReject(visitor.id)}
              disabled={actionLoading}
            >
              {actionLoading === 'reject' ? <span className="spin" /> : '✕'}
              Reject
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default VisitorDetailPanel;