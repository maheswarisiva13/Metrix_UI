// src/components/admin/AdminSidebar.jsx

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUser, clearSession } from '../../utils/auth';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: '📊', path: '/admin/dashboard' },
  { label: 'Security Users', icon: '🛡️', path: '/admin/security-users' },
  { label: 'All Visitors', icon: '👥', path: '/admin/visitors' },
];

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AD';

  return (
    <aside className="adm-sidebar">
      <div className="adm-sidebar__logo">
        <div className="adm-sidebar__logo-mark">M</div>
        <div className="adm-sidebar__logo-text">
          Metrix<span>.</span>
        </div>
        <span className="adm-sidebar__role-badge">Admin</span>
      </div>

      <nav className="adm-sidebar__nav">
        <div className="adm-sidebar__section-label">Administration</div>

        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              className={`adm-sidebar__item${isActive ? ' active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="adm-sidebar__item-icon">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="adm-sidebar__footer">
        <div
          className="adm-sidebar__user"
          onClick={() => {
            clearSession();
            navigate('/login');
          }}
          title="Logout"
        >
          <div className="adm-sidebar__avatar">{initials}</div>

          <div className="adm-sidebar__user-info">
            <div className="adm-sidebar__user-name">
              {user?.name || 'Admin'}
            </div>
            <div className="adm-sidebar__user-role">Administrator</div>
          </div>

          <span className="adm-sidebar__logout">↩</span>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;