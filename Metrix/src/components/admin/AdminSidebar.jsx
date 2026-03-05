import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, getUser } from '../../utils/auth';

const NAV_ITEMS = [
  {
    section: 'Main',
    items: [
      { label: 'Dashboard', icon: '🏠', path: '/admin/dashboard' },
      { label: 'Visitors',  icon: '👥', path: '/admin/visitors'  },
      { label: 'Reports',   icon: '📈', path: '/admin/reports'   },
    ],
  },
  {
    section: 'Management',
    items: [
      { label: 'HR Users',       icon: '👤', path: '/admin/users/hr'       },
      { label: 'Security Users', icon: '🛡️', path: '/admin/users/security' },
    ],
  },
  {
    section: 'System',
    items: [
      { label: 'Settings',  icon: '⚙️', path: '/admin/settings' },
      { label: 'Audit Log', icon: '📋', path: '/admin/audit'    },
    ],
  },
];

const initials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'A';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user     = getUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="adm-sidebar">
      {/* Logo */}
      <div className="adm-sidebar__logo">
        <div className="adm-sidebar__logo-mark">M</div>
        <span className="adm-sidebar__logo-text">
          Metrix<span>VMS</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="adm-sidebar__nav">
        {NAV_ITEMS.map(({ section, items }) => (
          <React.Fragment key={section}>
            <div className="adm-sidebar__section-label">{section}</div>
            {items.map(({ label, icon, path, badge }) => (
              <button
                key={path}
                className={`adm-sidebar__item${location.pathname === path ? ' active' : ''}`}
                onClick={() => navigate(path)}
              >
                <span className="adm-sidebar__item-icon">{icon}</span>
                {label}
                {badge !== undefined && (
                  <span className="adm-sidebar__badge">{badge}</span>
                )}
              </button>
            ))}
          </React.Fragment>
        ))}
      </nav>

      {/* User footer */}
      <div className="adm-sidebar__footer">
        <div className="adm-sidebar__user" onClick={handleLogout} title="Logout">
          <div className="adm-sidebar__avatar">{initials(user?.name)}</div>
          <div>
            <div className="adm-sidebar__user-name">{user?.name || 'Admin'}</div>
            <div className="adm-sidebar__user-role">Administrator</div>
          </div>
          <span className="adm-sidebar__logout">↩</span>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;