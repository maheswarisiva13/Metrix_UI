import React from 'react';

const STATUS_MAP = {
  pending:   { cls: 'badge--pending',   label: 'Pending',    dot: true },
  approved:  { cls: 'badge--approved',  label: 'Approved',   dot: true },
  rejected:  { cls: 'badge--rejected',  label: 'Rejected',   dot: true },
  checkedin: { cls: 'badge--checkedin', label: 'Checked In', dot: true },
};

const StatusBadge = ({ status }) => {
  const key    = status?.toLowerCase().replace(/\s/g, '') || 'pending';
  const config = STATUS_MAP[key] || STATUS_MAP.pending;

  return (
    <span className={`badge ${config.cls}`}>
      {config.dot && <span className="badge__dot" />}
      {config.label}
    </span>
  );
};

export default StatusBadge;