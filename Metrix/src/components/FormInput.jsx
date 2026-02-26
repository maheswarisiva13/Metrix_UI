import React, { useState } from 'react';

/**
 * FormInput
 * Props: label, type, name, value, onChange, placeholder, required, focusColor, focusShadow
 */
const FormInput = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  focusColor = '#4ecdc4',
  focusShadow = 'rgba(78,205,196,0.18)',
  autoComplete,
}) => {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="form-group">
      {label && <label className="form-label" htmlFor={name}>{label}</label>}
      <div style={{ position: 'relative' }}>
        <input
          id={name}
          name={name}
          type={isPassword ? (showPw ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="form-input"
          style={{
            '--focus-color':  focusColor,
            '--focus-shadow': focusShadow,
            paddingRight: isPassword ? 44 : 16,
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPw(p => !p)}
            style={{
              position: 'absolute',
              right: 13, top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none',
              cursor: 'pointer', fontSize: '1rem',
              color: '#94a3b8', lineHeight: 1,
            }}
            tabIndex={-1}
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? '🙈' : '👁️'}
          </button>
        )}
      </div>
    </div>
  );
};

export default FormInput;