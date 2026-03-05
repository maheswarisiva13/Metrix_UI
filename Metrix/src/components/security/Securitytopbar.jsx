import React from 'react';

/**
 * SecurityTopbar
 * @param {string} title       - Page heading (e.g. "Security Portal — Ravi")
 * @param {string} breadcrumb  - Small breadcrumb text
 * @param {number} alertCount  - Number of visitors inside; shows a live badge
 */
const SecurityTopbar = ({ title, breadcrumb, alertCount = 0 }) => {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <header className="sec-topbar">
      <div>
        <div className="sec-topbar__title">{title}</div>
        {breadcrumb && (
          <div className="sec-topbar__breadcrumb">{breadcrumb}</div>
        )}
      </div>

      <div className="sec-topbar__right">
        {/* Live clock */}
        <div style={{
          fontFamily: 'Courier New, monospace',
          fontWeight: 700,
          fontSize: '0.85rem',
          color: 'var(--text-mid)',
          background: 'var(--dash-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: 10,
          padding: '7px 14px',
          letterSpacing: 1,
        }}>
          🕐 {now}
        </div>

        {/* Visitors inside indicator */}
        {alertCount > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--success-bg)',
            border: '1px solid var(--success)',
            borderRadius: 10,
            padding: '6px 14px',
            fontSize: '0.78rem',
            fontWeight: 800,
            color: 'var(--success)',
          }}>
            🏢 {alertCount} inside
          </div>
        )}

        {/* Notification bell */}
        <button className="sec-topbar__icon-btn" title="Alerts">
          🔔
          {alertCount > 0 && (
            <span className="sec-topbar__notif-dot">{alertCount}</span>
          )}
        </button>
      </div>
    </header>
  );
};

export default SecurityTopbar;