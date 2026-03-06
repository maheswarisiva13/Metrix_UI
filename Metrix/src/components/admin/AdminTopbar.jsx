// src/components/admin/AdminTopbar.jsx

import React, { useState } from 'react';

const AdminTopbar = ({ title, breadcrumb, onSearch }) => {
  const [query, setQuery] = useState('');
  const handleSearch = e => { setQuery(e.target.value); onSearch?.(e.target.value); };

  return (
    <header className="adm-topbar">
      <div className="adm-topbar__left">
        <div className="adm-topbar__title">{title}</div>
        {breadcrumb && <div className="adm-topbar__breadcrumb">{breadcrumb}</div>}
      </div>
      <div className="adm-topbar__right">
        {onSearch !== undefined && (
          <div className="adm-topbar__search">
            <span className="adm-topbar__search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={handleSearch}
            />
          </div>
        )}
       
      </div>
    </header>
  );
};

export default AdminTopbar;