import React, { useState, useEffect, useRef } from 'react';
import FormInput from './FormInput';

/**
 * LoginModal
 * Props:
 *   role        — 'security' | 'hr' | 'admin'
 *   onClose     — fn
 *   onSuccess   — fn(user, token)
 *   onSignUp    — fn  (HR only, shows signup)
 *   onForgot    — fn
 */

const ROLE_CONFIG = {
  security: {
    stripe:      'modal__stripe--security',
    submit:      'modal__submit--security',
    title:       'Security Login',
    subtitle:    'Access the security check-in dashboard',
    usernameLabel:'Username / Employee ID',
    usernamePH:  'e.g. SEC001',
    focusColor:  '#4ecdc4',
    focusShadow: 'rgba(78,205,196,0.2)',
    btnText:     'Sign In as Security',
  },
  hr: {
    stripe:      'modal__stripe--hr',
    submit:      'modal__submit--hr',
    title:       'HR Login',
    subtitle:    'Manage visitor invitations & approvals',
    usernameLabel:'Work Email',
    usernamePH:  'you@company.com',
    focusColor:  '#a09090',
    focusShadow: 'rgba(160,144,144,0.22)',
    btnText:     'Sign In as HR',
  },
  admin: {
    stripe:      'modal__stripe--admin',
    submit:      'modal__submit--admin',
    title:       'Admin Login',
    subtitle:    'Full system administration access',
    usernameLabel:'Admin Email',
    usernamePH:  'admin@company.com',
    focusColor:  '#e05555',
    focusShadow: 'rgba(224,85,85,0.2)',
    btnText:     'Sign In as Admin',
  },
};

const LoginModal = ({ role, onClose, onSuccess, onSignUp, onForgot }) => {
  const cfg = ROLE_CONFIG[role];
  const [form, setForm]       = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const overlayRef            = useRef(null);
  const firstInputRef         = useRef(null);

  // focus first input on open
  useEffect(() => {
    setTimeout(() => firstInputRef.current?.focus(), 120);
  }, []);

  // close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: form.username,  // Backend expects `Email` in DTO
        password: form.password 
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody?.message || 'Login failed');
    }

    const data = await res.json();
    const { token, role, name } = data;

    onSuccess({ name, email: form.username, role }, token);

  } catch (err) {
    setError(err.message || 'Something went wrong.');
  } finally {
    setLoading(false);
  }
};

  // click outside to close
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className="modal" style={{ position: 'relative' }}>
        {/* colour stripe */}
        <div className={`modal__stripe ${cfg.stripe}`} />

        <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>

        <div className="modal__body">
          <h2 className="modal__title">{cfg.title}</h2>
          <p className="modal__subtitle">{cfg.subtitle}</p>

          {error && (
            <div className="form-error" role="alert">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <FormInput
              label={cfg.usernameLabel}
              type={role === 'security' ? 'text' : 'email'}
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder={cfg.usernamePH}
              required
              focusColor={cfg.focusColor}
              focusShadow={cfg.focusShadow}
              autoComplete={role === 'security' ? 'username' : 'email'}
            />

            <FormInput
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              focusColor={cfg.focusColor}
              focusShadow={cfg.focusShadow}
              autoComplete="current-password"
            />

            <button
              type="submit"
              className={`modal__submit ${cfg.submit}`}
              disabled={loading}
            >
              {loading && <span className="spinner" />}
              {loading ? 'Signing in...' : cfg.btnText}
            </button>
          </form>

          {/* Footer links */}
          <div className="modal__footer">
            {role === 'hr' && (
              <p style={{ marginBottom: 6 }}>
                No account?{' '}
                <button type="button" onClick={onSignUp}>Sign Up</button>
              </p>
            )}
            <p>
              <button type="button" onClick={onForgot} style={{ color: '#94a3b8' }}>
                Forgot Password?
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;