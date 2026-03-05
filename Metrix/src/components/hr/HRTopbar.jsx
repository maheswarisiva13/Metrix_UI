import React, { useState } from 'react';

const HRTopbar = ({ title, breadcrumb, onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    setQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <div className="topbar__title">{title}</div>
        {breadcrumb && <div className="topbar__breadcrumb">{breadcrumb}</div>}
      </div>

      <div className="topbar__right">
        {onSearch !== undefined && (
          <div className="topbar__search">
            <span className="topbar__search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search visitors..."
              value={query}
              onChange={handleSearch}
            />
          </div>
        )}

        
      </div>
    </header>
  );
};

export default HRTopbar;