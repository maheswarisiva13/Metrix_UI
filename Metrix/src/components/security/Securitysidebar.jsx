import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUser, clearSession } from '../../utils/auth';

const NAV_ITEMS = [
  { label: 'Dashboard',      icon: '🛡️',  path: '/security/dashboard' },
  { label: 'Check In / Out', icon: '🔍',  path: '/security/check-in', badgeKey: 'pending' },
  { label: 'Inside Now',     icon: '🏢',  path: '/security/inside' },
  { label: "Today's Log",    icon: '📋',  path: '/security/logs' },
  { label: 'All Visitors',   icon: '👥',  path: '/security/visitors' },
];

const SecuritySidebar = ({ pendingCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user     = getUser();
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SC';

  return (
    <aside className="sec-sidebar">
      <div className="sec-sidebar__logo">
        <div className="sec-sidebar__logo-mark">M</div>
        <div className="sec-sidebar__logo-text">Metrix<span>.</span></div>
      </div>

      <nav className="sec-sidebar__nav">
        <div className="sec-sidebar__section-label">Security Portal</div>
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path;
          const count    = item.badgeKey === 'pending' ? pendingCount : 0;
          return (
            <button
              key={item.path}
              className={`sec-sidebar__item${isActive ? ' active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="sec-sidebar__item-icon">{item.icon}</span>
              {item.label}
              {count > 0 && <span className="sec-sidebar__badge">{count}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sec-sidebar__footer">
        <div
          className="sec-sidebar__user"
          onClick={() => { clearSession(); navigate('/login'); }}
          title="Logout"
        >
          <div className="sec-sidebar__avatar">{initials}</div>
          <div className="sec-sidebar__user-info">
            <div className="sec-sidebar__user-name">{user?.name || 'Security'}</div>
            <div className="sec-sidebar__user-role">Security Staff</div>
          </div>
          <span className="sec-sidebar__logout">↩</span>
        </div>
      </div>
    </aside>
  );
};

export default SecuritySidebar;