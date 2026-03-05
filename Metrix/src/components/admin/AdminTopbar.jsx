import React from 'react';

/**
 * AdminTopbar
 * @param {string}   title      - Page heading (e.g. "Admin Panel — Raj")
 * @param {string}   breadcrumb - Small breadcrumb text (e.g. "Admin / Dashboard")
 * @param {function} onSearch   - Called with the current search string on each keystroke
 */
const AdminTopbar = ({ title, breadcrumb, onSearch }) => {
  return (
    <header className="adm-topbar">
      <div>
        <div className="adm-topbar__title">{title}</div>
        {breadcrumb && (
          <div className="adm-topbar__breadcrumb">{breadcrumb}</div>
        )}
      </div>

      <div className="adm-topbar__right">
        {/* Search */}
        {onSearch && (
          <div className="adm-topbar__search">
            <span>🔍</span>
            <input
              placeholder="Search users…"
              onChange={e => onSearch(e.target.value)}
            />
          </div>
        )}

        {/* Notification bell */}
        <button className="adm-topbar__icon-btn" title="Notifications">
          🔔
          <span className="adm-topbar__notif-dot">0</span>
        </button>

        {/* Settings shortcut */}
        <button className="adm-topbar__icon-btn" title="Settings">
          ⚙️
        </button>
      </div>
    </header>
  );
};

export default AdminTopbar;