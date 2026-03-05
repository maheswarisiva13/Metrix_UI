import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUser, clearSession } from '../../utils/auth';

const NAV_ITEMS = [
  { label: 'Dashboard',      icon: '🏠', path: '/hr/dashboard',    badge: null },
  { label: 'Send Invitation',icon: '✉️', path: '/hr/invite',       badge: null },
  { label: 'Pending',        icon: '⏳', path: '/hr/pending',      badgeKey: 'pending' },
  { label: 'All Visitors',   icon: '👥', path: '/hr/visitors',     badge: null },
];

const HRSidebar = ({ pendingCount = 0 }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = getUser();
  const initials  = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'HR';

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar__logo">
        <div className="sidebar__logo-mark">M</div>
        <div className="sidebar__logo-text">Metrix<span>.</span></div>
      </div>

      {/* Nav */}
      <nav className="sidebar__nav">
        <div className="sidebar__section-label">HR Portal</div>

        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path;
          const count    = item.badgeKey === 'pending' ? pendingCount : item.badge;

          return (
            <button
              key={item.path}
              className={`sidebar__item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="sidebar__item-icon">{item.icon}</span>
              {item.label}
              {count > 0 && (
                <span className={`sidebar__badge ${item.badgeKey === 'pending' ? 'sidebar__badge--warn' : ''}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="sidebar__footer">
        <div className="sidebar__user" onClick={handleLogout} title="Click to logout">
          <div className="sidebar__avatar">{initials}</div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{user?.name || 'HR User'}</div>
            <div className="sidebar__user-role">HR Staff</div>
          </div>
          <span className="sidebar__logout">↩</span>
        </div>
      </div>
    </aside>
  );
};

export default HRSidebar;